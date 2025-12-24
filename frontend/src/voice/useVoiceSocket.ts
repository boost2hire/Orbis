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

    // -----------------------------
    // 🎤 FIXED TEXT PARSING LOGIC
    // -----------------------------
    const onText = (data: { text: string }) => {
      if (!data?.text) return;

      const msg = data.text.trim().toLowerCase();
      const now = Date.now();

      if (!msg) return;
      if (NOISE.includes(msg)) return;

      // ⭐ WAKE WORDS MUST ALWAYS PASS
      if (msg.includes("lumi") || msg.includes("hey lumi")) {
        console.log("🔥 Wake word chunk received:", msg);
        setVoiceText(msg);
        lastUpdateRef.current = now;
        return;
      }

      // ⭐ Smooth debounce (not too strict)
      if (now - lastUpdateRef.current < 40) return;

      lastUpdateRef.current = now;
      setVoiceText(msg);
    };

    // AI RESPONSE
    const onResponse = (data: T) => {
      if (!data) return;

      console.log("🤖 AI response:", data);
      setVoiceResponse(data);

      if (data.audio || data.audioUrl) {
        playAudio(data.audioUrl ?? data.audio!);
      }
    };

    // LISTENERS
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("voice_text", onText);
    s.on("voice_response", onResponse);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("voice_text", onText);
      s.off("voice_response", onResponse);
      s.disconnect();
    };
  }, [playAudio]);

  // -----------------------------
  // TAKE PHOTO
  // -----------------------------
  useEffect(() => {
    if (!socket) return;

    const onRequestPhoto = async () => {
      try {
        const video = document.getElementById("mirror-cam") as HTMLVideoElement;
        if (!video) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

        await fetch("http://127.0.0.1:5001/photo/from-ui", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
      } catch (err) {
        console.error("Photo capture failed:", err);
      }
    };

    socket.on("request_photo", onRequestPhoto);

    return () => {
      socket.off("request_photo", onRequestPhoto);
    };
  }, [socket]);

  // -----------------------------
  // BOOST SENSITIVITY
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
