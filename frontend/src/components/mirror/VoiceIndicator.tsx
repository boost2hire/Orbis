import { useState, useEffect } from "react";
import { Mic } from "lucide-react";

type Props = {
  listening: boolean;
};

const VoiceIndicator = ({ listening }: Props) => {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`
          flex items-center justify-center 
          w-14 h-14 rounded-full 
          bg-white/10 backdrop-blur-lg
          border border-white/20
          shadow-[0_0_20px_rgba(255,255,255,0.15)]
          transition-all duration-300
          ${listening ? "scale-[1.40]" : "scale-100"}
        `}
      >
        {/* PULSE EFFECT */}
        {listening && (
          <span className="absolute w-14 h-14 rounded-full animate-ping bg-primary/30"></span>
        )}

        <Mic
          className={`w-7 h-7 ${
            listening ? "text-primary" : "text-foreground/50"
          } transition-all duration-300`}
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
};

export default VoiceIndicator;
