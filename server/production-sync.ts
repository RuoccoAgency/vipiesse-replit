import fs from "fs";
import path from "path";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { storage } from "./storage";

export async function runProductionSync() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  try {
    console.log("[ProductionSync] Checking if data sync is needed...");

    const syncDataPath = path.join(process.cwd(), "server", "sync-data.json");
    if (!fs.existsSync(syncDataPath)) {
      console.log("[ProductionSync] No sync-data.json found, skipping.");
      return;
    }

    const rawData = fs.readFileSync(syncDataPath, "utf-8");
    const syncData = JSON.parse(rawData);

    if (!syncData.products || syncData.products.length === 0) {
      console.log("[ProductionSync] No products to sync.");
      return;
    }

    const countResult = await db.execute(sql`SELECT COUNT(*) as cnt FROM products`);
    const currentCount = Number((countResult as any).rows?.[0]?.cnt || 0);
    const expectedCount = syncData.products.length;

    const sampleProduct = await db.execute(
      sql`SELECT compare_at_price_cents FROM products WHERE id = 13 LIMIT 1`
    );
    const hasComparePrice = (sampleProduct as any).rows?.[0]?.compare_at_price_cents != null;

    if (currentCount >= expectedCount && hasComparePrice) {
      console.log(`[ProductionSync] Data appears up-to-date (${currentCount} products, compareAtPrice set). Skipping sync.`);
      return;
    }

    console.log(`[ProductionSync] Syncing data: current=${currentCount} products, expected>=${expectedCount}, hasComparePrice=${hasComparePrice}`);

    const results = {
      productsUpdated: 0,
      productsInserted: 0,
      variantsInserted: 0,
      imagesInserted: 0,
      collectionsAssigned: 0,
    };

    const { Pool } = await import("pg");
    const directPool = new Pool({ connectionString: process.env.DATABASE_URL });

    for (const p of syncData.products) {
      await directPool.query(
        `INSERT INTO products (id, name, brand, description, base_price_cents, b2b_price_cents, compare_at_price_cents, active)
         OVERRIDING SYSTEM VALUE
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           brand = EXCLUDED.brand,
           description = EXCLUDED.description,
           base_price_cents = EXCLUDED.base_price_cents,
           b2b_price_cents = EXCLUDED.b2b_price_cents,
           compare_at_price_cents = EXCLUDED.compare_at_price_cents,
           active = EXCLUDED.active`,
        [p.id, p.name, p.brand, p.description, p.basePriceCents, p.b2bPriceCents, p.compareAtPriceCents, p.active]
      );
      results.productsUpdated++;
    }

    for (const v of syncData.variants) {
      const existingVariant = await storage.getVariantBySku(v.sku);
      if (!existingVariant) {
        await storage.createVariant({
          productId: v.productId,
          color: v.color,
          size: v.size,
          sku: v.sku,
          stockQty: v.stockQty,
          priceCents: v.priceCents,
          imageUrl: v.imageUrl,
        });
        results.variantsInserted++;
      }
    }

    for (const img of syncData.images) {
      const existingImages = await storage.getImagesByProduct(img.productId);
      const alreadyExists = existingImages.some((ei: any) => ei.imageUrl === img.imageUrl);
      if (!alreadyExists) {
        await storage.createProductImage({
          productId: img.productId,
          imageUrl: img.imageUrl,
          sortOrder: img.sortOrder,
        });
        results.imagesInserted++;
      }
    }

    for (const pc of syncData.productCollections) {
      await storage.assignProductToCollection(pc.productId, pc.collectionId, pc.position);
      results.collectionsAssigned++;
    }

    const maxIdResult = await db.execute(sql`SELECT MAX(id) as max_id FROM products`);
    const maxId = (maxIdResult as any).rows?.[0]?.max_id || 30;
    await db.execute(
      sql`SELECT setval(pg_get_serial_sequence('products', 'id'), ${Number(maxId) + 1}, false)`
    );

    await directPool.end();

    console.log("[ProductionSync] Data sync complete:", results);
  } catch (error) {
    console.error("[ProductionSync] Error during sync:", error);
  }
}
