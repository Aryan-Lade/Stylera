export interface ProductMetadata {
  title?: string;
  brand?: string;
  price?: string;
  categoryHint?: string;
  imageUrl: string;
  sourceUrl: string;
}

export interface SiteAdapter {
  name: string;
  matches: (hostname: string) => boolean;
  extractFromElement: (element: HTMLElement) => ProductMetadata | null;
  getHoverButtonContainer?: (element: HTMLElement) => HTMLElement | null;
}
