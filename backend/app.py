from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import cv2
import numpy as np
from PIL import Image, ImageFilter
import pytesseract
import easyocr
import re
import datetime
import requests
from pathlib import Path
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
RESULT_ENDPOINT = os.getenv("RESULT_ENDPOINT", "http://localhost:8080/result")
BASE_DIR = Path(__file__).resolve().parent
PROCESSED_SAVE_DIR = os.getenv("PROCESSED_SAVE_DIR", str(BASE_DIR / "processed"))
PROCESSED_URL_PATH = os.getenv("PROCESSED_URL_PATH", "/processed")

# Allow overriding tesseract binary location in container/host
tesseract_cmd = os.getenv("TESSERACT_CMD")
if tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

db.init_app(app)
jwt.init_app(app)
migrate = Migrate(app, db)
os.makedirs(PROCESSED_SAVE_DIR, exist_ok=True)

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

PASSPORT_NUMBER_PATTERNS = [
    re.compile(r"^\d{2}\s?\d{2}\s?\d{6}$"),  # 80 08 885361
    re.compile(r"^\d{4}\s?\d{6}$"),          # 8008 885361
    re.compile(r"^\d{10}$"),                 # 8008885361
]

# Буквы, разрешенные на российских номерах
PLATE_LETTERS = "ABEKMHOPCTYXАВЕКМНОРСТУХ"
PLATE_PATTERN = re.compile(
    rf"^[{PLATE_LETTERS}]\d{{3}}[{PLATE_LETTERS}]{{2}}\d{{2,3}}$"
)


def _box_iou(box_a, box_b):
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b
    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)
    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0.0
    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    return inter_area / float(area_a + area_b - inter_area)


def _dedupe_boxes(boxes, iou_threshold=0.3):
    deduped = []
    for box in boxes:
        if all(_box_iou(box, saved) < iou_threshold for saved in deduped):
            deduped.append(box)
    return deduped


def _normalize_plate_text(text):
    cleaned = re.sub(r"[^A-Za-zА-Яа-я0-9]", "", text or "")
    return cleaned.upper()


def _looks_like_passport_number(text):
    if not text:
        return False
    normalized = re.sub(r"\s+", "", text)
    return any(pat.match(normalized) for pat in PASSPORT_NUMBER_PATTERNS)


def _looks_like_plate(text):
    normalized = _normalize_plate_text(text)
    if len(normalized) < 7 or len(normalized) > 9:
        return False
    return bool(PLATE_PATTERN.match(normalized))


def _merge_boxes(boxes):
    x1 = min(b[0] for b in boxes)
    y1 = min(b[1] for b in boxes)
    x2 = max(b[2] for b in boxes)
    y2 = max(b[3] for b in boxes)
    return (x1, y1, x2, y2)


def _has_enough_digits(text, min_digits=3):
    if not text:
        return False
    return sum(ch.isdigit() for ch in text) >= min_digits


def _file_public_url(filename: str):
    base = request.host_url.rstrip("/")
    path = PROCESSED_URL_PATH if PROCESSED_URL_PATH.startswith("/") else f"/{PROCESSED_URL_PATH}"
    return f"{base}{path}/{filename}"


def _file_relative_path(filename: str):
    path = PROCESSED_URL_PATH if PROCESSED_URL_PATH.startswith("/") else f"/{PROCESSED_URL_PATH}"
    return f"{path}/{filename}"


