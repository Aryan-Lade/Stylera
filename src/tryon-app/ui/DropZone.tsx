import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud, Plus } from 'lucide-react';
import { useGarmentStore } from '../garments/garmentStore';

interface DropZoneProps {
  children?: React.ReactNode;
}

export const DropZone: React.FC<DropZoneProps> = ({ children }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { ingestItemFromUrl, ingestItemFromFile, items, isLoading, loadingMessage } = useGarmentStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      // 1. Check if files were dropped (e.g. from desktop)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          await ingestItemFromFile(file);
          return;
        }
      }

      // 2. Check if a custom JSON payload was transferred
      const customData = e.dataTransfer.getData('application/json');
      if (customData) {
        try {
          const parsed = JSON.parse(customData);
          if (parsed.imageUrl) {
            await ingestItemFromUrl(parsed);
            return;
          }
        } catch {
          // continue to next extraction
        }
      }

      // 3. Check for URL in dataTransfer
      let url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');

      // 4. Check HTML for img src
      if (!url) {
        const html = e.dataTransfer.getData('text/html');
        if (html) {
          const match = html.match(/src=["'](.*?)["']/);
          if (match && match[1]) {
            url = match[1];
          }
        }
      }

      if (url && (url.startsWith('http') || url.startsWith('data:image/'))) {
        await ingestItemFromUrl({ imageUrl: url });
      }
    },
    [ingestItemFromFile, ingestItemFromUrl]
  );

  // Support clipboard paste (Ctrl+V of copied image or URL)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Check for image blob
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            await ingestItemFromFile(file);
            return;
          }
        }
      }

      // Check for image URL
      const text = clipboardData.getData('text');
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        await ingestItemFromUrl({ imageUrl: text });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [ingestItemFromFile, ingestItemFromUrl]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full"
    >
      {children}

      {/* Empty State Overlay when no garments added yet */}
      {items.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none z-10">
          <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border-2 border-dashed border-slate-700/80 text-center max-w-[280px] shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <UploadCloud className="w-6 h-6 animate-bounce" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Drag a product here</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Drag any image from Myntra, Ajio or paste a product link to try it on.
            </p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center z-30 pointer-events-auto">
          <div className="w-10 h-10 rounded-full border-2 border-pink-500 border-t-transparent animate-spin mb-3" />
          <div className="text-xs font-semibold text-white tracking-wide">
            {loadingMessage || 'Processing Garment...'}
          </div>
        </div>
      )}

      {/* Dragging Active Overlay Highlight */}
      {isDragOver && (
        <div className="absolute inset-0 bg-pink-600/20 backdrop-blur-sm border-2 border-dashed border-pink-400 rounded-lg flex flex-col items-center justify-center z-40 pointer-events-none transition-all">
          <div className="w-16 h-16 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-xl animate-pulse mb-3">
            <Plus className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-white shadow-sm">Drop item to Try On</p>
        </div>
      )}
    </div>
  );
};
