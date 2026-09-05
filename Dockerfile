FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/ ./backend/
COPY frontend/dist/ ./backend/frontend/dist/

RUN cd backend && pip install --no-cache-dir -r requirements.txt

RUN mkdir -p backend/uploads

WORKDIR /app/backend

EXPOSE 8000

CMD ["sh", "-c", "python seed.py 2>/dev/null; uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
