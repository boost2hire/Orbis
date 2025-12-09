import { useEffect, useRef, useState } from "react";
import { useVoiceSocket } from "@/voice/useVoiceSocket";
import { toast } from "sonner";

import { handleOutfit } from "@/voice/actions/handleOutfit";
import { handlePhoto } from "@/voice/actions/handlePhoto";
import { handleQR } from "@/voice/actions/handleQR";
import { handleChat } from "@/voice/actions/handleChat";
import { isWakeWord } from "@/voice/wakeWord";

// -----------------------------
// Voice Response Type
// -----------------------------
type VoiceResponse =
  | { type: "OUTFIT"; suggestion: string; images: string[] }
  | { type: "PHOTO"; path: string }   // correct
  | { type: "WEATHER"; say: string }
  | { type: "TIME"; say: string }
  | { type: "QR"; qr: string }
  | { type: "UNKNOWN"; say?: string };


// -----------------------------

export const useHybridVoiceEngine = () => {
  const { voiceText, voiceResponse } = useVoiceSocket<VoiceResponse>();

  const [listening, setListening] = useState(false);
  const [showOutfit, setShowOutfit] = useState(false);
  const [outfitSuggestion, setOutfitSuggestion] = useState<string | null>(null);
  const [outfitImages, setOutfitImages] = useState<string[]>([]);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const cooldown = useRef(false);

  // -----------------------------
  // Wake word
  // -----------------------------
  useEffect(() => {
    if (!voiceText) return;

    const cleaned = voiceText.toLowerCase().trim();
    if (!cleaned) return;

    if (cooldown.current) return;
    cooldown.current = true;
    setTimeout(() => (cooldown.current = false), 1200);

    if (isWakeWord(cleaned) || cleaned.startsWith("lumi")) {
      setListening(true);
      setTimeout(() => setListening(false), 1500);
      return;
    }
  }, [voiceText]);

  // -----------------------------
  // Backend Response Handler
  // -----------------------------
  useEffect(() => {
    if (!voiceResponse) return;

    switch (voiceResponse.type) {
      case "OUTFIT": {
        const { suggestion, images } = handleOutfit(voiceResponse);
        setOutfitSuggestion(suggestion);
        setOutfitImages(images);
        setShowOutfit(true);
        setTimeout(() => setShowOutfit(false), 30000);
        break;
      }

      case "PHOTO": {
        handlePhoto(voiceResponse);
        break;
      }

      case "WEATHER": {
        toast("🌤 " + voiceResponse.say);
        break;
      }

      case "TIME": {
        toast("⏰ " + voiceResponse.say);
        break;
      }

      case "QR": {
        const { qr } = handleQR(voiceResponse);
        setQrImage(qr);
        setShowQR(true);
        setTimeout(() => setShowQR(false), 30000);
        break;
      }

      case "UNKNOWN": {
        toast("🤔 I didn't understand that.");
        break;
      }
    }
  }, [voiceResponse]);

  return {
    listening,
    showOutfit,
    outfitSuggestion,
    outfitImages,
    showQR,
    qrImage,
  };
};
