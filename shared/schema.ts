import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ================================
// PRODUCTS - Base product/model (e.g., "ROMA TOPI WA20")
// ================================
export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(), // Product name / articolo
  brand: text("brand"),
  description: text("description"),
  basePriceCents: integer("base_price_cents"), // Default price if variant doesn't have one
  b2bPriceCents: integer("b2b_price_cents"), // Discounted B2B price (nullable)
  compareAtPriceCents: integer("compare_at_price_cents"), // Original price before discount (for outlet)
  season: text("season"), // "primavera-estate" or "autunno-inverno"
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ================================
// PRODUCT VARIANTS - Color + Size combinations
// ================================
export const productVariants = pgTable(
  "product_variants",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    color: text("color").notNull(),
    size: text("size").notNull(),
    sku: text("sku").notNull().unique(), // Globally unique SKU
    stockQty: integer("stock_qty").notNull().default(0),
    priceCents: integer("price_cents"), // If null, use product.basePriceCents
    imageUrl: text("image_url"), // Image URL for this color variant
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueProductColorSize: uniqueIndex("unique_product_color_size").on(
      table.productId,
      table.color,
      table.size
    ),
  })
);

// ================================
// PRODUCT IMAGES - Gallery images for the product
// ================================
export const productImages = pgTable("product_images", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ================================
// VARIANT IMAGES - Images specific to a variant (color)
// ================================
export const variantImages = pgTable("variant_images", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  variantId: integer("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ================================
// COLLECTIONS - Product groupings
// ================================
export const collections = pgTable("collections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ================================
// PRODUCT COLLECTIONS - Many-to-many junction
// ================================
export const productCollections = pgTable(
  "product_collections",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.productId, table.collectionId] }),
  })
);

// ================================
// USERS
// ================================
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  phone: text("phone"),
  isB2b: boolean("is_b2b").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ================================
// ORDERS
// ================================
export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderNumber: text("order_number").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull().default("pending_payment"), // pending_payment, paid, processing, shipped, delivered, cancelled, refunded, expired
  paymentMethod: text("payment_method"), // stripe, bank_transfer
  paypalOrderId: text("paypal_order_id"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  customerSurname: text("customer_surname"),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city"),
  shippingCap: text("shipping_cap"),
  shippingCountry: text("shipping_country").default("IT"),
  notes: text("notes"),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  shippingCents: integer("shipping_cents").notNull().default(0),
  discountCents: integer("discount_cents").notNull().default(0),
  couponCode: text("coupon_code"),
  totalCents: integer("total_cents").notNull().default(0),
  // Tracking fields
  carrier: text("carrier"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  confirmationEmailSentAt: timestamp("confirmation_email_sent_at"),
  deliveredEmailSentAt: timestamp("delivered_email_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ================================
// ORDER ITEMS
// ================================
export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  productName: text("product_name").notNull(), // Snapshot at time of order
  variantSku: text("variant_sku").notNull(),
  variantColor: text("variant_color").notNull(),
  variantSize: text("variant_size").notNull(),
  quantity: integer("quantity").notNull(),
  priceCents: integer("price_cents").notNull(), // unit price at time of order
  imageUrl: text("image_url"),
});

// ================================
// SESSIONS (user + admin)
// ================================
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  userId: integer("user_id").references(() => users.id),
  isAdmin: boolean("is_admin").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ================================
// CONTACT MESSAGES
// ================================
export const contactMessages = pgTable("contact_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ================================
// BUSINESS REQUESTS (B2B Registration)
// ================================
export const businessRequests = pgTable("business_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyName: text("company_name").notNull(),
  vatNumber: text("vat_number").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  cap: text("cap"),
  contactPerson: text("contact_person"),
  businessType: text("business_type"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ================================
// SAVED ITEMS (Wishlist)
// ================================
export const savedItems = pgTable(
  "saved_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserProduct: uniqueIndex("unique_user_product").on(
      table.userId,
      table.productId
    ),
  })
);

// ================================
// COUPON USAGES - Track coupon usage per user
// ================================
export const couponUsages = pgTable("coupon_usages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  couponCode: text("coupon_code").notNull(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  usedAt: timestamp("used_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserCoupon: uniqueIndex("unique_user_coupon").on(
    table.userId,
    table.couponCode
  ),
}));

