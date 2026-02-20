import fs from "fs";
import path from "path";

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

    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const countResult = await pool.query("SELECT COUNT(*) as cnt FROM products");
    const currentCount = Number(countResult.rows[0]?.cnt || 0);
    const expectedCount = syncData.products.length;

    const sampleResult = await pool.query(
      "SELECT compare_at_price_cents FROM products WHERE id = 13 LIMIT 1"
    );
    const hasComparePrice = sampleResult.rows[0]?.compare_at_price_cents != null;

    if (currentCount >= expectedCount && hasComparePrice) {
      console.log(`[ProductionSync] Data appears up-to-date (${currentCount} products, compareAtPrice set). Skipping sync.`);
      await pool.end();
      return;
    }

    console.log(`[ProductionSync] Syncing data: current=${currentCount}, expected=${expectedCount}, hasComparePrice=${hasComparePrice}`);

    const results = {
      collections: 0,
      products: 0,
      variants: 0,
      images: 0,
      productCollections: 0,
    };

    if (syncData.collections) {
      for (const c of syncData.collections) {
        await pool.query(
          `INSERT INTO collections (id, name, slug, description)
           OVERRIDING SYSTEM VALUE
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description`,
          [c.id, c.name, c.slug, c.description]
        );
        results.collections++;
      }
      console.log(`[ProductionSync] Synced ${results.collections} collections`);
    }

    for (const p of syncData.products) {
      await pool.query(
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
      results.products++;
    }
    console.log(`[ProductionSync] Synced ${results.products} products`);

    for (const v of syncData.variants) {
      const existing = await pool.query("SELECT id FROM product_variants WHERE sku = $1", [v.sku]);
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO product_variants (product_id, color, size, sku, stock_qty, price_cents, image_url, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [v.productId, v.color, v.size, v.sku, v.stockQty, v.priceCents, v.imageUrl, v.active !== false]
        );
        results.variants++;
      }
    }
    console.log(`[ProductionSync] Inserted ${results.variants} new variants`);

    for (const img of syncData.images) {
      const existing = await pool.query(
        "SELECT id FROM product_images WHERE product_id = $1 AND image_url = $2",
        [img.productId, img.imageUrl]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO product_images (product_id, image_url, sort_order)
           VALUES ($1, $2, $3)`,
          [img.productId, img.imageUrl, img.sortOrder]
        );
        results.images++;
      }
    }
    console.log(`[ProductionSync] Inserted ${results.images} new images`);

    if (syncData.productCollections) {
      for (const pc of syncData.productCollections) {
        await pool.query(
          `INSERT INTO product_collections (product_id, collection_id, position)
           VALUES ($1, $2, $3)
           ON CONFLICT (product_id, collection_id) DO UPDATE SET position = EXCLUDED.position`,
          [pc.productId, pc.collectionId, pc.position]
        );
        results.productCollections++;
      }
      console.log(`[ProductionSync] Synced ${results.productCollections} product-collection assignments`);
    }

    const maxIdResult = await pool.query("SELECT MAX(id) as max_id FROM products");
    const maxId = Number(maxIdResult.rows[0]?.max_id || 30);
    await pool.query(`SELECT setval(pg_get_serial_sequence('products', 'id'), $1, false)`, [maxId + 1]);

    const maxVarResult = await pool.query("SELECT MAX(id) as max_id FROM product_variants");
    const maxVarId = Number(maxVarResult.rows[0]?.max_id || 500);
    await pool.query(`SELECT setval(pg_get_serial_sequence('product_variants', 'id'), $1, false)`, [maxVarId + 1]);

    const maxImgResult = await pool.query("SELECT MAX(id) as max_id FROM product_images");
    const maxImgId = Number(maxImgResult.rows[0]?.max_id || 300);
    await pool.query(`SELECT setval(pg_get_serial_sequence('product_images', 'id'), $1, false)`, [maxImgId + 1]);

    const maxColResult = await pool.query("SELECT MAX(id) as max_id FROM collections");
    const maxColId = Number(maxColResult.rows[0]?.max_id || 10);
    await pool.query(`SELECT setval(pg_get_serial_sequence('collections', 'id'), $1, false)`, [maxColId + 1]);

    await pool.end();

    console.log("[ProductionSync] Data sync complete:", JSON.stringify(results));
  } catch (error) {
    console.error("[ProductionSync] Error during sync:", error);
  }
}
