import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile } from "fs/promises";
import pg from "pg";

async function generateSyncData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("[GenerateSyncData] No DATABASE_URL, skipping auto-generation.");
    return;
  }

  console.log("[GenerateSyncData] Generating sync-data.json from database...");
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

    await writeFile("server/sync-data.json", JSON.stringify(syncData, null, 2));
    console.log(`[GenerateSyncData] Done: ${syncData.products.length} products, ${syncData.variants.length} variants, ${syncData.images.length} images, ${syncData.collections.length} collections, ${syncData.productCollections.length} assignments`);
    await pool.end();
  } catch (error) {
    console.error("[GenerateSyncData] Error:", error);
    await pool.end();
  }
}

const allowlist = [
  "@google/generative-ai",
  "axios",
  "bcryptjs",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await generateSyncData();

  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    banner: {
      js: `
const __importMetaUrl = require('url').pathToFileURL(__filename).href;
const __importMetaDirname = require('path').dirname(__filename);
      `.trim(),
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
