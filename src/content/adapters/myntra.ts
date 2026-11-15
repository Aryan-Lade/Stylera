import { SiteAdapter, ProductMetadata } from './types';

export const MyntraAdapter: SiteAdapter = {
  name: 'Myntra',
  matches: (hostname: string) => hostname.includes('myntra.com'),

  extractFromElement: (element: HTMLElement): ProductMetadata | null => {
    // Traverse up to find product card container if element is an img or child
    const productCard = element.closest('.product-base, .product-sliderContainer, .pdp-image-container') as HTMLElement | null;
    const searchRoot = productCard || element;

    // 1. Get highest-resolution image
    let imageUrl = '';
    const imgElement = searchRoot.querySelector('img') || (element.tagName === 'IMG' ? (element as HTMLImageElement) : null);

    if (imgElement) {
      if (imgElement.srcset) {
        const sources = imgElement.srcset.split(',').map((s) => s.trim().split(' '));
        const highestRes = sources[sources.length - 1];
        if (highestRes && highestRes[0]) {
          imageUrl = highestRes[0];
        }
      }
      if (!imageUrl) {
        imageUrl = imgElement.src || (imgElement.getAttribute('data-src') || '');
      }
    }

    // Fallback: check background-image
    if (!imageUrl) {
      const bg = window.getComputedStyle(element).backgroundImage;
      const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
      if (match && match[1]) {
        imageUrl = match[1];
      }
    }

    if (!imageUrl) return null;

    // Clean Myntra image url if it has downscaling params
    // e.g., assets.myntassets.com/.../image.jpg
    imageUrl = imageUrl.replace(/w_\d+,h_\d+,c_limit,q_\d+/, 'w_1080,q_90');

    // 2. Extract title & brand
    const brand = searchRoot.querySelector('.product-brand, .pdp-title')?.textContent?.trim() || '';
    const title = searchRoot.querySelector('.product-product, .pdp-name')?.textContent?.trim() || '';

    // 3. Extract price
    const price = searchRoot.querySelector('.product-discountedPrice, .pdp-price')?.textContent?.trim() || '';

    // 4. Extract category hint from breadcrumbs or title
    const breadcrumb = document.querySelector('.breadcrumbs-container, .breadcrumb')?.textContent?.trim() || '';
    const categoryHint = `${breadcrumb} ${title} ${brand}`.toLowerCase();

    return {
      imageUrl,
      brand,
      title: title || brand || 'Myntra Garment',
      price,
      categoryHint,
      sourceUrl: window.location.href,
    };
  },

  getHoverButtonContainer: (element: HTMLElement): HTMLElement | null => {
    return (element.closest('.product-base, .pdp-image-container') as HTMLElement) || element;
  },
};
