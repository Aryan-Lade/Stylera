import { create } from 'zustand';
import { GarmentItem, GarmentCategory, FetchImageResponse } from '../../shared/types';
import { APP_CONFIG } from '../../shared/constants';
import { classifyMultiModal, classifyImageVisually, extractTokensFromUrl } from './classifier';
import { removeBackgroundClient } from './bgRemoval';
import { visionManager } from '../vision/visionManager';

export interface IngestOptions {
  imageUrl: string;
  category?: GarmentCategory;
  confidence?: number;
  title?: string;
  brand?: string;
  price?: string;
  categoryHint?: string;
}

interface GarmentStoreState {
  items: GarmentItem[];
  activeItemId: string | null;
  isLoading: boolean;
  loadingMessage: string | null;

  // Actions
  ingestItemFromUrl: (opts: IngestOptions) => Promise<string | null>;
  ingestItemFromFile: (file: File) => Promise<string | null>;
  removeItem: (id: string) => void;
  clearOutfit: () => void;
  toggleVisibility: (id: string) => void;
  setActiveItem: (id: string | null) => void;
  updateItemTransform: (id: string, updates: Partial<Pick<GarmentItem, 'scale' | 'offsetX' | 'offsetY' | 'rotation'>>) => void;
  updateCategory: (id: string, category: GarmentCategory) => void;
  updateProcessedImage: (id: string, newProcessedUrl: string) => void;
}

function loadImageToCanvas(dataUrl: string): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), 800);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas);
          return;
        }
      } catch {
        // fallback
      }
      resolve(null);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = dataUrl;
  });
}

function getImageNaturalDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve({ width: 1, height: 1 });
      return;
    }
    // Safety timeout for jsdom / test environments where Image doesn't load external URLs
    const timer = setTimeout(() => {
      resolve({ width: 1, height: 1 });
    }, 400);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      resolve({
        width: img.naturalWidth || img.width || 1,
        height: img.naturalHeight || img.height || 1,
      });
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve({ width: 1, height: 1 });
    };
    img.src = dataUrl;
  });
}

