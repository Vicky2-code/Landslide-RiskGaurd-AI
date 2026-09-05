from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    issue_type = Column(String(100), nullable=False)
    description = Column(Text)
    photo_url = Column(String(500))
    status = Column(String(20), default="pending")
    synced = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    zone = relationship("Zone", back_populates="citizen_reports")
    user = relationship("User")
