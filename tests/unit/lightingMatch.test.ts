import { describe, it, expect } from 'vitest';
import { LightingEstimator } from '../../src/tryon-app/render/lightingMatch';

describe('Lighting Match Estimator Tests', () => {
  it('should initialize with neutral ambient lighting estimate', () => {
    const estimator = new LightingEstimator();
    const estimate = estimator.estimateFromVideo({} as any, 100);
    expect(estimate.color).toBeDefined();
    expect(estimate.brightness).toBe(1.0);
    expect(estimate.colorTemperature).toBe('neutral');
  });

  it('should compute valid brightness range', () => {
    const estimator = new LightingEstimator();
    const estimate = estimator.estimateFromVideo({} as any, 500);
    expect(estimate.brightness).toBeGreaterThanOrEqual(0.65);
    expect(estimate.brightness).toBeLessThanOrEqual(1.4);
  });
});
