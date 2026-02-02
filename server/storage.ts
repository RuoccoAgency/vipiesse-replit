import { 
  products, 
  productVariants,
  productImages,
  variantImages,
  collections, 
  productCollections,
  orders,
  orderItems,
  sessions,
  type Product, 
  type InsertProduct,
  type ProductVariant,
  type InsertProductVariant,
  type ProductImage,
  type InsertProductImage,
  type VariantImage,
  type InsertVariantImage,
  type Collection,
  type InsertCollection,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderWithItems,
  type Session,
  type ProductWithVariants
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, inArray, desc, asc, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

export interface IStorage {
  // Products
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductWithVariants(id: number): Promise<ProductWithVariants | undefined>;
  getAllProductsWithVariants(): Promise<ProductWithVariants[]>;
  getProductsByCollection(collectionSlug: string): Promise<ProductWithVariants[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  
  // Product Variants
  getVariantsByProduct(productId: number): Promise<ProductVariant[]>;
  getVariantById(id: number): Promise<ProductVariant | undefined>;
  getVariantBySku(sku: string): Promise<ProductVariant | undefined>;
  createVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateVariant(id: number, variant: Partial<InsertProductVariant>): Promise<ProductVariant | undefined>;
  deleteVariant(id: number): Promise<void>;
  
  // Product Images
  getImagesByProduct(productId: number): Promise<ProductImage[]>;
  getMaxImageSortOrder(productId: number): Promise<number>;
  createProductImage(image: InsertProductImage): Promise<ProductImage>;
  updateProductImage(id: number, image: Partial<InsertProductImage>): Promise<ProductImage | undefined>;
  deleteProductImage(id: number): Promise<void>;
  deleteAllProductImages(productId: number): Promise<void>;
  
  // Variant Images
  getImagesByVariant(variantId: number): Promise<VariantImage[]>;
  createVariantImage(image: InsertVariantImage): Promise<VariantImage>;
  updateVariantImage(id: number, image: Partial<InsertVariantImage>): Promise<VariantImage | undefined>;
  deleteVariantImage(id: number): Promise<void>;
  deleteAllVariantImages(variantId: number): Promise<void>;
  
  // Collections
  getAllCollections(): Promise<Collection[]>;
  getCollectionBySlug(slug: string): Promise<Collection | undefined>;
  getCollectionById(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<void>;
  
  // Product-Collection relationships
  assignProductToCollection(productId: number, collectionId: number, position?: number): Promise<void>;
  removeProductFromCollection(productId: number, collectionId: number): Promise<void>;
  getCollectionsByProduct(productId: number): Promise<Collection[]>;
  clearProductCollections(productId: number): Promise<void>;
  
  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<OrderWithItems | undefined>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Order Items
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  
  // Stock operations
  decrementStock(variantId: number, quantity: number): Promise<boolean>;
  
  // Transactional order creation
  createOrderWithItems(
    order: InsertOrder,
    items: { variantId: number; productName: string; variantSku: string; variantColor: string; variantSize: string; quantity: number; priceCents: number }[]
  ): Promise<{ order: Order; items: OrderItem[] } | { error: string }>;
  
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

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductWithVariants(id: number): Promise<ProductWithVariants | undefined> {
    const product = await this.getProductById(id);
    if (!product) return undefined;

    const [variants, images, productCols] = await Promise.all([
      this.getVariantsByProduct(id),
      this.getImagesByProduct(id),
      this.getCollectionsByProduct(id)
    ]);

    return {
      ...product,
      variants,
      images,
      collections: productCols
    };
  }

  async getAllProductsWithVariants(): Promise<ProductWithVariants[]> {
    const allProducts = await this.getAllProducts();
    const result: ProductWithVariants[] = [];
    
    for (const product of allProducts) {
      const [variants, images, productCols] = await Promise.all([
        this.getVariantsByProduct(product.id),
        this.getImagesByProduct(product.id),
        this.getCollectionsByProduct(product.id)
      ]);
      
      result.push({
        ...product,
        variants,
        images,
        collections: productCols
      });
    }
    
    return result;
  }

  async getProductsByCollection(collectionSlug: string): Promise<ProductWithVariants[]> {
    const collection = await this.getCollectionBySlug(collectionSlug);
    if (!collection) return [];
    
    const productIds = await db.select({ productId: productCollections.productId })
      .from(productCollections)
      .where(eq(productCollections.collectionId, collection.id));
    
    if (productIds.length === 0) return [];
    
    const collectionProducts = await db.select().from(products)
      .where(and(
        inArray(products.id, productIds.map(p => p.productId)),
        eq(products.active, true)
      ));
    
    const result: ProductWithVariants[] = [];
    for (const product of collectionProducts) {
      const [variants, images, productCols] = await Promise.all([
        this.getVariantsByProduct(product.id),
        this.getImagesByProduct(product.id),
        this.getCollectionsByProduct(product.id)
      ]);
      
      result.push({
        ...product,
        variants,
        images,
        collections: productCols
      });
    }
    
    return result;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Product Variants
  async getVariantsByProduct(productId: number): Promise<ProductVariant[]> {
    return await db.select().from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.color), asc(productVariants.size));
  }

  async getVariantById(id: number): Promise<ProductVariant | undefined> {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id));
    return variant || undefined;
  }

  async getVariantBySku(sku: string): Promise<ProductVariant | undefined> {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.sku, sku));
    return variant || undefined;
  }

  async createVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [newVariant] = await db.insert(productVariants).values(variant).returning();
    return newVariant;
  }

  async updateVariant(id: number, variant: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const [updated] = await db.update(productVariants)
      .set(variant)
      .where(eq(productVariants.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVariant(id: number): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  // Product Images
  async getImagesByProduct(productId: number): Promise<ProductImage[]> {
    return await db.select().from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder));
  }

  async getMaxImageSortOrder(productId: number): Promise<number> {
    const result = await db.select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), -1)` })
      .from(productImages)
      .where(eq(productImages.productId, productId));
    return result[0]?.maxOrder ?? -1;
  }

  async createProductImage(image: InsertProductImage): Promise<ProductImage> {
    const [newImage] = await db.insert(productImages).values(image).returning();
    return newImage;
  }

  async updateProductImage(id: number, image: Partial<InsertProductImage>): Promise<ProductImage | undefined> {
    const [updated] = await db.update(productImages)
      .set(image)
      .where(eq(productImages.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProductImage(id: number): Promise<void> {
    await db.delete(productImages).where(eq(productImages.id, id));
  }

  async deleteAllProductImages(productId: number): Promise<void> {
    await db.delete(productImages).where(eq(productImages.productId, productId));
  }

  // Variant Images
  async getImagesByVariant(variantId: number): Promise<VariantImage[]> {
    return await db.select().from(variantImages)
      .where(eq(variantImages.variantId, variantId))
      .orderBy(asc(variantImages.sortOrder));
  }

  async createVariantImage(image: InsertVariantImage): Promise<VariantImage> {
    const [newImage] = await db.insert(variantImages).values(image).returning();
    return newImage;
  }

  async updateVariantImage(id: number, image: Partial<InsertVariantImage>): Promise<VariantImage | undefined> {
    const [updated] = await db.update(variantImages)
      .set(image)
      .where(eq(variantImages.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVariantImage(id: number): Promise<void> {
    await db.delete(variantImages).where(eq(variantImages.id, id));
  }

  async deleteAllVariantImages(variantId: number): Promise<void> {
    await db.delete(variantImages).where(eq(variantImages.variantId, variantId));
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
    const [newCollection] = await db.insert(collections).values(collection as any).returning();
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
  async assignProductToCollection(productId: number, collectionId: number, position: number = 0): Promise<void> {
    await db.insert(productCollections)
      .values({ productId, collectionId, position })
      .onConflictDoUpdate({
        target: [productCollections.productId, productCollections.collectionId],
        set: { position }
      });
  }

  async removeProductFromCollection(productId: number, collectionId: number): Promise<void> {
    await db.delete(productCollections)
      .where(and(
        eq(productCollections.productId, productId),
        eq(productCollections.collectionId, collectionId)
      ));
  }

  async getCollectionsByProduct(productId: number): Promise<Collection[]> {
    const collectionIds = await db.select({ collectionId: productCollections.collectionId })
      .from(productCollections)
      .where(eq(productCollections.productId, productId));
    
    if (collectionIds.length === 0) return [];
    
    return await db.select().from(collections)
      .where(inArray(collections.id, collectionIds.map(c => c.collectionId)));
  }

  async clearProductCollections(productId: number): Promise<void> {
    await db.delete(productCollections).where(eq(productCollections.productId, productId));
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderWithItems(id: number): Promise<OrderWithItems | undefined> {
    const order = await this.getOrderById(id);
    if (!order) return undefined;
    
    const items = await this.getOrderItems(id);
    return { ...order, items };
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  // Order Items
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item as any).returning();
    return newItem;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Stock operations - Atomic decrement with stock check
  async decrementStock(variantId: number, quantity: number): Promise<boolean> {
    const result = await db.update(productVariants)
      .set({ stockQty: sql`${productVariants.stockQty} - ${quantity}` })
      .where(and(
        eq(productVariants.id, variantId),
        gte(productVariants.stockQty, quantity)
      ))
      .returning();
    
    return result.length > 0;
  }

  // Transactional order creation - ensures atomicity with row-level locking
  async createOrderWithItems(
    orderData: InsertOrder,
    items: { variantId: number; productName: string; variantSku: string; variantColor: string; variantSize: string; quantity: number; priceCents: number }[]
  ): Promise<{ order: Order; items: OrderItem[] } | { error: string }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Lock and validate all variants with SELECT FOR UPDATE to prevent race conditions
      for (const item of items) {
        const lockResult = await client.query(
          'SELECT id, stock_qty FROM product_variants WHERE id = $1 FOR UPDATE',
          [item.variantId]
        );
        
        if (lockResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return { error: `Variant not found: ${item.variantSku}` };
        }
        
        const currentStock = lockResult.rows[0].stock_qty;
        if (currentStock < item.quantity) {
          await client.query('ROLLBACK');
          return { error: `Insufficient stock for SKU: ${item.variantSku}. Available: ${currentStock}` };
        }
      }
      
      // Decrement stock for all variants (rows are now locked)
      for (const item of items) {
        await client.query(
          'UPDATE product_variants SET stock_qty = stock_qty - $1 WHERE id = $2',
          [item.quantity, item.variantId]
        );
      }
      
      // Create the order
      const orderResult = await client.query(
        `INSERT INTO orders (status, customer_email, customer_name, customer_phone, shipping_address, total_cents, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [orderData.status, orderData.customerEmail, orderData.customerName, orderData.customerPhone, orderData.shippingAddress, orderData.totalCents]
      );
      const newOrder = orderResult.rows[0];
      
      // Create order items
      const createdItems: OrderItem[] = [];
      for (const item of items) {
        const itemResult = await client.query(
          `INSERT INTO order_items (order_id, variant_id, product_name, variant_sku, variant_color, variant_size, quantity, price_cents)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [newOrder.id, item.variantId, item.productName, item.variantSku, item.variantColor, item.variantSize, item.quantity, item.priceCents]
        );
        createdItems.push(itemResult.rows[0]);
      }
      
      await client.query('COMMIT');
      
      // Map the raw SQL result to our Order type
      const order: Order = {
        id: newOrder.id,
        status: newOrder.status,
        customerEmail: newOrder.customer_email,
        customerName: newOrder.customer_name,
        customerPhone: newOrder.customer_phone,
        shippingAddress: newOrder.shipping_address,
        totalCents: newOrder.total_cents,
        createdAt: newOrder.created_at,
        updatedAt: newOrder.updated_at
      };
      
      return { order, items: createdItems };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