// ================================
// PRODUCT REVIEWS
// ================================
export const productReviews = pgTable("product_reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  name: text("name"),
  title: text("title"),
  comment: text("comment").notNull(),
  status: text("status").notNull().default("approved"),
  userId: integer("user_id").references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  brand: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  basePriceCents: z.number().int().nullable().optional(),
  b2bPriceCents: z.number().int().nullable().optional(),
  compareAtPriceCents: z.number().int().nullable().optional(),
  season: z.string().nullable().optional(),
  active: z.boolean().optional().default(true),
});

export const insertProductVariantSchema = z.object({
  productId: z.number().int().positive(),
  color: z.string().min(1, "Color is required"),
  size: z.string().min(1, "Size is required"),
  sku: z.string().min(1, "SKU is required"),
  stockQty: z.number().int().min(0, "Stock must be 0 or greater").default(0),
  priceCents: z.number().int().min(0).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  active: z.boolean().optional().default(true),
});

export const insertProductImageSchema = z.object({
  productId: z.number().int().positive(),
  imageUrl: z.string().min(1, "Image URL is required"),
  sortOrder: z.number().int().default(0),
});

export const insertVariantImageSchema = z.object({
  variantId: z.number().int().positive(),
  imageUrl: z.string().min(1, "Image URL is required"),
  sortOrder: z.number().int().default(0),
});

export const insertCollectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
});

export const insertProductCollectionSchema = z.object({
  productId: z.number().int().positive(),
  collectionId: z.number().int().positive(),
  position: z.number().int().default(0),
});

export const insertOrderSchema = z.object({
  orderNumber: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerSurname: z.string().min(1),
  customerPhone: z.string().nullable().optional(),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingProvince: z.string().nullable().optional(),
  shippingCap: z.string().nullable().optional(),
  subtotalCents: z.number().int().min(0),
  shippingCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  paymentMethod: z.string().min(1),
  paypalOrderId: z.string().nullable().optional(),
  stripePaymentIntentId: z.string().nullable().optional(),
  status: z.string().default("pending_payment"),
});

export const insertOrderItemSchema = z.object({
  orderId: z.number().int().positive(),
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  priceCents: z.number().int().min(0),
});

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username richiesto"),
  password: z.string().min(6, "Password minima 6 caratteri"),
  name: z.string().min(1, "Nome richiesto"),
  surname: z.string().min(1, "Cognome richiesto"),
});

export const insertContactMessageSchema = z.object({
  name: z.string().min(1, "Nome richiesto"),
  email: z.string().email("Email non valida"),
  phone: z.string().nullable().optional(),
  message: z.string().min(10, "Il messaggio deve avere almeno 10 caratteri"),
  status: z.string().default("new"),
});

export const insertSavedItemSchema = z.object({
  userId: z.number().int().positive(),
  variantId: z.number().int().positive(),
});

export const insertBusinessRequestSchema = z.object({
  companyName: z.string().min(2, "Ragione sociale richiesta"),
  vatNumber: z.string().min(11, "Partita IVA non valida"),
  email: z.string().email("Email non valida"),
  phone: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  status: z.string().default("new"),
});

export const insertProductReviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  name: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  comment: z.string().min(10).max(1000),
  status: z.string().default("approved"),
});

// ================================
// TYPES
// ================================
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;

export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type ProductImage = typeof productImages.$inferSelect;

export type InsertVariantImage = z.infer<typeof insertVariantImageSchema>;
export type VariantImage = typeof variantImages.$inferSelect;

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

export type InsertProductCollection = z.infer<typeof insertProductCollectionSchema>;
export type ProductCollection = typeof productCollections.$inferSelect;

export type Session = typeof sessions.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

export type InsertSavedItem = z.infer<typeof insertSavedItemSchema>;
export type SavedItem = typeof savedItems.$inferSelect;

export type CouponUsage = typeof couponUsages.$inferSelect;

export type InsertBusinessRequest = z.infer<typeof insertBusinessRequestSchema>;
export type BusinessRequest = typeof businessRequests.$inferSelect;

export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;

// ================================
// COMPOSITE TYPES FOR API RESPONSES
// ================================
export type ProductWithVariants = Product & {
  variants: ProductVariant[];
  images: ProductImage[];
  collections: Collection[];
};

export type ProductVariantWithImages = ProductVariant & {
  images: VariantImage[];
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};
