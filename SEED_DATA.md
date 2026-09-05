# Seed Data — Real NER Locations

## Why These Locations

The 16 seeded zones cover all 8 North Eastern Region states, selected for:
- **Known landslide history** — areas with documented slope failures and road blockages
- **Geographic diversity** — from low-elevation Assam valleys to high-altitude Sikkim slopes
- **Rainfall extremes** — Meghalaya's Cherrapunji/Mawsynram (wettest places on Earth) to drier Tripura
- **Infrastructure relevance** — state capitals, NH corridors, and vulnerable hill towns

## Seeded Zones

| # | Zone | State | District | Lat | Lon | Why |
|---|------|-------|----------|-----|-----|-----|
| 1 | Shillong | Meghalaya | East Khasi Hills | 25.5788 | 91.8933 | Steep hill roads, heavy monsoon rainfall |
| 2 | Cherrapunji | Meghalaya | Sohra | 25.3000 | 91.7000 | Among highest rainfall totals on Earth |
| 3 | Mawsynram | Meghalaya | West Khasi Hills | 25.2973 | 91.5822 | Extreme monsoon rainfall, saturated slopes |
| 4 | Haflong | Assam | Dima Hasao | 25.1667 | 93.0167 | Frequent rail-line & highway blockages |
| 5 | Guwahati | Assam | Kamrup | 26.1445 | 91.7362 | Urban hill-slope encroachment |
| 6 | Aizawl | Mizoram | Aizawl | 23.7271 | 92.7176 | City built on ridges; frequent slope failures |
| 7 | Champhai | Mizoram | Champhai | 23.4667 | 93.3333 | Border hill roads, seasonal slides |
| 8 | Ukhrul | Manipur | Ukhrul | 25.1167 | 94.3667 | Hilly, poor road connectivity |
| 9 | Senapati | Manipur | Senapati | 25.2667 | 94.0167 | Steep terrain, NH-2 corridor disruptions |
| 10 | Kohima | Nagaland | Kohima | 25.6751 | 94.1086 | Capital on a ridge; road cutting instability |
| 11 | Wokha | Nagaland | Wokha | 26.0833 | 94.2667 | Hill agriculture + slope destabilization |
| 12 | Itanagar | Arunachal Pradesh | Papum Pare | 27.0844 | 93.6053 | Remote steep terrain, road blockages |
| 13 | Along | Arunachal Pradesh | West Siang | 28.1667 | 94.8000 | Highway landslide-prone stretch |
| 14 | Gangtok | Sikkim | East Sikkim | 27.3389 | 88.6065 | NH10 frequent blockages |
| 15 | Mangan | Sikkim | North Sikkim | 27.5167 | 88.5333 | High-altitude slope instability |
| 16 | Dharmanagar | Tripura | North Tripura | 24.3667 | 92.1667 | Lower but non-zero hill-slope risk |

## Seeded Data Per Zone

Each zone gets:
- **72 hourly rainfall readings** — base value calibrated to real monsoon averages, with random spikes
- **72 hourly soil moisture readings** — correlated with rainfall, clamped to 15–95%
- **Terrain data** — slope angle (15–45°) and elevation (45–1650m) matching real topography
- **2–8 historical landslide events** — random severity (minor/moderate/severe/critical)
- **2–5 infrastructure items** — roads, schools, hospitals, villages with population estimates

## Risk Score Calibration

Meghalaya zones (Cherrapunji, Mawsynram) seed with very high rainfall → consistently high risk scores.
Sikkim/Arunachal zones seed with steep slopes and high elevation → elevated baseline risk.
Assam valley zones (Guwahati) seed with lower slopes but moderate rainfall → variable risk.
Tripura (Dharmanagar) seeds with low slope and low rainfall → generally low risk.
