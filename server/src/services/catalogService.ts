export interface ExtractedProduct {
  title: string;
  brand: string;
  price?: string;
  currency?: string;
  category: 'sunglasses' | 'top' | 'pants' | 'dress' | 'shoes' | 'jewelry' | 'hat';
  primaryImage: string;
  galleryImages: string[];
  description?: string;
  color?: string;
  material?: string;
  recommendedPrompt: string;
}

export class CatalogService {
  /**
   * Scrape and extract product metadata from an e-commerce URL
   */
  public async extractFromUrl(productUrl: string): Promise<ExtractedProduct> {
    const url = new URL(productUrl);

    // If it's a Shopify store (many have .json endpoint or meta tags)
    if (this.isShopifyUrl(url)) {
      const shopifyData = await this.tryExtractShopifyJson(productUrl);
      if (shopifyData) return shopifyData;
    }

    // Default HTML fetch & microdata/OpenGraph parser
    return this.scrapeHtml(productUrl);
  }

  private isShopifyUrl(url: URL): boolean {
    return (
      url.hostname.includes('myshopify.com') ||
      url.pathname.includes('/products/')
    );
  }

  private async tryExtractShopifyJson(productUrl: string): Promise<ExtractedProduct | null> {
    try {
      const jsonUrl = productUrl.replace(/\/$/, '') + '.json';
      const res = await fetch(jsonUrl, { headers: { 'User-Agent': 'StyleraBot/1.0' } });
      if (!res.ok) return null;

      const data = (await res.json()) as any;
      const product = data.product;
      if (!product) return null;

      const title = product.title || 'Product';
      const brand = product.vendor || 'Designer';
      const category = this.guessCategory(title, product.product_type || '', productUrl);
      const images = (product.images || []).map((img: any) => img.src);
      const primaryImage = images[0] || '';
      const price = product.variants?.[0]?.price ? `$${product.variants[0].price}` : undefined;

      return {
        title,
        brand,
        price,
        currency: 'USD',
        category,
        primaryImage,
        galleryImages: images,
        description: product.body_html?.replace(/<[^>]+>/g, '').slice(0, 200),
        recommendedPrompt: `Substitute outfit with ${title} by ${brand}, preserving authentic textures and real-time folds.`,
      };
    } catch {
      return null;
    }
  }

  private async scrapeHtml(productUrl: string): Promise<ExtractedProduct> {
    try {
      const res = await fetch(productUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      const html = await res.text();

      // Extract OpenGraph / Twitter tags
      const ogTitle = this.extractMeta(html, 'og:title') || this.extractTag(html, 'title') || 'Product';
      const ogImage = this.extractMeta(html, 'og:image') || '';
      const ogBrand = this.extractMeta(html, 'og:site_name') || this.extractBrandFromHost(productUrl);
      const ogPrice = this.extractMeta(html, 'product:price:amount') || this.extractPriceFromText(html);

      const category = this.guessCategory(ogTitle, '', productUrl);

      return {
        title: this.cleanTitle(ogTitle),
        brand: ogBrand,
        price: ogPrice,
        category,
        primaryImage: ogImage,
        galleryImages: ogImage ? [ogImage] : [],
        recommendedPrompt: `Wear ${this.cleanTitle(ogTitle)} by ${ogBrand} with real-time physical cloth drape.`,
      };
    } catch {
      // Fallback if network blocked or CORS error
      const hostBrand = this.extractBrandFromHost(productUrl);
      const category = this.guessCategory(productUrl, '', productUrl);
      return {
        title: 'Fashion Item',
        brand: hostBrand,
        category,
        primaryImage: '',
        galleryImages: [],
        recommendedPrompt: `Real-time V-TON transformation for ${category} from ${hostBrand}.`,
      };
    }
  }

  private extractMeta(html: string, property: string): string | null {
    const match =
      html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
      html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
    return match ? match[1] : null;
  }

  private extractTag(html: string, tag: string): string | null {
    const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
    return match ? match[1].trim() : null;
  }

  private extractBrandFromHost(urlStr: string): string {
    try {
      const hostname = new URL(urlStr).hostname;
      const parts = hostname.replace('www.', '').split('.');
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      return 'E-Commerce Store';
    }
  }

  private extractPriceFromText(html: string): string | undefined {
    const priceMatch = html.match(/(?:₹|\$|€|£)\s?([0-9,]+(?:\.[0-9]{2})?)/);
    return priceMatch ? priceMatch[0] : undefined;
  }

  private cleanTitle(title: string): string {
    return title.split(/[|\-–]/)[0].trim();
  }

  public guessCategory(
    title: string,
    type: string,
    url: string
  ): 'sunglasses' | 'top' | 'pants' | 'dress' | 'shoes' | 'jewelry' | 'hat' {
    const combined = `${title} ${type} ${url}`.toLowerCase();

    if (/\b(sunglass|sunglasses|eyewear|glasses|shades|spectacles|aviator|wayfarer)\b/.test(combined)) {
      return 'sunglasses';
    }
    if (/\b(dress|gown|frock|maxi|midi)\b/.test(combined)) {
      return 'dress';
    }
    if (/\b(pants|jeans|trousers|shorts|joggers|leggings|skirt|bottom)\b/.test(combined)) {
      return 'pants';
    }
    if (/\b(shoe|shoes|sneaker|sneakers|boots|heels|sandals|footwear)\b/.test(combined)) {
      return 'shoes';
    }
    if (/\b(necklace|earring|earrings|ring|bracelet|jewelry|jewellery|pendant)\b/.test(combined)) {
      return 'jewelry';
    }
    if (/\b(hat|cap|beanie|fedora|beret)\b/.test(combined)) {
      return 'hat';
    }
    return 'top';
  }
}

export const catalogService = new CatalogService();
