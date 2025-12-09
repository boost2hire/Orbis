// -----------------------------
// Outfit Text Suggestion (Groq)
// -----------------------------
export async function fetchOutfitSuggestion() {
  try {
    const res = await fetch("http://localhost:5001/suggest-outfit");
    const data = await res.json();

    if (data.error) {
      return { error: true, suggestion: "" };
    }

    return {
      error: false,
      suggestion: data.suggestion, // The text Groq generates
    };
  } catch (err) {
    console.error("Outfit Suggest Error:", err);
    return { error: true, suggestion: "" };
  }
}

// -----------------------------
// Fetch Outfit Images (2–3 max)
// -----------------------------
export async function fetchOutfitImages(query: string) {
  try {
    const res = await fetch("http://localhost:5001/outfit/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();

    // backend returns: { images: [ {url, caption}, ... ] }
    return data.images || [];
  } catch (err) {
    console.error("Outfit Image Error:", err);
    return [];
  }
}

// -----------------------------
// Combined Helper (Optional)
// -----------------------------
export async function getFullOutfitRecommendation() {
  try {
    // 1. Get Groq suggestion
    const sug = await fetchOutfitSuggestion();
    if (sug.error) return { suggestion: "", images: [], error: true };

    // 2. Get relevant images
    const imgs = await fetchOutfitImages(sug.suggestion);

    return {
      suggestion: sug.suggestion,
      images: imgs,
      error: false,
    };
  } catch (err) {
    return { suggestion: "", images: [], error: true };
  }
}
