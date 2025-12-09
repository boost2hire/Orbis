import { useState, useEffect } from "react";
import { AlarmClock, Bell, BellOff } from "lucide-react";

const TimeDisplay = () => {
  const [time, setTime] = useState(new Date());
  const [alarmTime, setAlarmTime] = useState<string | null>("07:00");
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0"); // ⭐ Added seconds

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  const dateString = time.toLocaleDateString("en-US", dateOptions);

  return (
    <div
      className="
        animate-fade-in 
        rounded-3xl
        border border-white/10 
        bg-white/5 
        backdrop-blur-xl 
        p-6 
        shadow-lg 
        w-50%
      "
    >
      {/* TIME */}
      <div className="flex items-baseline gap-1">
        <span className="text-6xl lg:text-6xl font-bold tracking-tight text-foreground glow-soft">
          {hours}
        </span>

        <span className="text-6xl lg:text-6xl font-bold tracking-tight text-foreground glow-soft">
          :
        </span>

        <span className="text-6xl lg:text-6xl font-bold tracking-tight text-foreground glow-soft">
          {minutes}
        </span>

        {/* ⭐ Seconds same size as HH:MM */}
        <span className="text-6xl lg:text-6xl font-bold tracking-tight text-foreground glow-soft">
          :{seconds}
        </span>
      </div>

      {/* DATE */}
      <p className="text-sm text-bold text-muted-foreground mt-2 tracking-wide">
        {dateString}
      </p>

      {/* ALARM */}
      <div
        className="flex items-center gap-2 mt-4 cursor-pointer group"
        onClick={() => setAlarmEnabled(!alarmEnabled)}
      >
        <div
          className={`p-2 rounded-xl transition-all duration-300 ${
            alarmEnabled
              ? "bg-primary/10 text-primary"
              : "bg-muted/20 text-muted-foreground/40"
          }`}
        >
          {alarmEnabled ? (
            <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
          ) : (
            <BellOff className="w-3.5 h-3.5" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <AlarmClock
            className={`w-3 h-3 ${
              alarmEnabled ? "text-primary/60" : "text-muted-foreground/30"
            }`}
            strokeWidth={1.5}
          />
          <span
            className={`text-sm text-thin tracking-wide transition-all duration-300 ${
              alarmEnabled
                ? "text-foreground/70"
                : "text-muted-foreground/30 line-through"
            }`}
          >
            {alarmTime}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeDisplay;
