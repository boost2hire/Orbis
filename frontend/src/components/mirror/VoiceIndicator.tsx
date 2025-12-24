import { Mic } from "lucide-react";

type Props = {
  listening: boolean;
};

const VoiceIndicator = ({ listening }: Props) => {
  return (
    <div
      className={`
        fixed bottom-20 left-1/2 -translate-x-1/2 z-50
        transition-all duration-300
        ${listening ? "animate-mic-pop" : ""}
      `}
    >
      <div
        className={`
          relative flex items-center justify-center
          w-16 h-16 rounded-full
          bg-white/10 backdrop-blur-lg border border-white/20
          
          transition-all duration-300

          ${listening ? "scale-125 animate-mic-pulse-glow" : "scale-100"}
        `}
      >
        {/* Soft pulse ring only when listening */}
        {listening && (
          <span
            className="
              absolute inset-0 rounded-full
              bg-primary/20
              animate-ping
            "
          />
        )}

        <Mic
          className={`
            w-8 h-8
            transition-all duration-300
            ${listening ? "text-primary" : "text-foreground/50"}
          `}
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
};

export default VoiceIndicator;