import { GarmentCategory } from '../../shared/types';
import { GARMENT_CATEGORIES } from '../../shared/constants';

interface ClassificationResult {
  category: GarmentCategory;
  confidence: number;
  allScores: Record<string, number>;
}

// Category keywords and semantic tokens with weighted affinities
const CATEGORY_KEYWORDS: Record<GarmentCategory, { primary: string[]; secondary: string[]; negative?: string[] }> = {
  't-shirt': {
    primary: ['tshirt', 't-shirt', 'tee', 'crew neck', 'round neck', 'polo tee', 'graphic tee'],
    secondary: ['half sleeve', 'printed tee', 'cotton tee', 'pique polo'],
    negative: ['formal shirt', 'oxford shirt', 'button down', 'jacket', 'dress', 'hoodie']
  },
  'shirt': {
    primary: ['shirt', 'formal shirt', 'casual shirt', 'oxford shirt', 'button down', 'spread collar'],
    secondary: ['full sleeve', 'slim fit', 'woven'],
    negative: ['tshirt', 't-shirt', 'tee', 'kurta', 'dress']
  },
  'kurta': {
    primary: ['kurta', 'kurti', 'sherwani', 'tunic', 'ethnic kurta'],
    secondary: ['chikankari', 'nehru', 'bandhgala', 'mandarin collar', 'festive'],
  },
  'top': {
    primary: ['crop top', 'peplum', 'blouse', 'cami', 'halter top', 'tank top', 'top'],
    secondary: ['sleeveless', 'ruffled', 'floral top'],
    negative: ['laptop', 'table', 'low-top', 'high-top']
  },
  'dress': {
    primary: ['dress', 'maxi dress', 'midi dress', 'mini dress', 'gown', 'bodycon', 'frock', 'sheath'],
    secondary: ['a-line', 'fit and flare', 'cocktail', 'evening'],
    negative: ['dressing', 'address']
  },
  'hoodie/sweatshirt': {
    primary: ['hoodie', 'sweatshirt', 'pullover', 'hooded sweatshirt', 'fleece'],
    secondary: ['kangaroo pocket', 'drawstring', 'winter'],
  },
  'jacket/coat/blazer': {
    primary: ['jacket', 'coat', 'blazer', 'bomber', 'denim jacket', 'leather jacket', 'puffer', 'trench', 'windbreaker'],
    secondary: ['suit', 'overcoat', 'outerwear'],
    negative: ['packet', 'bracket']
  },
  'jeans/trousers/pants': {
    primary: ['jeans', 'trousers', 'pants', 'chino', 'denim jeans', 'cargo pants', 'joggers', 'khakis'],
    secondary: ['slim fit', 'straight fit', 'mid rise', 'ankle length', 'stretch'],
    negative: ['jacket', 'shirt', 'belt']
  },
  'shorts': {
    primary: ['shorts', 'bermuda', 'board shorts', 'cycling shorts', 'denim shorts'],
    secondary: ['athletic shorts', 'running shorts'],
    negative: ['tshirt', 't-shirt', 'shirt', 'tee']
  },
  'skirt': {
    primary: ['skirt', 'mini skirt', 'pleated skirt', 'pencil skirt', 'denim skirt', 'midi skirt'],
    secondary: ['flared', 'slit', 'wrap'],
  },
  'saree/ethnic wear': {
    primary: ['saree', 'sari', 'lehenga', 'anarkali', 'dupatta', 'choli'],
    secondary: ['kanjivaram', 'banarasi', 'silk saree', 'georgette', 'traditional'],
  },
  'shoes/sneakers/heels/sandals': {
    primary: ['shoes', 'sneakers', 'heels', 'sandals', 'loafers', 'boots', 'slippers', 'footwear', 'flats', 'mules', 'running shoes', 'clogs'],
    secondary: ['lace up', 'sole', 'leather shoes', 'cushioned'],
  },
  'sunglasses/eyeglasses': {
    primary: ['sunglasses', 'eyeglasses', 'shades', 'spectacles', 'aviator', 'wayfarer', 'eyewear', 'goggles'],
    secondary: ['uv protected', 'polarized', 'lens', 'frames'],
  },
  'cap/hat/beanie': {
    primary: ['cap', 'hat', 'beanie', 'baseball cap', 'fedora', 'bucket hat', 'snapback', 'beret'],
    secondary: ['visor', 'headwear'],
  },
  'face mask': {
    primary: ['face mask', 'supermask', 'n95', 'reusable mask', 'cotton mask', 'mask'],
    secondary: ['protective mask', 'breathable'],
  },
  'watch': {
    primary: ['watch', 'wristwatch', 'analog watch', 'digital watch', 'chronograph', 'smartwatch'],
    secondary: ['dial', 'quartz', 'stainless steel'],
  },
  'bracelet/bangle': {
    primary: ['bracelet', 'bangle', 'cuff', 'wristband', 'kada'],
    secondary: ['charm', 'beaded', 'silver bangle', 'gold bangle'],
  },
  'necklace/chain/pendant': {
    primary: ['necklace', 'chain', 'pendant', 'choker', 'locket'],
    secondary: ['gold plated', 'pearl', 'crystal'],
  },
  'earrings': {
    primary: ['earrings', 'jhumkas', 'studs', 'hoops', 'drops', 'danglers', 'ear rings'],
    secondary: ['clip on'],
  },
  'ring': {
    primary: ['finger ring', 'band ring', 'solitaire ring', 'ring'],
    secondary: ['diamond ring', 'platinum ring', 'gold ring'],
    negative: ['earring', 'keyring', 'spring']
  },
  'scarf/stole': {
    primary: ['scarf', 'stole', 'muffler', 'shawl'],
    secondary: ['woolen', 'silk scarf', 'fringed'],
  },
  'belt': {
    primary: ['belt', 'waist belt', 'leather belt', 'denim belt'],
    secondary: ['buckle', 'reversible'],
  },
  'bag/backpack': {
    primary: ['bag', 'backpack', 'handbag', 'tote', 'sling bag', 'clutch', 'duffle'],
    secondary: ['shoulder bag', 'crossbody'],
  },
  'tie/bow tie': {
    primary: ['tie', 'necktie', 'bow tie', 'cravat'],
    secondary: ['silk tie', 'micro print'],
  },
  'gloves': {
    primary: ['gloves', 'mittens', 'winter gloves'],
    secondary: ['leather gloves', 'knitted'],
  },
  'socks': {
    primary: ['socks', 'ankle socks', 'crew socks', 'loafer socks'],
    secondary: ['cotton socks', 'cushioned'],
  },
};

