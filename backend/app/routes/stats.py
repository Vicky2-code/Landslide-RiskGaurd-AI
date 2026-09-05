from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.zone import Zone
from app.models.alert import Alert
from app.models.citizen_report import CitizenReport
from app.schemas.schemas import StatsSummary

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=StatsSummary)
def get_summary(db: Session = Depends(get_db)):
    total_zones = db.query(func.count(Zone.id)).scalar() or 0
    high_risk = db.query(func.count(Zone.id)).filter(Zone.current_risk_level.in_(["high", "very_high"])).scalar() or 0
    active_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "sent").scalar() or 0
    pending_reports = db.query(func.count(CitizenReport.id)).filter(CitizenReport.status == "pending").scalar() or 0
    total_reports = db.query(func.count(CitizenReport.id)).scalar() or 0
    avg_score = db.query(func.avg(Zone.current_risk_score)).scalar() or 0
    states = db.query(func.count(func.distinct(Zone.state))).scalar() or 0

    return StatsSummary(
        total_zones=total_zones,
        high_risk_zones=high_risk,
        active_alerts=active_alerts,
        pending_reports=pending_reports,
        total_reports=total_reports,
        avg_risk_score=round(float(avg_score), 1),
        states_covered=states,
    )
