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

export async function fetchProductsByCollection(slug: string, includeOutlet: boolean = false): Promise<any[]> {
  const params = includeOutlet ? '?includeOutlet=true' : '';
  const response = await fetch(`/api/products/collection/${slug}${params}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function fetchCollections(): Promise<any[]> {
  const response = await fetch('/api/collections');
  if (!response.ok) throw new Error('Failed to fetch collections');
  return response.json();
}

export async function fetchCharmProducts(): Promise<any[]> {
  const response = await fetch('/api/products/charms');
  if (!response.ok) throw new Error('Failed to fetch charms');
  return response.json();
}
