import { db } from "./db";
import { products, collections, productCollections } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create collections first
  const bestSellersCollection = await db.insert(collections).values({
    name: "Best Sellers",
    slug: "best-sellers",
    description: "I più venduti",
  }).returning();

  const donnaCollection = await db.insert(collections).values({
    name: "Women",
    slug: "donna",
    description: "Collezione Donna",
  }).returning();

  const uomoCollection = await db.insert(collections).values({
    name: "Men",
    slug: "uomo",
    description: "Collezione Uomo",
  }).returning();

  const bambinoCollection = await db.insert(collections).values({
    name: "Kids",
    slug: "bambino",
    description: "Collezione Bambino",
  }).returning();

  const outletCollection = await db.insert(collections).values({
    name: "Outlet",
    slug: "outlet",
    description: "Prodotti in saldo",
  }).returning();

  const newSeasonCollection = await db.insert(collections).values({
    name: "New Season",
    slug: "new-season",
    description: "Nuova stagione",
  }).returning();

  console.log("Collections created");

  // Create sample product with new Google Sheet fields
  const inbluProduct = await db.insert(products).values({
    articolo: "INBLU CLASSIC CLOGS 5033",
    colore: "AZALEA",
    sku: "5033AG39",
    taglia: "39",
    quantita: 10,
    priceCents: 1459, // €14.59
    brand: "Inblu",
    description: `Product Details
Sole material: Synthetic
Upper height: Ankle
Platform height: 4.5 cm
Outer material: Synthetic

Product Description:
ZOCCOLI – The colorful inblu clogs are a fresh and fun version of traditional professional clogs.`,
    image: "/assets/image_1768384856832-CTRfTKA7.png",
    gallery: [
      "/assets/image_1768384856832-CTRfTKA7.png",
      "/assets/image_1768384862836-qyO-uCN4.png",
      "/assets/image_1768384873309-CsgUpd3y.png",
    ],
    active: true,
    category: "donna",
    sizes: ["35", "36", "37", "38", "39", "40", "41"],
    colors: ["Silver", "Azalea", "White", "Blue"],
    isBestSeller: true,
    isNewSeason: false,
    isOutlet: false,
  }).returning();

  console.log("Products created");

  // Assign product to collections
  await db.insert(productCollections).values([
    { productId: inbluProduct[0].id, collectionId: bestSellersCollection[0].id, position: 0 },
    { productId: inbluProduct[0].id, collectionId: donnaCollection[0].id, position: 0 },
  ]);

  console.log("Product-collection relationships created");
  console.log("Seeding complete!");
}

seed()
  .catch(console.error)
  .finally(() => process.exit());
