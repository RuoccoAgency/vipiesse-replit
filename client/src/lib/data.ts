import bestSellerImg from '@assets/generated_images/stylish_best_seller_sliders.png';
import newSeasonImg from '@assets/generated_images/new_season_summer_sliders.png';
import outletImg from '@assets/generated_images/outlet_sale_sliders.png';
import donnaImg from '@assets/WhatsApp_Image_2026-01-12_at_11.22.53_1768217528955.jpeg';
import uomoImg from '@assets/image_1768217545082.png';
import bambinoImg from '@assets/generated_images/kids_colorful_sliders.png';

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
  sizes: string[];
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

// Generate 24 demo products
const generateProducts = (): Product[] => {
  const products: Product[] = [];
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
