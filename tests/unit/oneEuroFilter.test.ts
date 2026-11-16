import { describe, it, expect } from 'vitest';
import { OneEuroFilter, LandmarkSmoother2D } from '../../src/tryon-app/vision/oneEuroFilter';

describe('One-Euro Filter Tests', () => {
  it('should initialize and return identity on first point', () => {
    const filter = new OneEuroFilter(1.0, 0.007, 1.0);
    const result = filter.filter(100, 1000);
    expect(result).toBe(100);
  });

  it('should smoothly filter jittery values', () => {
    const filter = new OneEuroFilter(1.0, 0.007, 1.0);
    filter.filter(100, 1000);
    // Simulating small jitter around 100
    const val1 = filter.filter(102, 1033);
    const val2 = filter.filter(98, 1066);
    const val3 = filter.filter(101, 1100);

    // Jitter must be smoothed (less extreme than raw noise)
    expect(val1).toBeLessThan(102);
    expect(val1).toBeGreaterThan(100);
    expect(val2).toBeGreaterThan(98);
    expect(val3).toBeCloseTo(100, 0);
  });

  it('LandmarkSmoother2D should smooth 2D coordinates across IDs', () => {
    const smoother = new LandmarkSmoother2D();
    const [x1, y1] = smoother.smooth(11, 200, 150, 1000);
    expect(x1).toBe(200);
    expect(y1).toBe(150);

    const [x2, y2] = smoother.smooth(11, 204, 153, 1033);
    expect(x2).toBeLessThan(204);
    expect(y2).toBeLessThan(153);
  });
});
