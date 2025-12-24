# weather_routes.py
import requests
import os
from flask import Blueprint, jsonify, request
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import datetime, timedelta

weather_bp = Blueprint("weather", __name__)
CORS(weather_bp)

load_dotenv()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")


# ------------------------------------------------------
# Reverse geocode → ensure city name is accurate
# ------------------------------------------------------
def reverse_geocode_openweather(lat, lon):
    try:
        url = (
            f"http://api.openweathermap.org/geo/1.0/reverse?"
            f"lat={lat}&lon={lon}&limit=1&appid={WEATHER_API_KEY}"
        )
        r = requests.get(url, timeout=5)
        data = r.json()

        if isinstance(data, list) and len(data) > 0:
            item = data[0]
            return (
                item.get("name")
                or item.get("local_names", {}).get("en")
                or item.get("state")
                or "Unknown"
            )
        return "Unknown"
    except Exception:
        return "Unknown"


# ------------------------------------------------------
# Build clean daily forecast data (next 4 days)
# ------------------------------------------------------
def build_daily_forecast_from_3h(forecast_json, timezone_offset_seconds, days=4):
    """
    Convert 3-hour OpenWeather forecast into realistic daily summaries (free-tier friendly).
    Produces:
      - avg temp
      - min temp
      - max temp
      - dominant weather + icon
    """
    try:
        items = forecast_json.get("list", [])
        if not items:
            return []

        now_utc = datetime.utcnow()
        loc_now = now_utc + timedelta(seconds=timezone_offset_seconds)
        today_local = loc_now.date()

        daily = {}

        for it in items:
            dt_utc = datetime.utcfromtimestamp(it.get("dt", 0))
            dt_local = dt_utc + timedelta(seconds=timezone_offset_seconds)
            d = dt_local.date()

            if d <= today_local:
                continue  # skip today

            temp = it.get("main", {}).get("temp")
            weather_arr = it.get("weather") or [{}]
            icon = weather_arr[0].get("icon")
            desc = weather_arr[0].get("description")

            if d not in daily:
                daily[d] = {
                    "temps": [],
                    "icons": [],
                    "descriptions": [],
                }

            daily[d]["temps"].append(temp)
            daily[d]["icons"].append(icon)
            daily[d]["descriptions"].append(desc)

        # Build final daily output
        result = []
        for d in sorted(daily.keys())[:days]:
            temps = daily[d]["temps"]
            icons = daily[d]["icons"]
            descs = daily[d]["descriptions"]

            # pick the most common icon / description
            dominant_icon = max(set(icons), key=icons.count)
            dominant_desc = max(set(descs), key=descs.count)

            result.append({
                "date": d.isoformat(),
                "temp": sum(temps) / len(temps),         # avg temp
                "temp_min": min(temps),
                "temp_max": max(temps),
                "weather": dominant_desc,
                "icon": dominant_icon,
            })

        return result

    except Exception as e:
        print("Forecast error:", e)
        return []


# ------------------------------------------------------
# WEATHER VIA COORDINATES
# ------------------------------------------------------
def fetch_weather_by_coords(lat, lon):
    if not WEATHER_API_KEY:
        return {"error": "Missing WEATHER_API_KEY"}

    lat = float(lat)
    lon = float(lon)

    current_url = (
        f"https://api.openweathermap.org/data/2.5/weather?"
        f"lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
    )

    forecast_url = (
        f"https://api.openweathermap.org/data/2.5/forecast?"
        f"lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
    )

    current = requests.get(current_url, timeout=7).json()
    forecast = requests.get(forecast_url, timeout=7).json()

    timezone_offset = (
        forecast.get("city", {}).get("timezone")
        or current.get("timezone")
        or 19800  # fallback UTC+5:30 (India)
    )

    daily_forecast = build_daily_forecast_from_3h(forecast, timezone_offset, days=4)
    city_name = reverse_geocode_openweather(lat, lon)

    weather_now = (current.get("weather") or [{}])[0]

    return {
        "city": city_name,
        "temp": current.get("main", {}).get("temp"),
        "feels_like": current.get("main", {}).get("feels_like"),
        "humidity": current.get("main", {}).get("humidity"),
        "wind": current.get("wind", {}).get("speed"),
        "description": weather_now.get("description"),
        "icon": weather_now.get("icon"),
        "forecast": daily_forecast,
    }


# ------------------------------------------------------
# WEATHER VIA CITY NAME (fallback)
# ------------------------------------------------------
def fetch_weather(city):
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

    timezone_offset = (
        forecast.get("city", {}).get("timezone")
        or current.get("timezone")
        or 19800  # fallback India timezone
    )

    daily_forecast = build_daily_forecast_from_3h(forecast, timezone_offset, days=4)

    weather_now = (current.get("weather") or [{}])[0]

    return {
        "city": current.get("name"),
        "temp": current.get("main", {}).get("temp"),
        "feels_like": current.get("main", {}).get("feels_like"),
        "humidity": current.get("main", {}).get("humidity"),
        "wind": current.get("wind", {}).get("speed"),
        "description": weather_now.get("description"),
        "icon": weather_now.get("icon"),
        "forecast": daily_forecast,
    }


# ------------------------------------------------------
# MAIN ROUTE /weather/current
# ------------------------------------------------------
@weather_bp.route("/current")
def weather():
    lat = request.args.get("lat")
    lon = request.args.get("lon")

    if lat and lon:
        return jsonify(fetch_weather_by_coords(lat, lon))

    city = get_city_from_ip()
    return jsonify(fetch_weather(city))


# ------------------------------------------------------
# IP CITY FALLBACK
# ------------------------------------------------------
def get_city_from_ip():
    try:
        res = requests.get("https://ipapi.co/json/", timeout=5).json()
        return res.get("city", "Delhi")
    except Exception:
        return "Delhi"
