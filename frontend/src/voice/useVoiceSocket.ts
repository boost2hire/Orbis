import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// -----------------------------
// Types
// -----------------------------
export interface BaseVoiceResponse {
  type: string;
  say?: string;
  audio?: ArrayBuffer | string;
  audioUrl?: string;
  suggestion?: string;
  images?: string[];
  qr?: string;
  path?: string;
}

export function useVoiceSocket<T extends BaseVoiceResponse = BaseVoiceResponse>() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const [voiceResponse, setVoiceResponse] = useState<T | null>(null);
  const [isListening, setIsListening] = useState(false);

  const lastUpdateRef = useRef(0);

  // Noise filtering
  const NOISE = ["ah", "haan", "hmm", "huh", "who", "yo", "uh", "um"];

  // -----------------------------
  // AUDIO PLAYBACK
  // -----------------------------
  const playAudio = useCallback((src: string | ArrayBuffer) => {
    try {
      const audio = new Audio();
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";

      if (typeof src === "string") {
        audio.src = src;
      } else {
        const blob = new Blob([src], { type: "audio/wav" });
        audio.src = URL.createObjectURL(blob);
      }

      audio.play().catch((err) => console.error("Audio play failed:", err));

      audio.onended = () => {
        if (audio.src.startsWith("blob:")) URL.revokeObjectURL(audio.src);
      };
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  }, []);

  // -----------------------------
  // INIT SOCKET
  // -----------------------------
  useEffect(() => {
    const s: Socket = io("http://127.0.0.1:5001", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelayMax: 1000,
    });

    setSocket(s);

    // CONNECT
    const onConnect = () => {
      console.log("🔗 Connected to Voice Socket");
      setIsListening(true);

      s.emit("audio_config", {
        sampleRate: 16000,
        channels: 1,
        bufferSize: 4096,
        enableVAD: true,
        sensitivity: "high",
      });
    };

    // DISCONNECT
    const onDisconnect = () => {
      console.warn("⚠️ Voice Socket Disconnected");
      setIsListening(false);
    };

    // TEXT FROM SERVER
    const onText = (data: { text: string }) => {
      if (!data?.text) return;

      const msg = data.text.trim().toLowerCase();
      const now = Date.now();

      if (!msg || NOISE.includes(msg)) return;
      if (now - lastUpdateRef.current < 120) return;

      lastUpdateRef.current = now;
      setVoiceText(msg);
    };

    // AI RESPONSE
    const onResponse = (data: T) => {
      if (!data) return;

      console.log("🤖 AI response:", data);
      setVoiceResponse(data);

      // automatically play TTS audio if exists
      if (data.audio || data.audioUrl) {
        playAudio(data.audioUrl ?? data.audio!);
      }
    };

    // LISTENERS
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("voice_text", onText);
    s.on("voice_response", onResponse);

    // CLEANUP
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("voice_text", onText);
      s.off("voice_response", onResponse);
      s.disconnect();
    };
  }, [playAudio]);

  // -----------------------------
  // High sensitivity boost
  // -----------------------------
  useEffect(() => {
    if (!socket?.connected) return;

    socket.emit("sensitivity_config", {
      level: "high",
      minVolume: 0.01,
      vadThreshold: 0.3,
      enableContinuousListening: true,
    });
  }, [socket]);

  return {
    voiceText,
    voiceResponse,
    socket,
    isListening,
  };
}