export const useGarmentStore = create<GarmentStoreState>((set, get) => ({
  items: [],
  activeItemId: null,
  isLoading: false,
  loadingMessage: null,

  ingestItemFromUrl: async (opts: IngestOptions) => {
    const { items } = get();
    if (items.length >= APP_CONFIG.maxOutfitItems) {
      alert(`Outfit limit reached (${APP_CONFIG.maxOutfitItems} items max). Please remove an item first.`);
      return null;
    }

    set({ isLoading: true, loadingMessage: 'Downloading product image...' });

    try {
      let dataUrl = opts.imageUrl;

      // In browser extension environment, request background service worker to fetch image to avoid CORS taint
      if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.runtime?.sendMessage) {
        try {
          const res = (await chrome.runtime.sendMessage({
            type: 'FETCH_IMAGE',
            url: opts.imageUrl,
          })) as FetchImageResponse;

          if (res?.success && res.dataUrl) {
            dataUrl = res.dataUrl;
          }
        } catch {
          // Normal direct fetch fallback when service worker is idle
          dataUrl = opts.imageUrl;
        }
      }

      set({ loadingMessage: 'Analyzing garment & category detection...' });

      // Multi-modal category classification
      let predictedCategory = opts.category;
      let confidence = opts.confidence ?? 0.9;

      if (!predictedCategory) {
        const textHints = `${opts.brand || ''} ${opts.title || ''} ${opts.categoryHint || ''}`.trim();
        const canvas = await loadImageToCanvas(dataUrl);

        if (canvas) {
          // Zero-shot visual silhouette & foreground bounding box classifier
          const classification = classifyImageVisually(canvas, textHints, opts.imageUrl);
          predictedCategory = classification.category;
          confidence = classification.confidence;

          // Check if a human model face is wearing glasses in the image
          try {
            const faceLandmarks = await visionManager.detectFaceOnStaticImage(canvas);
            if (faceLandmarks && faceLandmarks.length >= 468) {
              const leftEye = faceLandmarks[33];
              const rightEye = faceLandmarks[263];
              const eyeSpan = Math.hypot((rightEye.x - leftEye.x) * canvas.width, (rightEye.y - leftEye.y) * canvas.height);

              if (eyeSpan > 15) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  const leftData = ctx.getImageData(
                    Math.max(0, Math.round(leftEye.x * canvas.width - eyeSpan * 0.15)),
                    Math.max(0, Math.round(leftEye.y * canvas.height - eyeSpan * 0.15)),
                    Math.max(2, Math.round(eyeSpan * 0.3)),
                    Math.max(2, Math.round(eyeSpan * 0.3))
                  );
                  let avgEyeB = 0;
                  for (let i = 0; i < leftData.data.length; i += 4) {
                    avgEyeB += (leftData.data[i] + leftData.data[i + 1] + leftData.data[i + 2]) / 3;
                  }
                  avgEyeB /= Math.max(1, leftData.data.length / 4);

                  if (avgEyeB < 140) {
                    predictedCategory = 'sunglasses/eyeglasses';
                    confidence = 0.98;
                  }
                }
              }
            }
          } catch {
            // face landmark analysis skipped
          }
        } else {
          // Fallback when canvas context is unavailable
          const dims = await getImageNaturalDimensions(dataUrl);
          const aspectRatio = dims.width / Math.max(1, dims.height);
          const classification = classifyMultiModal({
            textHints,
            url: opts.imageUrl,
            aspectRatio,
          });
          predictedCategory = classification.category;
          confidence = classification.confidence;
        }
      }

      set({
        loadingMessage: `Detected ${predictedCategory} (${Math.round(confidence * 100)}%). Removing background...`,
      });

      // Run on-device background removal & model-wearer isolation
      let processedImageUrl = dataUrl;
      try {
        processedImageUrl = await removeBackgroundClient(dataUrl, predictedCategory);
      } catch (bgErr) {
        console.warn('[Stylera GarmentStore] Background removal skipped:', bgErr);
      }

      // Generate clean title if not provided
      let itemTitle = opts.title;
      if (!itemTitle || itemTitle === 'Fashion Item' || itemTitle === 'Product Item') {
        const urlTokens = extractTokensFromUrl(opts.imageUrl);
        if (urlTokens && urlTokens.trim().length > 3) {
          itemTitle = urlTokens
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .slice(0, 5)
            .join(' ');
        } else {
          itemTitle = predictedCategory.charAt(0).toUpperCase() + predictedCategory.slice(1);
        }
      }

      const newItem: GarmentItem = {
        id: `garment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sourceUrl: opts.imageUrl,
        processedImageUrl,
        category: predictedCategory,
        confidence,
        title: itemTitle,
        brand: opts.brand,
        price: opts.price,
        visible: true,
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        addedAt: Date.now(),
      };

      set((state) => ({
        items: [...state.items, newItem],
        activeItemId: newItem.id,
        isLoading: false,
        loadingMessage: null,
      }));

      return newItem.id;
    } catch (err: any) {
      console.error('[Stylera GarmentStore] Failed to ingest garment:', err);
      set({ isLoading: false, loadingMessage: null });
      return null;
    }
  },

  ingestItemFromFile: async (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const rawName = file.name.replace(/\.[^/.]+$/, '');
        const cleanTitle = rawName.replace(/[\-_+.]/g, ' ').trim();
        const id = await get().ingestItemFromUrl({
          imageUrl: dataUrl,
          title: cleanTitle,
          categoryHint: cleanTitle,
        });
        resolve(id);
      };
      reader.readAsDataURL(file);
    });
  },

  removeItem: (id: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      activeItemId: state.activeItemId === id ? null : state.activeItemId,
    }));
  },

  clearOutfit: () => {
    set({ items: [], activeItemId: null });
  },

  toggleVisibility: (id: string) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      ),
    }));
  },

  setActiveItem: (id: string | null) => {
    set({ activeItemId: id });
  },

  updateItemTransform: (id, updates) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  updateCategory: (id: string, category: GarmentCategory) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, category } : item
      ),
    }));
  },

  updateProcessedImage: (id: string, newProcessedUrl: string) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, processedImageUrl: newProcessedUrl } : item
      ),
    }));
  },
}));
