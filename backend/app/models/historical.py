from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class HistoricalLandslide(Base):
    __tablename__ = "historical_landslides"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    event_date = Column(DateTime, nullable=False)
    severity = Column(String(50), nullable=False)
    description = Column(Text)

    zone = relationship("Zone", back_populates="historical_landslides")
