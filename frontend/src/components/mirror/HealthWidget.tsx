import { Heart, Footprints, Moon, Flame } from "lucide-react";

const HealthWidget = () => {
  return (
    <div className="glass-panel p-6 animate-fade-in delay-400">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl text-thin text-foreground">72</p>
            <p className="text-xs text-thin text-muted-foreground/60">BPM</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Footprints className="w-5 h-5 text-accent" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl text-thin text-foreground">8,542</p>
            <p className="text-xs text-thin text-muted-foreground/60">Steps</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Moon className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl text-thin text-foreground">7.5</p>
            <p className="text-xs text-thin text-muted-foreground/60">Hours</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl text-thin text-foreground">420</p>
            <p className="text-xs text-thin text-muted-foreground/60">Cal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthWidget;
