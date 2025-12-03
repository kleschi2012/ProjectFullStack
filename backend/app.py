from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import os
import io
import cv2
import numpy as np
from PIL import Image, ImageFilter
import pytesseract
import easyocr
import re
import datetime
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request

from extensions import db, jwt
from flask_migrate import Migrate
from models import User

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers=["Content-Type", "Authorization"])

# CONFIG
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///app.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-me")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=2)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
app.config["PROPAGATE_EXCEPTIONS"] = True

# Allow overriding tesseract binary location in container/host
tesseract_cmd = os.getenv("TESSERACT_CMD")
if tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

db.init_app(app)
jwt.init_app(app)
migrate = Migrate(app, db)

# JWT error handlers to вернуть понятные ответы (частая причина 422)
@jwt.unauthorized_loader
def handle_missing_token(reason):
    return jsonify({"error": "Требуется авторизация", "detail": reason}), 401


@jwt.invalid_token_loader
def handle_invalid_token(reason):
    return jsonify({"error": "Некорректный токен", "detail": reason}), 401


@jwt.expired_token_loader
def handle_expired(jwt_header, jwt_payload):
    return jsonify({"error": "Срок действия токена истек"}), 401

# Инициализация easyOCR один раз, чтобы ускорить работу API
ocr_reader = easyocr.Reader(["en", "ru"], gpu=False)

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

    token = create_access_token(identity=user.id)
    return jsonify({"token": token})

#   IMAGE PROCESSING

def detect_passport_fields(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    text = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT, lang="rus+eng")

    boxes = []
    passport_regex = r"[A-ZА-Я]{2,}|[0-9]{6}|[0-9]{4}\s[0-9]{6}"

    for i in range(len(text["text"])):
        word = text["text"][i]
        if re.match(passport_regex, word):
            x, y, w, h = text["left"][i], text["top"][i], text["width"][i], text["height"][i]
            boxes.append((x, y, x + w, y + h))

    return boxes

def detect_car_plates(image):
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = ocr_reader.readtext(rgb)

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
def process_image():
    try:
        verify_jwt_in_request()
    except Exception as exc:
        return jsonify({
            "error": "auth_failed",
            "detail": str(exc),
            "auth_header": request.headers.get("Authorization"),
        }), 401

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


@app.route("/auth-check")
@jwt_required()
def auth_check():
    return {"user_id": get_jwt_identity()}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=os.getenv("FLASK_DEBUG") == "1")
