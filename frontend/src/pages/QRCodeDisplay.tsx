import React from "react";

interface Props {
  qr: string | null;
  show: boolean;
}

const QRCodeDisplay: React.FC<Props> = ({ qr, show }) => {
  if (!show || !qr) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
      <div className="bg-black/30 backdrop-blur-lg p-6 rounded-3xl shadow-xl">
        <img
          src={qr}  // <<< FIXED — NO PREFIX ADDED
          className="w-56 h-56 rounded-xl"
        />
        <p className="mt-3 text-center text-white/80">Scan to download photo</p>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
