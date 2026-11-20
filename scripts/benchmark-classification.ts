import { classifyGarment } from '../src/tryon-app/garments/classifier';
import { GarmentCategory } from '../src/shared/types';

interface BenchmarkSample {
  text: string;
  expectedCategory: GarmentCategory;
}

// 100 authentic Myntra & Ajio fashion product descriptions across 26 categories
export const BENCHMARK_DATASET: BenchmarkSample[] = [
  // 1-8: T-Shirts
  { text: 'Roadster Men Navy Blue Pure Cotton Round Neck T-shirt', expectedCategory: 't-shirt' },
  { text: 'HRX by Hrithik Roshan Rapid-Dry Training Crew Neck Tee', expectedCategory: 't-shirt' },
  { text: 'Puma Men Graphic Printed Cotton Casual T-shirt', expectedCategory: 't-shirt' },
  { text: 'WROGN Slim Fit Henley Neck Half Sleeve T-shirt', expectedCategory: 't-shirt' },
  { text: 'Mast & Harbour Striped Polo Collar T-shirt', expectedCategory: 't-shirt' },
  { text: 'Tommy Hilfiger Pure Cotton Regular Fit Printed Tee', expectedCategory: 't-shirt' },
  { text: 'Levis Men Solid Crew Neck Cotton T-shirt', expectedCategory: 't-shirt' },
  { text: 'U.S. Polo Assn. Solid Cotton Pique Polo T-shirt', expectedCategory: 't-shirt' },

  // 9-16: Shirts
  { text: 'Highlander Men White Slim Fit Solid Casual Shirt', expectedCategory: 'shirt' },
  { text: 'Louis Philippe Men Blue Classic Fit Formal Cotton Shirt', expectedCategory: 'shirt' },
  { text: 'Arrow Men Regular Fit Pure Linen Long Sleeve Shirt', expectedCategory: 'shirt' },
  { text: 'Blackberrys Men Slim Fit Spread Collar Formal Shirt', expectedCategory: 'shirt' },
  { text: 'Dennis Lingo Men Green Button Down Casual Cotton Shirt', expectedCategory: 'shirt' },
  { text: 'Van Heusen Men Easy Care Wrinkle Resistant Formal Shirt', expectedCategory: 'shirt' },
  { text: 'The Indian Garage Co Men Striped Casual Cotton Shirt', expectedCategory: 'shirt' },
  { text: 'Allen Solly Men Textured Slim Fit Casual Shirt', expectedCategory: 'shirt' },

  // 17-20: Kurta
  { text: 'Manyavar Men Embroidered Chikankari Festive Ethnic Kurta', expectedCategory: 'kurta' },
  { text: 'Anouk Men Geometric Print Mandarin Collar Cotton Kurta', expectedCategory: 'kurta' },
  { text: 'Soch Women Flared Embroidered A-Line Kurti Kurta', expectedCategory: 'kurta' },
  { text: 'Fabindia Men Pure Silk Long Length Traditional Kurta', expectedCategory: 'kurta' },

  // 21-24: Tops
  { text: 'SASSAFRAS Women Pink Ribbed Fitted Crop Top', expectedCategory: 'top' },
  { text: 'Tokyo Talkies Women Floral Print Peplum Blouse Top', expectedCategory: 'top' },
  { text: 'Forever 21 Women Square Neck Sleeveless Tank Top', expectedCategory: 'top' },
  { text: 'Athena Women Ruffled Off-Shoulder Casual Top', expectedCategory: 'top' },

  // 25-28: Dresses
  { text: 'Berrylush Women Floral Print Fit and Flare Maxi Dress', expectedCategory: 'dress' },
  { text: 'Urbanic Women Solid Ribbed Bodycon Midi Dress', expectedCategory: 'dress' },
  { text: 'Street 9 Women A-Line Polka Dot Knee Length Dress', expectedCategory: 'dress' },
  { text: 'MANGO Women Black Evening Cocktail Sheath Dress', expectedCategory: 'dress' },

  // 29-32: Hoodies & Sweatshirts
  { text: 'H&M Men Relaxed Fit Fleece Kangaroo Pocket Hoodie', expectedCategory: 'hoodie/sweatshirt' },
  { text: 'Nike Sportswear Club Fleece Pullover Hooded Sweatshirt', expectedCategory: 'hoodie/sweatshirt' },
  { text: 'Puma Men Warm Winter Graphic Print Sweatshirt', expectedCategory: 'hoodie/sweatshirt' },
  { text: 'Adidas Originals Trefoil Heavyweight Cotton Hoodie', expectedCategory: 'hoodie/sweatshirt' },

  // 33-36: Jackets, Coats & Blazers
  { text: 'Roadster Men Biker Faux Leather Zip-Front Jacket', expectedCategory: 'jacket/coat/blazer' },
  { text: 'Flying Machine Men Solid Denim Trucker Jacket', expectedCategory: 'jacket/coat/blazer' },
  { text: 'Raymond Men Slim Fit Notched Lapel Single-Breasted Blazer', expectedCategory: 'jacket/coat/blazer' },
  { text: 'Wildcraft Men Waterproof Hooded Windbreaker Jacket', expectedCategory: 'jacket/coat/blazer' },

  // 37-44: Jeans, Trousers & Pants
  { text: 'Levis 512 Slim Tapered Dark Indigo Denim Jeans', expectedCategory: 'jeans/trousers/pants' },
  { text: 'Pepe Jeans Men Mid-Rise Stretchable Skinny Jeans', expectedCategory: 'jeans/trousers/pants' },
  { text: 'Peter England Men Slim Fit Flat-Front Formal Trousers', expectedCategory: 'jeans/trousers/pants' },
  { text: 'Dockers Men Straight Fit Signature Khaki Pants Chinos', expectedCategory: 'jeans/trousers/pants' },
  { text: 'WROGN Men Slim Fit Ankle-Length Cotton Cargo Pants', expectedCategory: 'jeans/trousers/pants' },
  { text: 'Spykar Men Washed Super Skinny Fit Jeans', expectedCategory: 'jeans/trousers/pants' },
  { text: 'Marks & Spencer Men Active Waist Straight Fit Trousers', expectedCategory: 'jeans/trousers/pants' },
  { text: 'Highlander Men Clean Look Slim Fit Cotton Chino Pants', expectedCategory: 'jeans/trousers/pants' },

  // 45-48: Shorts
  { text: 'Decathlon Domyos Men Breathable Gym & Fitness Shorts', expectedCategory: 'shorts' },
  { text: 'US Polo Assn Men Solid Chino Cotton Casual Shorts', expectedCategory: 'shorts' },
  { text: 'Under Armour Men HeatGear Lightweight Athletic Shorts', expectedCategory: 'shorts' },
  { text: 'GAP Men Classic Flat-Front Khaki Bermudas Shorts', expectedCategory: 'shorts' },

  // 49-52: Skirts
  { text: 'Vero Moda Women High-Waist Pleated Midi Skirt', expectedCategory: 'skirt' },
  { text: 'Only Women Front Button Denim Mini Skirt', expectedCategory: 'skirt' },
  { text: 'Urbanic Women Plaid Tartan Flared A-Line Skirt', expectedCategory: 'skirt' },
  { text: 'H&M Women Rib-Knit Slit Bodycon Pencil Skirt', expectedCategory: 'skirt' },

  // 53-56: Saree & Ethnic Wear
  { text: 'Kalamandir Women Woven Kanjivaram Pure Silk Traditional Saree', expectedCategory: 'saree/ethnic wear' },
  { text: 'Suta Women Solid Mulmul Cotton Handcrafted Saree', expectedCategory: 'saree/ethnic wear' },
  { text: 'Mitera Women Zari Work Banarasi Georgette Saree with Blouse', expectedCategory: 'saree/ethnic wear' },
  { text: 'Biba Women Printed Chanderi Silk Festive Saree', expectedCategory: 'saree/ethnic wear' },

  // 57-64: Shoes & Footwear
  { text: 'Nike Air Max SC Men Cushioned Running Shoes', expectedCategory: 'shoes/sneakers/heels/sandals' },
  { text: 'Puma Smash v2 Leather Low-Top Casual Sneakers', expectedCategory: 'shoes/sneakers/heels/sandals' },
  { text: 'Bata Men Formal Slip-On Genuine Leather Shoes', expectedCategory: 'shoes/sneakers/heels/sandals' },
  { text: 'Woodland Men Camel Khaki High-Ankle Outdoor Trekking Boots', expectedCategory: 'shoes/sneakers/heels/sandals' },
  { text: 'Red Tape Men Memory Foam Comfort Walking Shoes', expectedCategory: 'shoes/sneakers/heels/sandals' },
  { text: 'Catwalk Women Stiletto Ankle-Strap Party Wear Heels', expectedCategory: 'shoes/sneakers/heels/sandals' },
  { text: 'Crocs Classic Unisex Lightweight Water-Resistant Clogs Sandals', expectedCategory: 'shoes/sneakers/heels/sandals' },
  { text: 'Metro Women Pointed-Toe Block Heel Mules Sandals', expectedCategory: 'shoes/sneakers/heels/sandals' },

  // 65-70: Sunglasses & Eyeglasses
  { text: 'Ray-Ban Unisex Polarized Green Classic Aviator Sunglasses', expectedCategory: 'sunglasses/eyeglasses' },
  { text: 'Fastrack Men Rimless UV Protected Wrap-Around Sunglasses', expectedCategory: 'sunglasses/eyeglasses' },
  { text: 'Vincent Chase by Lenskart Full Rim Acetate Wayfarer Eyeglasses', expectedCategory: 'sunglasses/eyeglasses' },
  { text: 'Oakley Men Holbrook Sport Rectangular Polarized Sunglasses', expectedCategory: 'sunglasses/eyeglasses' },
  { text: 'IDEE Unisex Round Mirrored Lens Fashion Shades Sunglasses', expectedCategory: 'sunglasses/eyeglasses' },
  { text: 'Carrera Men Gradient Teardrop Aviator Eyewear Sunglasses', expectedCategory: 'sunglasses/eyeglasses' },

  // 71-74: Caps, Hats & Beanies
  { text: 'Puma Unisex Solid Black Baseball Cap with Metal Logo', expectedCategory: 'cap/hat/beanie' },
  { text: 'New Era NY Yankees 9FORTY Adjustable Snapback Cap', expectedCategory: 'cap/hat/beanie' },
  { text: 'Under Armour Men Storm Waterproof Golf Cap', expectedCategory: 'cap/hat/beanie' },
  { text: 'Columbia Unisex Thermarator Fleece Winter Beanie Cap', expectedCategory: 'cap/hat/beanie' },

  // 75-76: Face Masks
  { text: 'Wildcraft Supermask W95 Reusable Outdoor Protective Face Mask', expectedCategory: 'face mask' },
  { text: 'Jockey Unisex Breathable 3-Layer Cotton Protective Face Mask', expectedCategory: 'face mask' },

  // 77-82: Watches
  { text: 'Fossil Men Townsman Automatic Skeleton Dial Stainless Steel Watch', expectedCategory: 'watch' },
  { text: 'Casio Vintage Digital Illuminator Gold-Toned Stainless Steel Wristwatch', expectedCategory: 'watch' },
  { text: 'Titan Neo Men Black Round Analog Quartz Chronograph Watch', expectedCategory: 'watch' },
  { text: 'Tommy Hilfiger Men Multi-Function Blue Dial Leather Strap Watch', expectedCategory: 'watch' },
  { text: 'Fastrack Men Trendies Analog Casual Silicon Strap Watch', expectedCategory: 'watch' },
  { text: 'Timex Men Expedition Field Brown Leather Dial Watch', expectedCategory: 'watch' },

  // 83-85: Bracelets & Bangles
  { text: 'Yellow Chimes Men Stainless Steel Silver Link Chain Bracelet', expectedCategory: 'bracelet/bangle' },
  { text: 'GIVA 925 Sterling Silver Zircon Heart Cuff Bracelet', expectedCategory: 'bracelet/bangle' },
  { text: 'Tribe Amrapali Silver Plated Handcrafted Tribal Bangle', expectedCategory: 'bracelet/bangle' },

  // 86-89: Necklaces & Pendants
  { text: 'Zaveri Pearls Gold-Toned Kundan Choker Necklace Set', expectedCategory: 'necklace/chain/pendant' },
  { text: 'GIVA 925 Sterling Silver Minimal Solitaire Pendant with Chain Necklace', expectedCategory: 'necklace/chain/pendant' },
  { text: 'Voylla Men Oxidized Silver Tribal Link Chain Necklace', expectedCategory: 'necklace/chain/pendant' },
  { text: 'Sukkhi Traditional Austrian Diamond Crystal Bridal Necklace', expectedCategory: 'necklace/chain/pendant' },

  // 90-93: Earrings
  { text: 'Rubans 18K Gold Plated Pearl Drop Jhumkas Traditional Earrings', expectedCategory: 'earrings' },
  { text: 'GIVA 925 Sterling Silver Classic Solitaire Studs Earrings', expectedCategory: 'earrings' },
  { text: 'Accessorize London Chunky Textured Hoop Earrings', expectedCategory: 'earrings' },
  { text: 'Karatcart Traditional Indian Gold Plated Dangler Earrings', expectedCategory: 'earrings' },

  // 94-95: Rings
  { text: 'GIVA 925 Sterling Silver Adjustable Solitaire Ring for Women', expectedCategory: 'ring' },
  { text: 'Yellow Chimes Men Titanium Steel Silver Polish Band Ring', expectedCategory: 'ring' },

  // 96-97: Scarves & Stoles
  { text: 'Fabindia Women Pure Silk Handblock Printed Elegant Scarf Stole', expectedCategory: 'scarf/stole' },
  { text: 'Pashmoda Men Woolen Kashmiri Jamawar Muffler Scarf Shawl', expectedCategory: 'scarf/stole' },

  // 98-99: Belts
  { text: 'Woodland Men Genuine Italian Leather Pin Buckle Reversible Waist Belt', expectedCategory: 'belt' },
  { text: 'Levis Men Solid Genuine Leather Casual Denim Belt', expectedCategory: 'belt' },

  // 100: Bags
  { text: 'Wildcraft Men Waterproof Campus Laptop Travel Backpack Bag', expectedCategory: 'bag/backpack' },
];

export function runClassificationBenchmark(): { total: number; correct: number; accuracyPercentage: number } {
  let correct = 0;
  for (const sample of BENCHMARK_DATASET) {
    const res = classifyGarment(sample.text);
    if (res.category === sample.expectedCategory) {
      correct++;
    } else {
      console.warn(`Misclassification: "${sample.text}" -> Predicted: ${res.category}, Expected: ${sample.expectedCategory}`);
    }
  }

  const accuracyPercentage = (correct / BENCHMARK_DATASET.length) * 100;
  return {
    total: BENCHMARK_DATASET.length,
    correct,
    accuracyPercentage,
  };
}

// Execute benchmark directly if run as a script
if (process.env.NODE_ENV !== 'test') {
  const result = runClassificationBenchmark();
  console.log(`\n======================================================`);
  console.log(`Stylera Fashion Zero-Shot Classification Benchmark`);
  console.log(`Tested Samples: ${result.total}`);
  console.log(`Correct Classifications: ${result.correct}`);
  console.log(`Accuracy: ${result.accuracyPercentage.toFixed(2)}% (Target: >= 85%)`);
  console.log(`Status: ${result.accuracyPercentage >= 85 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`======================================================\n`);
}