def _build_file_info(filename: str):
    fs_path = os.path.join(PROCESSED_SAVE_DIR, filename)
    info = {
        "name": filename,
        "url": _file_public_url(filename),
        "path": _file_relative_path(filename),
    }
    try:
        stat = os.stat(fs_path)
        info["size"] = stat.st_size
        info["mtime"] = stat.st_mtime
    except FileNotFoundError:
        pass
    return info


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
    data = pytesseract.image_to_data(
        gray,
        output_type=pytesseract.Output.DICT,
        lang="rus+eng",
        config="--psm 6",
    )

    tokens = []
    for i in range(len(data["text"])):
        raw_word = data["text"][i].strip()
        conf = float(data["conf"][i])
        if not raw_word or conf < 0:  # тессеракт помечает -1 как мусор
            continue
        cleaned = re.sub(r"[^\w]", "", raw_word)
        if not cleaned:
            continue
        tokens.append(
            {
                "text": cleaned,
                "x1": data["left"][i],
                "y1": data["top"][i],
                "x2": data["left"][i] + data["width"][i],
                "y2": data["top"][i] + data["height"][i],
                "line": (data["block_num"][i], data["par_num"][i], data["line_num"][i]),
            }
        )

    # Группируем токены по строкам, чтобы собрать серию + номер вместе
    by_line = {}
    for token in tokens:
        by_line.setdefault(token["line"], []).append(token)
    for line_tokens in by_line.values():
        line_tokens.sort(key=lambda t: t["x1"])

    boxes = []

    # Проверяем склейку соседних числовых токенов (1-3 подряд)
    for line_tokens in by_line.values():
        digit_tokens = [t for t in line_tokens if any(ch.isdigit() for ch in t["text"])]
        for window in (1, 2, 3):
            for idx in range(len(digit_tokens) - window + 1):
                parts = digit_tokens[idx : idx + window]
                candidate = " ".join(p["text"] for p in parts)
                if _looks_like_passport_number(candidate):
                    x1 = min(p["x1"] for p in parts)
                    y1 = min(p["y1"] for p in parts)
                    x2 = max(p["x2"] for p in parts)
                    y2 = max(p["y2"] for p in parts)
                    boxes.append((x1, y1, x2, y2))

    # Fallback: easyOCR часто лучше читает вертикальный номер
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    ocr_results = ocr_reader.readtext(rgb)
    for (bbox, text, prob) in ocr_results:
        if not _looks_like_passport_number(text):
            continue
        xs = [p[0] for p in bbox]
        ys = [p[1] for p in bbox]
        boxes.append((int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))))

    return _dedupe_boxes(boxes)

def detect_car_plates(image):
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    boosted_gray = clahe.apply(gray)
    boosted_rgb = cv2.cvtColor(boosted_gray, cv2.COLOR_GRAY2RGB)

    boxes = []

    def _collect_easyocr_boxes(img_variant):
        local_boxes = []
        results = ocr_reader.readtext(img_variant)
        for (bbox, text, prob) in results:
            if not text:
                continue
            normalized = _normalize_plate_text(text)
            xs = [p[0] for p in bbox]
            ys = [p[1] for p in bbox]
            box = (int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys)))
            if _has_enough_digits(normalized):
                local_boxes.append((box, normalized))
        # Склеиваем соседние числовые куски по оси X
        partials_sorted = sorted(local_boxes, key=lambda item: item[0][0])
        merged = []
        for window in (1, 2, 3, 4):
            for idx in range(len(partials_sorted) - window + 1):
                chunk = partials_sorted[idx : idx + window]
                merged_text = "".join(p[1] for p in chunk)
                if _has_enough_digits(merged_text):
                    merged.append(_merge_boxes([p[0] for p in chunk]))
        return merged

    # Прогоняем easyOCR по исходному и усиленному по контрасту изображениям
    for img_variant in (rgb, boosted_rgb):
        boxes.extend(_collect_easyocr_boxes(img_variant))

    # Подстраховка: тессеракт иногда лучше собирает разорванные символы
    data = pytesseract.image_to_data(
        boosted_gray,
        output_type=pytesseract.Output.DICT,
        lang="rus+eng",
        config="--psm 6",
    )
    line_map = {}
    for i in range(len(data["text"])):
        word = data["text"][i].strip()
        conf = float(data["conf"][i])
        if not word or conf < 0:
            continue
        cleaned = re.sub(r"[^\w]", "", word)
        if not cleaned:
            continue
        line_key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        line_map.setdefault(line_key, []).append(
            {
                "text": cleaned,
                "x1": data["left"][i],
                "y1": data["top"][i],
                "x2": data["left"][i] + data["width"][i],
                "y2": data["top"][i] + data["height"][i],
            }
        )

    for line_tokens in line_map.values():
        line_tokens.sort(key=lambda t: t["x1"])
        for window in (1, 2, 3, 4):
            for idx in range(len(line_tokens) - window + 1):
                parts = line_tokens[idx : idx + window]
                candidate = "".join(p["text"] for p in parts)
                if _has_enough_digits(candidate):
                    x1 = min(p["x1"] for p in parts)
                    y1 = min(p["y1"] for p in parts)
                    x2 = max(p["x2"] for p in parts)
                    y2 = max(p["y2"] for p in parts)
                    boxes.append((x1, y1, x2, y2))

    return _dedupe_boxes(boxes)

