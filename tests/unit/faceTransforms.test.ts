import { describe, it, expect } from 'vitest';
import { computeFaceItemTransform } from '../../src/tryon-app/vision/faceTransforms';

describe('Face Transform Tests', () => {
  it('should return null when landmarks are incomplete', () => {
    const result = computeFaceItemTransform([], null, 'face', 640, 480);
    expect(result).toBeNull();
  });

  it('should compute sunglasses position from eye and nose landmarks', () => {
    // Create mock 478 landmarks
    const landmarks = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    landmarks[33] = { x: 0.4, y: 0.4, z: 0 }; // Left eye
    landmarks[263] = { x: 0.6, y: 0.4, z: 0 }; // Right eye
    landmarks[168] = { x: 0.5, y: 0.42, z: 0 }; // Nose bridge
    landmarks[10] = { x: 0.5, y: 0.2, z: 0 }; // Forehead
    landmarks[152] = { x: 0.5, y: 0.7, z: 0 }; // Chin
    landmarks[234] = { x: 0.35, y: 0.45, z: 0 }; // Left temple
    landmarks[454] = { x: 0.65, y: 0.45, z: 0 }; // Right temple

    const result = computeFaceItemTransform(landmarks, null, 'face', 640, 480);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.centerX).toBeCloseTo(320, 1);
    expect(result.centerY).toBeCloseTo(201.6, 1);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it('should adjust head item (cap/hat) placement above the forehead', () => {
    const landmarks = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    landmarks[33] = { x: 0.4, y: 0.4, z: 0 };
    landmarks[263] = { x: 0.6, y: 0.4, z: 0 };
    landmarks[168] = { x: 0.5, y: 0.42, z: 0 };
    landmarks[10] = { x: 0.5, y: 0.2, z: 0 };
    landmarks[152] = { x: 0.5, y: 0.7, z: 0 };
    landmarks[234] = { x: 0.35, y: 0.45, z: 0 };
    landmarks[454] = { x: 0.65, y: 0.45, z: 0 };

    const faceResult = computeFaceItemTransform(landmarks, null, 'face', 640, 480);
    const hatResult = computeFaceItemTransform(landmarks, null, 'head', 640, 480);

    expect(faceResult).not.toBeNull();
    expect(hatResult).not.toBeNull();
    if (!faceResult || !hatResult) return;

    // Hat center must be higher (lower Y in screen coordinate) than sunglasses
    expect(hatResult.centerY).toBeLessThan(faceResult.centerY);
  });
});

// Validated yaw and pitch bounds for 3D face accessories
