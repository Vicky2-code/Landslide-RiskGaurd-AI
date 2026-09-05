from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.citizen_report import CitizenReport
from app.models.notification import Notification
from app.schemas.schemas import CitizenReportCreate, CitizenReportResponse
from app.services.sms_service import send_report_status_sms
from app.config import get_settings
import os
import uuid

router = APIRouter(prefix="/reports", tags=["reports"])
settings = get_settings()

CITIZEN_PHONE_NUMBERS = ["+91-9876543200"]


@router.post("", response_model=CitizenReportResponse)
async def create_report(
    zone_id: Optional[int] = Form(None),
    lat: float = Form(...),
    lon: float = Form(...),
    issue_type: str = Form(...),
    description: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    photo_url = None
    if photo:
        ext = photo.filename.split(".")[-1] if photo.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        contents = await photo.read()
        with open(filepath, "wb") as f:
            f.write(contents)
        photo_url = f"/uploads/{filename}"

    report = CitizenReport(
        zone_id=zone_id,
        user_id=1,
        lat=lat,
        lon=lon,
        issue_type=issue_type,
        description=description,
        photo_url=photo_url,
        status="pending",
        synced=True,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    notif = Notification(
        zone_id=zone_id,
        title=f"New Report: {issue_type}",
        message=f"Citizen reported: {issue_type} at ({lat:.4f}, {lon:.4f}). {description or ''}",
        notification_type="new_report",
        channel="in_app",
        is_read=False,
    )
    db.add(notif)
    db.commit()

    return CitizenReportResponse.model_validate(report)


@router.get("", response_model=list[CitizenReportResponse])
def list_reports(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(CitizenReport)
    if status:
        q = q.filter(CitizenReport.status == status)
    return [CitizenReportResponse.model_validate(r) for r in q.order_by(CitizenReport.created_at.desc()).all()]


@router.patch("/{report_id}", response_model=CitizenReportResponse)
def update_report(report_id: int, status: str, db: Session = Depends(get_db)):
    report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = status
    db.commit()
    db.refresh(report)

    for phone in CITIZEN_PHONE_NUMBERS:
        send_report_status_sms(phone, report.id, status, report.issue_type)

    notif = Notification(
        zone_id=report.zone_id,
        title=f"Report #{report.id} — {status.title()}",
        message=f"Report #{report.id} ({report.issue_type}) has been {status}.",
        notification_type="report_update",
        channel="in_app",
        is_read=False,
    )
    db.add(notif)
    db.commit()

    return CitizenReportResponse.model_validate(report)
