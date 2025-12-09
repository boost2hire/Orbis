# weather_routes.py
import requests
import os
from flask import Blueprint, jsonify, request
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import datetime, timedelta, timezone

weather_bp = Blueprint("weather", __name__)
CORS(weather_bp)

load_dotenv()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")


# --------------------------
# Helper: Reverse geocode using OpenWeather (keeps names consistent)
# --------------------------
def reverse_geocode_openweather(lat, lon):
    """Return a sensible city name using OpenWeather reverse geocoding."""
    try:
        url = (
            f"http://api.openweathermap.org/geo/1.0/reverse?"
            f"lat={lat}&lon={lon}&limit=1&appid={WEATHER_API_KEY}"
        )
        r = requests.get(url, timeout=5)
        data = r.json()
        if isinstance(data, list) and len(data) > 0:
            item = data[0]
            # prefer city, then name, then state
            return item.get("name") or item.get("local_names", {}).get("en") or item.get("state") or "Unknown"
        return "Unknown"
    except Exception:
        return "Unknown"


# --------------------------
# Helper: Build local-date aware daily forecast from 3-hour forecast
# --------------------------
def build_daily_forecast_from_3h(forecast_json, timezone_offset_seconds, days=4):
    """
    forecast_json is the /data/2.5/forecast response.
    timezone_offset_seconds is forecast_json['city']['timezone'] (seconds)
    Returns a list of daily summaries for the next `days` days (excluding today).
    """
    try:
        items = forecast_json.get("list", [])
        # compute today's local date at the location
        now_utc = datetime.utcnow()
        loc_now = now_utc + timedelta(seconds=timezone_offset_seconds)
        today_local = loc_now.date()

        daily_map = {}  # date -> representative item (we'll pick the midday-ish item)
        # We'll pick the item closest to 12:00 local time for each date for a nicer representative temp.
        target_hour = 12

        # For each forecast item, compute local date and hour
        for it in items:
            dt_utc = datetime.utcfromtimestamp(it.get("dt", 0))
            dt_local = dt_utc + timedelta(seconds=timezone_offset_seconds)
            d = dt_local.date()
            if d <= today_local:
                continue  # skip today; we want upcoming days

            hour = dt_local.hour
            # compute "score" based on closeness to target_hour
            score = abs(hour - target_hour)

            if d not in daily_map or score < daily_map[d]["score"]:
                # store with score so we can compare
                daily_map[d] = {
                    "score": score,
                    "item": it,
                    "date": d
                }

        # Sort dates and build list of up to `days`
        result = []
        for d in sorted(daily_map.keys())[:days]:
            it = daily_map[d]["item"]
            result.append({
                "date": d.isoformat(),
                "temp": it.get("main", {}).get("temp"),
                "weather": (it.get("weather") or [{}])[0].get("description"),
                "icon": (it.get("weather") or [{}])[0].get("icon")
            })

        return result
    except Exception:
        return []


# ---------------------------------------
# WEATHER USING COORDINATES (HIGH ACCURACY)
# ---------------------------------------
def fetch_weather_by_coords(lat, lon):
    """Fetch weather using GPS coordinates and return current + forecast (4 days)."""
    if not WEATHER_API_KEY:
        return {"error": "Missing WEATHER_API_KEY"}

    # ensure lat/lon are floats or strings acceptable to the API
    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except Exception as e:
        return {"error": "Invalid coordinates", "details": str(e)}

    current_url = (
        f"https://api.openweathermap.org/data/2.5/weather?"
        f"lat={lat_f}&lon={lon_f}&appid={WEATHER_API_KEY}&units=metric"
    )

    forecast_url = (
        f"https://api.openweathermap.org/data/2.5/forecast?"
        f"lat={lat_f}&lon={lon_f}&appid={WEATHER_API_KEY}&units=metric"
    )

    current = requests.get(current_url, timeout=7).json()
    forecast = requests.get(forecast_url, timeout=7).json()

    # timezone offset (seconds) given by OpenWeather in forecast.city.timezone or current.timezone
    tz_offset = 0
    if isinstance(forecast, dict) and "city" in forecast:
        tz_offset = forecast["city"].get("timezone", 0)
    else:
        tz_offset = current.get("timezone", 0)

    # build daily forecast (next 4 days)
    daily = build_daily_forecast_from_3h(forecast, tz_offset, days=4)

    city_name = reverse_geocode_openweather(lat_f, lon_f)

    return {
        "city": city_name,
        "temp": current.get("main", {}).get("temp"),
        "feels_like": current.get("main", {}).get("feels_like"),
        "humidity": current.get("main", {}).get("humidity"),
        "wind": current.get("wind", {}).get("speed"),
        "condition": (current.get("weather") or [{}])[0].get("main"),
        "description": (current.get("weather") or [{}])[0].get("description"),
        "icon": (current.get("weather") or [{}])[0].get("icon"),
        "forecast": daily
    }


# ---------------------------------------
# WEATHER USING CITY NAME (IP fallback)
# ---------------------------------------
def fetch_weather(city):
    """Fetch current weather + 4-day forecast by city name."""
    if not WEATHER_API_KEY:
        return {"error": "Missing WEATHER_API_KEY"}

    current_url = (
        f"https://api.openweathermap.org/data/2.5/weather?"
        f"q={city}&appid={WEATHER_API_KEY}&units=metric"
    )

    forecast_url = (
        f"https://api.openweathermap.org/data/2.5/forecast?"
        f"q={city}&appid={WEATHER_API_KEY}&units=metric"
    )

    current = requests.get(current_url, timeout=7).json()
    forecast = requests.get(forecast_url, timeout=7).json()

    tz_offset = 0
    if isinstance(forecast, dict) and "city" in forecast:
        tz_offset = forecast["city"].get("timezone", 0)
    else:
        tz_offset = current.get("timezone", 0)

    daily = build_daily_forecast_from_3h(forecast, tz_offset, days=4)

    return {
        "city": current.get("name"),
        "temp": current.get("main", {}).get("temp"),
        "feels_like": current.get("main", {}).get("feels_like"),
        "humidity": current.get("main", {}).get("humidity"),
        "wind": current.get("wind", {}).get("speed"),
        "condition": (current.get("weather") or [{}])[0].get("main"),
        "description": (current.get("weather") or [{}])[0].get("description"),
        "icon": (current.get("weather") or [{}])[0].get("icon"),
        "forecast": daily
    }


# ---------------------------------------
# MAIN ROUTE (AUTO LOCATION)
# ---------------------------------------
@weather_bp.route("/current")
def weather():
    """Auto-detect location using GPS (frontend) or IP (fallback)."""
    lat = request.args.get("lat")
    lon = request.args.get("lon")

    if lat and lon:
        data = fetch_weather_by_coords(lat, lon)
        return jsonify(data)

    # Fallback to IP city
    city = get_city_from_ip()
    data = fetch_weather(city)
    return jsonify(data)


# ---------------------------------------
# SIMPLE IP-BASED CITY (fallback only)
# ---------------------------------------
def get_city_from_ip():
    """Detect user's city via IP address (fallback only)."""
    try:
        res = requests.get("https://ipapi.co/json/", timeout=5).json()
        return res.get("city", "Delhi")
    except Exception:
        return "Delhi"
