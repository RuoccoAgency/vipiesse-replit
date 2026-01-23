import { 
  products, 
  collections, 
  productCollections,
  sessions,
  type Product, 
  type InsertProduct,
  type Collection,
  type InsertCollection,
  type ProductCollection,
  type InsertProductCollection,
  type Session
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc } from "drizzle-orm";

export interface IStorage {
  // Products
  getAllProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProductsByCollection(collectionSlug: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  // Collections
  getAllCollections(): Promise<Collection[]>;
  getCollectionBySlug(slug: string): Promise<Collection | undefined>;
  getCollectionById(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<void>;
  
  // Product-Collection relationships
  assignProductToCollection(productId: string, collectionId: number, position?: number): Promise<void>;
  removeProductFromCollection(productId: string, collectionId: number): Promise<void>;
  getCollectionsByProduct(productId: string): Promise<Collection[]>;
  clearProductCollections(productId: string): Promise<void>;
  
  // Sessions
  createSession(email: string, expiresAt: Date): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product || undefined;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.category, category), eq(products.active, true)))
      .orderBy(desc(products.createdAt));
  }

  async getProductsByCollection(collectionSlug: string): Promise<Product[]> {
    const collection = await this.getCollectionBySlug(collectionSlug);
    if (!collection) return [];
    
    const productIds = await db.select({ productId: productCollections.productId })
      .from(productCollections)
      .where(eq(productCollections.collectionId, collection.id));
    
    if (productIds.length === 0) return [];
    
    return await db.select().from(products)
      .where(and(
        inArray(products.id, productIds.map(p => p.productId)),
        eq(products.active, true)
      ));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Collections
  async getAllCollections(): Promise<Collection[]> {
    return await db.select().from(collections).orderBy(desc(collections.createdAt));
  }

  async getCollectionBySlug(slug: string): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.slug, slug));
    return collection || undefined;
  }

  async getCollectionById(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection || undefined;
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [newCollection] = await db.insert(collections).values(collection).returning();
    return newCollection;
  }

  async updateCollection(id: number, collection: Partial<InsertCollection>): Promise<Collection | undefined> {
    const [updated] = await db.update(collections)
      .set(collection)
      .where(eq(collections.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCollection(id: number): Promise<void> {
    await db.delete(collections).where(eq(collections.id, id));
  }

  // Product-Collection relationships
  async assignProductToCollection(productId: string, collectionId: number, position: number = 0): Promise<void> {
    await db.insert(productCollections)
      .values({ productId, collectionId, position })
      .onConflictDoUpdate({
        target: [productCollections.productId, productCollections.collectionId],
        set: { position }
      });
  }

  async removeProductFromCollection(productId: string, collectionId: number): Promise<void> {
    await db.delete(productCollections)
      .where(and(
        eq(productCollections.productId, productId),
        eq(productCollections.collectionId, collectionId)
      ));
  }

  async getCollectionsByProduct(productId: string): Promise<Collection[]> {
    const collectionIds = await db.select({ collectionId: productCollections.collectionId })
      .from(productCollections)
      .where(eq(productCollections.productId, productId));
    
    if (collectionIds.length === 0) return [];
    
    return await db.select().from(collections)
      .where(inArray(collections.id, collectionIds.map(c => c.collectionId)));
  }

  async clearProductCollections(productId: string): Promise<void> {
    await db.delete(productCollections).where(eq(productCollections.productId, productId));
  }

  // Sessions
  async createSession(email: string, expiresAt: Date): Promise<Session> {
    const [session] = await db.insert(sessions)
      .values({ email, expiresAt })
      .returning();
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(eq(sessions.expiresAt, new Date()));
  }
}

export const storage = new DatabaseStorage();
