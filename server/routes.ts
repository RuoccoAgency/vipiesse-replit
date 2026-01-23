import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import cookieParser from "cookie-parser";
import { insertProductSchema, insertProductVariantSchema, insertCollectionSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      adminEmail?: string;
    }
  }
}

async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies.admin_session;
  
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = await storage.getSession(sessionId);
  
  if (!session || session.expiresAt < new Date()) {
    res.clearCookie("admin_session");
    return res.status(401).json({ error: "Session expired" });
  }

  req.sessionId = sessionId;
  req.adminEmail = session.email;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(cookieParser());

  // ================================
  // PUBLIC API - Products
  // ================================
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProductsWithVariants();
      const activeProducts = products.filter(p => p.active);
      res.json(activeProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductWithVariants(parseInt(req.params.id));
      if (!product || !product.active) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/products/collection/:slug", async (req, res) => {
    try {
      const products = await storage.getProductsByCollection(req.params.slug);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // ================================
  // PUBLIC API - Collections
  // ================================
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getAllCollections();
      res.json(collections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:slug", async (req, res) => {
    try {
      const collection = await storage.getCollectionBySlug(req.params.slug);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });

  // ================================
  // ADMIN AUTH
  // ================================
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log("[LOGIN] Attempt with email:", email);
    console.log("[LOGIN] Admin email configured:", adminEmail ? "YES" : "NO");
    console.log("[LOGIN] Admin password configured:", adminPassword ? "YES" : "NO");

    if (!adminEmail || !adminPassword) {
      console.log("[LOGIN] ERROR: Admin credentials not configured");
      return res.status(500).json({ error: "Admin credentials not configured" });
    }

    if (email !== adminEmail || password !== adminPassword) {
      console.log("[LOGIN] ERROR: Invalid credentials - email match:", email === adminEmail, "password match:", password === adminPassword);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    console.log("[LOGIN] SUCCESS for:", email);

    await storage.deleteExpiredSessions();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await storage.createSession(email, expiresAt);

    res.cookie("admin_session", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiresAt,
    });

    res.json({ success: true, email });
  });

  app.post("/api/admin/logout", isAdmin, async (req, res) => {
    if (req.sessionId) {
      await storage.deleteSession(req.sessionId);
    }
    res.clearCookie("admin_session");
    res.json({ success: true });
  });

  app.get("/api/admin/check", isAdmin, (req, res) => {
    res.json({ authenticated: true, email: req.adminEmail });
  });

  // ================================
  // ADMIN API - Products
  // ================================
  app.get("/api/admin/products", isAdmin, async (req, res) => {
    try {
      const products = await storage.getAllProductsWithVariants();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const product = await storage.getProductWithVariants(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/admin/products", isAdmin, async (req, res) => {
    try {
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validated);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid product data" });
    }
  });

  app.patch("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const product = await storage.updateProduct(parseInt(req.params.id), req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Product Collections
  app.get("/api/admin/products/:id/collections", isAdmin, async (req, res) => {
    try {
      const collections = await storage.getCollectionsByProduct(parseInt(req.params.id));
      res.json(collections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.post("/api/admin/products/:id/collections", isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { collectionIds } = req.body;
      
      await storage.clearProductCollections(productId);
      
      for (let i = 0; i < collectionIds.length; i++) {
        await storage.assignProductToCollection(productId, collectionIds[i], i);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update collections" });
    }
  });

  // ================================
  // ADMIN API - Variants
  // ================================
  app.get("/api/admin/products/:productId/variants", isAdmin, async (req, res) => {
    try {
      const variants = await storage.getVariantsByProduct(parseInt(req.params.productId));
      res.json(variants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch variants" });
    }
  });

  app.post("/api/admin/products/:productId/variants", isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const validated = insertProductVariantSchema.parse({ ...req.body, productId });
      
      // Check SKU uniqueness
      const existingVariant = await storage.getVariantBySku(validated.sku);
      if (existingVariant) {
        return res.status(400).json({ error: "SKU already exists" });
      }
      
      const variant = await storage.createVariant(validated);
      res.json(variant);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "SKU already exists or duplicate color/size combination" });
      }
      res.status(400).json({ error: error.message || "Invalid variant data" });
    }
  });

  app.patch("/api/admin/variants/:id", isAdmin, async (req, res) => {
    try {
      const variantId = parseInt(req.params.id);
      
      // Check SKU uniqueness if updating SKU
      if (req.body.sku) {
        const existingVariant = await storage.getVariantBySku(req.body.sku);
        if (existingVariant && existingVariant.id !== variantId) {
          return res.status(400).json({ error: "SKU already exists" });
        }
      }
      
      const variant = await storage.updateVariant(variantId, req.body);
      if (!variant) {
        return res.status(404).json({ error: "Variant not found" });
      }
      res.json(variant);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "SKU already exists or duplicate color/size combination" });
      }
      res.status(400).json({ error: "Failed to update variant" });
    }
  });

  app.delete("/api/admin/variants/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteVariant(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete variant" });
    }
  });

  // ================================
  // ADMIN API - Product Images
  // ================================
  app.get("/api/admin/products/:productId/images", isAdmin, async (req, res) => {
    try {
      const images = await storage.getImagesByProduct(parseInt(req.params.productId));
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.post("/api/admin/products/:productId/images", isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { imageUrl, sortOrder } = req.body;
      
      const image = await storage.createProductImage({
        productId,
        imageUrl,
        sortOrder: sortOrder || 0
      });
      res.json(image);
    } catch (error) {
      res.status(400).json({ error: "Failed to add image" });
    }
  });

  app.delete("/api/admin/product-images/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteProductImage(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // Bulk update product images
  app.put("/api/admin/products/:productId/images", isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { images } = req.body; // Array of { imageUrl, sortOrder }
      
      await storage.deleteAllProductImages(productId);
      
      for (const img of images) {
        await storage.createProductImage({
          productId,
          imageUrl: img.imageUrl,
          sortOrder: img.sortOrder || 0
        });
      }
      
      const updatedImages = await storage.getImagesByProduct(productId);
      res.json(updatedImages);
    } catch (error) {
      res.status(400).json({ error: "Failed to update images" });
    }
  });

  // ================================
  // ADMIN API - Variant Images
  // ================================
  app.get("/api/admin/variants/:variantId/images", isAdmin, async (req, res) => {
    try {
      const images = await storage.getImagesByVariant(parseInt(req.params.variantId));
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch variant images" });
    }
  });

  app.post("/api/admin/variants/:variantId/images", isAdmin, async (req, res) => {
    try {
      const variantId = parseInt(req.params.variantId);
      const { imageUrl, sortOrder } = req.body;
      
      const image = await storage.createVariantImage({
        variantId,
        imageUrl,
        sortOrder: sortOrder || 0
      });
      res.json(image);
    } catch (error) {
      res.status(400).json({ error: "Failed to add variant image" });
    }
  });

  app.delete("/api/admin/variant-images/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteVariantImage(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete variant image" });
    }
  });

  // ================================
  // ADMIN API - Collections
  // ================================
  app.get("/api/admin/collections", isAdmin, async (req, res) => {
    try {
      const collections = await storage.getAllCollections();
      res.json(collections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.post("/api/admin/collections", isAdmin, async (req, res) => {
    try {
      const validated = insertCollectionSchema.parse(req.body);
      const collection = await storage.createCollection(validated);
      res.json(collection);
    } catch (error) {
      res.status(400).json({ error: "Invalid collection data" });
    }
  });

  app.patch("/api/admin/collections/:id", isAdmin, async (req, res) => {
    try {
      const collection = await storage.updateCollection(parseInt(req.params.id), req.body);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(400).json({ error: "Failed to update collection" });
    }
  });

  app.delete("/api/admin/collections/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteCollection(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  // ================================
  // HTML ADMIN PAGES
  // ================================
  
  // Admin HTML middleware
  async function isAdminHTML(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.cookies.admin_session;
    
    if (!sessionId) {
      return res.redirect('/login');
    }

    const session = await storage.getSession(sessionId);
    
    if (!session || session.expiresAt < new Date()) {
      res.clearCookie("admin_session");
      return res.redirect('/login');
    }

    req.sessionId = sessionId;
    req.adminEmail = session.email;
    next();
  }

  // Login page
  app.get("/login", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Login - VIPIESSE</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .login-box { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
          h1 { margin-bottom: 1.5rem; text-align: center; }
          .form-group { margin-bottom: 1rem; }
          label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
          input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
          .btn { width: 100%; padding: 0.75rem; background: #000; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }
          .btn:hover { background: #333; }
          .error { color: #dc3545; margin-bottom: 1rem; display: none; }
        </style>
      </head>
      <body>
        <div class="login-box">
          <h1>VIPIESSE Admin</h1>
          <div class="error" id="error"></div>
          <form id="loginForm">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="email" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="password" required>
            </div>
            <button type="submit" class="btn">Login</button>
          </form>
        </div>
        <script>
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('error');
            errorDiv.style.display = 'none';
            
            try {
              const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: document.getElementById('email').value,
                  password: document.getElementById('password').value
                })
              });
              
              const data = await res.json();
              
              if (res.ok) {
                window.location.href = '/admin';
              } else {
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.style.display = 'block';
              }
            } catch (error) {
              errorDiv.textContent = 'Network error';
              errorDiv.style.display = 'block';
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  // Admin dashboard
  app.get("/admin", isAdminHTML, (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Panel - VIPIESSE</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
          .header { background: #000; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { font-size: 1.5rem; }
          .logout { background: transparent; border: 1px solid white; color: white; padding: 0.5rem 1rem; cursor: pointer; border-radius: 4px; }
          .nav { background: white; padding: 1rem 2rem; border-bottom: 1px solid #ddd; }
          .nav a { margin-right: 1.5rem; text-decoration: none; color: #333; font-weight: 500; }
          .nav a.active { color: #000; border-bottom: 2px solid #000; padding-bottom: 0.25rem; }
          .container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>VIPIESSE Admin Panel</h1>
          <button class="logout" onclick="logout()">Logout</button>
        </div>
        <div class="nav">
          <a href="/admin/products" class="active">Products</a>
          <a href="/admin/collections">Collections</a>
        </div>
        <div class="container">
          <h2>Welcome, ${req.adminEmail}</h2>
          <p style="margin-top: 1rem;">Use the navigation above to manage products and collections.</p>
        </div>
        <script>
          async function logout() {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = '/login';
          }
        </script>
      </body>
      </html>
    `);
  });

  // Admin Products page - redirects to new admin interface
  app.get("/admin/products", isAdminHTML, async (req, res) => {
    const products = await storage.getAllProductsWithVariants();
    const collections = await storage.getAllCollections();
    
    res.send(getAdminProductsPage(products, collections));
  });

  // Admin Product Edit page
  app.get("/admin/products/:id", isAdminHTML, async (req, res) => {
    const product = await storage.getProductWithVariants(parseInt(req.params.id));
    const collections = await storage.getAllCollections();
    
    if (!product) {
      return res.redirect('/admin/products');
    }
    
    res.send(getAdminProductEditPage(product, collections));
  });

  // Admin Collections page
  app.get("/admin/collections", isAdminHTML, async (req, res) => {
    const collections = await storage.getAllCollections();
    
    res.send(getAdminCollectionsPage(collections));
  });

  // ================================
  // PUBLIC API - Orders (Checkout)
  // ================================
  
  // Create order with stock validation and decrement (transactional)
  app.post("/api/orders", async (req, res) => {
    try {
      const { items, customerEmail, customerName, customerPhone, shippingAddress } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }
      
      // Validate all items have required fields
      for (const item of items) {
        if (!item.variantId || typeof item.variantId !== 'number') {
          return res.status(400).json({ error: "Invalid variantId in cart item" });
        }
        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
          return res.status(400).json({ error: "Invalid quantity in cart item" });
        }
      }
      
      // Pre-validate stock and gather item details
      const orderItems: { variantId: number; productName: string; variantSku: string; variantColor: string; variantSize: string; quantity: number; priceCents: number }[] = [];
      let totalCents = 0;
      
      for (const item of items) {
        const variant = await storage.getVariantById(item.variantId);
        if (!variant) {
          return res.status(400).json({ error: `Variant ${item.variantId} not found` });
        }
        if (!variant.active) {
          return res.status(400).json({ error: `Variant ${variant.sku} is not available` });
        }
        if (variant.stockQty < item.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${variant.sku}. Available: ${variant.stockQty}, Requested: ${item.quantity}` 
          });
        }
        
        const product = await storage.getProductById(variant.productId);
        if (!product || !product.active) {
          return res.status(400).json({ error: `Product for variant ${variant.sku} not available` });
        }
        
        const priceCents = variant.priceCents || product.basePriceCents || 0;
        totalCents += priceCents * item.quantity;
        
        orderItems.push({
          variantId: item.variantId,
          productName: product.name,
          variantSku: variant.sku,
          variantColor: variant.color,
          variantSize: variant.size,
          quantity: item.quantity,
          priceCents
        });
      }
      
      // Create order with items in a single transaction (stock decrement included)
      const result = await storage.createOrderWithItems(
        {
          status: 'paid', // Set to paid since we're simulating payment
          customerEmail: customerEmail || null,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          shippingAddress: shippingAddress || null,
          totalCents
        },
        orderItems
      );
      
      // Check for stock error (transaction rolled back)
      if ('error' in result) {
        return res.status(400).json({ error: result.error });
      }
      
      res.status(201).json({ 
        success: true, 
        orderId: result.order.id,
        order: result.order,
        message: 'Order placed successfully' 
      });
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  
  // Get order status
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrderWithItems(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  
  // ================================
  // ADMIN API - Orders
  // ================================
  
  app.get("/api/admin/orders", isAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  
  app.get("/api/admin/orders/:id", isAdmin, async (req, res) => {
    try {
      const order = await storage.getOrderWithItems(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  
  app.patch("/api/admin/orders/:id/status", isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!['pending', 'paid', 'shipped', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  return httpServer;
}

// ================================
// ADMIN PAGE TEMPLATES
// ================================

function getAdminProductsPage(products: any[], collections: any[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Products - Admin Panel</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
        .header { background: #000; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { font-size: 1.5rem; }
        .logout { background: transparent; border: 1px solid white; color: white; padding: 0.5rem 1rem; cursor: pointer; border-radius: 4px; }
        .nav { background: white; padding: 1rem 2rem; border-bottom: 1px solid #ddd; }
        .nav a { margin-right: 1.5rem; text-decoration: none; color: #333; font-weight: 500; }
        .nav a.active { color: #000; border-bottom: 2px solid #000; padding-bottom: 0.25rem; }
        .container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        .controls { margin-bottom: 1.5rem; }
        .btn { padding: 0.5rem 1rem; background: #000; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; text-decoration: none; display: inline-block; }
        .btn:hover { background: #333; }
        .btn-small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
        table { width: 100%; background: white; border-collapse: collapse; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f8f8; font-weight: 600; }
        .active-badge { display: inline-block; padding: 0.2rem 0.4rem; border-radius: 3px; font-size: 0.7rem; font-weight: 600; }
        .active-badge.yes { background: #d4edda; color: #155724; }
        .active-badge.no { background: #f8d7da; color: #721c24; }
        .variant-count { font-size: 0.85rem; color: #666; }
        .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 1000; }
        .modal.show { display: flex; }
        .modal-content { background: white; padding: 2rem; border-radius: 8px; max-width: 600px; width: 95%; max-height: 90vh; overflow-y: auto; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        input, select, textarea { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
        .checkbox-group { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem; }
        .checkbox-group label { font-weight: normal; display: flex; align-items: center; font-size: 0.85rem; }
        .checkbox-group input { width: auto; margin-right: 0.5rem; }
        .error-msg { color: #dc3545; font-size: 0.85rem; margin-top: 0.5rem; display: none; }
        .error-msg.show { display: block; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>VIPIESSE Admin Panel</h1>
        <button class="logout" onclick="logout()">Logout</button>
      </div>
      <div class="nav">
        <a href="/admin/products" class="active">Products</a>
        <a href="/admin/collections">Collections</a>
      </div>
      <div class="container">
        <div class="controls">
          <button class="btn" onclick="showCreateModal()">+ New Product</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Brand</th>
              <th>Variants</th>
              <th>Base Price</th>
              <th>Active</th>
              <th>Collections</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td><a href="/admin/products/${p.id}">${p.name}</a></td>
                <td>${p.brand || '-'}</td>
                <td class="variant-count">${p.variants?.length || 0} variant(s)</td>
                <td>${p.basePriceCents ? '€' + (p.basePriceCents / 100).toFixed(2) : '-'}</td>
                <td><span class="active-badge ${p.active ? 'yes' : 'no'}">${p.active ? 'Yes' : 'No'}</span></td>
                <td>${p.collections?.map((c: any) => c.name).join(', ') || '-'}</td>
                <td>
                  <a href="/admin/products/${p.id}" class="btn btn-small">Edit</a>
                  <button class="btn btn-small" onclick="deleteProduct(${p.id})">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div id="productModal" class="modal">
        <div class="modal-content">
          <h2>Create Product</h2>
          <form id="productForm">
            <div class="error-msg" id="formError"></div>
            <div class="form-group">
              <label>Name / Articolo *</label>
              <input type="text" id="name" required placeholder="e.g. ROMA TOPI WA20">
            </div>
            <div class="form-group">
              <label>Brand</label>
              <input type="text" id="brand" placeholder="e.g. Inblu">
            </div>
            <div class="form-group">
              <label>Base Price (€)</label>
              <input type="text" id="basePrice" placeholder="e.g. 14,90">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Collections</label>
              <div class="checkbox-group">
                ${collections.map(c => `
                  <label>
                    <input type="checkbox" name="collection" value="${c.id}">
                    ${c.name}
                  </label>
                `).join('')}
              </div>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
              <button type="submit" class="btn">Create & Edit Variants</button>
              <button type="button" class="btn" onclick="closeModal()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
      
      <script>
        async function logout() {
          await fetch('/api/admin/logout', { method: 'POST' });
          window.location.href = '/login';
        }
        
        function showCreateModal() {
          document.getElementById('productForm').reset();
          document.getElementById('formError').classList.remove('show');
          document.getElementById('productModal').classList.add('show');
        }
        
        function closeModal() {
          document.getElementById('productModal').classList.remove('show');
        }
        
        async function deleteProduct(id) {
          if (!confirm('Delete this product and all its variants?')) return;
          await fetch('/api/admin/products/' + id, { method: 'DELETE' });
          location.reload();
        }
        
        function parsePrice(str) {
          if (!str) return null;
          return Math.round(parseFloat(str.replace(',', '.')) * 100);
        }
        
        document.getElementById('productForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const errorDiv = document.getElementById('formError');
          errorDiv.classList.remove('show');
          
          const basePriceInput = document.getElementById('basePrice').value;
          const basePriceCents = basePriceInput ? parsePrice(basePriceInput) : null;
          
          const data = {
            name: document.getElementById('name').value,
            brand: document.getElementById('brand').value || null,
            description: document.getElementById('description').value || null,
            basePriceCents: basePriceCents,
            active: true
          };
          
          const collectionIds = Array.from(document.querySelectorAll('input[name="collection"]:checked'))
            .map(cb => parseInt(cb.value));
          
          try {
            const res = await fetch('/api/admin/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await res.json();
            
            if (!res.ok) {
              errorDiv.textContent = result.error || 'Failed to create product';
              errorDiv.classList.add('show');
              return;
            }
            
            // Assign collections
            if (collectionIds.length > 0) {
              await fetch('/api/admin/products/' + result.id + '/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionIds })
              });
            }
            
            // Redirect to product edit page
            window.location.href = '/admin/products/' + result.id;
          } catch (err) {
            errorDiv.textContent = 'Network error';
            errorDiv.classList.add('show');
          }
        });
      </script>
    </body>
    </html>
  `;
}

function getAdminProductEditPage(product: any, collections: any[]): string {
  const productCollectionIds = product.collections?.map((c: any) => c.id) || [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Edit ${product.name} - Admin Panel</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
        .header { background: #000; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { font-size: 1.5rem; }
        .logout { background: transparent; border: 1px solid white; color: white; padding: 0.5rem 1rem; cursor: pointer; border-radius: 4px; }
        .nav { background: white; padding: 1rem 2rem; border-bottom: 1px solid #ddd; }
        .nav a { margin-right: 1.5rem; text-decoration: none; color: #333; font-weight: 500; }
        .nav a.active { color: #000; border-bottom: 2px solid #000; padding-bottom: 0.25rem; }
        .container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        .btn { padding: 0.5rem 1rem; background: #000; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; text-decoration: none; display: inline-block; }
        .btn:hover { background: #333; }
        .btn-small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
        .btn-secondary { background: #6c757d; }
        .btn-danger { background: #dc3545; }
        .section { background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .section h3 { margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem; }
        input, select, textarea { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
        .checkbox-group { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem; }
        .checkbox-group label { font-weight: normal; display: flex; align-items: center; font-size: 0.85rem; }
        .checkbox-group input { width: auto; margin-right: 0.5rem; }
        table { width: 100%; border-collapse: collapse; }
        table th, table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
        table th { font-weight: 600; background: #f8f8f8; }
        .active-badge { display: inline-block; padding: 0.2rem 0.4rem; border-radius: 3px; font-size: 0.7rem; font-weight: 600; }
        .active-badge.yes { background: #d4edda; color: #155724; }
        .active-badge.no { background: #f8d7da; color: #721c24; }
        .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 1000; }
        .modal.show { display: flex; }
        .modal-content { background: white; padding: 2rem; border-radius: 8px; max-width: 500px; width: 95%; max-height: 90vh; overflow-y: auto; }
        .error-msg { color: #dc3545; font-size: 0.85rem; margin-bottom: 0.5rem; display: none; }
        .error-msg.show { display: block; }
        .image-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
        .image-item { display: flex; align-items: center; gap: 0.5rem; background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }
        .back-link { color: #666; text-decoration: none; margin-bottom: 1rem; display: inline-block; }
        .back-link:hover { color: #000; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>VIPIESSE Admin Panel</h1>
        <button class="logout" onclick="logout()">Logout</button>
      </div>
      <div class="nav">
        <a href="/admin/products" class="active">Products</a>
        <a href="/admin/collections">Collections</a>
      </div>
      <div class="container">
        <a href="/admin/products" class="back-link">← Back to Products</a>
        
        <!-- Product Details Section -->
        <div class="section">
          <h3>Product Details</h3>
          <form id="productForm">
            <div class="form-row">
              <div class="form-group">
                <label>Name / Articolo *</label>
                <input type="text" id="name" value="${product.name}" required>
              </div>
              <div class="form-group">
                <label>Brand</label>
                <input type="text" id="brand" value="${product.brand || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Base Price (€)</label>
                <input type="text" id="basePrice" value="${product.basePriceCents ? (product.basePriceCents / 100).toFixed(2) : ''}">
              </div>
              <div class="form-group">
                <label>Active</label>
                <select id="active">
                  <option value="true" ${product.active ? 'selected' : ''}>Yes</option>
                  <option value="false" ${!product.active ? 'selected' : ''}>No</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="description" rows="3">${product.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label>Collections</label>
              <div class="checkbox-group">
                ${collections.map(c => `
                  <label>
                    <input type="checkbox" name="collection" value="${c.id}" ${productCollectionIds.includes(c.id) ? 'checked' : ''}>
                    ${c.name}
                  </label>
                `).join('')}
              </div>
            </div>
            <button type="submit" class="btn">Save Product</button>
          </form>
        </div>
        
        <!-- Product Images Section -->
        <div class="section">
          <h3>Product Images</h3>
          <div id="imagesList" class="image-list">
            ${product.images?.map((img: any) => `
              <div class="image-item" data-id="${img.id}">
                <span>${img.imageUrl.substring(0, 40)}...</span>
                <button class="btn-small btn-danger" onclick="deleteImage(${img.id})">×</button>
              </div>
            `).join('') || '<p style="color: #666;">No images yet</p>'}
          </div>
          <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
            <input type="text" id="newImageUrl" placeholder="Image URL" style="flex: 1;">
            <button class="btn" onclick="addImage()">Add Image</button>
          </div>
        </div>
        
        <!-- Variants Section -->
        <div class="section">
          <h3>Variants (Color + Size Combinations)</h3>
          <button class="btn" onclick="showVariantModal()">+ Add Variant</button>
          <table style="margin-top: 1rem;">
            <thead>
              <tr>
                <th>Color</th>
                <th>Size</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="variantsList">
              ${product.variants?.map((v: any) => `
                <tr data-id="${v.id}">
                  <td>${v.color}</td>
                  <td>${v.size}</td>
                  <td>${v.sku}</td>
                  <td>${v.stockQty}</td>
                  <td>${v.priceCents ? '€' + (v.priceCents / 100).toFixed(2) : '-'}</td>
                  <td><span class="active-badge ${v.active ? 'yes' : 'no'}">${v.active ? 'Yes' : 'No'}</span></td>
                  <td>
                    <button class="btn btn-small" onclick="editVariant(${v.id})">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteVariant(${v.id})">Delete</button>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="7" style="color: #666;">No variants yet. Add color/size combinations.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Variant Modal -->
      <div id="variantModal" class="modal">
        <div class="modal-content">
          <h2 id="variantModalTitle">Add Variant</h2>
          <form id="variantForm">
            <input type="hidden" id="variantId">
            <div class="error-msg" id="variantError"></div>
            <div class="form-group">
              <label>Color *</label>
              <input type="text" id="variantColor" required placeholder="e.g. BORDEAUX">
            </div>
            <div class="form-group">
              <label>Size *</label>
              <input type="text" id="variantSize" required placeholder="e.g. 36/37">
            </div>
            <div class="form-group">
              <label>SKU * (unique)</label>
              <input type="text" id="variantSku" required placeholder="e.g. ROMATOPIWA20BO36">
            </div>
            <div class="form-group">
              <label>Stock Quantity</label>
              <input type="number" id="variantStock" min="0" value="0">
            </div>
            <div class="form-group">
              <label>Price (€) - leave empty to use base price</label>
              <input type="text" id="variantPrice" placeholder="e.g. 14,90">
            </div>
            <div class="form-group">
              <label>Active</label>
              <select id="variantActive">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              <button type="submit" class="btn">Save Variant</button>
              <button type="button" class="btn btn-secondary" onclick="closeVariantModal()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
      
      <script>
        const productId = ${product.id};
        const variants = ${JSON.stringify(product.variants || [])};
        
        async function logout() {
          await fetch('/api/admin/logout', { method: 'POST' });
          window.location.href = '/login';
        }
        
        function parsePrice(str) {
          if (!str) return null;
          const val = parseFloat(str.replace(',', '.'));
          return isNaN(val) ? null : Math.round(val * 100);
        }
        
        // Product form
        document.getElementById('productForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const basePriceInput = document.getElementById('basePrice').value;
          const data = {
            name: document.getElementById('name').value,
            brand: document.getElementById('brand').value || null,
            description: document.getElementById('description').value || null,
            basePriceCents: parsePrice(basePriceInput),
            active: document.getElementById('active').value === 'true'
          };
          
          const collectionIds = Array.from(document.querySelectorAll('input[name="collection"]:checked'))
            .map(cb => parseInt(cb.value));
          
          await fetch('/api/admin/products/' + productId, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          await fetch('/api/admin/products/' + productId + '/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collectionIds })
          });
          
          alert('Product saved!');
        });
        
        // Images
        async function addImage() {
          const url = document.getElementById('newImageUrl').value;
          if (!url) return;
          
          await fetch('/api/admin/products/' + productId + '/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: url })
          });
          
          location.reload();
        }
        
        async function deleteImage(id) {
          await fetch('/api/admin/product-images/' + id, { method: 'DELETE' });
          document.querySelector('.image-item[data-id="' + id + '"]').remove();
        }
        
        // Variants
        function showVariantModal() {
          document.getElementById('variantModalTitle').textContent = 'Add Variant';
          document.getElementById('variantForm').reset();
          document.getElementById('variantId').value = '';
          document.getElementById('variantStock').value = '0';
          document.getElementById('variantError').classList.remove('show');
          document.getElementById('variantModal').classList.add('show');
        }
        
        function editVariant(id) {
          const variant = variants.find(v => v.id === id);
          if (!variant) return;
          
          document.getElementById('variantModalTitle').textContent = 'Edit Variant';
          document.getElementById('variantId').value = id;
          document.getElementById('variantColor').value = variant.color;
          document.getElementById('variantSize').value = variant.size;
          document.getElementById('variantSku').value = variant.sku;
          document.getElementById('variantStock').value = variant.stockQty;
          document.getElementById('variantPrice').value = variant.priceCents ? (variant.priceCents / 100).toFixed(2) : '';
          document.getElementById('variantActive').value = variant.active.toString();
          document.getElementById('variantError').classList.remove('show');
          document.getElementById('variantModal').classList.add('show');
        }
        
        function closeVariantModal() {
          document.getElementById('variantModal').classList.remove('show');
        }
        
        async function deleteVariant(id) {
          if (!confirm('Delete this variant?')) return;
          await fetch('/api/admin/variants/' + id, { method: 'DELETE' });
          location.reload();
        }
        
        document.getElementById('variantForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const errorDiv = document.getElementById('variantError');
          errorDiv.classList.remove('show');
          
          const variantId = document.getElementById('variantId').value;
          const priceInput = document.getElementById('variantPrice').value;
          
          const data = {
            color: document.getElementById('variantColor').value,
            size: document.getElementById('variantSize').value,
            sku: document.getElementById('variantSku').value,
            stockQty: parseInt(document.getElementById('variantStock').value) || 0,
            priceCents: parsePrice(priceInput),
            active: document.getElementById('variantActive').value === 'true'
          };
          
          try {
            let res;
            if (variantId) {
              res = await fetch('/api/admin/variants/' + variantId, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
            } else {
              res = await fetch('/api/admin/products/' + productId + '/variants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
            }
            
            const result = await res.json();
            
            if (!res.ok) {
              errorDiv.textContent = result.error || 'Failed to save variant';
              errorDiv.classList.add('show');
              return;
            }
            
            location.reload();
          } catch (err) {
            errorDiv.textContent = 'Network error';
            errorDiv.classList.add('show');
          }
        });
      </script>
    </body>
    </html>
  `;
}

function getAdminCollectionsPage(collections: any[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Collections - Admin Panel</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
        .header { background: #000; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { font-size: 1.5rem; }
        .logout { background: transparent; border: 1px solid white; color: white; padding: 0.5rem 1rem; cursor: pointer; border-radius: 4px; }
        .nav { background: white; padding: 1rem 2rem; border-bottom: 1px solid #ddd; }
        .nav a { margin-right: 1.5rem; text-decoration: none; color: #333; font-weight: 500; }
        .nav a.active { color: #000; border-bottom: 2px solid #000; padding-bottom: 0.25rem; }
        .container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        .controls { margin-bottom: 1.5rem; }
        .btn { padding: 0.5rem 1rem; background: #000; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
        .btn:hover { background: #333; }
        table { width: 100%; background: white; border-collapse: collapse; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f8f8; font-weight: 600; }
        .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 1000; }
        .modal.show { display: flex; }
        .modal-content { background: white; padding: 2rem; border-radius: 8px; max-width: 500px; width: 95%; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        input, textarea { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>VIPIESSE Admin Panel</h1>
        <button class="logout" onclick="logout()">Logout</button>
      </div>
      <div class="nav">
        <a href="/admin/products">Products</a>
        <a href="/admin/collections" class="active">Collections</a>
      </div>
      <div class="container">
        <div class="controls">
          <button class="btn" onclick="showCreateModal()">+ New Collection</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${collections.map(c => `
              <tr>
                <td>${c.name}</td>
                <td>${c.slug}</td>
                <td>${c.description || '-'}</td>
                <td>
                  <button class="btn" onclick="editCollection(${c.id})">Edit</button>
                  <button class="btn" onclick="deleteCollection(${c.id})">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div id="collectionModal" class="modal">
        <div class="modal-content">
          <h2 id="modalTitle">Create Collection</h2>
          <form id="collectionForm">
            <input type="hidden" id="collectionId">
            <div class="form-group">
              <label>Name *</label>
              <input type="text" id="name" required>
            </div>
            <div class="form-group">
              <label>Slug *</label>
              <input type="text" id="slug" required placeholder="e.g. best-sellers">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="description" rows="2"></textarea>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              <button type="submit" class="btn">Save</button>
              <button type="button" class="btn" onclick="closeModal()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
      
      <script>
        const collections = ${JSON.stringify(collections)};
        
        async function logout() {
          await fetch('/api/admin/logout', { method: 'POST' });
          window.location.href = '/login';
        }
        
        function showCreateModal() {
          document.getElementById('modalTitle').textContent = 'Create Collection';
          document.getElementById('collectionForm').reset();
          document.getElementById('collectionId').value = '';
          document.getElementById('collectionModal').classList.add('show');
        }
        
        function editCollection(id) {
          const collection = collections.find(c => c.id === id);
          if (!collection) return;
          
          document.getElementById('modalTitle').textContent = 'Edit Collection';
          document.getElementById('collectionId').value = id;
          document.getElementById('name').value = collection.name;
          document.getElementById('slug').value = collection.slug;
          document.getElementById('description').value = collection.description || '';
          document.getElementById('collectionModal').classList.add('show');
        }
        
        function closeModal() {
          document.getElementById('collectionModal').classList.remove('show');
        }
        
        async function deleteCollection(id) {
          if (!confirm('Delete this collection?')) return;
          await fetch('/api/admin/collections/' + id, { method: 'DELETE' });
          location.reload();
        }
        
        document.getElementById('collectionForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const id = document.getElementById('collectionId').value;
          
          const data = {
            name: document.getElementById('name').value,
            slug: document.getElementById('slug').value,
            description: document.getElementById('description').value || null
          };
          
          if (id) {
            await fetch('/api/admin/collections/' + id, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
          } else {
            await fetch('/api/admin/collections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
          }
          
          location.reload();
        });
      </script>
    </body>
    </html>
  `;
}
