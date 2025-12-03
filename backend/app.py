from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import os
import io
import cv2
import numpy as np
from PIL import Image, ImageFilter
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
import easyocr
import re
import datetime

from extensions import db, jwt
from models import User

load_dotenv()

app = Flask(__name__)
CORS(app)

# CONFIG
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=2)

db.init_app(app)
jwt.init_app(app)

# Создание таблиц
with app.app_context():
    db.create_all()

# AUTH
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username, password = data.get("username"), data.get("password")

    if not username or not password:
        return jsonify({"error": "Заполните все поля"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Пользователь уже существует"}), 400

    user = User(username=username)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Регистрация успешна"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username, password = data.get("username"), data.get("password")

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Неверный логин или пароль"}), 401

    token = jwt.create_access_token(identity=user.id)
    return jsonify({"token": token})

#   IMAGE PROCESSING

def detect_passport_fields(image):
    text = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT, lang="rus+eng")

    boxes = []
    passport_regex = r"[A-ZА-Я]{2,}|[0-9]{6}|[0-9]{4}\s[0-9]{6}"

    for i in range(len(text["text"])):
        word = text["text"][i]
        if re.match(passport_regex, word):
            x, y, w, h = text["left"][i], text["top"][i], text["width"][i], text["height"][i]
            boxes.append((x, y, x + w, y + h))

    return boxes

def detect_car_plates(image):
    reader = easyocr.Reader(["en", "ru"])
    results = reader.readtext(image)

    boxes = []
    pattern = r"[A-ZА-Я]\d{3}[A-ZА-Я]{2}\d{2,3}"

    for (bbox, text, prob) in results:
        if re.match(pattern, text.replace(" ", "")):
            xs = [p[0] for p in bbox]
            ys = [p[1] for p in bbox]
            boxes.append((int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))))

    return boxes

def blur_regions(image, regions):
    img = image.copy()
    for (x1, y1, x2, y2) in regions:
        crop = img.crop((x1, y1, x2, y2)).filter(ImageFilter.GaussianBlur(12))
        img.paste(crop, (x1, y1))
    return img

@app.route("/process-image", methods=["POST"])
@jwt.jwt_required()
def process_image():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "Файл не найден"}), 400

    pil_img = Image.open(file.stream).convert("RGB")
    cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    passport_boxes = detect_passport_fields(cv_img)
    plate_boxes = detect_car_plates(cv_img)
    all_boxes = passport_boxes + plate_boxes

    if not all_boxes:
        img_io = io.BytesIO()
        pil_img.save(img_io, "PNG")
        img_io.seek(0)
        return send_file(img_io, mimetype="image/png")

    blurred = blur_regions(pil_img, all_boxes)

    img_io = io.BytesIO()
    blurred.save(img_io, "PNG")
    img_io.seek(0)
    return send_file(img_io, mimetype="image/png")

@app.route("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    app.run(debug=True)
