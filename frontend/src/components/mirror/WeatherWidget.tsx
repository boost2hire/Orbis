import { useEffect, useState } from "react";
import { Cloud, Sun, Droplets, Wind, MapPin, Loader2, AlertTriangle, CloudRain, Snowflake } from "lucide-react";

interface WeatherData {
  city: string;
  temp: number;
  feels_like: number;
  humidity: number;
  wind: number;
  description: string;
  icon: string;
  timestamp?: number;
  forecast: {
    date: string;
    temp: number;
    icon: string;
    weather: string;
  }[];
}

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

const STORAGE_KEY = "weather_cache";

const getIcon = (code: string) => {
  if (code.startsWith("01")) return Sun;
  if (code.startsWith("02") || code.startsWith("03") || code.startsWith("04")) return Cloud;
  if (code.startsWith("09") || code.startsWith("10")) return CloudRain;
  if (code.startsWith("13")) return Snowflake;
  return Cloud;
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const FIXED_CITY = "Chandigarh";

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:5001/weather/current?city=${FIXED_CITY}`);
      if (!res.ok) throw new Error(`API Error: ${res.status}`);

      const data: WeatherData = await res.json();

      const cache: CachedWeather = { 
        data: { ...data, timestamp: Date.now() },
        timestamp: Date.now()
      };

      window.electronStore.set(STORAGE_KEY, cache);
      setWeather(cache.data);
    } catch (err: any) {
      setError(err.message);

      // fallback to cache
      const cached: CachedWeather = window.electronStore.get(STORAGE_KEY);
      if (cached) setWeather(cached.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
    const timer = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="glass-panel p-7 animate-fade-in scale-[1.05]">

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-light flex items-center gap-1">
          <MapPin className="w-4 h-4 text-primary" />
          Chandigarh
        </h2>
        <p className="text-sm text-muted-foreground">{weather.description}</p>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Icon className="w-10 h-10 text-yellow-400" strokeWidth={1.5} />
            <span className="text-6xl font-light">{Math.round(weather.temp)}°</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Feels like {Math.round(weather.feels_like)}°
          </div>
          {weather.timestamp && (
            <div className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date(weather.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>

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

      <div className="flex justify-between mt-6 pt-4 border-t border-border/20">
        {weather.forecast?.length > 0 ? (
          weather.forecast.map((day, i) => {
            const DayIcon = getIcon(day.icon);
            return (
              <div key={i} className="flex flex-col items-center gap-1 text-center">
                <span className="text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <DayIcon className="w-5 h-5" />
                <span className="text-sm">{Math.round(day.temp)}°</span>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground">No forecast available.</p>
        )}
      </div>
    </div>
  );
};

export default WeatherWidget;
