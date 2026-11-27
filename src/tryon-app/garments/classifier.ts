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
    negative: ['laptop', 'table', 'low-top', 'high-top', 'low top', 'high top', 'sneakers', 'sneaker', 'shoes', 'shoe', 'footwear', 'shorts', 'jeans']
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
  if (!url || url.startsWith('data:')) return '';
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
  normalized = normalized.replace(/\bt[\s\-_]+shirt\b/g, ' tshirt ');
  normalized = normalized.replace(/\bt[\s\-_]+shirts\b/g, ' tshirt ');
  normalized = normalized.replace(/\bsun[\s\-_]+glasses\b/g, ' sunglasses ');
  normalized = normalized.replace(/\bsun[\s\-_]+glass\b/g, ' sunglass ');
  normalized = normalized.replace(/\beye[\s\-_]+glasses\b/g, ' eyeglasses ');
  normalized = normalized.replace(/\beye[\s\-_]+glass\b/g, ' eyeglass ');
  normalized = normalized.replace(/\beye[\s\-_]+wear\b/g, ' eyewear ');
  // Replace underscores and special chars with spaces so regex \b matches words separated by underscores or dashes
  normalized = normalized.replace(/[_/\-+.,:;&%#?()]/g, ' ');
  normalized = ` ${normalized.replace(/\s+/g, ' ').trim()} `;

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

export interface ObjectBoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  aspectRatio: number;
  foregroundPixelCount: number;
  totalPixelCount: number;
  fillRatio: number;
}

/**
 * Extracts foreground object bounding box by eliminating solid white/light/transparent background borders.
 * Resolves the issue where a square (1:1) product photo has wide sunglasses or tall pants inside.
 */
export function extractObjectBoundingBox(canvas: HTMLCanvasElement): ObjectBoundingBox {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx || w === 0 || h === 0) {
    return {
      minX: 0,
      maxX: w,
      minY: 0,
      maxY: h,
      width: w,
      height: h,
      aspectRatio: w / Math.max(1, h),
      foregroundPixelCount: 0,
      totalPixelCount: w * h,
      fillRatio: 1,
    };
  }

  // Work on downscaled canvas for microsecond execution speed
  let srcCanvas = canvas;
  let scale = 1;
  const maxDim = 200;
  if (w > maxDim || h > maxDim) {
    scale = maxDim / Math.max(w, h);
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = Math.max(1, Math.round(w * scale));
    smallCanvas.height = Math.max(1, Math.round(h * scale));
    const sCtx = smallCanvas.getContext('2d');
    if (sCtx) {
      sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
      srcCanvas = smallCanvas;
    }
  }

  const sw = srcCanvas.width;
  const sh = srcCanvas.height;
  const sCtx = srcCanvas.getContext('2d');
  if (!sCtx) {
    return {
      minX: 0,
      maxX: w,
      minY: 0,
      maxY: h,
      width: w,
      height: h,
      aspectRatio: w / Math.max(1, h),
      foregroundPixelCount: 0,
      totalPixelCount: w * h,
      fillRatio: 1,
    };
  }

  const imgData = sCtx.getImageData(0, 0, sw, sh);
  const data = imgData.data;

  // Sample perimeter border corners to identify background color
  const sampleIndices = [
    0, // top-left
    Math.max(0, (sw - 1) * 4), // top-right
    Math.max(0, ((sh - 1) * sw) * 4), // bottom-left
    Math.max(0, ((sh - 1) * sw + (sw - 1)) * 4), // bottom-right
    Math.max(0, Math.floor(sw / 2) * 4), // top-center
    Math.max(0, ((sh - 1) * sw + Math.floor(sw / 2)) * 4), // bottom-center
  ];

  let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
  let validBorderSamples = 0;

  for (const idx of sampleIndices) {
    if (idx + 3 < data.length) {
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
      sumA += data[idx + 3];
      validBorderSamples++;
    }
  }

  const bgR = validBorderSamples > 0 ? Math.round(sumR / validBorderSamples) : 255;
  const bgG = validBorderSamples > 0 ? Math.round(sumG / validBorderSamples) : 255;
  const bgB = validBorderSamples > 0 ? Math.round(sumB / validBorderSamples) : 255;
  const bgA = validBorderSamples > 0 ? Math.round(sumA / validBorderSamples) : 255;

  const isBgTransparent = bgA < 45;

  let minX = sw, maxX = 0, minY = sh, maxY = 0;
  let fgPixels = 0;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = (y * sw + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      let isFg = false;
      if (isBgTransparent) {
        isFg = a > 35;
      } else {
        const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        isFg = a > 40 && diff > 24;
      }

      if (isFg) {
        fgPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If entire image was deemed background or solid color
  if (fgPixels < 15 || minX > maxX || minY > maxY) {
    return {
      minX: 0,
      maxX: w,
      minY: 0,
      maxY: h,
      width: w,
      height: h,
      aspectRatio: w / Math.max(1, h),
      foregroundPixelCount: fgPixels,
      totalPixelCount: w * h,
      fillRatio: 1,
    };
  }

  // Map back to full-res coordinates
  const fullMinX = Math.floor(minX / scale);
  const fullMaxX = Math.min(w, Math.ceil(maxX / scale));
  const fullMinY = Math.floor(minY / scale);
  const fullMaxY = Math.min(h, Math.ceil(maxY / scale));

  const fgW = Math.max(1, fullMaxX - fullMinX + 1);
  const fgH = Math.max(1, fullMaxY - fullMinY + 1);
  const objAspectRatio = fgW / fgH;

  return {
    minX: fullMinX,
    maxX: fullMaxX,
    minY: fullMinY,
    maxY: fullMaxY,
    width: fgW,
    height: fgH,
    aspectRatio: Math.round(objAspectRatio * 100) / 100,
    foregroundPixelCount: fgPixels,
    totalPixelCount: sw * sh,
    fillRatio: fgPixels / (sw * sh),
  };
}

/**
 * Analyzes silhouette profile to detect dual lenses (eyewear), shoe sole, leg split (pants)
 */
export function analyzeForegroundGeometry(
  canvas: HTMLCanvasElement,
  bbox: ObjectBoundingBox
): {
  isEyewearDualLens: boolean;
  isPantsLegSplit: boolean;
  isFootwearSole: boolean;
} {
  const ctx = canvas.getContext('2d');
  if (!ctx || bbox.width < 10 || bbox.height < 10) {
    return { isEyewearDualLens: false, isPantsLegSplit: false, isFootwearSole: false };
  }

  const { minX, minY, width, height } = bbox;
  const gridW = 40;
  const gridH = 40;

  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = gridW;
  smallCanvas.height = gridH;
  const sCtx = smallCanvas.getContext('2d');
  if (!sCtx) return { isEyewearDualLens: false, isPantsLegSplit: false, isFootwearSole: false };

  sCtx.drawImage(canvas, minX, minY, width, height, 0, 0, gridW, gridH);
  const imgData = sCtx.getImageData(0, 0, gridW, gridH);
  const data = imgData.data;

  // Compute column density and row density
  const colDensity = new Float32Array(gridW);
  const rowDensity = new Float32Array(gridH);

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const idx = (y * gridW + x) * 4;
      const alpha = data[idx + 3];
      const diff = 765 - (data[idx] + data[idx + 1] + data[idx + 2]);
      if (alpha > 40 && diff > 30) {
        colDensity[x]++;
        rowDensity[y]++;
      }
    }
  }

  // 1. Dual-Lens Eyewear Check:
  // Left lens (cols 6 to 16), Center bridge (cols 17 to 23), Right lens (cols 24 to 34)
  let leftLensDensity = 0;
  let centerBridgeDensity = 0;
  let rightLensDensity = 0;

  for (let x = 6; x <= 16; x++) leftLensDensity += colDensity[x];
  for (let x = 17; x <= 23; x++) centerBridgeDensity += colDensity[x];
  for (let x = 24; x <= 34; x++) rightLensDensity += colDensity[x];

  leftLensDensity /= 11;
  centerBridgeDensity /= 7;
  rightLensDensity /= 11;

  // Eyewear has a distinct bridge dip in the center (center density is <= 70% of lens density)
  // and aspect ratio is wide (>= 1.40)
  const isEyewearDualLens =
    bbox.aspectRatio >= 1.40 &&
    leftLensDensity > 5 &&
    rightLensDensity > 5 &&
    centerBridgeDensity <= Math.max(leftLensDensity, rightLensDensity) * 0.72;

  // 2. Pants Leg-Split Check:
  let legSplitDetected = false;
  if (bbox.aspectRatio <= 0.75) {
    let splitRows = 0;
    for (let y = 22; y <= 36; y++) {
      let centerColEmpty = true;
      for (let x = 17; x <= 23; x++) {
        const idx = (y * gridW + x) * 4;
        const diff = 765 - (data[idx] + data[idx + 1] + data[idx + 2]);
        if (data[idx + 3] > 40 && diff > 30) {
          centerColEmpty = false;
          break;
        }
      }
      if (centerColEmpty) splitRows++;
    }
    legSplitDetected = splitRows >= 5;
  }

  // 3. Footwear Sole Check:
  let footwearSole = false;
  if (bbox.aspectRatio >= 1.15 && bbox.aspectRatio <= 2.20) {
    let bottomDensity = 0;
    for (let y = 32; y < gridH; y++) bottomDensity += rowDensity[y];
    bottomDensity /= (gridH - 32);
    footwearSole = bottomDensity > gridW * 0.55;
  }

  return {
    isEyewearDualLens,
    isPantsLegSplit: legSplitDetected,
    isFootwearSole: footwearSole,
  };
}

