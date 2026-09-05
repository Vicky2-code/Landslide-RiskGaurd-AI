from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.notification import Notification
from app.models.zone import Zone

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Notification)
    if status == "unread":
        q = q.filter(Notification.is_read == False)
    elif status == "read":
        q = q.filter(Notification.is_read == True)
    notifs = q.order_by(Notification.created_at.desc()).limit(50).all()
    result = []
    for n in notifs:
        zone = db.query(Zone).filter(Zone.id == n.zone_id).first() if n.zone_id else None
        result.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "channel": n.channel,
            "is_read": n.is_read,
            "zone_id": n.zone_id,
            "zone_name": zone.name if zone else None,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        })
    return result


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"count": count}


@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"ok": True}


@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"ok": True}
