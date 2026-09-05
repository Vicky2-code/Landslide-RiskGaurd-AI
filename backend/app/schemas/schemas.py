from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "citizen"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class ZoneBase(BaseModel):
    id: int
    name: str
    state: str
    district: str
    lat: float
    lon: float
    current_risk_score: float
    current_risk_level: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ZoneDetail(ZoneBase):
    terrain: Optional["TerrainResponse"] = None
    recent_rainfall: List["RainfallResponse"] = []
    recent_soil_moisture: List["SoilMoistureResponse"] = []
    historical_landslides: List["HistoricalLandslideResponse"] = []
    infrastructure: List["InfrastructureResponse"] = []


class TerrainResponse(BaseModel):
    slope_angle: float
    elevation_m: float
    land_cover: Optional[str] = None

    class Config:
        from_attributes = True


class RainfallResponse(BaseModel):
    precipitationCal: float
    timestamp: datetime

    class Config:
        from_attributes = True


class SoilMoistureResponse(BaseModel):
    moisture_pct: float
    timestamp: datetime

    class Config:
        from_attributes = True


class HistoricalLandslideResponse(BaseModel):
    event_date: datetime
    severity: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class InfrastructureResponse(BaseModel):
    type: str
    name: str
    population_estimate: Optional[int] = None

    class Config:
        from_attributes = True


class CitizenReportCreate(BaseModel):
    zone_id: Optional[int] = None
    lat: float
    lon: float
    issue_type: str
    description: Optional[str] = None


class CitizenReportResponse(BaseModel):
    id: int
    zone_id: Optional[int]
    user_id: int
    lat: float
    lon: float
    issue_type: str
    description: Optional[str]
    photo_url: Optional[str]
    status: str
    synced: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: int
    zone_id: int
    zone_name: Optional[str] = None
    risk_score_at_trigger: float
    message_en: str
    message_regional: Optional[str]
    regional_language: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AlertAcknowledge(BaseModel):
    status: str = "acknowledged"


class RiskScoreRequest(BaseModel):
    precipitationCal: float
    moisture_pct: float
    slope_angle: float
    elevation_m: float
    historical_count: int = 0


class RiskScoreResponse(BaseModel):
    score: float
    level: str


class TrendPoint(BaseModel):
    date: str
    score: float


class StatsSummary(BaseModel):
    total_zones: int
    high_risk_zones: int
    active_alerts: int
    pending_reports: int
    total_reports: int
    avg_risk_score: float
    states_covered: int


ZoneDetail.model_rebuild()
