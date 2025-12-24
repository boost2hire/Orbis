declare global {
  interface Window {
    updateAlarmFromVoice: (time: string) => void;
  }
}

import { useState, useEffect, useRef } from "react";
import { AlarmClock, Bell, BellOff } from "lucide-react";

const TimeDisplay = () => {
  const [time, setTime] = useState(new Date());
  const [alarmTime, setAlarmTime] = useState<string | null>("07:00");
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const hasRungRef = useRef(false);

  // --------------------
  // CLOCK
  // --------------------
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --------------------
  // ALARM RING CHECK
  // --------------------
  useEffect(() => {
    if (!alarmEnabled || !alarmTime || hasRungRef.current) return;

    const current = time.toTimeString().slice(0, 5); // HH:MM

    if (current === alarmTime) {
      hasRungRef.current = true;

      const audio = new Audio("/alarm.mp3");
      audio.play();

      alert(`⏰ Alarm ringing for ${formatAlarmDisplay(alarmTime)}!`);
      setAlarmEnabled(false);
    }
  }, [time, alarmEnabled, alarmTime]);

  // --------------------
  // UPDATE FROM VOICE / BACKEND
  // --------------------
  const updateAlarmFromVoice = (input: string) => {
    if (!input) return;

    const timeStr = input.trim().toUpperCase();

    const match = timeStr.match(/(\d{1,2})(:?(\d{2}))?\s*(AM|PM)?/);
    if (!match) return;

    let hour = parseInt(match[1]);
    const minute = match[3] ? parseInt(match[3]) : 0;
    const period = match[4];

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    const hh = hour.toString().padStart(2, "0");
    const mm = minute.toString().padStart(2, "0");

    hasRungRef.current = false;
    setAlarmTime(`${hh}:${mm}`);
    setAlarmEnabled(true);
  };

  // expose globally ONCE
  useEffect(() => {
    window.updateAlarmFromVoice = updateAlarmFromVoice;
  }, []);

  // --------------------
  // FORMAT FOR DISPLAY
  // --------------------
  const formatAlarmDisplay = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  const dateString = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="animate-fade-in rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-lg w-50%">
      {/* TIME */}
      <div className="flex items-baseline gap-1">
        <span className="text-6xl font-bold">{hours}</span>
        <span className="text-6xl font-bold">:</span>
        <span className="text-6xl font-bold">{minutes}</span>
        <span className="text-6xl font-bold">:{seconds}</span>
      </div>

      {/* DATE */}
      <p className="text-sm text-muted-foreground mt-2 tracking-wide">
        {dateString}
      </p>

      {/* ALARM */}
      <div
        className="flex items-center gap-2 mt-4 cursor-pointer"
        onClick={() => setAlarmEnabled(!alarmEnabled)}
      >
        <div
          className={`p-2 rounded-xl ${
            alarmEnabled
              ? "bg-primary/10 text-primary"
              : "bg-muted/20 text-muted-foreground/40"
          }`}
        >
          {alarmEnabled ? (
            <Bell className="w-3.5 h-3.5" />
          ) : (
            <BellOff className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <AlarmClock className="w-3 h-3" />
          <span className="text-sm tracking-wide">
            {alarmTime ? formatAlarmDisplay(alarmTime) : "--:--"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeDisplay;
