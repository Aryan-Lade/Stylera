import React, { useState } from 'react';
import { Download, Copy, Check, X, Columns } from 'lucide-react';

interface SnapshotPreviewModalProps {
  snapshotDataUrl: string;
  rawVideoDataUrl?: string;
  onClose: () => void;
}

export const SnapshotPreviewModal: React.FC<SnapshotPreviewModalProps> = ({
  snapshotDataUrl,
  rawVideoDataUrl,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSplitCompare, setIsSplitCompare] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `stylera-tryon-${Date.now()}.png`;
    link.href = snapshotDataUrl;
    link.click();
  };

  const handleCopyClipboard = async () => {
    try {
      const res = await fetch(snapshotDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy image to clipboard:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 select-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white">Outfit Snapshot</h3>
        <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Snapshot Viewport */}
      <div className="flex-1 flex items-center justify-center my-4 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950 relative">
        {isSplitCompare && rawVideoDataUrl ? (
          <div className="flex w-full h-full">
            <div className="w-1/2 h-full relative border-r border-slate-800">
              <img src={rawVideoDataUrl} alt="Before" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] text-slate-300 font-medium">
                Without Item
              </div>
            </div>
            <div className="w-1/2 h-full relative">
              <img src={snapshotDataUrl} alt="After" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-pink-600/80 text-[10px] text-white font-medium">
                Stylera Try-On
              </div>
            </div>
          </div>
        ) : (
          <img src={snapshotDataUrl} alt="Snapshot" className="max-h-full max-w-full object-contain rounded" />
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        {rawVideoDataUrl && (
          <button
            onClick={() => setIsSplitCompare(!isSplitCompare)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isSplitCompare
                ? 'bg-pink-500/20 text-pink-400 border-pink-500/40'
                : 'text-slate-300 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare Mode</span>
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs shadow-md shadow-pink-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};
