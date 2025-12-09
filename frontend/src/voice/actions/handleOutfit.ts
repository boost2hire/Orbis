export interface OutfitResponse {
  type: "OUTFIT";
  suggestion?: string;
  say?: string;
  images?: string[];
}
export const handleOutfit = (res: OutfitResponse) => {
  return {
    suggestion: res.suggestion || res.say || "No suggestion available.",
    images: res.images || [],
  };
};

