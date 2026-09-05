import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")


def scheduled_risk_recompute():
    try:
        from app.database import SessionLocal
        from app.services.risk_scheduler import recompute_all_risks
        db = SessionLocal()
        recompute_all_risks(db)
        db.close()
    except Exception as e:
        print(f"Risk recompute error: {e}")


scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.database import engine, Base
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        Base.metadata.create_all(bind=engine)
        scheduler.add_job(scheduled_risk_recompute, "interval", seconds=120, id="risk_recompute")
        scheduler.start()
        scheduled_risk_recompute()
    except Exception as e:
        print(f"Startup error: {e}")
    yield
    try:
        scheduler.shutdown()
    except Exception:
        pass


app = FastAPI(title="Landslide RiskGuard AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from app.routes import auth, zones, reports, alerts, stats, risk, notifications
    app.include_router(auth.router)
    app.include_router(zones.router)
    app.include_router(reports.router)
    app.include_router(alerts.router)
    app.include_router(stats.router)
    app.include_router(risk.router)
    app.include_router(notifications.router)
except Exception as e:
    print(f"Route error: {e}")

if os.path.exists(UPLOAD_DIR):
    try:
        app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
    except Exception:
        pass


@app.get("/api/health")
def health():
    return {"status": "ok"}


if os.path.exists(FRONTEND_DIR):
    try:
        app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")
    except Exception:
        pass

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
