# intent_parser.py
import re
from datetime import datetime


def parse_alarm(text: str):
    text = text.lower().strip()

    # -------------------------
    # Detect AM / PM (robust)
    # -------------------------
    period = None
    if re.search(r"\b(a\.?\s?m\.?)\b", text):
        period = "am"
    elif re.search(r"\b(p\.?\s?m\.?)\b", text):
        period = "pm"

    # -------------------------
    # Extract all numbers
    # -------------------------
    nums = re.findall(r"\d+", text)
    if not nums:
        return None

    raw = nums[0]

    # Handle compressed forms like:
    # 450  → 4:50
    # 1126 → 11:26
    if len(raw) == 3:          # e.g. "450"
        hour = int(raw[:-2])
        minute = int(raw[-2:])
    elif len(raw) == 4:        # e.g. "1126"
        hour = int(raw[:2])
        minute = int(raw[2:])
    else:
        hour = int(raw)
        minute = int(nums[1]) if len(nums) > 1 else 0

    # Fix invalid minutes
    if minute >= 60:
        minute = minute % 60

    # -------------------------
    # AM / PM conversion
    # -------------------------
    if period == "pm" and hour != 12:
        hour += 12
    elif period == "am" and hour == 12:
        hour = 0

    # -------------------------
    # No AM/PM → smart fallback
    # -------------------------
    if period is None:
        now_hour = datetime.now().hour
        if hour <= now_hour:
            hour = (hour + 12) % 24

    # Clamp values
    hour = max(0, min(hour, 23))
    minute = max(0, min(minute, 59))

    return f"{hour:02d}:{minute:02d}"

def parse_intent(text: str):
    """
    Returns a dict describing user intent.
    """

    t = text.lower().strip()

    if any(w in t for w in ["alarm", "wake", "set alarm", "wake me"]):
        alarm_time = parse_alarm(text)
        if alarm_time:
            return {
                "intent": "set_alarm",
                "time": alarm_time
            }
        else:
            return {
                "intent": "error",
                "message": "Could not understand the alarm time."
            }

    # Default fallback
    return {
        "intent": "unknown",
        "raw": text
    }
