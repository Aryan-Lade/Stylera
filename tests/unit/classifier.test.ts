import { describe, it, expect } from 'vitest';
import { classifyGarment } from '../../src/tryon-app/garments/classifier';
import { runClassificationBenchmark } from '../../scripts/benchmark-classification';

describe('Zero-Shot Garment Classifier Tests', () => {
  it('should achieve >= 85% accuracy on 100 Myntra/Ajio product benchmark dataset', () => {
    const result = runClassificationBenchmark();
    expect(result.total).toBe(100);
    expect(result.accuracyPercentage).toBeGreaterThanOrEqual(85.0);
    console.log(`Classifier Accuracy on 100 Myntra/Ajio products: ${result.accuracyPercentage}%`);
  });

  it('should correctly classify t-shirts and shirts with distinct features', () => {
    const tshirt = classifyGarment('Roadster Men Solid Pure Cotton Round Neck T-shirt');
    expect(tshirt.category).toBe('t-shirt');
    expect(tshirt.confidence).toBeGreaterThanOrEqual(0.75);

    const shirt = classifyGarment('Highlander Men Slim Fit Formal Oxford Cotton Shirt');
    expect(shirt.category).toBe('shirt');
    expect(shirt.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('should accurately detect headwear and eyewear', () => {
    const sunglasses = classifyGarment('Ray-Ban Polarized Aviator Sunglasses for Men');
    expect(sunglasses.category).toBe('sunglasses/eyeglasses');

    const cap = classifyGarment('Puma Unisex Black Baseball Cap with Embroidered Logo');
    expect(cap.category).toBe('cap/hat/beanie');
  });

  it('should distinguish lower body garments', () => {
    const jeans = classifyGarment('Levis 511 Slim Fit Mid-Rise Stretchable Jeans');
    expect(jeans.category).toBe('jeans/trousers/pants');

    const shorts = classifyGarment('Nike Dri-FIT Men Running Shorts with Pockets');
    expect(shorts.category).toBe('shorts');
  });

  it('should identify watches and jewelry', () => {
    const watch = classifyGarment('Fossil Grant Chronograph Analog Blue Dial Leather Wristwatch');
    expect(watch.category).toBe('watch');

    const necklace = classifyGarment('Tanishq 18K Gold Plated Pendant Necklace for Women');
    expect(necklace.category).toBe('necklace/chain/pendant');
  });
});
