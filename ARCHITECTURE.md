# Architecture — Landslide RiskGuard AI

## Data Flow

```
Data Sources → Processing → AI/ML Risk Engine → Output/Analytics → Alert & Response
```

### 1. Data Sources (Seeded Simulated Data)
- **Rainfall readings** — NASA GPM/IMERG-style `precipitationCal` values per zone, 72 hours of history
- **Soil moisture readings** — percentage moisture per zone, 72 hours of history
- **Terrain data** — slope angle, elevation, land cover per zone
- **Historical landslides** — past event records per zone (severity, date, description)
- **Citizen reports** — crowd-sourced observations with GPS, photos, issue type

### 2. Processing Layer
- **FastAPI REST API** — all CRUD operations, filtering, aggregation
- **PostGIS** — geospatial queries, zone geometry storage
- **APScheduler** — background job running every 60s to recompute risk scores

### 3. AI/ML Risk Engine
- **Random Forest Regressor** (scikit-learn) trained on synthetic risk patterns
- **Input features:** precipitationCal, moisture_pct, slope_angle, elevation_m, historical_count
- **Output:** risk score (0–100) mapped to levels: low (<25), moderate (25–49), high (50–74), very_high (75+)
- **Model persistence:** saved to `risk_model.pkl`, rebuilt on first run

### 4. Output & Analytics
- **Dashboard** — real-time zone markers on Leaflet map, stat cards with live DB aggregates
- **Zone Detail** — 7-day trend charts (Recharts), rainfall/moisture time series, infrastructure impact
- **Alerts** — auto-generated when score >70, includes bilingual messages (English + Assamese/Hindi)
- **Reports** — citizen submissions stored in DB, review queue for authorities

### 5. Alert & Response Pipeline
1. Scheduler triggers `recompute_all_risks()` every 60s
2. For each zone: fetch latest readings → run ML model → update `zones.current_risk_score`
3. If score > 70 and no recent unacknowledged alert → insert new `alerts` row
4. Frontend polls `/alerts` every 15s → new alerts appear without refresh
5. Authority acknowledges → alert status updated in DB → removed from active filter

## Database Schema

```
zones ──┬── rainfall_readings
        ├── soil_moisture_readings
        ├── terrain_data (1:1)
        ├── historical_landslides
        ├── citizen_reports
        ├── alerts
        └── infrastructure
users ──── citizen_reports
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /auth/login | JWT authentication |
| POST | /auth/register | Create account |
| GET | /zones | List zones (filterable) |
| GET | /zones/{id} | Zone detail with readings |
| GET | /zones/{id}/trend | 7-day risk score trend |
| GET | /zones/{id}/impact | Infrastructure at risk |
| POST | /risk/score | ML risk prediction |
| POST | /reports | Submit citizen report |
| GET | /reports | List reports (filterable) |
| PATCH | /reports/{id} | Update report status |
| GET | /alerts | List alerts (filterable) |
| PATCH | /alerts/{id} | Acknowledge alert |
| GET | /stats/summary | Dashboard aggregates |
