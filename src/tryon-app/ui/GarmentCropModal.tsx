import React, { useState, useRef } from 'react';
import { Crop, Check, X, RotateCcw } from 'lucide-react';

interface GarmentCropModalProps {
  imageUrl: string;
  onApplyCrop: (croppedDataUrl: string) => void;
  onClose: () => void;
}

export const GarmentCropModal: React.FC<GarmentCropModalProps> = ({
  imageUrl,
  onApplyCrop,
  onClose,
}) => {
  const [cropBox, setCropBox] = useState({ x: 15, y: 15, width: 70, height: 70 }); // in percentages
  const containerRef = useRef<HTMLDivElement>(null);

  const handleApply = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const natW = img.naturalWidth || img.width;
      const natH = img.naturalHeight || img.height;

      const sx = (cropBox.x / 100) * natW;
      const sy = (cropBox.y / 100) * natH;
      const sw = (cropBox.width / 100) * natW;
      const sh = (cropBox.height / 100) * natH;

      canvas.width = sw;
      canvas.height = sh;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const croppedUrl = canvas.toDataURL('image/png');
      onApplyCrop(croppedUrl);
      onClose();
    };
    img.src = imageUrl;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-4 select-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Crop className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-semibold text-white">Crop / Isolate Garment</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative my-3 overflow-hidden" ref={containerRef}>
        <div className="relative inline-block max-h-full max-w-full">
          <img src={imageUrl} alt="Crop Source" className="max-h-[60vh] max-w-full object-contain pointer-events-none rounded" />

          {/* Interactive Bounding Box */}
          <div
            className="absolute border-2 border-pink-500 bg-pink-500/10 cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
            style={{
              left: `${cropBox.x}%`,
              top: `${cropBox.y}%`,
              width: `${cropBox.width}%`,
              height: `${cropBox.height}%`,
            }}
          >
            <div className="absolute top-1 left-1 bg-pink-600 text-[10px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
              Target Garment
            </div>
          </div>
        </div>
      </div>

      {/* Control Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Crop Width</label>
            <input
              type="range"
              min="20"
              max="95"
              value={cropBox.width}
              onChange={(e) => setCropBox((b) => ({ ...b, width: parseInt(e.target.value, 10) }))}
              className="w-full accent-pink-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Crop Height</label>
            <input
              type="range"
              min="20"
              max="95"
              value={cropBox.height}
              onChange={(e) => setCropBox((b) => ({ ...b, height: parseInt(e.target.value, 10) }))}
              className="w-full accent-pink-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <button
            onClick={() => setCropBox({ x: 10, y: 10, width: 80, height: 80 })}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Crop</span>
          </button>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs">
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs shadow-md shadow-pink-600/30"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Selection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
