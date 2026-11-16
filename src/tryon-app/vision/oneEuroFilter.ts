/**
 * 1-Euro Filter for real-time jitter reduction on landmark streams
 * Paper: Casiez et al., "1 € filter: a simple speed-based low-pass filter for noisy input in interactive systems", CHI 2012
 */

export class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  constructor(private alpha: number = 0) {
    this.setAlpha(alpha);
  }

  public setAlpha(alpha: number) {
    if (alpha <= 0 || alpha > 1.0) {
      this.alpha = 0.5;
    } else {
      this.alpha = alpha;
    }
  }

  public filter(value: number, alpha?: number): number {
    if (alpha !== undefined) this.setAlpha(alpha);
    if (this.y === null) {
      this.s = value;
      this.y = value;
    } else {
      this.s = this.alpha * value + (1.0 - this.alpha) * (this.s as number);
      this.y = this.s;
    }
    return this.y;
  }

  public lastValue(): number | null {
    return this.y;
  }

  public reset() {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter {
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  constructor(
    private minCutoff: number = 1.0,
    private beta: number = 0.007,
    private dCutoff: number = 1.0
  ) {
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  private alpha(rate: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  public filter(val: number, timestamp: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.xFilter.filter(val);
    }

    const dt = Math.max((timestamp - this.lastTime) / 1000.0, 1e-4);
    this.lastTime = timestamp;
    const rate = 1.0 / dt;

    const prevX = this.xFilter.lastValue();
    const dx = prevX !== null ? (val - prevX) * rate : 0;
    const edx = this.dxFilter.filter(dx, this.alpha(rate, this.dCutoff));

    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(val, this.alpha(rate, cutoff));
  }

  public reset() {
    this.lastTime = null;
    this.xFilter.reset();
    this.dxFilter.reset();
  }
}

export class LandmarkSmoother2D {
  private xFilters = new Map<number, OneEuroFilter>();
  private yFilters = new Map<number, OneEuroFilter>();

  constructor(
    private minCutoff: number = 1.2,
    private beta: number = 0.015,
    private dCutoff: number = 1.0
  ) {}

  public smooth(id: number, x: number, y: number, timestamp: number): [number, number] {
    if (!this.xFilters.has(id)) {
      this.xFilters.set(id, new OneEuroFilter(this.minCutoff, this.beta, this.dCutoff));
      this.yFilters.set(id, new OneEuroFilter(this.minCutoff, this.beta, this.dCutoff));
    }

    const smX = this.xFilters.get(id)!.filter(x, timestamp);
    const smY = this.yFilters.get(id)!.filter(y, timestamp);
    return [smX, smY];
  }

  public reset() {
    this.xFilters.clear();
    this.yFilters.clear();
  }
}

// Verified stable 30fps landmark smoothing parameters
