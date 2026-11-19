import { GarmentCategory } from '../../shared/types';

export interface BodyRegion {
  bodyType: 'upper_body' | 'lower_body' | 'dress' | 'face' | 'head' | 'footwear' | 'wrist' | 'neck' | 'ring';
  primaryLandmarks: number[];
  secondaryLandmarks: number[];
  widthScale: number;
  heightScale: number;
  yOffsetRatio: number; // positive = downwards, negative = upwards
  zLayer: number; // Layer order: innerwear < shirt < jacket < accessories
}

export const CATEGORY_ANCHORS: Record<GarmentCategory, BodyRegion> = {
  // Upper body items
  't-shirt': {
    bodyType: 'upper_body',
    primaryLandmarks: [11, 12], // Left & right shoulders
    secondaryLandmarks: [23, 24], // Left & right hips
    widthScale: 2.1,
    heightScale: 1.25,
    yOffsetRatio: 0.28,
    zLayer: 10,
  },
  'shirt': {
    bodyType: 'upper_body',
    primaryLandmarks: [11, 12],
    secondaryLandmarks: [23, 24],
    widthScale: 2.2,
    heightScale: 1.3,
    yOffsetRatio: 0.3,
    zLayer: 12,
  },
  'top': {
    bodyType: 'upper_body',
    primaryLandmarks: [11, 12],
    secondaryLandmarks: [23, 24],
    widthScale: 2.0,
    heightScale: 1.15,
    yOffsetRatio: 0.25,
    zLayer: 11,
  },
  'kurta': {
    bodyType: 'upper_body',
    primaryLandmarks: [11, 12],
    secondaryLandmarks: [23, 24, 25, 26], // extends past knees
    widthScale: 2.25,
    heightScale: 1.7,
    yOffsetRatio: 0.45,
    zLayer: 15,
  },
  'hoodie/sweatshirt': {
    bodyType: 'upper_body',
    primaryLandmarks: [11, 12],
    secondaryLandmarks: [23, 24],
    widthScale: 2.4,
    heightScale: 1.35,
    yOffsetRatio: 0.3,
    zLayer: 20,
  },
  'jacket/coat/blazer': {
    bodyType: 'upper_body',
    primaryLandmarks: [11, 12],
    secondaryLandmarks: [23, 24],
    widthScale: 2.45,
    heightScale: 1.38,
    yOffsetRatio: 0.32,
    zLayer: 25,
  },

  // Dresses & Saree
  'dress': {
    bodyType: 'dress',
    primaryLandmarks: [11, 12], // Shoulders
    secondaryLandmarks: [23, 24, 25, 26], // Hips to knees
    widthScale: 2.2,
    heightScale: 2.1,
    yOffsetRatio: 0.6,
    zLayer: 14,
  },
  'saree/ethnic wear': {
    bodyType: 'dress',
    primaryLandmarks: [11, 12],
    secondaryLandmarks: [23, 24, 27, 28], // Shoulders to ankles
    widthScale: 2.3,
    heightScale: 2.4,
    yOffsetRatio: 0.7,
    zLayer: 18,
  },

  // Lower body
  'jeans/trousers/pants': {
    bodyType: 'lower_body',
    primaryLandmarks: [23, 24], // Hips
    secondaryLandmarks: [27, 28], // Ankles
    widthScale: 1.8,
    heightScale: 1.1,
    yOffsetRatio: 0.45,
    zLayer: 8,
  },
  'shorts': {
    bodyType: 'lower_body',
    primaryLandmarks: [23, 24],
    secondaryLandmarks: [25, 26], // Knees
    widthScale: 1.8,
    heightScale: 0.7,
    yOffsetRatio: 0.28,
    zLayer: 8,
  },
  'skirt': {
    bodyType: 'lower_body',
    primaryLandmarks: [23, 24],
    secondaryLandmarks: [25, 26],
    widthScale: 2.1,
    heightScale: 0.9,
    yOffsetRatio: 0.35,
    zLayer: 9,
  },

  // Head and Face items
  'sunglasses/eyeglasses': {
    bodyType: 'face',
    primaryLandmarks: [33, 263], // Left and right outer eye corners (face mesh)
    secondaryLandmarks: [168, 6], // Nose bridge
    widthScale: 2.3,
    heightScale: 1.1,
    yOffsetRatio: 0.0,
    zLayer: 50,
  },
  'cap/hat/beanie': {
    bodyType: 'head',
    primaryLandmarks: [10, 151], // Forehead top and crown
    secondaryLandmarks: [234, 454], // Left/right temples
    widthScale: 2.2,
    heightScale: 1.4,
    yOffsetRatio: -0.42,
    zLayer: 45,
  },
  'face mask': {
    bodyType: 'face',
    primaryLandmarks: [6, 152], // Nose bridge to chin
    secondaryLandmarks: [234, 454], // Cheeks
    widthScale: 1.8,
    heightScale: 1.2,
    yOffsetRatio: 0.15,
    zLayer: 40,
  },

  // Footwear
  'shoes/sneakers/heels/sandals': {
    bodyType: 'footwear',
    primaryLandmarks: [27, 28], // Ankles
    secondaryLandmarks: [31, 32], // Foot indices
    widthScale: 1.4,
    heightScale: 1.0,
    yOffsetRatio: 0.2,
    zLayer: 30,
  },

  // Accessories & Jewelry
  'watch': {
    bodyType: 'wrist',
    primaryLandmarks: [15, 16], // Left/Right wrist
    secondaryLandmarks: [17, 18], // Pinky
    widthScale: 1.2,
    heightScale: 1.2,
    yOffsetRatio: 0.0,
    zLayer: 35,
  },
  'bracelet/bangle': {
    bodyType: 'wrist',
    primaryLandmarks: [15, 16],
    secondaryLandmarks: [19, 20], // Index
    widthScale: 1.3,
    heightScale: 1.0,
    yOffsetRatio: 0.0,
    zLayer: 34,
  },
  'necklace/chain/pendant': {
    bodyType: 'neck',
    primaryLandmarks: [11, 12], // Shoulders
    secondaryLandmarks: [152], // Chin
    widthScale: 1.4,
    heightScale: 1.0,
    yOffsetRatio: 0.08,
    zLayer: 38,
  },
  'earrings': {
    bodyType: 'face',
    primaryLandmarks: [234, 454], // Left / Right ears
    secondaryLandmarks: [152],
    widthScale: 0.5,
    heightScale: 0.7,
    yOffsetRatio: 0.1,
    zLayer: 48,
  },
  'ring': {
    bodyType: 'ring',
    primaryLandmarks: [15, 16],
    secondaryLandmarks: [],
    widthScale: 0.4,
    heightScale: 0.4,
    yOffsetRatio: 0.0,
    zLayer: 55,
  },
  'scarf/stole': {
    bodyType: 'upper_body',
    primaryLandmarks: [11, 12],
    secondaryLandmarks: [23, 24],
    widthScale: 1.8,
    heightScale: 1.1,
    yOffsetRatio: 0.12,
    zLayer: 36,
  },
  'belt': {
    bodyType: 'lower_body',
    primaryLandmarks: [23, 24],
    secondaryLandmarks: [],
    widthScale: 1.6,
    heightScale: 0.35,
    yOffsetRatio: 0.0,
    zLayer: 22,
  },
  'bag/backpack': {
    bodyType: 'upper_body',
    primaryLandmarks: [11, 12],
    secondaryLandmarks: [23, 24],
    widthScale: 1.5,
    heightScale: 1.2,
    yOffsetRatio: 0.2,
    zLayer: 28,
  },
  'tie/bow tie': {
    bodyType: 'upper_body',
    primaryLandmarks: [11, 12],
    secondaryLandmarks: [23, 24],
    widthScale: 0.8,
    heightScale: 1.1,
    yOffsetRatio: 0.18,
    zLayer: 32,
  },
  'gloves': {
    bodyType: 'wrist',
    primaryLandmarks: [15, 16],
    secondaryLandmarks: [],
    widthScale: 1.5,
    heightScale: 1.5,
    yOffsetRatio: 0.1,
    zLayer: 24,
  },
  'socks': {
    bodyType: 'footwear',
    primaryLandmarks: [27, 28],
    secondaryLandmarks: [31, 32],
    widthScale: 1.3,
    heightScale: 1.2,
    yOffsetRatio: -0.1,
    zLayer: 7,
  },
};
