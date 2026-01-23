export async function fetchProducts(): Promise<any[]> {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function fetchProductById(id: string): Promise<any | null> {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) return null;
  return response.json();
}

export async function fetchProductsByCollection(slug: string): Promise<any[]> {
  const response = await fetch(`/api/products/collection/${slug}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function fetchCollections(): Promise<any[]> {
  const response = await fetch('/api/collections');
  if (!response.ok) throw new Error('Failed to fetch collections');
  return response.json();
}
