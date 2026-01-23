import type { Product } from "@shared/schema";

// Convert database product (prices in cents) to frontend format (prices in euros)
function convertProductToFrontend(dbProduct: any): any {
  return {
    ...dbProduct,
    price: dbProduct.priceCents / 100,
    originalPrice: dbProduct.originalPriceCents ? dbProduct.originalPriceCents / 100 : undefined,
    // Map imagesByColor if needed (currently not in DB schema)
    imagesByColor: undefined,
  };
}

export async function fetchProducts(): Promise<any[]> {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('Failed to fetch products');
  const products = await response.json();
  return products.map(convertProductToFrontend);
}

export async function fetchProductById(id: string): Promise<any | null> {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) return null;
  const product = await response.json();
  return convertProductToFrontend(product);
}

export async function fetchProductsByCategory(category: string): Promise<any[]> {
  const response = await fetch(`/api/products/category/${category}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  const products = await response.json();
  return products.map(convertProductToFrontend);
}

export async function fetchProductsByCollection(slug: string): Promise<any[]> {
  const response = await fetch(`/api/products/collection/${slug}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  const products = await response.json();
  return products.map(convertProductToFrontend);
}
