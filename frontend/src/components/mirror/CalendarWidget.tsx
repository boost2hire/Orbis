import { Calendar } from "lucide-react";

const events = [
  { time: "9:00 AM", title: "Standup", accent: true },
  { time: "11:30 AM", title: "Design Review", accent: false },
  { time: "2:00 PM", title: "Client Call", accent: false },
  { time: "4:30 PM", title: "Yoga Session", accent: true },
];

const CalendarWidget = () => {
  return (
    <div className="glass-panel p-6 animate-fade-in delay-200">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="text-sm text-light text-foreground/80">Today's Schedule</span>
      </div>
      
      <div className="space-y-3">
        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-0.5 h-8 rounded-full ${event.accent ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            <div>
              <p className="text-sm text-light text-foreground">{event.title}</p>
              <p className="text-xs text-thin text-muted-foreground/60">{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarWidget;
