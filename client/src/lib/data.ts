import bestSellerImg from '@assets/generated_images/stylish_best_seller_sliders.png';
import newSeasonImg from '@assets/generated_images/new_season_summer_sliders.png';
import outletImg from '@assets/generated_images/outlet_sale_sliders.png';
import donnaImg from '@assets/WhatsApp_Image_2026-01-12_at_11.22.53_1768217528955.jpeg';
import uomoImg from '@assets/image_1768217545082.png';
import bambinoImg from '@assets/WhatsApp_Image_2026-01-12_at_12.12.15_1768383712607.jpeg';

import inbluGold from '@assets/image_1768384856832.png';
import inbluSilver from '@assets/image_1768384862836.png';
import inbluWhite from '@assets/image_1768384873309.png';
import inbluBlue from '@assets/image_1768384895088.png';
import inbluDarkBlue from '@assets/image_1768384902607.png';

export type Category = 'donna' | 'uomo' | 'bambino';

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  originalPrice?: number;
  isOutlet: boolean;
  isBestSeller: boolean;
  isNewSeason: boolean;
  image: string;
  gallery?: string[];
  sizes: string[];
  colors?: string[];
  sku?: string;
  brand: string;
  description: string;
}

export const CATEGORY_IMAGES = {
  bestSeller: bestSellerImg,
  newSeason: newSeasonImg,
  outlet: outletImg,
  donna: donnaImg,
  uomo: uomoImg,
  bambino: bambinoImg,
};

const SIZES_ADULT = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const SIZES_KIDS = ['28', '29', '30', '31', '32', '33', '34', '35'];

// Specific product requested
const inbluProduct: Product = {
  id: '5033AG39-1',
  name: 'inblu Pantofole Classische Clogs, Sandali a Ciabatta Donna Art. 5033',
  category: 'donna',
  price: 14.59,
  isOutlet: false,
  isBestSeller: true,
  isNewSeason: false,
  image: inbluGold,
  gallery: [inbluGold, inbluSilver, inbluWhite, inbluBlue, inbluDarkBlue],
  sizes: ['35 EU', '36 EU', '37 EU', '38 EU', '39 EU', '40 EU', '41 EU'],
  colors: ['Argento', 'Azalea', 'Bianco', 'Blu', 'Blu Scuro', 'Jeans', 'Platino', 'Rosa'],
  sku: '5033AG39-1',
  brand: 'Inblu',
  description: `Dettagli prodotto / Informazioni su questo articolo

Materiale esterno: Sintetico
Materiale suola: Poliuretano
Chiusura: Senza chiusura
Tipo di tacco: Senza tacco

Informazioni aggiuntive:
Le inblu 5033 sono una versione moderna e colorata degli zoccoli professionali classici, ideali per uso professionale e casalingo.
Plantare anatomico in vera pelle imbottita che garantisce comfort duraturo.
Leggere, flessibili e traspiranti.`,
};

// Generate 24 demo products
const generateProducts = (): Product[] => {
  const products: Product[] = [inbluProduct]; // Start with the specific one
  const categories: Category[] = ['donna', 'uomo', 'bambino'];
  const adjectives = ['Comfort', 'Urban', 'Classic', 'Sport', 'Luxury', 'Beach', 'Soft', 'Light'];
  const types = ['Slider', 'Flip-Flop', 'Sandal', 'Mule'];

  for (let i = 1; i <= 24; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const isOutlet = Math.random() > 0.7;
    const isBestSeller = Math.random() > 0.8;
    const isNewSeason = !isOutlet && Math.random() > 0.6;
    
    let basePrice = Math.floor(Math.random() * 30) + 15; // 15-45
    let price = basePrice;
    let originalPrice = undefined;

    if (isOutlet) {
      originalPrice = basePrice;
      price = Math.floor(basePrice * 0.7);
    }

    let image = category === 'donna' ? donnaImg : category === 'uomo' ? uomoImg : bambinoImg;
    // Mix in the hero images for variety
    if (isBestSeller) image = bestSellerImg;
    else if (isNewSeason) image = newSeasonImg;
    else if (isOutlet) image = outletImg;

    products.push({
      id: `p-${i}`,
      name: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${types[Math.floor(Math.random() * types.length)]} ${i}`,
      category,
      price,
      originalPrice,
      isOutlet,
      isBestSeller,
      isNewSeason,
      image,
      sizes: category === 'bambino' ? SIZES_KIDS : SIZES_ADULT,
      brand: 'VIPIESSE',
      description: 'Comode, resistenti e alla moda. Ideali per ogni occasione.',
    });
  }
  return products;
};

export const products = generateProducts();

export const SHIPPING_THRESHOLD = 50;
export const SHIPPING_COST = 5;
