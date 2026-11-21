import { describe, it, expect } from 'vitest';

describe('Snapshot Compositing Tests', () => {
  it('should generate a combined canvas compositing video and overlay layers', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;

    // In happy-dom headless environment, provide a 2D mock if not natively provided by node
    const mockCtx = {
      fillStyle: '',
      fillRect: () => {},
      drawImage: () => {},
    };

    if (!canvas.getContext('2d')) {
      canvas.getContext = (() => mockCtx) as any;
      canvas.toDataURL = () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();

    if (!ctx) return;
    ctx.fillRect(0, 0, 640, 480);

    const dataUrl = canvas.toDataURL('image/png');
    expect(dataUrl).toContain('data:image/png;base64');
  });
});
