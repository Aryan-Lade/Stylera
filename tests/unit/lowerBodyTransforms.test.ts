import { describe, it, expect } from 'vitest';
import { computeLowerBodyTransform, computeFootwearPair } from '../../src/tryon-app/vision/lowerBodyTransforms';

describe('Lower Body & Footwear Transforms Tests', () => {
  it('should return null when landmarks are incomplete', () => {
    expect(computeLowerBodyTransform([], 640, 480)).toBeNull();
    expect(computeFootwearPair([], 640, 480)).toBeNull();
  });

  it('should compute lower body pants dimensions and detect visibility', () => {
    const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));
    landmarks[23] = { x: 0.42, y: 0.5, z: 0, visibility: 0.9 }; // Left hip
    landmarks[24] = { x: 0.58, y: 0.5, z: 0, visibility: 0.9 }; // Right hip
    landmarks[25] = { x: 0.42, y: 0.7, z: 0, visibility: 0.9 }; // Left knee
    landmarks[26] = { x: 0.58, y: 0.7, z: 0, visibility: 0.9 }; // Right knee
    landmarks[27] = { x: 0.42, y: 0.9, z: 0, visibility: 0.9 }; // Left ankle
    landmarks[28] = { x: 0.58, y: 0.9, z: 0, visibility: 0.9 }; // Right ankle

    const result = computeLowerBodyTransform(landmarks, 640, 480);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.hipCenterX).toBeCloseTo(320, 1);
    expect(result.hipCenterY).toBeCloseTo(240, 1);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.isLegsVisible).toBe(true);
  });

  it('should compute paired footwear positions for left and right shoe', () => {
    const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));
    landmarks[27] = { x: 0.4, y: 0.9, z: 0, visibility: 0.9 }; // Left ankle
    landmarks[28] = { x: 0.6, y: 0.9, z: 0, visibility: 0.9 }; // Right ankle
    landmarks[31] = { x: 0.38, y: 0.95, z: 0, visibility: 0.9 }; // Left toe
    landmarks[32] = { x: 0.62, y: 0.95, z: 0, visibility: 0.9 }; // Right toe

    const result = computeFootwearPair(landmarks, 640, 480);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.leftShoe.x).toBeCloseTo(256, 1);
    expect(result.rightShoe.x).toBeCloseTo(384, 1);
    expect(result.leftShoe.visible).toBe(true);
    expect(result.rightShoe.visible).toBe(true);
  });
});
