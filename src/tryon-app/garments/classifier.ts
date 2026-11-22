import { GarmentCategory } from '../../shared/types';
import { GARMENT_CATEGORIES } from '../../shared/constants';

export interface ClassificationResult {
  category: GarmentCategory;
  confidence: number;
  allScores: Record<string, number>;
  source?: 'text' | 'url' | 'aspect_ratio' | 'multimodal';
}

// Category keywords and semantic tokens with weighted affinities
export const CATEGORY_KEYWORDS: Record<GarmentCategory, { primary: string[]; secondary: string[]; negative?: string[] }> = {
  't-shirt': {
    primary: ['tshirt', 't-shirt', 'tee', 'tees', 'crew neck', 'round neck', 'polo tee', 'graphic tee', 'v neck tee'],
    secondary: ['half sleeve', 'printed tee', 'cotton tee', 'pique polo', 'oversized tee', 'drop shoulder', 'solid tee'],
    negative: ['formal shirt', 'oxford shirt', 'button down', 'jacket', 'dress', 'hoodie', 'shorts', 'sunglasses', 'glasses']
  },
  'shirt': {
    primary: ['shirt', 'shirts', 'formal shirt', 'casual shirt', 'oxford shirt', 'button down', 'spread collar', 'mandarin shirt'],
    secondary: ['full sleeve', 'slim fit', 'woven', 'linen shirt', 'cuban collar', 'cotton shirt'],
    negative: ['tshirt', 't-shirt', 'tee', 'kurta', 'dress', 'shorts', 'sunglasses']
  },
  'kurta': {
    primary: ['kurta', 'kurtas', 'kurti', 'kurtis', 'sherwani', 'tunic', 'ethnic kurta'],
    secondary: ['chikankari', 'nehru', 'bandhgala', 'mandarin collar', 'festive', 'traditional'],
  },
  'top': {
    primary: ['crop top', 'peplum', 'blouse', 'blouses', 'cami', 'halter top', 'tank top', 'top', 'tops'],
    secondary: ['sleeveless', 'ruffled', 'floral top', 'corset'],
    negative: ['laptop', 'table', 'low-top', 'high-top', 'shorts', 'jeans']
  },
  'dress': {
    primary: ['dress', 'dresses', 'maxi dress', 'midi dress', 'mini dress', 'gown', 'gowns', 'bodycon', 'frock', 'frocks', 'sheath'],
    secondary: ['a-line', 'fit and flare', 'cocktail', 'evening', 'slip dress'],
    negative: ['dressing', 'address']
  },
  'hoodie/sweatshirt': {
    primary: ['hoodie', 'hoodies', 'sweatshirt', 'sweatshirts', 'pullover', 'pullovers', 'hooded sweatshirt', 'fleece'],
    secondary: ['kangaroo pocket', 'drawstring', 'winter', 'warm'],
  },
  'jacket/coat/blazer': {
    primary: ['jacket', 'jackets', 'coat', 'coats', 'blazer', 'blazers', 'bomber', 'denim jacket', 'leather jacket', 'puffer', 'trench', 'windbreaker', 'overcoat', 'waistcoat'],
    secondary: ['suit', 'outerwear', 'parka', 'quilted'],
    negative: ['packet', 'bracket']
  },
  'jeans/trousers/pants': {
    primary: ['jeans', 'jean', 'trousers', 'trouser', 'pants', 'pant', 'denim jeans', 'cargo pants', 'joggers', 'jogger', 'khakis', 'khaki'],
    secondary: ['slim fit', 'straight fit', 'mid rise', 'ankle length', 'stretch', 'chino', 'chinos'],
    negative: ['shorts', 'short', 'jacket', 'shirt', 'belt', 'sunglasses', 'shoes', 'shoe', 'boots', 'boot', 'sneakers']
  },
  'shorts': {
    primary: ['shorts', 'short', 'bermuda', 'board shorts', 'cycling shorts', 'denim shorts', 'chino shorts', 'bermudas'],
    secondary: ['athletic shorts', 'running shorts', 'gym shorts'],
    negative: ['tshirt', 't-shirt', 'shirt', 'tee', 'trousers', 'pants']
  },
  'skirt': {
    primary: ['skirt', 'skirts', 'mini skirt', 'pleated skirt', 'pencil skirt', 'denim skirt', 'midi skirt'],
    secondary: ['flared', 'slit', 'wrap', 'a-line'],
  },
  'saree/ethnic wear': {
    primary: ['saree', 'sarees', 'sari', 'saris', 'lehenga', 'lehengas', 'anarkali', 'dupatta', 'choli'],
    secondary: ['kanjivaram', 'banarasi', 'silk saree', 'georgette', 'traditional'],
  },
  'shoes/sneakers/heels/sandals': {
    primary: ['shoes', 'shoe', 'sneakers', 'sneaker', 'heels', 'heel', 'sandals', 'sandal', 'loafers', 'loafer', 'boots', 'boot', 'slippers', 'slipper', 'footwear', 'flats', 'flat', 'mules', 'mule', 'running shoes', 'clogs', 'clog', 'trainers', 'trainer'],
    secondary: ['lace up', 'sole', 'leather shoes', 'cushioned', 'air max', 'jordans', 'slip-on'],
  },
  'sunglasses/eyeglasses': {
    primary: [
      'sunglasses',
      'sunglass',
      'eyeglasses',
      'eyeglass',
      'shades',
      'shade',
      'spectacles',
      'spectacle',
      'aviator',
      'aviators',
      'wayfarer',
      'wayfarers',
      'eyewear',
      'goggles',
      'goggle',
      'frames',
      'frame',
      'lenskart',
      'eyekart',
      'clubmaster',
      'cat-eye',
      'cateye',
      'polarised',
      'polarized',
    ],
    secondary: [
      'uv protected',
      'lens',
      'lenses',
      'anti-reflective',
      'tinted',
      'reading glasses',
      'vision glasses',
      'sun glass',
      'sun glasses',
      'sun-glasses',
      'sun-glass',
      'round frame',
      'square frame',
      'oval frame',
      'voyage',
      'ray-ban',
      'rayban',
      'oakley',
      'fastrack',
    ],
    negative: ['shirt', 'pant', 'shoe', 'dress', 'waterproof jacket'],
  },
  'cap/hat/beanie': {
    primary: ['cap', 'caps', 'hat', 'hats', 'beanie', 'beanies', 'baseball cap', 'fedora', 'fedoras', 'bucket hat', 'snapback', 'beret'],
    secondary: ['visor', 'headwear', 'sun hat'],
  },
  'face mask': {
    primary: ['face mask', 'facemask', 'supermask', 'n95', 'reusable mask', 'cotton mask', 'mask', 'masks'],
    secondary: ['protective mask', 'breathable'],
  },
  'watch': {
    primary: ['watch', 'watches', 'wristwatch', 'wristwatches', 'analog watch', 'digital watch', 'chronograph', 'smartwatch', 'smartwatches', 'timepiece', 'dial watch'],
    secondary: ['dial', 'quartz', 'stainless steel', 'leather strap'],
    negative: ['stopwatch', 'watching']
  },
  'bracelet/bangle': {
    primary: ['bracelet', 'bracelets', 'bangle', 'bangles', 'cuff', 'cuffs', 'wristband', 'wristbands', 'kada'],
    secondary: ['charm', 'beaded', 'silver bangle', 'gold bangle'],
  },
  'necklace/chain/pendant': {
    primary: ['necklace', 'necklaces', 'chain', 'chains', 'pendant', 'pendants', 'choker', 'chokers', 'locket', 'lockets', 'mangalsutra'],
    secondary: ['gold plated', 'pearl', 'crystal', 'silver chain'],
  },
  'earrings': {
    primary: ['earrings', 'earring', 'jhumkas', 'jhumka', 'studs', 'stud', 'hoops', 'hoop', 'drops', 'danglers', 'dangler', 'ear rings', 'ear ring'],
    secondary: ['clip on'],
  },
  'ring': {
    primary: ['finger ring', 'band ring', 'solitaire ring', 'diamond ring', 'gold ring', 'ring', 'rings'],
    secondary: ['platinum ring', 'gemstone ring', 'cocktail ring'],
    negative: ['earring', 'earrings', 'keyring', 'spring', 'string']
  },
  'scarf/stole': {
    primary: ['scarf', 'scarves', 'stole', 'stoles', 'muffler', 'mufflers', 'shawl', 'shawls'],
    secondary: ['woolen', 'silk scarf', 'fringed', 'cashmere'],
  },
  'belt': {
    primary: ['belt', 'belts', 'waist belt', 'leather belt', 'denim belt'],
    secondary: ['buckle', 'reversible', 'pin buckle'],
  },
  'bag/backpack': {
    primary: ['bag', 'bags', 'backpack', 'backpacks', 'handbag', 'handbags', 'tote', 'tote bag', 'sling bag', 'clutch', 'duffle', 'wallet', 'wallets', 'purse'],
    secondary: ['shoulder bag', 'crossbody', 'satchel', 'messenger bag'],
  },
  'tie/bow tie': {
    primary: ['tie', 'ties', 'necktie', 'neckties', 'bow tie', 'bow ties', 'cravat'],
    secondary: ['silk tie', 'micro print'],
  },
  'gloves': {
    primary: ['gloves', 'glove', 'mittens', 'mitten', 'winter gloves'],
    secondary: ['leather gloves', 'knitted'],
  },
  'socks': {
    primary: ['socks', 'sock', 'ankle socks', 'crew socks', 'loafer socks'],
    secondary: ['cotton socks', 'cushioned'],
  },
};

