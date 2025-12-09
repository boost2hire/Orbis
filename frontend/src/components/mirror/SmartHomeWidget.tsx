import { Lightbulb, Thermometer, Lock, Wifi } from "lucide-react";

const devices = [
  { icon: Lightbulb, label: "Lights", status: "3 on", active: true },
  { icon: Thermometer, label: "Climate", status: "72°F", active: true },
  { icon: Lock, label: "Security", status: "Armed", active: true },
  { icon: Wifi, label: "Network", status: "Connected", active: true },
];

const SmartHomeWidget = () => {
  return (
    <div className="glass-panel p-6 animate-fade-in delay-500">
      <p className="text-sm text-light text-foreground/80 mb-4">Smart Home</p>
      
      <div className="grid grid-cols-2 gap-3">
        {devices.map((device, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30"
          >
            <device.icon 
              className={`w-4 h-4 ${device.active ? 'text-primary' : 'text-muted-foreground/40'}`} 
              strokeWidth={1.5} 
            />
            <div className="min-w-0">
              <p className="text-xs text-light text-foreground truncate">{device.label}</p>
              <p className="text-xs text-thin text-muted-foreground/60 truncate">{device.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartHomeWidget;
