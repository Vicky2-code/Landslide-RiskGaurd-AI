from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    current_risk_score = Column(Float, default=0.0)
    current_risk_level = Column(String(50), default="low")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    rainfall_readings = relationship("RainfallReading", back_populates="zone")
    soil_moisture_readings = relationship("SoilMoistureReading", back_populates="zone")
    terrain_data = relationship("TerrainData", back_populates="zone", uselist=False)
    historical_landslides = relationship("HistoricalLandslide", back_populates="zone")
    citizen_reports = relationship("CitizenReport", back_populates="zone")
    alerts = relationship("Alert", back_populates="zone")
    infrastructure = relationship("Infrastructure", back_populates="zone")