def _expand_box(box, margin, width, height):
    x1, y1, x2, y2 = box
    dx = int((x2 - x1) * margin)
    dy = int((y2 - y1) * margin)
    return (
        max(0, x1 - dx),
        max(0, y1 - dy),
        min(width, x2 + dx),
        min(height, y2 + dy),
    )

def _save_and_forward(image: Image.Image, original_name: str | None):
    """
    Сохраняем обработанный файл локально и отправляем в внешний endpoint.
    Ошибки отправки не ломают ответ пользователю.
    """
    ts = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    safe_name = re.sub(r"[^\w.-]", "_", original_name or "upload")
    filename = f"{ts}_{safe_name}.png"
    file_path = os.path.join(PROCESSED_SAVE_DIR, filename)

    os.makedirs(PROCESSED_SAVE_DIR, exist_ok=True)
    image.save(file_path, "PNG")

    try:
        with open(file_path, "rb") as fh:
            resp = requests.post(
                RESULT_ENDPOINT,
                files={"file": (filename, fh, "image/png")},
                timeout=10,
            )
        app.logger.info("Forwarded processed image to %s status=%s", RESULT_ENDPOINT, getattr(resp, "status_code", None))
    except Exception as exc:
        app.logger.error("Failed to forward processed image: %s", exc)

    return _build_file_info(filename)

def blur_regions(image, regions):
    img = image.copy()
    width, height = img.size
    for (x1, y1, x2, y2) in regions:
        ex1, ey1, ex2, ey2 = _expand_box((x1, y1, x2, y2), margin=0.15, width=width, height=height)
        crop = img.crop((ex1, ey1, ex2, ey2)).filter(ImageFilter.GaussianBlur(18))
        img.paste(crop, (ex1, ey1))
    return img

@app.route("/process-image", methods=["POST"])
def process_image():
    # Пытаемся проверить JWT, но не блокируем обработку, чтобы не ронять UX
    auth_header = request.headers.get("Authorization")
    if auth_header:
        try:
            verify_jwt_in_request()
        except Exception as exc:
            # Логируем, но продолжаем обработку
            app.logger.warning("JWT check failed: %s", exc)

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "Файл не найден"}), 400

    pil_img = Image.open(file.stream).convert("RGB")
    cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    plate_boxes = detect_car_plates(cv_img)
    processed_img = blur_regions(pil_img, plate_boxes) if plate_boxes else pil_img

    file_info = _save_and_forward(processed_img, file.filename)
    response = jsonify({"file": file_info, "message": "Изображение обработано и сохранено"})
    response.headers["X-Processed-Filename"] = file_info["name"]
    response.headers["X-Processed-Url"] = file_info["url"]
    response.headers["X-Processed-Path"] = file_info["path"]
    return response


@app.route("/processed-files", methods=["GET"])
@jwt_required(optional=True)
def list_processed_files():
    files = []
    if os.path.isdir(PROCESSED_SAVE_DIR):
        for name in os.listdir(PROCESSED_SAVE_DIR):
            if not name.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp")):
                continue
            path = os.path.join(PROCESSED_SAVE_DIR, name)
            try:
                os.stat(path)
            except FileNotFoundError:
                continue
            files.append(_build_file_info(name))
    files.sort(key=lambda f: f.get("mtime") or 0, reverse=True)
    return jsonify({"files": files})


@app.route(f"{PROCESSED_URL_PATH.rstrip('/')}/<path:filename>")
@jwt_required(optional=True)
def serve_processed(filename):
    return send_from_directory(PROCESSED_SAVE_DIR, filename)

@app.route("/health")
def health():
    return {"status": "ok"}


@app.route("/auth-check")
@jwt_required()
def auth_check():
    return {"user_id": get_jwt_identity()}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=os.getenv("FLASK_DEBUG") == "1")
