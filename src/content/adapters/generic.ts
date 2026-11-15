import { SiteAdapter, ProductMetadata } from './types';

export const GenericAdapter: SiteAdapter = {
  name: 'Generic',
  matches: () => true,

  extractFromElement: (element: HTMLElement): ProductMetadata | null => {
    // 1. Check for standard <img> or picture elements
    let imageUrl = '';
    const img = (element.tagName === 'IMG' ? element : element.querySelector('img')) as HTMLImageElement | null;

    if (img) {
      if (img.srcset) {
        const parts = img.srcset.split(',').map((p) => p.trim().split(' '));
        const last = parts[parts.length - 1];
        if (last && last[0]) imageUrl = last[0];
      }
      if (!imageUrl) {
        imageUrl = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-highres') || '';
      }
    }

    // 2. Check for background-image
    if (!imageUrl) {
      const bg = window.getComputedStyle(element).backgroundImage;
      const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
      if (match && match[1]) {
        imageUrl = match[1];
      }
    }

    // 3. Fallback to OpenGraph image or Schema.org JSON-LD if on a product page
    if (!imageUrl) {
      const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
      if (ogImg) imageUrl = ogImg;
    }

    if (!imageUrl) return null;

    // Extract title
    const title =
      img?.alt ||
      element.getAttribute('aria-label') ||
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      document.title ||
      'Fashion Item';

    return {
      imageUrl,
      title,
      categoryHint: `${document.title} ${title}`.toLowerCase(),
      sourceUrl: window.location.href,
    };
  },
};
