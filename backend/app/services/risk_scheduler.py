from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.models.zone import Zone
from app.models.readings import RainfallReading, SoilMoistureReading, TerrainData
from app.models.alert import Alert
from app.models.notification import Notification
from app.services.risk_service import predict_risk
from app.services.sms_service import send_risk_alert_sms

AUTHORITY_PHONE_NUMBERS = ["+91-9876543210", "+91-9876543211"]


def recompute_all_risks(db: Session):
    """Background job: recompute risk for every zone, create alerts and notifications."""
    zones = db.query(Zone).all()
    for zone in zones:
        terrain = db.query(TerrainData).filter(TerrainData.zone_id == zone.id).first()

        latest_rain = (
            db.query(RainfallReading)
            .filter(RainfallReading.zone_id == zone.id)
            .order_by(RainfallReading.timestamp.desc())
            .first()
        )
        latest_soil = (
            db.query(SoilMoistureReading)
            .filter(SoilMoistureReading.zone_id == zone.id)
            .order_by(SoilMoistureReading.timestamp.desc())
            .first()
        )

        hist_count = len(zone.historical_landslides) if zone.historical_landslides else 0

        precipitation = latest_rain.precipitationCal if latest_rain else 0
        moisture = latest_soil.moisture_pct if latest_soil else 30
        slope = terrain.slope_angle if terrain else 20
        elevation = terrain.elevation_m if terrain else 500

        result = predict_risk(precipitation, moisture, slope, elevation, hist_count)

        zone.current_risk_score = result["score"]
        zone.current_risk_level = result["level"]
        zone.updated_at = datetime.now(timezone.utc)

        if result["score"] > 70:
            existing = (
                db.query(Alert)
                .filter(Alert.zone_id == zone.id, Alert.status == "sent")
                .order_by(Alert.created_at.desc())
                .first()
            )
            if not existing or (datetime.now(timezone.utc) - existing.created_at.replace(tzinfo=timezone.utc)).total_seconds() > 3600:
                lang = "as" if zone.state == "Assam" else "hi"
                msg_en = f"High landslide risk detected in {zone.name}, {zone.district}. Risk score: {result['score']:.0f}/100. Exercise caution and avoid steep slopes."
                msg_regional = (
                    f"সতর্কতা: {zone.name}, {zone.district} ত উচ্চ ভূমিধসৰ বিপদ চিহ্নিত কৰা হৈছে। বিপদ স্ক'ৰ: {result['score']:.0f}/100।"
                    if lang == "as"
                    else f"चेतावनी: {zone.name}, {zone.district} में भूस्खलन का उच्च जोखिम। जोखिम स्कोर: {result['score']:.0f}/100। सावधान रहें।"
                )
                alert = Alert(
                    zone_id=zone.id,
                    risk_score_at_trigger=result["score"],
                    message_en=msg_en,
                    message_regional=msg_regional,
                    regional_language=lang,
                    status="sent",
                )
                db.add(alert)
                db.flush()

                notif = Notification(
                    zone_id=zone.id,
                    title=f"High Risk Alert — {zone.name}",
                    message=msg_en,
                    notification_type="risk_alert",
                    channel="in_app",
                    is_read=False,
                )
                db.add(notif)

                sms_results = send_risk_alert_sms(zone.name, zone.district, result["score"], AUTHORITY_PHONE_NUMBERS)
                for sms in sms_results:
                    sms_notif = Notification(
                        zone_id=zone.id,
                        title=f"SMS Sent — {zone.name}",
                        message=f"Alert SMS sent to authority: {sms['to']}",
                        notification_type="sms_sent",
                        channel="sms",
                        is_read=False,
                    )
                    db.add(sms_notif)

    db.commit()
