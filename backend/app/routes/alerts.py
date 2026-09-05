from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.alert import Alert
from app.models.zone import Zone
from app.schemas.schemas import AlertResponse, AlertAcknowledge

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertResponse])
def list_alerts(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Alert)
    if status:
        q = q.filter(Alert.status == status)
    alerts = q.order_by(Alert.created_at.desc()).all()
    result = []
    for a in alerts:
        zone = db.query(Zone).filter(Zone.id == a.zone_id).first()
        result.append(
            AlertResponse(
                id=a.id,
                zone_id=a.zone_id,
                zone_name=zone.name if zone else None,
                risk_score_at_trigger=a.risk_score_at_trigger,
                message_en=a.message_en,
                message_regional=a.message_regional,
                regional_language=a.regional_language,
                status=a.status,
                created_at=a.created_at,
            )
        )
    return result


@router.patch("/{alert_id}", response_model=AlertResponse)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "acknowledged"
    db.commit()
    db.refresh(alert)
    zone = db.query(Zone).filter(Zone.id == alert.zone_id).first()
    return AlertResponse(
        id=alert.id,
        zone_id=alert.zone_id,
        zone_name=zone.name if zone else None,
        risk_score_at_trigger=alert.risk_score_at_trigger,
        message_en=alert.message_en,
        message_regional=alert.message_regional,
        regional_language=alert.regional_language,
        status=alert.status,
        created_at=alert.created_at,
    )