/**
 * Geometric aspect ratio & silhouette heuristic classifier
 * Zero-shot computer vision fallback when text metadata is missing or ambiguous
 */
export function classifyFromImageAspect(aspectRatio: number, textHints = ''): ClassificationResult | null {
  if (!aspectRatio || isNaN(aspectRatio) || aspectRatio <= 0) return null;

  // Eyewear has a distinct wide aspect ratio: width is significantly larger than height (1.45 to 4.0)
  if (aspectRatio >= 1.45) {
    return {
      category: 'sunglasses/eyeglasses',
      confidence: 0.95,
      allScores: { 'sunglasses/eyeglasses': 30 },
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

  // Slightly wide items (1.20 - 1.54): Shoes / Footwear or Cap / Hat
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
 * Complete Zero-Shot Visual & Geometric Classifier
 * Works on any raw or cropped input image, base64 dataUrl, or canvas
 */
export function classifyImageVisually(
  canvas: HTMLCanvasElement,
  textHints?: string,
  url?: string
): ClassificationResult {
  // 1. Check text & URL tokens first
  const urlTokens = url ? extractTokensFromUrl(url) : '';
  const combinedText = `${textHints || ''} ${urlTokens}`.trim();

  if (combinedText.length > 0) {
    const textResult = classifyGarment(combinedText);
    const topScore = textResult.allScores[textResult.category] || 0;
    // If text has strong confident primary keyword, trust text
    if (topScore >= 10) {
      return { ...textResult, source: 'multimodal' };
    }
  }

  // 2. Extract trimmed foreground object bounding box (eliminates canvas border padding)
  const bbox = extractObjectBoundingBox(canvas);
  const geo = analyzeForegroundGeometry(canvas, bbox);

  // 3. Dual-lens eyewear detection (highest precision for sunglasses/eyeglasses)
  if (geo.isEyewearDualLens || bbox.aspectRatio >= 1.45) {
    return {
      category: 'sunglasses/eyeglasses',
      confidence: geo.isEyewearDualLens ? 0.98 : 0.92,
      allScores: { 'sunglasses/eyeglasses': 35 },
      source: 'aspect_ratio',
    };
  }

  // 4. Pants leg-split detection
  if (geo.isPantsLegSplit || bbox.aspectRatio <= 0.60) {
    return {
      category: 'jeans/trousers/pants',
      confidence: geo.isPantsLegSplit ? 0.95 : 0.88,
      allScores: { 'jeans/trousers/pants': 30 },
      source: 'aspect_ratio',
    };
  }

  // 5. Footwear sole detection
  if (geo.isFootwearSole || (bbox.aspectRatio >= 1.25 && bbox.aspectRatio <= 1.85 && /shoe|foot|sneaker|heel/i.test(combinedText))) {
    return {
      category: 'shoes/sneakers/heels/sandals',
      confidence: geo.isFootwearSole ? 0.92 : 0.85,
      allScores: { 'shoes/sneakers/heels/sandals': 28 },
      source: 'aspect_ratio',
    };
  }

  // 6. Secondary text check
  if (combinedText.length > 0) {
    const textResult = classifyGarment(combinedText);
    if ((textResult.allScores[textResult.category] || 0) > 0) {
      return textResult;
    }
  }

  // 7. General aspect ratio fallbacks
  const aspectResult = classifyFromImageAspect(bbox.aspectRatio, combinedText);
  if (aspectResult) {
    return aspectResult;
  }

  // Default fallback
  return {
    category: 't-shirt',
    confidence: 0.50,
    allScores: { 't-shirt': 1 },
    source: 'multimodal',
  };
}

/**
 * Multi-Modal Classifier combining text hints, URL tokens, visual aspect ratio, and optional canvas
 */
export function classifyMultiModal(params: {
  textHints?: string;
  url?: string;
  aspectRatio?: number;
  canvas?: HTMLCanvasElement;
}): ClassificationResult {
  if (params.canvas) {
    return classifyImageVisually(params.canvas, params.textHints, params.url);
  }

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
