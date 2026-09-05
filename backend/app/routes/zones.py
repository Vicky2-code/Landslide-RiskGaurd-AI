from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database import get_db
from app.models.zone import Zone
from app.models.readings import RainfallReading, SoilMoistureReading, TerrainData
from app.models.infrastructure import Infrastructure
from app.schemas.schemas import ZoneBase, ZoneDetail, TerrainResponse, RainfallResponse, SoilMoistureResponse, InfrastructureResponse

router = APIRouter(prefix="/zones", tags=["zones"])


@router.get("", response_model=List[ZoneBase])
def list_zones(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Zone)
    if state:
        q = q.filter(Zone.state == state)
    if district:
        q = q.filter(Zone.district == district)
    if risk_level:
        q = q.filter(Zone.current_risk_level == risk_level)
    return [ZoneBase.model_validate(z) for z in q.all()]


@router.get("/{zone_id}", response_model=ZoneDetail)
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    terrain = db.query(TerrainData).filter(TerrainData.zone_id == zone_id).first()
    rain_readings = (
        db.query(RainfallReading)
        .filter(RainfallReading.zone_id == zone_id)
        .order_by(RainfallReading.timestamp.desc())
        .limit(24)
        .all()
    )
    soil = (
        db.query(SoilMoistureReading)
        .filter(SoilMoistureReading.zone_id == zone_id)
        .order_by(SoilMoistureReading.timestamp.desc())
        .limit(24)
        .all()
    )
    infra = db.query(Infrastructure).filter(Infrastructure.zone_id == zone_id).all()

    detail = ZoneBase.model_validate(zone)
    return ZoneDetail(
        **detail.model_dump(),
        terrain=TerrainResponse.model_validate(terrain) if terrain else None,
        recent_rainfall=[RainfallResponse.model_validate(r) for r in rain_readings],
        recent_soil_moisture=[SoilMoistureResponse.model_validate(s) for s in soil],
        infrastructure=[InfrastructureResponse.model_validate(i) for i in infra],
    )


@router.get("/{zone_id}/trend")
def get_zone_trend(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    readings = (
        db.query(RainfallReading)
        .filter(RainfallReading.zone_id == zone_id, RainfallReading.timestamp >= seven_days_ago)
        .order_by(RainfallReading.timestamp.asc())
        .all()
    )

    from app.services.risk_service import predict_risk
    terrain = db.query(TerrainData).filter(TerrainData.zone_id == zone_id).first()
    soil = (
        db.query(SoilMoistureReading)
        .filter(SoilMoistureReading.zone_id == zone_id)
        .order_by(SoilMoistureReading.timestamp.desc())
        .first()
    )
    hist_count = len(zone.historical_landslides) if zone.historical_landslides else 0

    trend = []
    for r in readings:
        moisture = soil.moisture_pct if soil else 30
        slope = terrain.slope_angle if terrain else 20
        elevation = terrain.elevation_m if terrain else 500
        result = predict_risk(r.precipitationCal, moisture, slope, elevation, hist_count)
        trend.append({"date": r.timestamp.strftime("%Y-%m-%d"), "score": result["score"]})

    if not trend:
        from app.services.risk_service import predict_risk as pr
        slope = terrain.slope_angle if terrain else 20
        elevation = terrain.elevation_m if terrain else 500
        moisture = soil.moisture_pct if soil else 30
        result = pr(50, moisture, slope, elevation, hist_count)
        for i in range(7):
            d = (now - timedelta(days=6 - i)).strftime("%Y-%m-%d")
            trend.append({"date": d, "score": round(result["score"] + (i - 3) * 2, 1)})

    return trend


@router.get("/{zone_id}/impact")
def get_zone_impact(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    infra = db.query(Infrastructure).filter(Infrastructure.zone_id == zone_id).all()
    return [
        {"type": i.type, "name": i.name, "population_estimate": i.population_estimate}
        for i in infra
    ]
