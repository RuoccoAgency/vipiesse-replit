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
  users,
  contactMessages,
  savedItems,
  businessRequests,
  productReviews,
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
  type ProductWithVariants,
  type BusinessRequest,
  type InsertBusinessRequest,
  type ProductReview,
  type InsertProductReview,
  type User,
  type ContactMessage,
  type SavedItem
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
  updateOrderPaypalId(orderId: number, paypalOrderId: string): Promise<Order | undefined>;
  getOrderByPaypalId(paypalOrderId: string): Promise<Order | undefined>;
  getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | undefined>;
  
  // Order Items
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  
  // Stock operations
  decrementStock(variantId: number, quantity: number): Promise<boolean>;
  
  // Transactional order creation
  createOrderWithItems(
    orderData: {
      orderNumber: string;
      userId?: number | null;
      status: string;
      paymentMethod: string | null;
      stripeSessionId?: string | null;
      customerEmail: string;
      customerName: string;
      customerSurname?: string | null;
      customerPhone?: string | null;
      shippingAddress: string;
      shippingCity?: string | null;
      shippingCap?: string | null;
      subtotalCents: number;
      shippingCents: number;
      totalCents: number;
    },
    items: { variantId: number; productName: string; variantSku: string; variantColor: string; variantSize: string; quantity: number; priceCents: number; imageUrl?: string }[]
  ): Promise<{ order: Order; items: OrderItem[] } | { error: string }>;
  
  // Create pending order (before Stripe checkout)
  createPendingOrder(
    orderData: {
      orderNumber: string;
      userId?: number | null;
      status: string;
      paymentMethod: string | null;
      customerEmail: string;
      customerName: string;
      customerSurname?: string | null;
      customerPhone?: string | null;
      shippingAddress: string;
      shippingCity?: string | null;
      shippingCap?: string | null;
      subtotalCents: number;
      shippingCents: number;
      totalCents: number;
    },
    items: { variantId: number; productName: string; variantSku: string; variantColor: string; variantSize: string; quantity: number; priceCents: number; imageUrl?: string }[]
  ): Promise<Order>;
  
  // Update order with Stripe session ID
  updateOrderStripeSession(orderId: number, stripeSessionId: string): Promise<Order | undefined>;
  
  // Atomically claim the right to send confirmation email (returns true if this caller should send)
  claimConfirmationEmail(orderId: number): Promise<boolean>;
  // Atomically claim the right to send delivered email (returns true if this caller should send)
  claimDeliveredEmail(orderId: number): Promise<boolean>;
  
  // Confirm order payment and decrement stock (transactional)
  confirmOrderPayment(
    orderId: number,
    data: {
      status: string;
      paymentMethod?: string;
      stripePaymentIntentId?: string | null;
      estimatedDeliveryDate?: Date;
    }
  ): Promise<{ order: Order } | { error: string }>;
  
  // Sessions
  createSession(email: string, expiresAt: Date, userId?: number, isAdmin?: boolean): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  
  // Users
  createUser(email: string, passwordHash: string, name: string, surname: string, phone?: string): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  
  // User Orders
  getOrdersByUserId(userId: number): Promise<Order[]>;
  getOrdersByEmail(email: string): Promise<Order[]>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;
  
  // Contact Messages
  createContactMessage(name: string, email: string, message: string): Promise<ContactMessage>;
  getAllContactMessages(): Promise<ContactMessage[]>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined>;
  
  // Saved Items (Wishlist)
  getSavedItemsByUser(userId: number): Promise<SavedItem[]>;
  getSavedItemsWithProducts(userId: number): Promise<ProductWithVariants[]>;
  addSavedItem(userId: number, productId: number): Promise<SavedItem>;
  removeSavedItem(userId: number, productId: number): Promise<void>;
  isProductSaved(userId: number, productId: number): Promise<boolean>;

  // B2B
  updateProductB2bPrice(productId: number, b2bPriceCents: number | null): Promise<Product | undefined>;
  updateProductComparePrice(productId: number, compareAtPriceCents: number | null): Promise<Product | undefined>;
  setUserB2b(userId: number, isB2b: boolean): Promise<void>;

  // Business Requests
  createBusinessRequest(data: InsertBusinessRequest): Promise<BusinessRequest>;
  getAllBusinessRequests(): Promise<BusinessRequest[]>;
  updateBusinessRequestStatus(id: number, status: string): Promise<BusinessRequest | undefined>;
  getApprovedBusinessRequestByEmail(email: string): Promise<BusinessRequest | undefined>;

  // Product Reviews
  createProductReview(data: InsertProductReview): Promise<ProductReview>;
  getApprovedReviewsByProduct(productId: number): Promise<ProductReview[]>;
  getReviewSummary(productId: number): Promise<{ averageRating: number; totalReviews: number; ratingBreakdown: Record<number, number> }>;
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

  async updateOrderPaypalId(orderId: number, paypalOrderId: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ paypalOrderId, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated || undefined;
  }

  async getOrderByPaypalId(paypalOrderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.paypalOrderId, paypalOrderId));
    return order || undefined;
  }

  async getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.stripeSessionId, stripeSessionId));
    return order || undefined;
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
    orderData: {
      orderNumber: string;
      userId?: number | null;
      status: string;
      paymentMethod: string | null;
      stripeSessionId?: string | null;
      customerEmail: string;
      customerName: string;
      customerSurname?: string | null;
      customerPhone?: string | null;
      shippingAddress: string;
      shippingCity?: string | null;
      shippingCap?: string | null;
      subtotalCents: number;
      shippingCents: number;
      totalCents: number;
    },
    items: { variantId: number; productName: string; variantSku: string; variantColor: string; variantSize: string; quantity: number; priceCents: number; imageUrl?: string }[]
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
      
      // Create the order with all new fields
      const orderResult = await client.query(
        `INSERT INTO orders (order_number, user_id, status, payment_method, stripe_session_id, customer_email, customer_name, customer_surname, customer_phone, shipping_address, shipping_city, shipping_cap, subtotal_cents, shipping_cents, total_cents, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()) RETURNING *`,
        [
          orderData.orderNumber,
          orderData.userId || null,
          orderData.status,
          orderData.paymentMethod,
          orderData.stripeSessionId || null,
          orderData.customerEmail,
          orderData.customerName,
          orderData.customerSurname || null,
          orderData.customerPhone || null,
          orderData.shippingAddress,
          orderData.shippingCity || null,
          orderData.shippingCap || null,
          orderData.subtotalCents,
          orderData.shippingCents,
          orderData.totalCents
        ]
      );
      const newOrder = orderResult.rows[0];
      
      // Create order items with image_url
      const createdItems: OrderItem[] = [];
      for (const item of items) {
        const itemResult = await client.query(
          `INSERT INTO order_items (order_id, variant_id, product_name, variant_sku, variant_color, variant_size, quantity, price_cents, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [newOrder.id, item.variantId, item.productName, item.variantSku, item.variantColor, item.variantSize, item.quantity, item.priceCents, item.imageUrl || null]
        );
        createdItems.push(itemResult.rows[0]);
      }
      
      await client.query('COMMIT');
      
      // Map the raw SQL result to our Order type
      const order: Order = {
        id: newOrder.id,
        orderNumber: newOrder.order_number,
        userId: newOrder.user_id,
        status: newOrder.status,
        paymentMethod: newOrder.payment_method,
        paypalOrderId: newOrder.paypal_order_id,
        stripeSessionId: newOrder.stripe_session_id,
        stripePaymentIntentId: newOrder.stripe_payment_intent_id,
        customerEmail: newOrder.customer_email,
        customerName: newOrder.customer_name,
        customerSurname: newOrder.customer_surname,
        customerPhone: newOrder.customer_phone,
        shippingAddress: newOrder.shipping_address,
        shippingCity: newOrder.shipping_city,
        shippingCap: newOrder.shipping_cap,
        shippingCountry: newOrder.shipping_country,
        notes: newOrder.notes,
        subtotalCents: newOrder.subtotal_cents,
        shippingCents: newOrder.shipping_cents,
        totalCents: newOrder.total_cents,
        carrier: newOrder.carrier,
        trackingNumber: newOrder.tracking_number,
        trackingUrl: newOrder.tracking_url,
        estimatedDeliveryDate: newOrder.estimated_delivery_date,
        shippedAt: newOrder.shipped_at,
        deliveredAt: newOrder.delivered_at,
        confirmationEmailSentAt: newOrder.confirmation_email_sent_at,
        deliveredEmailSentAt: newOrder.delivered_email_sent_at,
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

  // Create pending order (without decrementing stock - for pre-checkout)
  async createPendingOrder(
    orderData: {
      orderNumber: string;
      userId?: number | null;
      status: string;
      paymentMethod: string | null;
      customerEmail: string;
      customerName: string;
      customerSurname?: string | null;
      customerPhone?: string | null;
      shippingAddress: string;
      shippingCity?: string | null;
      shippingCap?: string | null;
      subtotalCents: number;
      shippingCents: number;
      totalCents: number;
    },
    items: { variantId: number; productName: string; variantSku: string; variantColor: string; variantSize: string; quantity: number; priceCents: number; imageUrl?: string }[]
  ): Promise<Order> {
    // Create order without decrementing stock
    const [order] = await db.insert(orders)
      .values({
        orderNumber: orderData.orderNumber,
        userId: orderData.userId || null,
        status: orderData.status,
        paymentMethod: orderData.paymentMethod,
        customerEmail: orderData.customerEmail,
        customerName: orderData.customerName,
        customerSurname: orderData.customerSurname || null,
        customerPhone: orderData.customerPhone || null,
        shippingAddress: orderData.shippingAddress,
        shippingCity: orderData.shippingCity || null,
        shippingCap: orderData.shippingCap || null,
        subtotalCents: orderData.subtotalCents,
        shippingCents: orderData.shippingCents,
        totalCents: orderData.totalCents,
      })
      .returning();
    
    // Create order items
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        variantId: item.variantId,
        productName: item.productName,
        variantSku: item.variantSku,
        variantColor: item.variantColor,
        variantSize: item.variantSize,
        quantity: item.quantity,
        priceCents: item.priceCents,
        imageUrl: item.imageUrl || null,
      });
    }
    
    return order;
  }

  // Update order with Stripe session ID
  async updateOrderStripeSession(orderId: number, stripeSessionId: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ stripeSessionId, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated || undefined;
  }

  // Confirm order payment and decrement stock transactionally
  async confirmOrderPayment(
    orderId: number,
    data: {
      status: string;
      paymentMethod?: string;
      stripePaymentIntentId?: string | null;
      estimatedDeliveryDate?: Date;
    }
  ): Promise<{ order: Order } | { error: string }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get order items
      const orderItemsResult = await client.query(
        'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
        [orderId]
      );
      
      // Lock and validate all variants with SELECT FOR UPDATE
      for (const item of orderItemsResult.rows) {
        const lockResult = await client.query(
          'SELECT id, stock_qty, sku FROM product_variants WHERE id = $1 FOR UPDATE',
          [item.variant_id]
        );
        
        if (lockResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return { error: `Variant not found: ${item.variant_id}` };
        }
        
        const currentStock = lockResult.rows[0].stock_qty;
        if (currentStock < item.quantity) {
          await client.query('ROLLBACK');
          return { error: `Insufficient stock for SKU: ${lockResult.rows[0].sku}. Available: ${currentStock}` };
        }
      }
      
      // Decrement stock for all variants
      for (const item of orderItemsResult.rows) {
        await client.query(
          'UPDATE product_variants SET stock_qty = stock_qty - $1 WHERE id = $2',
          [item.quantity, item.variant_id]
        );
      }
      
      // Update order status and payment method
      const updateFields = ['status = $1', 'stripe_payment_intent_id = $2', 'estimated_delivery_date = $3', 'updated_at = NOW()'];
      const updateParams: any[] = [data.status, data.stripePaymentIntentId || null, data.estimatedDeliveryDate || null];
      
      if (data.paymentMethod) {
        updateFields.push(`payment_method = $${updateParams.length + 1}`);
        updateParams.push(data.paymentMethod);
      }
      
      updateParams.push(orderId);
      const updateResult = await client.query(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${updateParams.length} RETURNING *`,
        updateParams
      );
      
      await client.query('COMMIT');
      
      const row = updateResult.rows[0];
      const order: Order = {
        id: row.id,
        orderNumber: row.order_number,
        userId: row.user_id,
        status: row.status,
        paymentMethod: row.payment_method,
        paypalOrderId: row.paypal_order_id,
        stripeSessionId: row.stripe_session_id,
        stripePaymentIntentId: row.stripe_payment_intent_id,
        customerEmail: row.customer_email,
        customerName: row.customer_name,
        customerSurname: row.customer_surname,
        customerPhone: row.customer_phone,
        shippingAddress: row.shipping_address,
        shippingCity: row.shipping_city,
        shippingCap: row.shipping_cap,
        shippingCountry: row.shipping_country,
        notes: row.notes,
        subtotalCents: row.subtotal_cents,
        shippingCents: row.shipping_cents,
        totalCents: row.total_cents,
        carrier: row.carrier,
        trackingNumber: row.tracking_number,
        trackingUrl: row.tracking_url,
        estimatedDeliveryDate: row.estimated_delivery_date,
        shippedAt: row.shipped_at,
        deliveredAt: row.delivered_at,
        confirmationEmailSentAt: row.confirmation_email_sent_at,
        deliveredEmailSentAt: row.delivered_email_sent_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      return { order };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Atomically claim the right to send confirmation email
  async claimConfirmationEmail(orderId: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE orders SET confirmation_email_sent_at = NOW() WHERE id = $1 AND confirmation_email_sent_at IS NULL RETURNING id`,
      [orderId]
    );
    return result.rows.length > 0;
  }

  // Unclaim confirmation email (reset) if sending failed
  async unclaimConfirmationEmail(orderId: number): Promise<void> {
    await pool.query(
      `UPDATE orders SET confirmation_email_sent_at = NULL WHERE id = $1`,
      [orderId]
    );
  }

  // Atomically claim the right to send delivered email
  async claimDeliveredEmail(orderId: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE orders SET delivered_email_sent_at = NOW() WHERE id = $1 AND delivered_email_sent_at IS NULL RETURNING id`,
      [orderId]
    );
    return result.rows.length > 0;
  }

  // Unclaim delivered email (reset) if sending failed
  async unclaimDeliveredEmail(orderId: number): Promise<void> {
    await pool.query(
      `UPDATE orders SET delivered_email_sent_at = NULL WHERE id = $1`,
      [orderId]
    );
  }

  // Sessions
  async createSession(email: string, expiresAt: Date, userId?: number, isAdmin: boolean = false): Promise<Session> {
    const [session] = await db.insert(sessions)
      .values({ email, expiresAt, userId: userId || null, isAdmin })
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

  // Users
  async createUser(email: string, passwordHash: string, name: string, surname: string, phone?: string): Promise<User> {
    const [user] = await db.insert(users)
      .values({ email, passwordHash, name, surname, phone: phone || null })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // User Orders
  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerEmail, email)).orderBy(desc(orders.createdAt));
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order || undefined;
  }

  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  // Contact Messages
  async createContactMessage(name: string, email: string, message: string): Promise<ContactMessage> {
    const [msg] = await db.insert(contactMessages)
      .values({ name, email, message })
      .returning();
    return msg;
  }

  async getAllContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined> {
    const [updated] = await db.update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, id))
      .returning();
    return updated || undefined;
  }

  // Saved Items (Wishlist)
  async getSavedItemsByUser(userId: number): Promise<SavedItem[]> {
    return await db.select().from(savedItems)
      .where(eq(savedItems.userId, userId))
      .orderBy(desc(savedItems.createdAt));
  }

  async getSavedItemsWithProducts(userId: number): Promise<ProductWithVariants[]> {
    const items = await this.getSavedItemsByUser(userId);
    if (items.length === 0) return [];
    
    const result: ProductWithVariants[] = [];
    for (const item of items) {
      const productWithVariants = await this.getProductWithVariants(item.productId);
      if (productWithVariants) {
        result.push(productWithVariants);
      }
    }
    return result;
  }

  async addSavedItem(userId: number, productId: number): Promise<SavedItem> {
    const [item] = await db.insert(savedItems)
      .values({ userId, productId })
      .onConflictDoNothing()
      .returning();
    
    if (!item) {
      const [existing] = await db.select().from(savedItems)
        .where(and(eq(savedItems.userId, userId), eq(savedItems.productId, productId)));
      return existing;
    }
    return item;
  }

  async removeSavedItem(userId: number, productId: number): Promise<void> {
    await db.delete(savedItems)
      .where(and(eq(savedItems.userId, userId), eq(savedItems.productId, productId)));
  }

  async isProductSaved(userId: number, productId: number): Promise<boolean> {
    const [item] = await db.select().from(savedItems)
      .where(and(eq(savedItems.userId, userId), eq(savedItems.productId, productId)));
    return !!item;
  }

  // Business Requests
  async createBusinessRequest(data: InsertBusinessRequest): Promise<BusinessRequest> {
    const [request] = await db.insert(businessRequests)
      .values(data)
      .returning();
    return request;
  }

  async getAllBusinessRequests(): Promise<BusinessRequest[]> {
    return await db.select().from(businessRequests).orderBy(desc(businessRequests.createdAt));
  }

  async updateBusinessRequestStatus(id: number, status: string): Promise<BusinessRequest | undefined> {
    const [updated] = await db.update(businessRequests)
      .set({ status })
      .where(eq(businessRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async getApprovedBusinessRequestByEmail(email: string): Promise<BusinessRequest | undefined> {
    const [request] = await db.select().from(businessRequests)
      .where(and(eq(businessRequests.email, email), eq(businessRequests.status, "approved")));
    return request || undefined;
  }

  // B2B
  async updateProductB2bPrice(productId: number, b2bPriceCents: number | null): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set({ b2bPriceCents, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();
    return updated || undefined;
  }

  async updateProductComparePrice(productId: number, compareAtPriceCents: number | null): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set({ compareAtPriceCents, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();
    return updated || undefined;
  }

  async setUserB2b(userId: number, isB2b: boolean): Promise<void> {
    await db.update(users)
      .set({ isB2b })
      .where(eq(users.id, userId));
  }

  // Product Reviews
  async createProductReview(data: InsertProductReview): Promise<ProductReview> {
    const [review] = await db.insert(productReviews)
      .values(data)
      .returning();
    return review;
  }

  async getApprovedReviewsByProduct(productId: number): Promise<ProductReview[]> {
    return await db.select().from(productReviews)
      .where(and(eq(productReviews.productId, productId), eq(productReviews.status, "approved")))
      .orderBy(desc(productReviews.createdAt));
  }

  async getReviewSummary(productId: number): Promise<{ averageRating: number; totalReviews: number; ratingBreakdown: Record<number, number> }> {
    const reviews = await this.getApprovedReviewsByProduct(productId);
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return { averageRating: 0, totalReviews: 0, ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
    
    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    
    for (const review of reviews) {
      sum += review.rating;
      ratingBreakdown[review.rating] = (ratingBreakdown[review.rating] || 0) + 1;
    }
    
    return {
      averageRating: Math.round((sum / totalReviews) * 10) / 10,
      totalReviews,
      ratingBreakdown
    };
  }
}

export const storage = new DatabaseStorage();
