FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN cd frontend && npm install && npm run build && \
    mkdir -p ../backend/frontend && \
    cp -r dist ../backend/frontend/

RUN cd backend && pip install --no-cache-dir -r requirements.txt

RUN mkdir -p backend/uploads

WORKDIR /app/backend

EXPOSE 8000

CMD sh -c "python seed.py; uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
