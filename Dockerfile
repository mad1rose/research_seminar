# syntax=docker/dockerfile:1
# Tessituragram Repertoire Recommender — Flask web app
#
# Targets:
#   dev  — default (last stage): Flask built-in server (`python app.py`).
#   prod — Gunicorn WSGI: `docker build --target prod -t tessituragram-app:prod .`
#
# `docker build -t tessituragram-app .` builds **dev** because `dev` is the final stage.

FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN useradd --create-home --shell /bin/bash --uid 1000 app

# --- prod (not default; build with --target prod) ---------------------------
FROM base AS prod

COPY requirements-prod.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements-prod.txt

COPY . .
RUN chown -R app:app /app

USER app

EXPOSE 5000

ENV FLASK_HOST=0.0.0.0 \
    PORT=5000 \
    FLASK_DEBUG=0

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "2", "app:app"]

# --- dev (default final stage) ----------------------------------------------
FROM base AS dev

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R app:app /app

USER app

EXPOSE 5000

ENV FLASK_HOST=0.0.0.0 \
    PORT=5000 \
    FLASK_DEBUG=0

CMD ["python", "app.py"]