/**
 * Extracts meaningful tokens from URL path, query params, and filename
 * e.g. "https://assets.myntassets.com/.../assets/images/1234/Voyage-Men-Square-Sunglasses-1.jpg"
 * -> "Voyage Men Square Sunglasses"
 */
export function extractTokensFromUrl(url: string): string {
  if (!url) return '';
  try {
    const decoded = decodeURIComponent(url);
    // Remove query parameters or hash for primary pathname inspection, but extract query values
    const [pathPart, queryPart] = decoded.split(/[?#]/);

    // Replace typical URL delimiters with spaces
    let tokens = `${pathPart} ${queryPart || ''}`
      .replace(/https?:\/\/[^/]+/g, ' ') // remove protocol & domain
      .replace(/[\/\-_+.,;:=&%?]/g, ' ')
      .replace(/\.(jpg|jpeg|png|webp|avif|gif|svg)/gi, ' ')
      // Strip common non-product URL noise words
      .replace(/\b(assets|images|image|img|media|sys_master|root|uploads?|v\d+|cdn|dpr|limit|fl_progressive|width|height|auto|format|crop|fit|q_\d+|w_\d+|h_\d+|c_limit)\b/gi, ' ')
      // Strip pure numbers or long hex strings
      .replace(/\b[0-9a-f]{16,}\b/gi, ' ')
      .replace(/\b\d+\b/g, ' ')
      .trim();

    return tokens;
  } catch {
    return '';
  }
}

/**
 * Classifies garment based on text hints (title, brand, category breadcrumbs, etc.)
 */
export function classifyGarment(textHints: string): ClassificationResult {
  // Normalize text hints
  let normalized = ` ${textHints.toLowerCase()} `;
  normalized = normalized.replace(/\bt[\s-]+shirt\b/g, ' tshirt ');
  normalized = normalized.replace(/\bt[\s-]+shirts\b/g, ' tshirt ');
  normalized = normalized.replace(/\bsun[\s-]+glasses\b/g, ' sunglasses ');
  normalized = normalized.replace(/\bsun[\s-]+glass\b/g, ' sunglass ');
  normalized = normalized.replace(/\beye[\s-]+glasses\b/g, ' eyeglasses ');
  normalized = normalized.replace(/\beye[\s-]+glass\b/g, ' eyeglass ');
  normalized = normalized.replace(/\beye[\s-]+wear\b/g, ' eyewear ');

  const scores: Record<string, number> = {};

  for (const category of GARMENT_CATEGORIES as GarmentCategory[]) {
    const config = CATEGORY_KEYWORDS[category];
    if (!config) continue;

    let score = 0;

    // Check primary keywords (weight = 10)
    for (const kw of config.primary) {
      const regex = new RegExp(`\\b${kw.replace('/', '\\/')}\\b`, 'i');
      if (regex.test(normalized)) {
        score += 10;
      }
    }

    // Check secondary keywords (weight = 2)
    for (const kw of config.secondary) {
      const regex = new RegExp(`\\b${kw.replace('/', '\\/')}\\b`, 'i');
      if (regex.test(normalized)) {
        score += 2;
      }
    }

    // Check negative keywords (penalty = -15)
    if (config.negative) {
      for (const neg of config.negative) {
        const regex = new RegExp(`\\b${neg.replace('/', '\\/')}\\b`, 'i');
        if (regex.test(normalized)) {
          score -= 15;
        }
      }
    }

    scores[category] = Math.max(0, score);
  }

  // Find top scoring category
  let topCategory: GarmentCategory = 't-shirt';
  let highestScore = 0;
  let totalScore = 0;

  for (const [cat, sc] of Object.entries(scores)) {
    totalScore += sc;
    if (sc > highestScore) {
      highestScore = sc;
      topCategory = cat as GarmentCategory;
    }
  }

  const confidence = totalScore > 0 ? Math.min(0.99, 0.70 + (highestScore / totalScore) * 0.29) : 0.50;

  return {
    category: topCategory,
    confidence: Math.round(confidence * 100) / 100,
    allScores: scores,
    source: 'text',
  };
}

/**
 * Geometric aspect ratio & silhouette heuristic classifier
 * Zero-shot computer vision fallback when text metadata is missing or ambiguous
 */
export function classifyFromImageAspect(aspectRatio: number, textHints = ''): ClassificationResult | null {
  if (!aspectRatio || isNaN(aspectRatio) || aspectRatio <= 0) return null;

  // Eyewear has a distinct wide aspect ratio: width is significantly larger than height (1.55 to 3.5)
  // Fashion items like shirts (0.8 - 1.1) or jeans (0.4 - 0.7) are never this wide in product photos
  if (aspectRatio >= 1.55) {
    return {
      category: 'sunglasses/eyeglasses',
      confidence: 0.95,
      allScores: { 'sunglasses/eyeglasses': 25 },
      source: 'aspect_ratio',
    };
  }

  // Very tall items: height is significantly larger than width (width/height <= 0.65)
  // e.g. jeans, trousers, full-length dresses
  if (aspectRatio <= 0.65) {
    const isDress = /dress|gown|maxi|saree/i.test(textHints);
    const category: GarmentCategory = isDress ? 'dress' : 'jeans/trousers/pants';
    return {
      category,
      confidence: 0.88,
      allScores: { [category]: 20 },
      source: 'aspect_ratio',
    };
  }

  // Moderate vertical items (0.45 - 0.75): Watch or Pants
  if (aspectRatio >= 0.45 && aspectRatio <= 0.75 && /watch|dial|strap|wrist/i.test(textHints)) {
    return {
      category: 'watch',
      confidence: 0.90,
      allScores: { watch: 22 },
      source: 'aspect_ratio',
    };
  }

  // Slightly wide items (1.20 - 1.52): Shoes / Footwear or Cap / Hat
  if (aspectRatio >= 1.20 && aspectRatio <= 1.54) {
    if (/cap|hat|beanie|headwear/i.test(textHints)) {
      return {
        category: 'cap/hat/beanie',
        confidence: 0.88,
        allScores: { 'cap/hat/beanie': 18 },
        source: 'aspect_ratio',
      };
    }
    return {
      category: 'shoes/sneakers/heels/sandals',
      confidence: 0.82,
      allScores: { 'shoes/sneakers/heels/sandals': 18 },
      source: 'aspect_ratio',
    };
  }

  return null;
}

/**
 * Multi-Modal Classifier combining text hints, URL tokens, and visual aspect ratio
 */
export function classifyMultiModal(params: {
  textHints?: string;
  url?: string;
  aspectRatio?: number;
}): ClassificationResult {
  const urlTokens = params.url ? extractTokensFromUrl(params.url) : '';
  const combinedText = `${params.textHints || ''} ${urlTokens}`.trim();

  // 1. If text or URL tokens yield a confident match (score > 0), use text classification
  if (combinedText.length > 0) {
    const textResult = classifyGarment(combinedText);
    const topScore = textResult.allScores[textResult.category] || 0;
    if (topScore >= 10) {
      return { ...textResult, source: 'multimodal' };
    }
  }

  // 2. Fall back to image geometric aspect ratio heuristic
  if (params.aspectRatio && params.aspectRatio > 0) {
    const visualResult = classifyFromImageAspect(params.aspectRatio, combinedText);
    if (visualResult) {
      return visualResult;
    }
  }

  // 3. Fallback to general text classification or default
  if (combinedText.length > 0) {
    const textResult = classifyGarment(combinedText);
    if ((textResult.allScores[textResult.category] || 0) > 0) {
      return textResult;
    }
  }

  // Default fallback
  return {
    category: 't-shirt',
    confidence: 0.50,
    allScores: { 't-shirt': 1 },
    source: 'multimodal',
  };
}
