FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-rus \
    libtesseract-dev \
    libgl1 \
    ffmpeg \
    libsm6 \
    libxext6 && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
ENV PIP_DEFAULT_TIMEOUT=120
RUN pip install --no-cache-dir --default-timeout=120 --retries=5 -r requirements.txt

RUN mkdir -p /data
ENV DATABASE_URL=sqlite:////data/app.db
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=8000
ENV FLASK_APP=app.py

COPY . .

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
