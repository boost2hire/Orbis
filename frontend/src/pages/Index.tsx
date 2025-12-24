import TimeDisplay from "@/components/mirror/TimeDisplay";
import WeatherWidget from "@/components/mirror/WeatherWidget";
import CalendarWidget from "@/components/mirror/CalendarWidget";
import VoiceIndicator from "@/components/mirror/VoiceIndicator";
import OutfitDisplay from "@/components/mirror/outfitDisplay";
import QRCodeDisplay from "@/pages/QRCodeDisplay";
import MusicPlayer from "@/components/mirror/MusicPlayer";

import { useVoiceSocket } from "@/voice/useVoiceSocket";
import { toast } from "sonner";
import { useState, useEffect } from "react";

type OutfitImage = { url: string; caption: string };

const Index = () => {
  const { voiceText, voiceResponse, socket } = useVoiceSocket();

  const [listening, setListening] = useState(false);
  const [outfitSuggestion, setOutfitSuggestion] = useState<string | null>(null);
  const [outfitImages, setOutfitImages] = useState<OutfitImage[]>([]);
  const [showOutfit, setShowOutfit] = useState(false);

  const [qrImage, setQrImage] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // -----------------------------
  // TTS Helper
  // -----------------------------
  const speak = (text: string) => {
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  };

  const hideAll = () => {
    setShowOutfit(false);
    setShowQR(false);
  };

  // -----------------------------
  // 🔥 REAL WAKE WORD TRIGGER (from Python)
  // -----------------------------
  useEffect(() => {
  if (!socket) return;

  const onWake = () => {
    console.log("🔥 Wake word received from Python!");
    hideAll();
    setListening(true);
  };

  socket.on("wake_word", onWake);

  return () => {
    socket.off("wake_word", onWake);
  };
}, [socket]);


  // -----------------------------
  // Camera Setup
  // -----------------------------
  useEffect(() => {
    const video = document.getElementById("mirror-cam") as HTMLVideoElement | null;
    if (!video) return;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => (video.srcObject = stream))
      .catch((err) => console.error("Camera error:", err));
  }, []);

  // -----------------------------
  // HANDLE BACKEND RESPONSES
  // -----------------------------
  useEffect(() => {
    if (!voiceResponse) return;
    console.log("🎯 UI got:", voiceResponse);

    const type = voiceResponse.type;

    if (type === "OUTFIT") {
      const formatted = (voiceResponse.images || []).map((url: string) => ({
        url,
        caption: "Outfit match",
      }));

      setOutfitSuggestion(voiceResponse.suggestion);
      setOutfitImages(formatted);
      setShowOutfit(true);
      speak(voiceResponse.suggestion);

      setTimeout(() => setShowOutfit(false), 30000);
      return;
    }

    if (type === "OUTFIT_PENDING") {
      speak("Capturing your outfit...");
      return;
    }

    if (type === "PHOTO") {
      speak("Your photo has been taken.");
      toast.success("📸 Photo captured!");
      return;
    }

    if (type === "SHOW_QR") {
      setQrImage(voiceResponse.qr);
      setShowQR(true);
      speak(voiceResponse.say || "Here is your QR code.");

      setTimeout(() => setShowQR(false), 30000);
      return;
    }

    if (type === "WEATHER" || type === "TIME") {
      speak(voiceResponse.say);
      toast(voiceResponse.say);
      return;
    }

    if (type === "SET_ALARM") {
    speak(voiceResponse.say);
    toast.success(voiceResponse.say);
    return;
  }

    if (type === "UNKNOWN") {
      speak("Sorry, I didn’t understand.");
    }
  }, [voiceResponse]);

  // -----------------------------
// ⏰ HANDLE ALARM SET EVENT
// -----------------------------
useEffect(() => {
  if (!socket) return;

  const onAlarmSet = (data: { time: string }) => {
    console.log("⏰ Alarm set received:", data);

    if (window.updateAlarmFromVoice) {
      window.updateAlarmFromVoice(data.time);
    }
  };

  socket.on("alarm_set", onAlarmSet);

  return () => {
    socket.off("alarm_set", onAlarmSet);
  };
}, [socket]);

  // -----------------------------
  // HANDLE FRAME CAPTURE FOR OUTFIT
  // -----------------------------
 useEffect(() => {
  if (!socket) return;

  const onRequest = async () => {
    try {
      const video = document.getElementById("mirror-cam") as HTMLVideoElement | null;
      if (!video) {
        console.error("No video element");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      await fetch("/voice/frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

    } catch (err) {
      console.error("Frame capture failed:", err);
    }
  };

  // Attach event listener
  socket.on("request_frame_for_outfit", onRequest);

  // Cleanup (must return a function)
  return () => {
    socket.off("request_frame_for_outfit", onRequest);
  };

}, [socket]);


  console.log("🎧 listening =", listening);

  // -----------------------------
  // UI RENDER
  // -----------------------------
  return (
    <div className="fixed inset-0 bg-transparent overflow-hidden">
      <div className="relative w-full h-full z-10">
        <div className="absolute top-4 left-4 z-20">
          <TimeDisplay />
        </div>

        <div className="absolute top-4 right-4 z-20">
          <WeatherWidget />
        </div>

        <div className="absolute bottom-4 left-4 z-20">
          <CalendarWidget />
        </div>

        {/* 🔥 Mic Animation */}
        <VoiceIndicator listening={listening} />

        {/* Hidden camera */}
        <video id="mirror-cam" autoPlay playsInline muted className="hidden" />

        {/* Outfit */}
        <OutfitDisplay
          suggestion={outfitSuggestion}
          images={outfitImages}
          show={showOutfit}
        />

        {/* QR */}
        <QRCodeDisplay qr={qrImage} show={showQR} />

        {/* Music */}
        <MusicPlayer />

        <div className="absolute bottom-4 right-4 z-20">
          <p className="text-xs text-muted-foreground/20">Smart Mirror</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
