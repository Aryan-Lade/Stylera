import { describe, it, expect } from 'vitest';
import { CATEGORY_ANCHORS } from '../../src/tryon-app/garments/categoryAnchors';
import { GARMENT_CATEGORIES } from '../../src/shared/constants';
import { GarmentCategory } from '../../src/shared/types';

describe('Category Anchors Configuration Tests', () => {
  it('should have complete anchor definition for every garment category', () => {
    for (const cat of GARMENT_CATEGORIES) {
      const config = CATEGORY_ANCHORS[cat as GarmentCategory];
      expect(config, `Missing config for category: ${cat}`).toBeDefined();
      expect(config.primaryLandmarks.length).toBeGreaterThan(0);
      expect(config.widthScale).toBeGreaterThan(0);
      expect(config.heightScale).toBeGreaterThan(0);
      expect(config.zLayer).toBeGreaterThan(0);
    }
  });

  it('should order layer z-indexes appropriately', () => {
    expect(CATEGORY_ANCHORS['t-shirt'].zLayer).toBeLessThan(CATEGORY_ANCHORS['jacket/coat/blazer'].zLayer);
    expect(CATEGORY_ANCHORS['jeans/trousers/pants'].zLayer).toBeLessThan(CATEGORY_ANCHORS['shoes/sneakers/heels/sandals'].zLayer);
    expect(CATEGORY_ANCHORS['sunglasses/eyeglasses'].zLayer).toBeGreaterThan(CATEGORY_ANCHORS['t-shirt'].zLayer);
  });
});
