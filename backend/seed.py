import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime, timedelta, timezone
import random
from app.database import SessionLocal, engine, Base
from app.models.zone import Zone
from app.models.readings import RainfallReading, SoilMoistureReading, TerrainData
from app.models.historical import HistoricalLandslide
from app.models.infrastructure import Infrastructure
from app.models.user import User
from app.models.notification import Notification
from app.services.auth_service import hash_password
from app.services.risk_service import predict_risk, get_risk_level

NER_ZONES = [
    {"name": "Shillong", "state": "Meghalaya", "district": "East Khasi Hills", "lat": 25.5788, "lon": 91.8933,
     "rainfall_base": 280, "moisture_base": 72, "slope": 32, "elevation": 1525},
    {"name": "Cherrapunji", "state": "Meghalaya", "district": "Sohra", "lat": 25.3000, "lon": 91.7000,
     "rainfall_base": 450, "moisture_base": 85, "slope": 38, "elevation": 1430},
    {"name": "Mawsynram", "state": "Meghalaya", "district": "West Khasi Hills", "lat": 25.2973, "lon": 91.5822,
     "rainfall_base": 480, "moisture_base": 88, "slope": 40, "elevation": 1400},
    {"name": "Haflong", "state": "Assam", "district": "Dima Hasao", "lat": 25.1667, "lon": 93.0167,
     "rainfall_base": 220, "moisture_base": 65, "slope": 28, "elevation": 966},
    {"name": "Guwahati", "state": "Assam", "district": "Kamrup", "lat": 26.1445, "lon": 91.7362,
     "rainfall_base": 180, "moisture_base": 55, "slope": 18, "elevation": 55},
    {"name": "Aizawl", "state": "Mizoram", "district": "Aizawl", "lat": 23.7271, "lon": 92.7176,
     "rainfall_base": 200, "moisture_base": 68, "slope": 35, "elevation": 1132},
    {"name": "Champhai", "state": "Mizoram", "district": "Champhai", "lat": 23.4667, "lon": 93.3333,
     "rainfall_base": 190, "moisture_base": 62, "slope": 30, "elevation": 920},
    {"name": "Ukhrul", "state": "Manipur", "district": "Ukhrul", "lat": 25.1167, "lon": 94.3667,
     "rainfall_base": 210, "moisture_base": 67, "slope": 33, "elevation": 1890},
    {"name": "Senapati", "state": "Manipur", "district": "Senapati", "lat": 25.2667, "lon": 94.0167,
     "rainfall_base": 200, "moisture_base": 64, "slope": 30, "elevation": 1680},
    {"name": "Kohima", "state": "Nagaland", "district": "Kohima", "lat": 25.6751, "lon": 94.1086,
     "rainfall_base": 195, "moisture_base": 66, "slope": 29, "elevation": 1444},
    {"name": "Wokha", "state": "Nagaland", "district": "Wokha", "lat": 26.0833, "lon": 94.2667,
     "rainfall_base": 185, "moisture_base": 60, "slope": 26, "elevation": 1325},
    {"name": "Itanagar", "state": "Arunachal Pradesh", "district": "Papum Pare", "lat": 27.0844, "lon": 93.6053,
     "rainfall_base": 230, "moisture_base": 70, "slope": 36, "elevation": 320},
    {"name": "Along", "state": "Arunachal Pradesh", "district": "West Siang", "lat": 28.1667, "lon": 94.8000,
     "rainfall_base": 215, "moisture_base": 68, "slope": 34, "elevation": 300},
    {"name": "Gangtok", "state": "Sikkim", "district": "East Sikkim", "lat": 27.3389, "lon": 88.6065,
     "rainfall_base": 250, "moisture_base": 74, "slope": 42, "elevation": 1650},
    {"name": "Mangan", "state": "Sikkim", "district": "North Sikkim", "lat": 27.5167, "lon": 88.5333,
     "rainfall_base": 240, "moisture_base": 76, "slope": 45, "elevation": 940},
    {"name": "Dharmanagar", "state": "Tripura", "district": "North Tripura", "lat": 24.3667, "lon": 92.1667,
     "rainfall_base": 170, "moisture_base": 58, "slope": 15, "elevation": 45},
]

INFRA_TEMPLATES = [
    ("road", ["NH-6", "NH-37", "SH-1", "District Road", "Hill Highway"]),
    ("school", ["Primary School", "High School", "Govt. School"]),
    ("hospital", ["District Hospital", "PHC", "Community Health Centre"]),
    ("village", ["Village", "Tea Garden", "Town"]),
]

now = datetime.now(timezone.utc)


def seed():
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()

        existing = db.query(Zone).count()
        if existing > 0:
            print(f"Database already has {existing} zones. Skipping seed.")
            db.close()
            return

        admin = User(name="Admin Authority", email="admin@riskguard.gov.in", password_hash=hash_password("admin123"), role="authority")
        citizen = User(name="Citizen User", email="citizen@riskguard.gov.in", password_hash=hash_password("citizen123"), role="citizen")
        db.add_all([admin, citizen])
        db.flush()

        zones_created = []
        for z in NER_ZONES:
            zone = Zone(
                name=z["name"], state=z["state"], district=z["district"],
                lat=z["lat"], lon=z["lon"], current_risk_score=0, current_risk_level="low",
            )
            db.add(zone)
            db.flush()

            terrain = TerrainData(zone_id=zone.id, slope_angle=z["slope"], elevation_m=z["elevation"], land_cover="mixed_forest")
            db.add(terrain)

            for h in range(72):
                ts = now - timedelta(hours=h)
                rain_var = z["rainfall_base"] * (0.7 + 0.6 * random.random())
                if random.random() < 0.15:
                    rain_var *= 1.5 + random.random()
                db.add(RainfallReading(zone_id=zone.id, precipitationCal=round(rain_var, 1), timestamp=ts))
                moisture_var = z["moisture_base"] + random.gauss(0, 8)
                moisture_var = max(15, min(95, moisture_var))
                db.add(SoilMoistureReading(zone_id=zone.id, moisture_pct=round(moisture_var, 1), timestamp=ts))

            hist_events = random.randint(2, 8)
            for i in range(hist_events):
                evt_date = now - timedelta(days=random.randint(30, 1800))
                severity = random.choice(["minor", "moderate", "severe", "critical"])
                descs = {
                    "minor": "Small rockfall blocking local path",
                    "moderate": "Landslide blocking road for several hours",
                    "severe": "Major landslide destroying section of highway",
                    "critical": "Catastrophic landslide affecting village area",
                }
                db.add(HistoricalLandslide(zone_id=zone.id, event_date=evt_date, severity=severity, description=descs[severity]))

            infra_count = random.randint(2, 5)
            for _ in range(infra_count):
                infra_type, names = random.choice(INFRA_TEMPLATES)
                name = f"{random.choice(names)} near {z['name']}"
                pop = random.randint(200, 15000) if infra_type in ("village", "school") else None
                db.add(Infrastructure(zone_id=zone.id, type=infra_type, name=name, population_estimate=pop))

            latest_rain = z["rainfall_base"] * (0.8 + 0.4 * random.random())
            latest_moisture = z["moisture_base"] + random.gauss(0, 5)
            hist_count = hist_events
            result = predict_risk(latest_rain, latest_moisture, z["slope"], z["elevation"], hist_count)
            zone.current_risk_score = result["score"]
            zone.current_risk_level = result["level"]
            zones_created.append(zone)

        db.commit()
        print(f"Seeded {len(zones_created)} zones successfully.")
        db.close()
    except Exception as e:
        print(f"Seed error (non-fatal): {e}")


if __name__ == "__main__":
    seed()
