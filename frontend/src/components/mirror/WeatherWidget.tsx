import { useEffect, useState } from "react";
import {
  Cloud,
  Sun,
  Droplets,
  Wind,
  MapPin,
  Loader2,
  AlertTriangle,
  CloudRain,
  Snowflake,
} from "lucide-react";

interface ForecastDay {
  date: string;
  temp: number;
  temp_min: number;
  temp_max: number;
  icon: string | null;
  weather: string;
}

interface WeatherData {
  city: string;
  temp: number;
  feels_like: number;
  humidity: number;
  wind: number;
  description: string;
  icon: string | null;
  timestamp?: number;
  forecast: ForecastDay[];
}

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

const STORAGE_KEY = "weather_cache";

// -------------------------------------------------------
// SAFE ICON FUNCTION
// -------------------------------------------------------
const getIcon = (code?: string | null) => {
  if (!code || typeof code !== "string") return Cloud;

  if (code.startsWith("01")) return Sun;
  if (code.startsWith("02") || code.startsWith("03") || code.startsWith("04"))
    return Cloud;
  if (code.startsWith("09") || code.startsWith("10")) return CloudRain;
  if (code.startsWith("13")) return Snowflake;

  return Cloud;
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const FIXED_CITY = "Chandigarh";

  // -------------------------------------------------------
  // FETCH WEATHER
  // -------------------------------------------------------
  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `http://localhost:5001/weather/current?city=${FIXED_CITY}`
      );

      if (!res.ok) throw new Error(`API Error: ${res.status}`);

      const data: WeatherData = await res.json();

      // force icon fallback
      data.icon = data.icon || "01d";

      // ensure each forecast icon is also safe
      data.forecast = (data.forecast || []).map((f) => ({
        ...f,
        icon: f.icon || "01d",
      }));

      const cache: CachedWeather = {
        data: { ...data, timestamp: Date.now() },
        timestamp: Date.now(),
      };

      window.electronStore.set(STORAGE_KEY, cache);
      setWeather(cache.data);
    } catch (err: unknown) {
      let message = "Unknown error";

      if (err instanceof Error) message = err.message;

      setError(message);

      const cached = window.electronStore.get(STORAGE_KEY) as
        | CachedWeather
        | null;

      if (cached?.data) {
        cached.data.icon = cached.data.icon || "01d";
        cached.data.forecast =
          cached.data.forecast?.map((f) => ({
            ...f,
            icon: f.icon || "01d",
          })) || [];

        setWeather(cached.data);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
    const timer = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------
  // LOADING UI
  // -------------------------------------------------------
  if (loading) {
    return (
      <div className="glass-panel p-7 animate-pulse">
        <div className="flex gap-4 items-center">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-muted-foreground">Fetching weather...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // ERROR UI
  // -------------------------------------------------------
  if (error || !weather) {
    return (
      <div className="glass-panel p-7 text-center">
        <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
        <p className="text-red-500">{error || "Unable to load weather"}</p>

        <button
          onClick={fetchWeather}
          className="mt-3 px-4 py-1 text-xs bg-primary text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  const Icon = getIcon(weather.icon);

  // -------------------------------------------------------
  // MAIN UI
  // -------------------------------------------------------
  return (
    <div className="glass-panel p-7 animate-fade-in scale-[1.05]">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-light flex items-center gap-1">
          <MapPin className="w-4 h-4 text-primary" />
          Chandigarh
        </h2>
        <p className="text-sm text-muted-foreground">
          {weather.description}
        </p>
      </div>

      {/* CURRENT WEATHER */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Icon className="w-10 h-10 text-yellow-400" strokeWidth={1.5} />
            <span className="text-6xl font-light">
              {Math.round(weather.temp)}°
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            Feels like {Math.round(weather.feels_like)}°
          </div>

          {weather.timestamp && (
            <div className="text-xs text-muted-foreground mt-1">
              Last updated:{" "}
              {new Date(weather.timestamp).toLocaleTimeString("en-IN")}
            </div>
          )}
        </div>

        {/* HUMIDITY / WIND */}
        <div className="flex flex-col gap-2 text-right">
          <div className="flex items-center gap-2 justify-end">
            <Droplets className="w-4 h-4 text-primary" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Wind className="w-4 h-4 text-primary" />
            <span>{weather.wind} km/h</span>
          </div>
        </div>
      </div>

    {/* FORECAST */}
<div className="mt-8 pt-5 border-t border-border/20">
  <div className="grid grid-cols-4 gap-6 text-center">

    {weather.forecast?.length ? (
      weather.forecast.map((day, i) => {
        const DayIcon = getIcon(day.icon);

        return (
          <div
            key={i}
            className="flex flex-col items-center gap-2 opacity-90"
          >
            {/* Day Name */}
            <span className="text-sm font-medium text-white/80">
              {new Date(day.date).toLocaleDateString("en-US", {
                weekday: "short",
              })}
            </span>

            {/* Icon */}
            <DayIcon className="w-7 h-7 text-white/90" strokeWidth={1.3} />

            {/* Temperature */}
            <span className="text-sm text-white/70 font-light">
              {Math.round(day.temp_min)}°  
              <span className="mx-1 text-white/30">/</span>
              {Math.round(day.temp_max)}°
            </span>
          </div>
        );
      })
    ) : (
      <p className="text-xs text-muted-foreground">No forecast available.</p>
    )}
  </div>
</div>
    </div>
  );
};

export default WeatherWidget;
