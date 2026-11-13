export type GarmentCategory =
  | 't-shirt'
  | 'shirt'
  | 'kurta'
  | 'top'
  | 'dress'
  | 'hoodie/sweatshirt'
  | 'jacket/coat/blazer'
  | 'jeans/trousers/pants'
  | 'shorts'
  | 'skirt'
  | 'saree/ethnic wear'
  | 'shoes/sneakers/heels/sandals'
  | 'sunglasses/eyeglasses'
  | 'cap/hat/beanie'
  | 'face mask'
  | 'watch'
  | 'bracelet/bangle'
  | 'necklace/chain/pendant'
  | 'earrings'
  | 'ring'
  | 'scarf/stole'
  | 'belt'
  | 'bag/backpack'
  | 'tie/bow tie'
  | 'gloves'
  | 'socks';

export interface GarmentItem {
  id: string;
  sourceUrl: string;
  processedImageUrl?: string;
  category: GarmentCategory;
  confidence: number;
  title?: string;
  price?: string;
  brand?: string;
  visible: boolean;
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  addedAt: number;
}

export type PerformanceTier = 'low' | 'balanced' | 'high';

export interface ExtensionMessage {
  type: string;
  payload?: any;
}

export interface FetchImageRequest {
  type: 'FETCH_IMAGE';
  url: string;
}

export interface FetchImageResponse {
  success: boolean;
  dataUrl?: string;
  error?: string;
}
