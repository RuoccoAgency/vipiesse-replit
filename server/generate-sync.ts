import fs from "fs";
import path from "path";
import pg from "pg";

let syncTimer: ReturnType<typeof setTimeout> | null = null;

async function doGenerate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const [products, variants, images, collections, productCollections] = await Promise.all([
      pool.query("SELECT id, name, brand, description, base_price_cents, b2b_price_cents, compare_at_price_cents, season, active FROM products ORDER BY id"),
      pool.query("SELECT id, product_id, color, size, sku, stock_qty, price_cents, image_url, active FROM product_variants ORDER BY id"),
      pool.query("SELECT id, product_id, image_url, sort_order FROM product_images ORDER BY id"),
      pool.query("SELECT id, name, slug, description FROM collections ORDER BY id"),
      pool.query("SELECT product_id, collection_id, position FROM product_collections ORDER BY product_id, collection_id"),
    ]);

    const syncData = {
      products: products.rows.map((r: any) => ({
        id: r.id, name: r.name, brand: r.brand, description: r.description,
        basePriceCents: r.base_price_cents, b2bPriceCents: r.b2b_price_cents,
        compareAtPriceCents: r.compare_at_price_cents, season: r.season || null, active: r.active,
      })),
      variants: variants.rows.map((r: any) => ({
        id: r.id, productId: r.product_id, color: r.color, size: r.size,
        sku: r.sku, stockQty: r.stock_qty, priceCents: r.price_cents,
        imageUrl: r.image_url, active: r.active,
      })),
      images: images.rows.map((r: any) => ({
        id: r.id, productId: r.product_id, imageUrl: r.image_url, sortOrder: r.sort_order,
      })),
      collections: collections.rows.map((r: any) => ({
        id: r.id, name: r.name, slug: r.slug, description: r.description,
      })),
      productCollections: productCollections.rows.map((r: any) => ({
        productId: r.product_id, collectionId: r.collection_id, position: r.position,
      })),
    };

    const outputPath = path.join(process.cwd(), "server", "sync-data.json");
    fs.writeFileSync(outputPath, JSON.stringify(syncData, null, 2));
    console.log(`[GenerateSyncData] Updated: ${syncData.products.length} products, ${syncData.variants.length} variants, ${syncData.images.length} images, ${syncData.collections.length} collections, ${syncData.productCollections.length} assignments`);
    await pool.end();
  } catch (error) {
    console.error("[GenerateSyncData] Error:", error);
    await pool.end();
  }
}

export async function generateSyncData() {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log("[GenerateSyncData] Generating sync-data.json from development database...");
  await doGenerate();
}

export function scheduleSyncDataUpdate() {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(async () => {
    syncTimer = null;
    await doGenerate();
  }, 3000);
}
