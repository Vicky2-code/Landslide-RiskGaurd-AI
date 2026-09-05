from fastapi import APIRouter, Depends
from app.schemas.schemas import RiskScoreRequest, RiskScoreResponse
from app.services.risk_service import predict_risk

router = APIRouter(prefix="/risk", tags=["risk"])


@router.post("/score", response_model=RiskScoreResponse)
def score_risk(data: RiskScoreRequest):
    result = predict_risk(
        data.precipitationCal,
        data.moisture_pct,
        data.slope_angle,
        data.elevation_m,
        data.historical_count,
    )
    return RiskScoreResponse(score=result["score"], level=result["level"])
