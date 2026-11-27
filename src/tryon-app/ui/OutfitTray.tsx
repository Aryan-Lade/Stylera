import React from 'react';
import { Eye, EyeOff, Trash2, Sliders, RotateCcw, Crop } from 'lucide-react';
import { useGarmentStore } from '../garments/garmentStore';
import { GARMENT_CATEGORIES } from '../../shared/constants';
import { GarmentCategory } from '../../shared/types';
import { GarmentCropModal } from './GarmentCropModal';

const CATEGORY_EMOJIS: Record<string, string> = {
  'sunglasses/eyeglasses': '🕶️',
  't-shirt': '👕',
  'shirt': '👔',
  'kurta': '🥻',
  'top': '👚',
  'dress': '👗',
  'hoodie/sweatshirt': '🧥',
  'jacket/coat/blazer': '🧥',
  'jeans/trousers/pants': '👖',
  'shorts': '🩳',
  'skirt': '👗',
  'saree/ethnic wear': '🥻',
  'shoes/sneakers/heels/sandals': '👟',
  'cap/hat/beanie': '🧢',
  'face mask': '😷',
  'watch': '⌚',
  'bracelet/bangle': '📿',
  'necklace/chain/pendant': '📿',
  'earrings': '✨',
  'ring': '💍',
  'scarf/stole': '🧣',
  'belt': '🎗️',
  'bag/backpack': '🎒',
  'tie/bow tie': '👔',
  'gloves': '🧤',
  'socks': '🧦',
};

export const OutfitTray: React.FC = () => {
  const {
    items,
    activeItemId,
    setActiveItem,
    removeItem,
    toggleVisibility,
    updateItemTransform,
    updateCategory,
    updateProcessedImage,
  } = useGarmentStore();

  const activeItem = items.find((i) => i.id === activeItemId) || null;
  const [showTuning, setShowTuning] = React.useState(false);
  const [cropItem, setCropItem] = React.useState<typeof activeItem | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-2 z-20 pointer-events-auto">
      {/* Fine Tuning Panel (Floating above active thumbnail) */}
      {showTuning && activeItem && (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl text-xs space-y-2.5 max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-slate-200 truncate max-w-[180px]">
              {activeItem.title || 'Adjust Garment'}
            </span>
            <button
              onClick={() =>
                updateItemTransform(activeItem.id, {
                  scale: 1.0,
                  offsetX: 0,
                  offsetY: 0,
                  rotation: 0,
                })
              }
              title="Reset Adjustments"
              className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Category Dropdown Override */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Category ({Math.round(activeItem.confidence * 100)}% Match)
              </label>
              <button
                onClick={() => setCropItem(activeItem)}
                className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-1 font-medium"
              >
                <Crop className="w-3 h-3" />
                <span>Crop / Isolate</span>
              </button>
            </div>
            <select
              value={activeItem.category}
              onChange={(e) => updateCategory(activeItem.id, e.target.value as GarmentCategory)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1 text-slate-200 text-xs focus:outline-none focus:border-pink-500"
            >
              {GARMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Scale Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
              <span>Size Scale</span>
              <span>{Math.round(activeItem.scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.05"
              value={activeItem.scale}
              onChange={(e) => updateItemTransform(activeItem.id, { scale: parseFloat(e.target.value) })}
              className="w-full accent-pink-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
            />
          </div>

          {/* Vertical Nudge */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
              <span>Vertical Position</span>
              <span>{activeItem.offsetY > 0 ? `+${activeItem.offsetY}` : activeItem.offsetY}px</span>
            </div>
            <input
              type="range"
              min="-150"
              max="150"
              step="2"
              value={activeItem.offsetY}
              onChange={(e) => updateItemTransform(activeItem.id, { offsetY: parseInt(e.target.value, 10) })}
              className="w-full accent-pink-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
            />
          </div>

          {/* Horizontal Nudge */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
              <span>Horizontal Position</span>
              <span>{activeItem.offsetX > 0 ? `+${activeItem.offsetX}` : activeItem.offsetX}px</span>
            </div>
            <input
              type="range"
              min="-150"
              max="150"
              step="2"
              value={activeItem.offsetX}
              onChange={(e) => updateItemTransform(activeItem.id, { offsetX: parseInt(e.target.value, 10) })}
              className="w-full accent-pink-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Thumbnails Row */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl">
        {items.map((item) => {
          const isSelected = item.id === activeItemId;
          return (
            <div
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`relative group shrink-0 w-14 h-14 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                isSelected
                  ? 'border-pink-500 ring-2 ring-pink-500/30 scale-105'
                  : 'border-slate-800 opacity-80 hover:opacity-100'
              } ${!item.visible ? 'grayscale opacity-40' : ''}`}
            >
              <img
                src={item.processedImageUrl || item.sourceUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />

              {/* Action Overlays on Hover */}
              <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-around p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(item.id);
                  }}
                  className="text-slate-300 hover:text-white"
                  title={item.visible ? 'Hide' : 'Show'}
                >
                  {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveItem(item.id);
                    setShowTuning(!showTuning);
                  }}
                  className="text-slate-300 hover:text-white"
                  title="Tune Adjustments"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="text-red-400 hover:text-red-300"
                  title="Remove Item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Category indicator pill with quick-click tuning toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveItem(item.id);
                  setShowTuning(true);
                }}
                title={`Category: ${item.category} (${Math.round(item.confidence * 100)}% match). Click to change.`}
                className="absolute bottom-0 inset-x-0 bg-slate-950/90 hover:bg-pink-950/90 text-[8px] text-center font-medium text-slate-200 py-0.5 truncate px-1 border-t border-slate-800 flex items-center justify-center gap-0.5 transition-colors"
              >
                <span>{CATEGORY_EMOJIS[item.category] || '✨'}</span>
                <span className="truncate">{item.category.split('/')[0]}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Interactive Crop Modal */}
      {cropItem && (
        <GarmentCropModal
          imageUrl={cropItem.processedImageUrl || cropItem.sourceUrl}
          onApplyCrop={(croppedUrl) => updateProcessedImage(cropItem.id, croppedUrl)}
          onClose={() => setCropItem(null)}
        />
      )}
    </div>
  );
};
