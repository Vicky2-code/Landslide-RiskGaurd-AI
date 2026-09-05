import numpy as np
from sklearn.ensemble import RandomForestRegressor
import pickle
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "risk_model.pkl")


def get_risk_level(score: float) -> str:
    if score < 25:
        return "low"
    elif score < 50:
        return "moderate"
    elif score < 75:
        return "high"
    else:
        return "very_high"


def build_model():
    """Build and train a simple RF model for risk scoring."""
    np.random.seed(42)
    n = 500
    precipitation = np.random.uniform(0, 500, n)
    moisture = np.random.uniform(10, 95, n)
    slope = np.random.uniform(5, 60, n)
    elevation = np.random.uniform(100, 4000, n)
    hist_count = np.random.randint(0, 20, n)

    X = np.column_stack([precipitation, moisture, slope, elevation, hist_count])

    risk = (
        0.30 * np.clip(precipitation / 300, 0, 1) * 100
        + 0.25 * np.clip(moisture / 80, 0, 1) * 100
        + 0.25 * np.clip(slope / 45, 0, 1) * 100
        + 0.10 * np.clip(elevation / 3000, 0, 1) * 100
        + 0.10 * np.clip(hist_count / 10, 0, 1) * 100
        + np.random.normal(0, 3, n)
    )
    risk = np.clip(risk, 0, 100)

    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, risk)
    return model


def get_or_build_model():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    model = build_model()
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return model


def predict_risk(precipitation: float, moisture: float, slope: float, elevation: float, historical_count: int) -> dict:
    model = get_or_build_model()
    features = np.array([[precipitation, moisture, slope, elevation, historical_count]])
    score = float(model.predict(features)[0])
    score = max(0.0, min(100.0, score))
    return {"score": round(score, 1), "level": get_risk_level(score)}
