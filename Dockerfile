# ── Etapa 1: build del frontend (Vite + React) ──
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Etapa 2: backend Flask sirviendo la API + el build estático ──
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-build /app/frontend/dist ./static_dist

EXPOSE 8080

# Cloud Run inyecta $PORT. Timeout amplio para textos largos.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 300 app:app
