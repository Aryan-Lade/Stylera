import { describe, it, expect } from 'vitest';
import {
  classifyGarment,
  extractTokensFromUrl,
  classifyFromImageAspect,
  classifyMultiModal,
  extractObjectBoundingBox,
  classifyImageVisually,
} from '../../src/tryon-app/garments/classifier';
import { runClassificationBenchmark } from '../../scripts/benchmark-classification';

describe('Zero-Shot Garment Classifier Tests', () => {
  it('should achieve >= 85% accuracy on 100 Myntra/Ajio product benchmark dataset', () => {
    const result = runClassificationBenchmark();
    expect(result.total).toBe(100);
    expect(result.accuracyPercentage).toBeGreaterThanOrEqual(95.0);
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

    // Test singular form and variants
    const sunglass = classifyGarment('Voyage Black Polarised Square Sunglass');
    expect(sunglass.category).toBe('sunglasses/eyeglasses');

    const shades = classifyGarment('Trendy UV Protection Shades with Metal Frame');
    expect(shades.category).toBe('sunglasses/eyeglasses');

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

  it('should extract meaningful product tokens from URLs', () => {
    const url = 'https://assets.myntassets.com/h_1440,q_90,w_1080/v1/assets/images/12345/Voyage-Men-Square-Sunglasses-1.jpg';
    const tokens = extractTokensFromUrl(url);
    expect(tokens.toLowerCase()).toContain('voyage');
    expect(tokens.toLowerCase()).toContain('sunglasses');

    const classified = classifyMultiModal({ url });
    expect(classified.category).toBe('sunglasses/eyeglasses');
  });

  it('should classify based on geometric aspect ratio when text is missing', () => {
    // Wide horizontal aspect ratio (e.g. 2.1) -> sunglasses/eyeglasses
    const eyewearAspect = classifyFromImageAspect(2.1);
    expect(eyewearAspect?.category).toBe('sunglasses/eyeglasses');

    // Tall vertical aspect ratio (e.g. 0.5) -> jeans/trousers/pants
    const pantsAspect = classifyFromImageAspect(0.5);
    expect(pantsAspect?.category).toBe('jeans/trousers/pants');

    // Footwear aspect ratio (e.g. 1.35) -> shoes
    const shoeAspect = classifyFromImageAspect(1.35);
    expect(shoeAspect?.category).toBe('shoes/sneakers/heels/sandals');
  });

  it('should automatically detect sunglasses on multi-modal input with zero title hints', () => {
    const result = classifyMultiModal({
      url: 'https://cdn.example.com/products/49281.jpg',
      aspectRatio: 2.2, // wide sunglasses aspect ratio
    });
    expect(result.category).toBe('sunglasses/eyeglasses');
    expect(result.confidence).toBeGreaterThanOrEqual(0.90);
  });

  it('should handle filenames with underscores, dashes and numbers correctly', () => {
    const res1 = classifyGarment('voyage_unisex_square_sunglasses_58157mg2970');
    expect(res1.category).toBe('sunglasses/eyeglasses');

    const res2 = classifyGarment('mens_black_hoodie_oversized_fit.jpg');
    expect(res2.category).toBe('hoodie/sweatshirt');

    const res3 = classifyGarment('levis-501-straight-fit-jeans');
    expect(res3.category).toBe('jeans/trousers/pants');
  });

  it('should not parse base64 data URLs as noise words in extractTokensFromUrl', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQY';
    const tokens = extractTokensFromUrl(dataUrl);
    expect(tokens).toBe('');
  });

  it('should accurately extract object bounding box from square padded white image', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100; // raw canvas aspect ratio is 1.0 (square)
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Fill entire background with white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 100, 100);

      // Draw horizontal dark rectangle in center (e.g. 80w x 25h = 3.2 aspect ratio)
      ctx.fillStyle = '#101010';
      ctx.fillRect(10, 38, 80, 24);

      const bbox = extractObjectBoundingBox(canvas);
      expect(bbox.aspectRatio).toBeGreaterThanOrEqual(2.5);

      const visualRes = classifyImageVisually(canvas);
      expect(visualRes.category).toBe('sunglasses/eyeglasses');
      expect(visualRes.confidence).toBeGreaterThanOrEqual(0.90);
    }
  });
});
