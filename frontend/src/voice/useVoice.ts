import { useEffect, useRef } from "react";

export const useVoice = (onSpeech: (text: string) => void) => {
  const recRef = useRef<any>(null);
  const isListening = useRef(false);
  const ttsSpeaking = useRef(false);
  const lastTranscript = useRef("");

  useEffect(() => {
    // -----------------------------
    // Init STT
    // -----------------------------
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      console.error("❌ SpeechRecognition not supported");
      return;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    recRef.current = rec;

    // -----------------------------
    // TTS Override (mute STT)
    // -----------------------------
    const synth = window.speechSynthesis;
    const origSpeak = synth.speak.bind(synth);

    synth.speak = (utter: SpeechSynthesisUtterance) => {
      utter.onstart = () => {
        ttsSpeaking.current = true;
        try { rec.stop(); } catch {}
        isListening.current = false;
      };

      utter.onend = () => {
        ttsSpeaking.current = false;
        setTimeout(() => {
          if (!isListening.current) {
            try {
              rec.start();
              isListening.current = true;
              console.log("🎤 STT listening (after TTS)");
            } catch {}
          }
        }, 800);
      };

      origSpeak(utter);
    };

    // -----------------------------
    // Speech Result
    // -----------------------------
    rec.onresult = (event: any) => {
      if (ttsSpeaking.current) return;

      const text = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      if (!text || text === lastTranscript.current) return;

      lastTranscript.current = text;
      console.log("🗣️ Heard:", text);

      onSpeech(text);
    };

    // -----------------------------
    // IMPORTANT:
    // DO NOT RESTART ON ERROR
    // DO NOT RESTART ON onend
    // -----------------------------
    rec.onerror = (e: any) => {
      console.warn("⚠ STT Error:", e.error);
    };

    rec.onend = () => {
      // Chrome fires onend randomly; ignore
      isListening.current = false;

      // Restart ONLY if user is not speaking (TTS done)
      if (!ttsSpeaking.current) {
        setTimeout(() => {
          if (!isListening.current) {
            try {
              rec.start();
              isListening.current = true;
              console.log("🎤 STT listening (onend-safe)");
            } catch {}
          }
        }, 800);
      }
    };

    // Start STT only once
    setTimeout(() => {
      try {
        rec.start();
        isListening.current = true;
        console.log("🎤 STT started");
      } catch {}
    }, 300);

    return () => {
      try { rec.stop(); } catch {}
      isListening.current = false;
    };
  }, [onSpeech]);
};
