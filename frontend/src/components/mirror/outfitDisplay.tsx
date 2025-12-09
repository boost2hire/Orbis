import React from "react";

type OutfitImage = {
  url: string;
  caption: string;
};

interface OutfitProps {
  suggestion: string | null;
  images: OutfitImage[];
  show: boolean;
}

const OutfitDisplay: React.FC<OutfitProps> = ({ suggestion, images, show }) => {
  if (!show || !suggestion) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-fade-in">

      {/* Premium Suggestion Text */}
      <div className="text-center max-w-3xl px-6 mb-8">
        <p className="text-xl lg:text-2xl font-light leading-relaxed tracking-wide text-white/85 drop-shadow-md">
          {suggestion}
        </p>
      </div>

      {/* Pinterest Style Staggered Layout */}
      <div className="grid grid-cols-3 gap-8 px-4 max-w-4xl">

        {images.map((img, i) => (
          <div
            key={i}
            className={`
              group relative overflow-hidden rounded-3xl
              w-40 h-56 lg:w-48 lg:h-64
              bg-white/5 backdrop-blur-xl 
              border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)]
              transition-all duration-500
              hover:scale-[1.06] hover:shadow-[0_12px_35px_rgba(0,0,0,0.5)]
              animate-premium-float
            `}
            style={{
              animationDelay: `${i * 0.2}s`,
            }}
          >
            {/* Image */}
            <img
              src={img.url}
              alt={img.caption}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            />

            {/* Caption on Hover */}
            <div
              className="
                absolute bottom-0 left-0 right-0
                bg-gradient-to-t from-black/70 via-black/20 to-transparent
                p-4 opacity-0 group-hover:opacity-100
                transition-all duration-500 pointer-events-none
              "
            >
              <p className="text-sm text-white font-light tracking-wide leading-snug">
                {img.caption}
              </p>
            </div>
          </div>
        ))}

      </div>

    </div>
  );
};

export default OutfitDisplay;
