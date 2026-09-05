from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class RainfallReading(Base):
    __tablename__ = "rainfall_readings"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    precipitationCal = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)

    zone = relationship("Zone", back_populates="rainfall_readings")


class SoilMoistureReading(Base):
    __tablename__ = "soil_moisture_readings"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    moisture_pct = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)

    zone = relationship("Zone", back_populates="soil_moisture_readings")


class TerrainData(Base):
    __tablename__ = "terrain_data"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False, unique=True)
    slope_angle = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False)
    land_cover = Column(String(100))

    zone = relationship("Zone", back_populates="terrain_data")
