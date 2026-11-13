export const GARMENT_CATEGORIES: string[] = [
  't-shirt',
  'shirt',
  'kurta',
  'top',
  'dress',
  'hoodie/sweatshirt',
  'jacket/coat/blazer',
  'jeans/trousers/pants',
  'shorts',
  'skirt',
  'saree/ethnic wear',
  'shoes/sneakers/heels/sandals',
  'sunglasses/eyeglasses',
  'cap/hat/beanie',
  'face mask',
  'watch',
  'bracelet/bangle',
  'necklace/chain/pendant',
  'earrings',
  'ring',
  'scarf/stole',
  'belt',
  'bag/backpack',
  'tie/bow tie',
  'gloves',
  'socks'
];

export const APP_CONFIG = {
  appName: 'Stylera',
  version: '0.1.0',
  defaultFps: 30,
  maxOutfitItems: 8,
  iframeId: 'stylera-tryon-iframe',
  containerId: 'stylera-root-container',
  badgeText: 'Your camera never leaves your device'
} as const;
