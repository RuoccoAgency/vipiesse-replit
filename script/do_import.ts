import { storage } from "../server/storage";
import fs from "fs";
import path from "path";

async function runImport() {
    const csvPath = path.join(process.cwd(), "PRODOTTI_AGGIUNTI.md");
    if (!fs.existsSync(csvPath)) {
        console.error("File PRODOTTI_AGGIUNTI.md not found");
        return;
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split(/\r?\n/);
    let currentArticolo = '';
    let currentColore = '';
    let currentPrezzoCents = 0;
    let importedCount = 0;
    let updatedCount = 0;
    let productsCache = new Map<string, number>();

    console.log("Starting import...");

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.replace(/,/g, '').trim() === '') continue;

        const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length < 7) continue;

        const [, articolo, colore, sku, taglia, quantita, prezzo] = parts;

        if (articolo && articolo.trim()) currentArticolo = articolo.trim();
        if (colore && colore.trim()) currentColore = colore.trim();
        if (prezzo && prezzo.trim()) {
            const normalizedPrezzo = prezzo.trim().replace(',', '.');
            currentPrezzoCents = Math.round(parseFloat(normalizedPrezzo) * 100);
        }

        if (!sku || sku.trim() === '') continue;
        const cleanSku = sku.trim();

        // 1. Resolve product
        let productId = productsCache.get(currentArticolo);
        if (productId === undefined) {
            let product = await storage.getProductByName(currentArticolo);
            if (!product) {
                console.log(`Creating product: ${currentArticolo}`);
                product = await storage.createProduct({
                    name: currentArticolo,
                    basePriceCents: currentPrezzoCents,
                    active: true
                });
            }
            productId = product.id;
            productsCache.set(currentArticolo, productId);
        }

        // 2. Resolve variant
        const existingVariant = await storage.getVariantBySku(cleanSku);
        const qty = parseInt(quantita) || 0;

        if (existingVariant) {
            await storage.updateVariant(existingVariant.id, {
                productId: productId,
                color: currentColore,
                size: taglia.trim(),
                stockQty: qty,
                priceCents: currentPrezzoCents
            });
            updatedCount++;
        } else {
            await storage.createVariant({
                productId: productId,
                color: currentColore,
                size: taglia.trim(),
                sku: cleanSku,
                stockQty: qty,
                priceCents: currentPrezzoCents,
                active: true
            });
            importedCount++;
        }
    }

    console.log(`Import finished!`);
    console.log(`Created: ${importedCount}`);
    console.log(`Updated: ${updatedCount}`);
    process.exit(0);
}

runImport().catch(err => {
    console.error(err);
    process.exit(1);
});
