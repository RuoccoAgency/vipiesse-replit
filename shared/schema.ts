import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ================================
// PRODUCTS - Base product/model (e.g., "ROMA TOPI WA20")
// ================================
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Product name / articolo
  brand: text("brand"),
  description: text("description"),
  basePriceCents: integer("base_price_cents"), // Default price if variant doesn't have one
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ================================
// PRODUCT VARIANTS - Color + Size combinations
// ================================
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  color: text("color").notNull(),
  size: text("size").notNull(),
  sku: text("sku").notNull().unique(), // Globally unique SKU
  stockQty: integer("stock_qty").notNull().default(0),
  priceCents: integer("price_cents"), // If null, use product.basePriceCents
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one variant per product/color/size combination
  uniqueProductColorSize: uniqueIndex("unique_product_color_size").on(table.productId, table.color, table.size),
}));

// ================================
// PRODUCT IMAGES - Gallery images for the product
// ================================
export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ================================
// VARIANT IMAGES - Images specific to a variant (color)
// ================================
export const variantImages = pgTable("variant_images", {
  id: serial("id").primaryKey(),
  variantId: integer("variant_id").notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ================================
// COLLECTIONS - Product groupings
// ================================
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ================================
// PRODUCT COLLECTIONS - Many-to-many junction
// ================================
export const productCollections = pgTable("product_collections", {
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: 'cascade' }),
  position: integer("position").notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.productId, table.collectionId] }),
}));

// ================================
// ORDERS
// ================================
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("pending"), // pending, paid, shipped, completed, cancelled
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address"),
  totalCents: integer("total_cents").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ================================
// ORDER ITEMS
// ================================
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  productName: text("product_name").notNull(), // Snapshot of product name at time of order
  variantSku: text("variant_sku").notNull(), // Snapshot of variant SKU
  variantColor: text("variant_color").notNull(),
  variantSize: text("variant_size").notNull(),
  quantity: integer("quantity").notNull(),
  priceCents: integer("price_cents").notNull(), // Price per unit at time of order
});

// ================================
// ADMIN SESSIONS
// ================================
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ================================
// INSERT SCHEMAS
// ================================
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Product name is required"),
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
}).extend({
  productId: z.number().int().positive(),
  color: z.string().min(1, "Color is required"),
  size: z.string().min(1, "Size is required"),
  sku: z.string().min(1, "SKU is required"),
  stockQty: z.number().int().min(0, "Stock must be 0 or greater").default(0),
  priceCents: z.number().int().min(0).nullable().optional(),
});

export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
}).extend({
  productId: z.number().int().positive(),
  imageUrl: z.string().min(1, "Image URL is required"),
  sortOrder: z.number().int().default(0),
});

export const insertVariantImageSchema = createInsertSchema(variantImages).omit({
  id: true,
}).extend({
  variantId: z.number().int().positive(),
  imageUrl: z.string().min(1, "Image URL is required"),
  sortOrder: z.number().int().default(0),
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
});

export const insertProductCollectionSchema = createInsertSchema(productCollections);

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
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
