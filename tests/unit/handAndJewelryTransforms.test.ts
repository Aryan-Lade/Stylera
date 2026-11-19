import { describe, it, expect } from 'vitest';
import {
  computeWristTransform,
  computeNecklaceTransform,
  computeEarringsTransform,
} from '../../src/tryon-app/vision/handAndJewelryTransforms';

describe('Hand & Jewelry Transform Tests', () => {
  it('should return null when landmarks are missing', () => {
    expect(computeWristTransform([], 640, 480)).toBeNull();
    expect(computeNecklaceTransform([], null, 640, 480)).toBeNull();
    expect(computeEarringsTransform([], 640, 480)).toBeNull();
  });

  it('should compute wrist coordinates aligned with forearm vector', () => {
    const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));
    landmarks[13] = { x: 0.3, y: 0.5, z: 0, visibility: 0.9 }; // Left elbow
    landmarks[15] = { x: 0.2, y: 0.6, z: 0, visibility: 0.9 }; // Left wrist

    const result = computeWristTransform(landmarks, 640, 480);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.x).toBeCloseTo(128, 1);
    expect(result.y).toBeCloseTo(288, 1);
    expect(result.scale).toBeGreaterThan(0);
    expect(result.visible).toBe(true);
  });

  it('should compute necklace draped between chin and collarbone', () => {
    const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));
    landmarks[11] = { x: 0.4, y: 0.35, z: 0, visibility: 0.9 }; // Left shoulder
    landmarks[12] = { x: 0.6, y: 0.35, z: 0, visibility: 0.9 }; // Right shoulder

    const result = computeNecklaceTransform(landmarks, null, 640, 480);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.centerX).toBeCloseTo(320, 1);
    expect(result.centerY).toBeGreaterThan(0);
    expect(result.width).toBeGreaterThan(0);
  });

  it('should compute earrings paired on earlobes', () => {
    const faceLandmarks = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    faceLandmarks[234] = { x: 0.3, y: 0.45, z: 0 };
    faceLandmarks[454] = { x: 0.7, y: 0.45, z: 0 };

    const result = computeEarringsTransform(faceLandmarks, 640, 480);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.leftEar.x).toBeCloseTo(192, 1);
    expect(result.rightEar.x).toBeCloseTo(448, 1);
    expect(result.leftEar.y).toBeGreaterThan(0.45 * 480);
  });
});
