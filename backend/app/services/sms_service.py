from datetime import datetime, timezone


def send_sms_simulation(phone_number: str, message: str) -> dict:
    """Simulate sending an SMS. In production, integrate with Twilio, MSG91, etc."""
    log_entry = {
        "to": phone_number,
        "message": message,
        "status": "sent",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "provider": "simulation",
    }
    import sys
    msg = f"[SMS] To: {phone_number} | {message[:60]}"
    try:
        print(msg)
    except UnicodeEncodeError:
        sys.stdout.buffer.write((msg + "\n").encode("utf-8", errors="replace"))
    return log_entry


def send_risk_alert_sms(zone_name: str, district: str, risk_score: float, phone_numbers: list[str]) -> list[dict]:
    """Send risk alert SMS to all registered phone numbers."""
    message = (
        f"LANDSLIDE ALERT: High risk detected in {zone_name}, {district}. "
        f"Risk score: {risk_score:.0f}/100. Avoid steep slopes and stay alert. "
        f"- RiskGuard AI"
    )
    results = []
    for phone in phone_numbers:
        result = send_sms_simulation(phone, message)
        results.append(result)
    return results


def send_report_status_sms(phone_number: str, report_id: int, status: str, issue_type: str) -> dict:
    """Notify citizen when their report status changes."""
    status_text = {
        "reviewed": "is being reviewed by authorities",
        "resolved": "has been resolved",
        "rejected": "could not be verified",
    }.get(status, f"updated to {status}")

    message = (
        f"Your report #{report_id} ({issue_type}) {status_text}. "
        f"Check RiskGuard AI for details. - RiskGuard AI"
    )
    return send_sms_simulation(phone_number, message)
