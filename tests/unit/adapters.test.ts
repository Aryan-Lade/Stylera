import { describe, it, expect } from 'vitest';
import { MyntraAdapter } from '../../src/content/adapters/myntra';
import { GenericAdapter } from '../../src/content/adapters/generic';

describe('Site Adapters Tests', () => {
  it('should match Myntra hostname', () => {
    expect(MyntraAdapter.matches('www.myntra.com')).toBe(true);
    expect(MyntraAdapter.matches('myntra.com')).toBe(true);
    expect(MyntraAdapter.matches('www.ajio.com')).toBe(false);
  });

  it('Generic adapter should match any domain', () => {
    expect(GenericAdapter.matches('www.zara.com')).toBe(true);
    expect(GenericAdapter.matches('www.amazon.in')).toBe(true);
  });

  it('should extract product info from mock elements in GenericAdapter', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/tshirt.jpg';
    img.alt = 'Cotton Crew Neck T-Shirt';

    const result = GenericAdapter.extractFromElement(img);
    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBe('https://example.com/tshirt.jpg');
    expect(result?.title).toBe('Cotton Crew Neck T-Shirt');
  });
});
