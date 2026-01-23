import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(), // Store price in cents
  category: varchar("category", { length: 50 }).notNull(), // donna, uomo, bambino
  brand: text("brand").notNull(),
  sku: text("sku"),
  description: text("description"),
  image: text("image").notNull(),
  gallery: text("gallery").array(), // Array of image URLs
  sizes: text("sizes").array().notNull(), // Available sizes
  colors: text("colors").array(), // Available colors
  active: boolean("active").notNull().default(true), // Product visibility
  isBestSeller: boolean("is_best_seller").notNull().default(false),
  isNewSeason: boolean("is_new_season").notNull().default(false),
  isOutlet: boolean("is_outlet").notNull().default(false),
  originalPriceCents: integer("original_price_cents"), // For outlet pricing
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
  position: integer("position").notNull().default(0), // For ordering within collection
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

// Insert schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
