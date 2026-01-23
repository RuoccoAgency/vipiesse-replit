import { db } from "./db";
import { products, productVariants, productImages, collections, productCollections } from "@shared/schema";

async function seed() {
  console.log("Seeding database with new product/variant structure...");

  // Create collections first
  const [bestSellers] = await db.insert(collections).values({
    name: "Best Sellers",
    slug: "best-sellers",
    description: "I più venduti",
  }).returning();

  const [donna] = await db.insert(collections).values({
    name: "Women",
    slug: "donna",
    description: "Collezione Donna",
  }).returning();

  const [uomo] = await db.insert(collections).values({
    name: "Men",
    slug: "uomo",
    description: "Collezione Uomo",
  }).returning();

  const [bambino] = await db.insert(collections).values({
    name: "Kids",
    slug: "bambino",
    description: "Collezione Bambino",
  }).returning();

  const [outlet] = await db.insert(collections).values({
    name: "Outlet",
    slug: "outlet",
    description: "Prodotti in saldo",
  }).returning();

  console.log("Collections created");

  // Create a sample product (base model)
  const [inbluProduct] = await db.insert(products).values({
    name: "INBLU Classic Clogs 5033",
    brand: "Inblu",
    description: `Product Details
Sole material: Synthetic
Upper height: Ankle
Platform height: 4.5 cm
Outer material: Synthetic

Product Description:
ZOCCOLI – The colorful inblu clogs are a fresh and fun version of traditional professional clogs.`,
    basePriceCents: 1459, // €14.59
    active: true,
  }).returning();

  console.log("Product created:", inbluProduct.name);

  // Add product images
  await db.insert(productImages).values([
    { productId: inbluProduct.id, imageUrl: "/assets/image_1768384856832-CTRfTKA7.png", sortOrder: 0 },
    { productId: inbluProduct.id, imageUrl: "/assets/image_1768384862836-qyO-uCN4.png", sortOrder: 1 },
    { productId: inbluProduct.id, imageUrl: "/assets/image_1768384873309-CsgUpd3y.png", sortOrder: 2 },
  ]);

  console.log("Product images added");

  // Add variants (color + size combinations)
  const colors = ["AZALEA", "SILVER", "WHITE", "BLUE"];
  const sizes = ["36", "37", "38", "39", "40", "41"];
  
  for (const color of colors) {
    for (const size of sizes) {
      await db.insert(productVariants).values({
        productId: inbluProduct.id,
        color: color,
        size: size,
        sku: `5033${color.substring(0, 2)}${size}`,
        stockQty: Math.floor(Math.random() * 20) + 5, // Random stock 5-24
        priceCents: null, // Use base price
        active: true,
      });
    }
  }

  console.log("Product variants created");

  // Assign product to collections
  await db.insert(productCollections).values([
    { productId: inbluProduct.id, collectionId: bestSellers.id, position: 0 },
    { productId: inbluProduct.id, collectionId: donna.id, position: 0 },
  ]);

  console.log("Product assigned to collections");
  console.log("Seeding complete!");
}

seed()
  .catch(console.error)
  .finally(() => process.exit());