export function classifyGarment(textHints: string): ClassificationResult {
  // Normalize t-shirt variants
  let normalized = textHints.toLowerCase();
  normalized = normalized.replace(/\bt[\s-]+shirt\b/g, ' tshirt ');
  normalized = normalized.replace(/\bt[\s-]+shirts\b/g, ' tshirt ');

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
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(normalized)) {
        score += 2;
      }
    }

    // Check negative keywords (penalty = -15)
    if (config.negative) {
      for (const neg of config.negative) {
        const regex = new RegExp(`\\b${neg}\\b`, 'i');
        if (regex.test(normalized)) {
          score -= 15;
        }
      }
    }

    scores[category] = Math.max(0, score);
  }

  // Find top scoring category
  let topCategory: GarmentCategory = 't-shirt';
  let highestScore = -1;
  let totalScore = 0;

  for (const [cat, sc] of Object.entries(scores)) {
    totalScore += sc;
    if (sc > highestScore) {
      highestScore = sc;
      topCategory = cat as GarmentCategory;
    }
  }

  const confidence = totalScore > 0 ? Math.min(0.99, 0.65 + (highestScore / totalScore) * 0.34) : 0.70;

  return {
    category: topCategory,
    confidence: Math.round(confidence * 100) / 100,
    allScores: scores,
  };
}
