import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Products table - updated with Google Sheet fields
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // New fields from Google Sheet
  articolo: text("articolo").notNull(), // e.g. "ROMA TOPI WA20"
  colore: text("colore").notNull(), // e.g. "BORDEAUX", "BIANCO"
  sku: text("sku").notNull().unique(), // e.g. "ROMATOPIWA20BO36/37" - UNIQUE
  taglia: text("taglia").notNull(), // e.g. "36/37", "38/39"
  quantita: integer("quantita").notNull().default(0), // stock quantity
  
  // Price fields
  priceCents: integer("price_cents").notNull(), // stored as cents internally
  
  // Optional fields
  name: text("name"), // Legacy field for backward compatibility
  brand: text("brand"),
  description: text("description"),
  image: text("image"),
  gallery: text("gallery").array(),
  
  // Status
  active: boolean("active").notNull().default(true),
  
  // Legacy fields (kept for compatibility)
  category: varchar("category", { length: 50 }),
  sizes: text("sizes").array(),
  colors: text("colors").array(),
  isBestSeller: boolean("is_best_seller").notNull().default(false),
  isNewSeason: boolean("is_new_season").notNull().default(false),
  isOutlet: boolean("is_outlet").notNull().default(false),
  originalPriceCents: integer("original_price_cents"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Collections table
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Product-Collection junction table (many-to-many)
export const productCollections = pgTable("product_collections", {
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: 'cascade' }),
  position: integer("position").notNull().default(0),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.productId, table.collectionId] }),
  };
});

// Admin sessions table
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas with validation
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sku: z.string().min(1, "SKU is required"),
  articolo: z.string().min(1, "Articolo is required"),
  colore: z.string().min(1, "Colore is required"),
  taglia: z.string().min(1, "Taglia is required"),
  quantita: z.number().int().min(0, "Quantità must be 0 or greater").default(0),
  priceCents: z.number().int().min(0, "Price must be positive"),
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
});

export const insertProductCollectionSchema = createInsertSchema(productCollections);

// Types
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

export type InsertProductCollection = z.infer<typeof insertProductCollectionSchema>;
export type ProductCollection = typeof productCollections.$inferSelect;

export type Session = typeof sessions.$inferSelect;
