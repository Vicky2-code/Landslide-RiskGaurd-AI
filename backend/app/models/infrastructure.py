from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Infrastructure(Base):
    __tablename__ = "infrastructure"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    type = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    population_estimate = Column(Integer, nullable=True)

    zone = relationship("Zone", back_populates="infrastructure")
