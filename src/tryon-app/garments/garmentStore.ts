import { create } from 'zustand';
import { GarmentItem, GarmentCategory, FetchImageResponse } from '../../shared/types';
import { APP_CONFIG } from '../../shared/constants';
import { classifyGarment } from './classifier';
import { removeBackgroundClient } from './bgRemoval';

interface IngestOptions {
  imageUrl: string;
  category?: GarmentCategory;
  confidence?: number;
  title?: string;
  brand?: string;
  price?: string;
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
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        try {
          const res = (await chrome.runtime.sendMessage({
            type: 'FETCH_IMAGE',
            url: opts.imageUrl,
          })) as FetchImageResponse;

          if (res?.success && res.dataUrl) {
            dataUrl = res.dataUrl;
          }
        } catch (msgErr) {
          console.warn('[Stylera GarmentStore] Background fetch fallback to direct URL:', msgErr);
        }
      }

      set({ loadingMessage: 'Classifying category & removing background...' });

      // Run zero-shot classification from text hints
      let predictedCategory = opts.category;
      let confidence = opts.confidence ?? 0.9;

      if (!predictedCategory && (opts.title || opts.brand)) {
        const textHints = `${opts.brand || ''} ${opts.title || ''}`;
        const classification = classifyGarment(textHints);
        predictedCategory = classification.category;
        confidence = classification.confidence;
      } else if (!predictedCategory) {
        predictedCategory = 't-shirt';
      }

      // Run on-device background removal
      let processedImageUrl = dataUrl;
      try {
        processedImageUrl = await removeBackgroundClient(dataUrl);
      } catch (bgErr) {
        console.warn('[Stylera GarmentStore] Background removal skipped:', bgErr);
      }

      const newItem: GarmentItem = {
        id: `garment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sourceUrl: opts.imageUrl,
        processedImageUrl,
        category: predictedCategory,
        confidence,
        title: opts.title || 'Product Item',
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
        const id = await get().ingestItemFromUrl({
          imageUrl: dataUrl,
          title: file.name.replace(/\.[^/.]+$/, ''),
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

  setActiveItem: (activeItemId: string | null) => set({ activeItemId }),

  updateItemTransform: (id: string, updates) => {
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
