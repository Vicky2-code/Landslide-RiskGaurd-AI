from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    risk_score_at_trigger = Column(Float, nullable=False)
    message_en = Column(Text, nullable=False)
    message_regional = Column(Text)
    regional_language = Column(String(50))
    status = Column(String(20), default="sent")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    zone = relationship("Zone", back_populates="alerts")
