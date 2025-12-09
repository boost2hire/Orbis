export function isWakeWord(text: string): boolean {
  const t = text.toLowerCase().trim();

  // Exact matches
  if (t === "lumi") return true;

  // Common misheard and phonetic versions of "Lumi"
  const similar = [
    // Added Lumi variants
    "loomy", "loo me", "loomi", "lumee", "loomi", "lummi",
    "lumi", "lumi.", "lu mi", "lummi", "lummy", "loomy", "loomie",
    "blue me", "blew me", "light me", "lue me", "lu me", "blooming",

    // Accent mispronunciations
    "roomy", "loni", "luni", "looney", "loony", "bloomy", "blu me", "lue me",

    // Wake phrases
    "hey lumi", "hi lumi", "okay lumi", "ok lumi",
    "hello lumi", "lumi hey", "wake up lumi"
  ];

  return similar.some(w => t.includes(w));
}
