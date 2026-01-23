import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import cookieParser from "cookie-parser";
import { insertProductSchema, insertCollectionSchema } from "@shared/schema";

// Extend Express Request type to include session
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      adminEmail?: string;
    }
  }
}

// Admin authentication middleware
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

  // Public API routes - Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const activeProducts = products.filter(p => p.active);
      res.json(activeProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product || !product.active) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const products = await storage.getProductsByCategory(req.params.category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
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

  // Public API routes - Collections
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

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;

    // Check credentials against environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ error: "Admin credentials not configured" });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Delete any expired sessions
    await storage.deleteExpiredSessions();

    // Create session (expires in 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await storage.createSession(email, expiresAt);

    // Set httpOnly cookie
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

  // Admin API routes - Products
  app.get("/api/admin/products", isAdmin, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", isAdmin, async (req, res) => {
    try {
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validated);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.patch("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
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
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Admin API routes - Collections
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

  // Admin API routes - Product-Collection relationships
  app.post("/api/admin/products/:productId/collections", isAdmin, async (req, res) => {
    try {
      const { collectionIds } = req.body;
      const productId = req.params.productId;

      // Clear existing collections
      await storage.clearProductCollections(productId);

      // Add new collections
      for (let i = 0; i < collectionIds.length; i++) {
        await storage.assignProductToCollection(productId, collectionIds[i], i);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update product collections" });
    }
  });

  app.get("/api/admin/products/:productId/collections", isAdmin, async (req, res) => {
    try {
      const collections = await storage.getCollectionsByProduct(req.params.productId);
      res.json(collections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product collections" });
    }
  });

  // HTML Admin Panel Routes
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
          .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
          h1 { margin-bottom: 1.5rem; color: #333; }
          .form-group { margin-bottom: 1rem; }
          label { display: block; margin-bottom: 0.5rem; color: #666; font-weight: 500; }
          input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
          input:focus { outline: none; border-color: #000; }
          button { width: 100%; padding: 0.75rem; background: #000; color: white; border: none; border-radius: 4px; font-size: 1rem; font-weight: 500; cursor: pointer; margin-top: 1rem; }
          button:hover { background: #333; }
          .error { color: #dc3545; margin-top: 1rem; display: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Admin Login</h1>
          <form id="loginForm">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Login</button>
            <div class="error" id="error"></div>
          </form>
        </div>
        <script>
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error');
            
            try {
              const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              });
              
              const data = await response.json();
              
              if (response.ok) {
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

  // Admin middleware for HTML routes
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
          .logout:hover { background: rgba(255,255,255,0.1); }
          .nav { background: white; padding: 1rem 2rem; border-bottom: 1px solid #ddd; }
          .nav a { margin-right: 1.5rem; text-decoration: none; color: #333; font-weight: 500; }
          .nav a.active { color: #000; border-bottom: 2px solid #000; padding-bottom: 0.25rem; }
          .container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
          h2 { margin-bottom: 1.5rem; }
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
          <p>Use the navigation above to manage products and collections.</p>
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

  app.get("/admin/products", isAdminHTML, async (req, res) => {
    const products = await storage.getAllProducts();
    const collections = await storage.getAllCollections();
    
    res.send(`
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
          .logout:hover { background: rgba(255,255,255,0.1); }
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
          .active-badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.75rem; font-weight: 600; }
          .active-badge.yes { background: #d4edda; color: #155724; }
          .active-badge.no { background: #f8d7da; color: #721c24; }
          .actions button { margin-right: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.85rem; }
          .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; }
          .modal.show { display: flex; }
          .modal-content { background: white; padding: 2rem; border-radius: 8px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; }
          .form-group { margin-bottom: 1rem; }
          label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
          input, select, textarea { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
          .checkbox-group { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem; }
          .checkbox-group label { font-weight: normal; display: flex; align-items: center; }
          .checkbox-group input { width: auto; margin-right: 0.5rem; }
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
                <th>Price</th>
                <th>Category</th>
                <th>Active</th>
                <th>Collections</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td>€${(p.priceCents / 100).toFixed(2)}</td>
                  <td>${p.category}</td>
                  <td><span class="active-badge ${p.active ? 'yes' : 'no'}">${p.active ? 'Yes' : 'No'}</span></td>
                  <td><button class="btn" onclick="editCollections('${p.id}')">Edit</button></td>
                  <td class="actions">
                    <button class="btn" onclick="editProduct('${p.id}')">Edit</button>
                    <button class="btn" onclick="deleteProduct('${p.id}')">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div id="productModal" class="modal">
          <div class="modal-content">
            <h2 id="modalTitle">Create Product</h2>
            <form id="productForm">
              <input type="hidden" id="productId">
              <div class="form-group">
                <label>Name</label>
                <input type="text" id="name" required>
              </div>
              <div class="form-group">
                <label>Price (€)</label>
                <input type="number" step="0.01" id="price" required>
              </div>
              <div class="form-group">
                <label>Category</label>
                <select id="category" required>
                  <option value="donna">Donna</option>
                  <option value="uomo">Uomo</option>
                  <option value="bambino">Bambino</option>
                </select>
              </div>
              <div class="form-group">
                <label>Brand</label>
                <input type="text" id="brand" required>
              </div>
              <div class="form-group">
                <label>Active</label>
                <select id="active">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <button type="submit" class="btn">Save</button>
              <button type="button" class="btn" onclick="closeModal()">Cancel</button>
            </form>
          </div>
        </div>
        
        <div id="collectionsModal" class="modal">
          <div class="modal-content">
            <h2>Assign Collections</h2>
            <form id="collectionsForm">
              <input type="hidden" id="collectionProductId">
              <div class="checkbox-group">
                ${collections.map(c => `
                  <label>
                    <input type="checkbox" name="collection" value="${c.id}">
                    ${c.name}
                  </label>
                `).join('')}
              </div>
              <button type="submit" class="btn" style="margin-top: 1rem;">Save</button>
              <button type="button" class="btn" onclick="closeCollectionsModal()">Cancel</button>
            </form>
          </div>
        </div>
        
        <script>
          const products = ${JSON.stringify(products)};
          
          async function logout() {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = '/login';
          }
          
          function showCreateModal() {
            document.getElementById('modalTitle').textContent = 'Create Product';
            document.getElementById('productForm').reset();
            document.getElementById('productId').value = '';
            document.getElementById('productModal').classList.add('show');
          }
          
          function editProduct(id) {
            const product = products.find(p => p.id === id);
            document.getElementById('modalTitle').textContent = 'Edit Product';
            document.getElementById('productId').value = id;
            document.getElementById('name').value = product.name;
            document.getElementById('price').value = (product.priceCents / 100).toFixed(2);
            document.getElementById('category').value = product.category;
            document.getElementById('brand').value = product.brand;
            document.getElementById('active').value = product.active.toString();
            document.getElementById('productModal').classList.add('show');
          }
          
          function closeModal() {
            document.getElementById('productModal').classList.remove('show');
          }
          
          async function deleteProduct(id) {
            if (!confirm('Are you sure?')) return;
            await fetch('/api/admin/products/' + id, { method: 'DELETE' });
            location.reload();
          }
          
          async function editCollections(productId) {
            document.getElementById('collectionProductId').value = productId;
            const response = await fetch('/api/admin/products/' + productId + '/collections');
            const productCollections = await response.json();
            const checkboxes = document.querySelectorAll('#collectionsForm input[type="checkbox"]');
            checkboxes.forEach(cb => {
              cb.checked = productCollections.some(c => c.id == cb.value);
            });
            document.getElementById('collectionsModal').classList.add('show');
          }
          
          function closeCollectionsModal() {
            document.getElementById('collectionsModal').classList.remove('show');
          }
          
          document.getElementById('productForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('productId').value;
            const data = {
              name: document.getElementById('name').value,
              priceCents: Math.round(parseFloat(document.getElementById('price').value) * 100),
              category: document.getElementById('category').value,
              brand: document.getElementById('brand').value,
              active: document.getElementById('active').value === 'true',
              image: '/placeholder.jpg',
              sizes: ['36', '37', '38', '39', '40', '41'],
              description: '',
              sku: '',
              gallery: [],
              colors: [],
              isBestSeller: false,
              isNewSeason: false,
              isOutlet: false
            };
            
            if (id) {
              await fetch('/api/admin/products/' + id, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
            } else {
              await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
            }
            location.reload();
          });
          
          document.getElementById('collectionsForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const productId = document.getElementById('collectionProductId').value;
            const collectionIds = Array.from(document.querySelectorAll('#collectionsForm input:checked'))
              .map(cb => parseInt(cb.value));
            
            await fetch('/api/admin/products/' + productId + '/collections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ collectionIds })
            });
            closeCollectionsModal();
          });
        </script>
      </body>
      </html>
    `);
  });

  app.get("/admin/collections", isAdminHTML, async (req, res) => {
    const collections = await storage.getAllCollections();
    
    res.send(`
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
          .logout:hover { background: rgba(255,255,255,0.1); }
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
          .actions button { margin-right: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.85rem; }
          .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; }
          .modal.show { display: flex; }
          .modal-content { background: white; padding: 2rem; border-radius: 8px; max-width: 500px; width: 90%; }
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
                  <td class="actions">
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
                <label>Name</label>
                <input type="text" id="name" required>
              </div>
              <div class="form-group">
                <label>Slug</label>
                <input type="text" id="slug" required>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea id="description" rows="3"></textarea>
              </div>
              <button type="submit" class="btn">Save</button>
              <button type="button" class="btn" onclick="closeModal()">Cancel</button>
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
            if (!confirm('Are you sure?')) return;
            await fetch('/api/admin/collections/' + id, { method: 'DELETE' });
            location.reload();
          }
          
          document.getElementById('collectionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('collectionId').value;
            const data = {
              name: document.getElementById('name').value,
              slug: document.getElementById('slug').value,
              description: document.getElementById('description').value
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
    `);
  });

  return httpServer;
}
