## Crocs charms upsell (optional add-on)

### Goal
On **Crocs** product pages, customers can optionally add **Charms** for **+€0.50 each** before adding the main product to the cart.

### How it works
- **Crocs detection**: the upsell shows only when the product is identified as Crocs by existing data already present in the project:
  - product name contains `"crocs"` (case-insensitive), **or**
  - base brand equals `"crocs"` (case-insensitive; base brand is `brand.split("(")[0].trim()`).
- **Charm source**: charms are loaded dynamically from the database using the existing `brand` field:
  - Charm products are those with base brand **`CHARMS`**.
- **Selection UX**:
  - Product page shows a new section: **“Add a Charm (+€0.50)”**
  - Each charm is shown as a selectable card (image + name).
  - Out-of-stock charms are disabled.
- **Add to cart behavior**:
  - The main product is added (respecting variant/size and quantity).
  - Each selected charm is added as a **separate cart item** with **€0.50** unit price.
  - Cart and checkout totals naturally include charms via existing pricing logic.

### API
- `GET /api/products/charms`
  - Returns active products whose brand base is `CHARMS` (including variants and images), sourced from the existing database.

### Files changed
- `server/storage.ts`
- `server/routes.ts`
- `client/src/lib/api.ts`
- `client/src/pages/product-detail.tsx`

