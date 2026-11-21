import * as THREE from 'three';

export interface AmbientLightingEstimate {
  color: THREE.Color;
  brightness: number; // 0.0 to 2.0
  colorTemperature: 'warm' | 'cool' | 'neutral';
}

export class LightingEstimator {
  private sampleCanvas: HTMLCanvasElement | null = null;
  private sampleCtx: CanvasRenderingContext2D | null = null;
  private lastSampleTime = 0;
  private cachedEstimate: AmbientLightingEstimate = {
    color: new THREE.Color(1, 1, 1),
    brightness: 1.0,
    colorTemperature: 'neutral',
  };

  constructor() {
    if (typeof document !== 'undefined') {
      this.sampleCanvas = document.createElement('canvas');
      this.sampleCanvas.width = 32;
      this.sampleCanvas.height = 32;
      this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  public estimateFromVideo(video: HTMLVideoElement, timestamp: number): AmbientLightingEstimate {
    // Sample every 250ms to conserve GPU/CPU cycles
    if (timestamp - this.lastSampleTime < 250) {
      return this.cachedEstimate;
    }
    this.lastSampleTime = timestamp;

    if (!this.sampleCtx || !video || video.readyState < 2) {
      return this.cachedEstimate;
    }

    try {
      this.sampleCtx.drawImage(video, 0, 0, 32, 32);
      const imgData = this.sampleCtx.getImageData(0, 0, 32, 32);
      const data = imgData.data;

      let totalR = 0;
      let totalG = 0;
      let totalB = 0;
      const count = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
      }

      const avgR = totalR / count / 255.0;
      const avgG = totalG / count / 255.0;
      const avgB = totalB / count / 255.0;

      // Perceived luminance
      const luminance = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
      const brightness = Math.max(0.65, Math.min(1.4, luminance * 1.5 + 0.2));

      // Color temperature calculation
      let colorTemperature: 'warm' | 'cool' | 'neutral' = 'neutral';
      if (avgR > avgB * 1.15) {
        colorTemperature = 'warm';
      } else if (avgB > avgR * 1.15) {
        colorTemperature = 'cool';
      }

      // Smooth color tone
      const color = new THREE.Color(
        0.85 + avgR * 0.25,
        0.85 + avgG * 0.25,
        0.85 + avgB * 0.25
      );

      this.cachedEstimate = {
        color,
        brightness,
        colorTemperature,
      };
    } catch {
      // fallback
    }

    return this.cachedEstimate;
  }
}
