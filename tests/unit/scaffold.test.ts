import { describe, it, expect } from 'vitest';
import { APP_CONFIG, GARMENT_CATEGORIES } from '../../src/shared/constants';

describe('Stylera Scaffold & Config Tests', () => {
  it('should have valid application configuration', () => {
    expect(APP_CONFIG.appName).toBe('Stylera');
    expect(APP_CONFIG.defaultFps).toBe(30);
    expect(APP_CONFIG.maxOutfitItems).toBe(8);
    expect(APP_CONFIG.badgeText).toContain('never leaves your device');
  });

  it('should define core fashion categories', () => {
    expect(GARMENT_CATEGORIES).toContain('t-shirt');
    expect(GARMENT_CATEGORIES).toContain('sunglasses/eyeglasses');
    expect(GARMENT_CATEGORIES).toContain('shoes/sneakers/heels/sandals');
    expect(GARMENT_CATEGORIES).toContain('watch');
    expect(GARMENT_CATEGORIES.length).toBeGreaterThanOrEqual(20);
  });
});
