import TimeDisplay from "@/components/mirror/TimeDisplay";
import WeatherWidget from "@/components/mirror/WeatherWidget";
import CalendarWidget from "@/components/mirror/CalendarWidget";
import VoiceIndicator from "@/components/mirror/VoiceIndicator";
import OutfitDisplay from "@/components/mirror/outfitDisplay";
import QRCodeDisplay from "@/pages/QRCodeDisplay";
import MusicPlayer from "@/components/mirror/MusicPlayer";

import { useVoiceSocket } from "@/voice/useVoiceSocket";
import { isWakeWord } from "@/voice/wakeWord";

import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";

// -----------------------------
// TYPES
// -----------------------------
type OutfitImage = { url: string; caption: string };

const Index = () => {
  const { voiceText, voiceResponse, socket } = useVoiceSocket();

  const [listening, setListening] = useState(false);
  const [outfitSuggestion, setOutfitSuggestion] = useState<string | null>(null);
  const [outfitImages, setOutfitImages] = useState<OutfitImage[]>([]);
  const [showOutfit, setShowOutfit] = useState(false);

  const [qrImage, setQrImage] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const cooldown = useRef(false);

  // -----------------------------
  // TTS
  // -----------------------------
  const speak = (text: string) => {
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    utter.voice =
      voices.find(v => v.name.includes("Google UK English Female")) ||
      voices.find(v => v.name.includes("Google US English")) ||
      voices.find(v => v.name.toLowerCase().includes("female")) ||
      voices[0];

    utter.pitch = 1.1;
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  };

  const hideAll = () => {
    setShowOutfit(false);
    setShowQR(false);
  };

  const showOutfitFor30s = () => {
    setShowOutfit(true);
    setTimeout(() => setShowOutfit(false), 30000);
  };

  // -----------------------------
  // Wake Word
  // -----------------------------
  useEffect(() => {
    if (!voiceText) return;
    const text = voiceText.toLowerCase().trim();

    if (cooldown.current) return;
    cooldown.current = true;
    setTimeout(() => (cooldown.current = false), 1200);

    if (isWakeWord(text) || text.startsWith("lumi")) {
      hideAll();
      setListening(true);
      setTimeout(() => setListening(false), 2000);
    }
  }, [voiceText]);

  // I DO not know//

      useEffect(() => {
        const video = document.getElementById("mirror-cam") as HTMLVideoElement | null;
        if (!video) return;

        navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false
        })
          .then(stream => {
            video.srcObject = stream;

            video.onloadedmetadata = () => {
              console.log("🎥 Camera resolution:", video.videoWidth, video.videoHeight);
            };
          })
          .catch(err => {
            console.error("Camera access denied:", err);
          });
      }, []);


  // -----------------------------
  // HANDLE BACKEND RESPONSES
  // -----------------------------
  useEffect(() => {
    if (!voiceResponse) return;

    console.log("🎯 Mirror UI received:", voiceResponse);

    const type = voiceResponse.type;

    // ---- FINAL OUTFIT RESULT ----
    if (type === "OUTFIT") {
      const suggestion = voiceResponse.suggestion;
      const images = voiceResponse.images || [];

      const formatted = images.map((url: string) => ({
        url,
        caption: "Outfit match",
      }));

      setOutfitSuggestion(suggestion);
      setOutfitImages(formatted);
      showOutfitFor30s();
      speak(suggestion);
      return;
    }

    // ---- OUTFIT PENDING (NEEDS UI FRAME CAPTURE) ----
    if (type === "OUTFIT_PENDING") {
      speak(voiceResponse.say || "Hold on, capturing your outfit.");
      return;
    }

    // ---- PHOTO ----
    if (type === "PHOTO") {
      speak("Your photo has been taken.");
      toast.success("📸 Photo captured!");
      return;
    }

    // ---- QR ----
    if (type === "QR") {
      setQrImage(voiceResponse.qr);
      setShowQR(true);
      setTimeout(() => setShowQR(false), 30000);
      speak("Here is your QR code.");
      return;
    }

    // ---- WEATHER ----
    if (type === "WEATHER") {
      speak(voiceResponse.say);
      toast(`🌤 ${voiceResponse.say}`);
      return;
    }

    // ---- TIME ----
    if (type === "TIME") {
      speak(voiceResponse.say);
      toast(`⏰ ${voiceResponse.say}`);
      return;
    }

    if (type === "UNKNOWN") {
      speak("Sorry, I didn’t understand.");
      return;
    }
  }, [voiceResponse]);

  // -----------------------------
  // LISTEN FOR “REQUEST FRAME” FROM BACKEND
  // -----------------------------
 useEffect(() => {
  if (!socket) return;

  const onRequest = async () => {
    try {
      const video = document.getElementById("mirror-cam") as HTMLVideoElement | null;

      if (!video) {
        console.error("No video element found");
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
        body: JSON.stringify({ image: dataUrl })
      });


    } catch (err) {
      console.error("Frame capture failed:", err);
    }
  };

  socket.on("request_frame_for_outfit", onRequest);

  return () => {
    socket.off("request_frame_for_outfit", onRequest);
  };

}, [socket]);


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

      <VoiceIndicator listening={listening} />

      <video
        id="mirror-cam"
        autoPlay
        playsInline
        muted
        className="hidden"
      />

      <OutfitDisplay
        suggestion={outfitSuggestion}
        images={outfitImages}
        show={showOutfit}
      />

      <QRCodeDisplay qr={qrImage} show={showQR} />

      {/* 🎵 MUSIC PLAYER */}
      <MusicPlayer />

      <div className="absolute bottom-4 right-4 z-20">
        <p className="text-xs text-muted-foreground/20">Smart Mirror</p>
      </div>

    </div>
  </div>
);

};

export default Index;
