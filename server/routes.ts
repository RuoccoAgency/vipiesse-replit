import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import cookieParser from "cookie-parser";
import { insertProductSchema, insertProductVariantSchema, insertCollectionSchema, insertContactMessageSchema } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local file storage
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato. Usa JPG, PNG, WebP o GIF.'));
    }
  }
});

declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      adminEmail?: string;
      userId?: number;
      userEmail?: string;
    }
  }
}

// Generate unique order number
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VIP-${year}${month}${day}-${random}`;
}

// User authentication middleware
async function isUser(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies.user_session;
  
  if (!sessionId) {
    return res.status(401).json({ error: "Non autenticato" });
  }

  const session = await storage.getSession(sessionId);
  
  if (!session || session.expiresAt < new Date()) {
    res.clearCookie("user_session");
    return res.status(401).json({ error: "Sessione scaduta" });
  }

  req.sessionId = sessionId;
  req.userEmail = session.email;
  req.userId = session.userId || undefined;
  next();
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
  
  // Serve uploaded images statically
  app.use('/uploads', express.static(uploadsDir));
  
  // Register object storage routes for image uploads
  registerObjectStorageRoutes(app);
  
  // Bank info endpoint for checkout
  app.get("/api/bank-info", (req, res) => {
    res.json({
      iban: process.env.BANK_IBAN || "",
      accountHolder: process.env.BANK_ACCOUNT_NAME || "",
      bankName: process.env.BANK_NAME || "",
    });
  });

  // ================================
  // USER AUTHENTICATION API
  // ================================
  
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, surname, phone } = req.body;
      
      if (!email || !password || !name || !surname) {
        return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "La password deve avere almeno 6 caratteri" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email già registrata" });
      }
      
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser(email, passwordHash, name, surname, phone);
      
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const session = await storage.createSession(email, expiresAt, user.id, false);
      
      res.cookie("user_session", session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email, name: user.name, surname: user.surname } 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Errore durante la registrazione" });
    }
  });
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email e password sono obbligatori" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }
      
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const session = await storage.createSession(email, expiresAt, user.id, false);
      
      res.cookie("user_session", session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email, name: user.name, surname: user.surname } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Errore durante il login" });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    const sessionId = req.cookies.user_session;
    if (sessionId) {
      await storage.deleteSession(sessionId);
    }
    res.clearCookie("user_session");
    res.json({ success: true });
  });
  
  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    const sessionId = req.cookies.user_session;
    if (!sessionId) {
      return res.json({ user: null });
    }
    
    const session = await storage.getSession(sessionId);
    if (!session || session.expiresAt < new Date()) {
      res.clearCookie("user_session");
      return res.json({ user: null });
    }
    
    if (session.userId) {
      const user = await storage.getUserById(session.userId);
      if (user) {
        return res.json({ 
          user: { id: user.id, email: user.email, name: user.name, surname: user.surname } 
        });
      }
    }
    
    res.json({ user: null });
  });
  
  // Get user's orders
  app.get("/api/my/orders", isUser, async (req, res) => {
    try {
      let orders;
      if (req.userId) {
        orders = await storage.getOrdersByUserId(req.userId);
      } else if (req.userEmail) {
        orders = await storage.getOrdersByEmail(req.userEmail);
      } else {
        return res.json([]);
      }
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero degli ordini" });
    }
  });

  // Get user's order with items
  app.get("/api/my/orders/:orderNumber", isUser, async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const order = await storage.getOrderByNumber(orderNumber);
      
      if (!order) {
        return res.status(404).json({ error: "Ordine non trovato" });
      }
      
      // Verify user owns this order
      if (req.userId && order.userId !== req.userId) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
      if (req.userEmail && order.customerEmail !== req.userEmail) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
      
      const items = await storage.getOrderItems(order.id);
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dell'ordine" });
    }
  });

  // ================================
  // SAVED ITEMS (WISHLIST) API
  // ================================
  
  // Get user's saved items
  app.get("/api/my/saved", isUser, async (req, res) => {
    try {
      if (!req.userId) {
        return res.json([]);
      }
      const savedProducts = await storage.getSavedItemsWithProducts(req.userId);
      res.json(savedProducts);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei preferiti" });
    }
  });
  
  // Check if a product is saved
  app.get("/api/my/saved/:productId", isUser, async (req, res) => {
    try {
      if (!req.userId) {
        return res.json({ saved: false });
      }
      const productId = parseInt(req.params.productId);
      const isSaved = await storage.isProductSaved(req.userId, productId);
      res.json({ saved: isSaved });
    } catch (error) {
      res.status(500).json({ error: "Errore" });
    }
  });
  
  // Add product to saved items
  app.post("/api/my/saved/:productId", isUser, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Devi essere loggato" });
      }
      const productId = parseInt(req.params.productId);
      
      // Verify product exists
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ error: "Prodotto non trovato" });
      }
      
      await storage.addSavedItem(req.userId, productId);
      res.json({ success: true, saved: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nel salvataggio" });
    }
  });
  
  // Remove product from saved items
  app.delete("/api/my/saved/:productId", isUser, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Devi essere loggato" });
      }
      const productId = parseInt(req.params.productId);
      await storage.removeSavedItem(req.userId, productId);
      res.json({ success: true, saved: false });
    } catch (error) {
      res.status(500).json({ error: "Errore nella rimozione" });
    }
  });

  // ================================
  // USER DASHBOARD API
  // ================================
  
  // Get dashboard summary data
  app.get("/api/my/dashboard", isUser, async (req, res) => {
    try {
      if (!req.userId) {
        return res.json({ orders: [], savedItems: [], orderCount: 0, savedCount: 0 });
      }
      
      const [orders, savedProducts] = await Promise.all([
        storage.getOrdersByUserId(req.userId),
        storage.getSavedItemsWithProducts(req.userId)
      ]);
      
      res.json({
        orders: orders.slice(0, 5), // Last 5 orders
        savedItems: savedProducts.slice(0, 4), // First 4 saved items
        orderCount: orders.length,
        savedCount: savedProducts.length
      });
    } catch (error) {
      res.status(500).json({ error: "Errore nel caricamento della dashboard" });
    }
  });

  // ================================
  // CONTACT FORM API
  // ================================
  
  app.post("/api/contact", async (req, res) => {
    try {
      const result = insertContactMessageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }
      
      const { name, email, message } = result.data;
      const contactMessage = await storage.createContactMessage(name, email, message);
      
      res.json({ success: true, id: contactMessage.id });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Errore nell'invio del messaggio" });
    }
  });
  
  // Admin: Get all contact messages
  app.get("/api/admin/contacts", isAdmin, async (req, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei messaggi" });
    }
  });
  
  // Admin: Update contact message status
  app.patch("/api/admin/contacts/:id/status", isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const updated = await storage.updateContactMessageStatus(parseInt(req.params.id), status);
      if (!updated) {
        return res.status(404).json({ error: "Messaggio non trovato" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Errore nell'aggiornamento" });
    }
  });

  // ================================
  // FILE UPLOAD API (multer) - Admin only
  // ================================
  app.post("/api/upload", isAdmin, upload.array("images", 20), (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }
      
      const uploadedFiles = files.map(file => ({
        filename: file.filename,
        url: `/uploads/${file.filename}`,
        originalName: file.originalname,
        size: file.size
      }));
      
      res.json({ success: true, files: uploadedFiles });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Errore durante il caricamento" });
    }
  });
  
  // Error handler for multer
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "File troppo grande. Massimo 10MB." });
      }
      return res.status(400).json({ error: err.message });
    }
    next(err);
  });

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
    const isFormSubmit = req.headers['content-type']?.includes('application/x-www-form-urlencoded');

    console.log("[LOGIN] Attempt with email:", email);
    console.log("[LOGIN] Admin email configured:", adminEmail ? "YES" : "NO");
    console.log("[LOGIN] Admin password configured:", adminPassword ? "YES" : "NO");

    if (!adminEmail || !adminPassword) {
      console.log("[LOGIN] ERROR: Admin credentials not configured");
      if (isFormSubmit) return res.redirect('/login?error=1');
      return res.status(500).json({ error: "Admin credentials not configured" });
    }

    if (email !== adminEmail || password !== adminPassword) {
      console.log("[LOGIN] ERROR: Invalid credentials - email match:", email === adminEmail, "password match:", password === adminPassword);
      if (isFormSubmit) return res.redirect('/login?error=1');
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    console.log("[LOGIN] SUCCESS for:", email);

    await storage.deleteExpiredSessions();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await storage.createSession(email, expiresAt);

    res.cookie("admin_session", session.id, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      expires: expiresAt,
      path: "/"
    });

    // Form submit gets redirect, JSON requests get JSON response
    if (isFormSubmit) {
      res.redirect('/admin');
    } else {
      res.json({ success: true, email });
    }
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

  app.get("/api/admin/products/:productId/max-image-order", isAdmin, async (req, res) => {
    try {
      const maxOrder = await storage.getMaxImageSortOrder(parseInt(req.params.productId));
      res.json({ maxOrder });
    } catch (error) {
      res.status(500).json({ error: "Failed to get max order" });
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
          <div class="error" id="error">${req.query.error ? 'Credenziali non valide' : ''}</div>
          <form method="POST" action="/api/admin/login">
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" name="password" required>
            </div>
            <button type="submit" class="btn">Login</button>
          </form>
        </div>
        <script>
          const err = document.getElementById('error');
          if (err.textContent.trim()) err.style.display = 'block';
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
          <a href="/admin/products">Products</a>
          <a href="/admin/collections">Collections</a>
          <a href="/admin/orders">Orders</a>
          <a href="/admin/contacts">Contacts</a>
        </div>
        <div class="container">
          <h2>Welcome, ${req.adminEmail}</h2>
          <p style="margin-top: 1rem;">Use the navigation above to manage products, collections, orders and contact messages.</p>
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

  // Admin Orders page
  app.get("/admin/orders", isAdminHTML, async (req, res) => {
    const orders = await storage.getAllOrders();
    res.send(getAdminOrdersPage(orders));
  });

  // Admin Order Detail page
  app.get("/admin/orders/:id", isAdminHTML, async (req, res) => {
    const order = await storage.getOrderWithItems(parseInt(req.params.id));
    if (!order) {
      return res.redirect('/admin/orders');
    }
    res.send(getAdminOrderDetailPage(order));
  });

  // Admin Contacts page
  app.get("/admin/contacts", isAdminHTML, async (req, res) => {
    const contacts = await storage.getAllContactMessages();
    res.send(getAdminContactsPage(contacts));
  });

  // ================================
  // PUBLIC API - Orders (Checkout)
  // ================================
  
  // Create order with stock validation and decrement (transactional)
  app.post("/api/orders", async (req, res) => {
    try {
      const { 
        items, 
        customerEmail, 
        customerName, 
        customerSurname,
        customerPhone, 
        shippingAddress, 
        shippingCity,
        shippingCap,
        status, 
        paymentMethod 
      } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Il carrello è vuoto" });
      }
      
      if (!customerEmail || !customerName) {
        return res.status(400).json({ error: "Email e nome sono obbligatori" });
      }
      
      if (!shippingAddress) {
        return res.status(400).json({ error: "Indirizzo di spedizione obbligatorio" });
      }
      
      // Validate status and paymentMethod to prevent client-side manipulation
      const allowedStatuses = ['pending_payment', 'awaiting_bank'];
      const allowedPaymentMethods = ['bank_transfer'];
      
      const validatedStatus = status && allowedStatuses.includes(status) ? status : 'pending_payment';
      const validatedPaymentMethod = paymentMethod && allowedPaymentMethods.includes(paymentMethod) ? paymentMethod : 'bank_transfer';
      
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
      const orderItems: { variantId: number; productName: string; variantSku: string; variantColor: string; variantSize: string; quantity: number; priceCents: number; imageUrl?: string }[] = [];
      let subtotalCents = 0;
      
      for (const item of items) {
        const variant = await storage.getVariantById(item.variantId);
        if (!variant) {
          return res.status(400).json({ error: `Prodotto non trovato` });
        }
        if (!variant.active) {
          return res.status(400).json({ error: `Prodotto ${variant.sku} non disponibile` });
        }
        if (variant.stockQty < item.quantity) {
          return res.status(400).json({ 
            error: `Stock insufficiente per ${variant.sku}. Disponibili: ${variant.stockQty}` 
          });
        }
        
        const product = await storage.getProductById(variant.productId);
        if (!product || !product.active) {
          return res.status(400).json({ error: `Prodotto non disponibile` });
        }
        
        // Get product image
        const images = await storage.getImagesByProduct(product.id);
        const imageUrl = images.length > 0 ? images[0].imageUrl : undefined;
        
        const priceCents = variant.priceCents || product.basePriceCents || 0;
        subtotalCents += priceCents * item.quantity;
        
        orderItems.push({
          variantId: item.variantId,
          productName: product.name,
          variantSku: variant.sku,
          variantColor: variant.color,
          variantSize: variant.size,
          quantity: item.quantity,
          priceCents,
          imageUrl
        });
      }
      
      // Calculate shipping (free over 50€)
      const shippingCents = subtotalCents >= 5000 ? 0 : 590;
      const totalCents = subtotalCents + shippingCents;
      
      if (totalCents <= 0) {
        return res.status(400).json({ error: "Il totale dell'ordine non può essere zero" });
      }
      
      // Generate unique order number
      const orderNumber = generateOrderNumber();
      
      // Get user ID from session if logged in
      const sessionId = req.cookies.user_session;
      let userId: number | null = null;
      if (sessionId) {
        const session = await storage.getSession(sessionId);
        if (session && session.userId && session.expiresAt > new Date()) {
          userId = session.userId;
        }
      }
      
      // Create order with items in a single transaction (stock decrement included)
      const result = await storage.createOrderWithItems(
        {
          orderNumber,
          userId,
          status: validatedStatus,
          paymentMethod: validatedPaymentMethod,
          customerEmail,
          customerName,
          customerSurname: customerSurname || null,
          customerPhone: customerPhone || null,
          shippingAddress,
          shippingCity: shippingCity || null,
          shippingCap: shippingCap || null,
          subtotalCents,
          shippingCents,
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
        orderNumber: result.order.orderNumber,
        totalCents: result.order.totalCents,
        order: result.order,
        message: 'Ordine creato con successo' 
      });
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(500).json({ error: "Errore durante la creazione dell'ordine" });
    }
  });
  
  // Get order by order number (for order confirmation pages)
  app.get("/api/orders/by-number/:orderNumber", async (req, res) => {
    try {
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ error: "Ordine non trovato" });
      }
      const items = await storage.getOrderItems(order.id);
      res.json({ order: { ...order, items } });
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dell'ordine" });
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
        <a href="/admin/orders">Orders</a>
        <a href="/admin/contacts">Contacts</a>
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
        .image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; margin: 1rem 0; }
        .image-card { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #f0f0f0; border: 2px solid #e0e0e0; }
        .image-card img { width: 100%; height: 100%; object-fit: cover; }
        .image-delete-btn { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; font-size: 16px; line-height: 1; }
        .image-delete-btn:hover { background: #dc2626; }
        .drop-zone { border: 2px dashed #ccc; border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.3s; margin-top: 1rem; background: #fafafa; }
        .drop-zone:hover, .drop-zone.dragover { border-color: #2563eb; background: #eff6ff; }
        .drop-zone-content { color: #666; }
        .drop-zone-content svg { color: #9ca3af; margin-bottom: 0.5rem; }
        .drop-zone.dragover svg { color: #2563eb; }
        .browse-link { color: #2563eb; text-decoration: underline; cursor: pointer; }
        .drop-hint { font-size: 0.75rem; color: #9ca3af; margin-top: 0.5rem; }
        .upload-progress { margin-top: 1rem; }
        .progress-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: #2563eb; width: 0%; transition: width 0.3s; }
        .progress-text { display: block; font-size: 0.85rem; color: #666; margin-top: 0.5rem; }
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
        <a href="/admin/orders">Orders</a>
        <a href="/admin/contacts">Contacts</a>
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
          <div id="imagesList" class="image-grid">
            ${product.images?.map((img: any) => `
              <div class="image-card" data-id="${img.id}">
                <img src="${img.imageUrl}" alt="Product image" onerror="this.src='https://via.placeholder.com/150?text=Error'">
                <button class="image-delete-btn" onclick="deleteImage(${img.id})">×</button>
              </div>
            `).join('') || '<p style="color: #666; grid-column: 1/-1;">No images yet. Upload images below.</p>'}
          </div>
          
          <!-- Drag & Drop Upload Area -->
          <div id="dropZone" class="drop-zone">
            <input type="file" id="fileInput" multiple accept="image/*" style="display: none;">
            <div class="drop-zone-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>Trascina le immagini qui o <span class="browse-link">clicca per selezionare</span></p>
              <p class="drop-hint">Formati supportati: JPG, PNG, WebP (max 10MB)</p>
            </div>
          </div>
          <div id="uploadProgress" class="upload-progress" style="display: none;">
            <div class="progress-bar"><div class="progress-fill"></div></div>
            <span class="progress-text">Caricamento...</span>
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
        
        // Images - Drag & Drop Upload
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const uploadProgress = document.getElementById('uploadProgress');
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        // Click to browse
        dropZone.addEventListener('click', () => fileInput.click());
        
        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
          dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'));
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
          dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
        });
        
        dropZone.addEventListener('drop', handleDrop);
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
        
        function handleDrop(e) {
          const files = e.dataTransfer.files;
          handleFiles(files);
        }
        
        async function handleFiles(files) {
          const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
          if (imageFiles.length === 0) {
            alert('Seleziona almeno un file immagine');
            return;
          }
          
          // Validate file sizes (max 10MB)
          const maxSize = 10 * 1024 * 1024;
          const validFiles = imageFiles.filter(f => {
            if (f.size > maxSize) {
              alert(f.name + ' supera il limite di 10MB');
              return false;
            }
            return true;
          });
          
          if (validFiles.length === 0) return;
          
          uploadProgress.style.display = 'block';
          progressText.textContent = 'Caricamento in corso...';
          progressFill.style.width = '10%';
          
          try {
            // Upload all files at once using FormData
            const formData = new FormData();
            validFiles.forEach(file => {
              formData.append('images', file);
            });
            
            progressFill.style.width = '30%';
            
            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });
            
            if (!uploadRes.ok) {
              const errData = await uploadRes.json();
              throw new Error(errData.error || 'Errore durante il caricamento');
            }
            
            const result = await uploadRes.json();
            progressFill.style.width = '60%';
            
            // Get current max sortOrder to assign new orders
            const maxOrderRes = await fetch('/api/admin/products/' + productId + '/max-image-order');
            const maxOrderData = await maxOrderRes.json();
            let nextOrder = (maxOrderData.maxOrder ?? -1) + 1;
            
            // Save each uploaded image to the database with sortOrder
            let saved = 0;
            for (const file of result.files) {
              const saveRes = await fetch('/api/admin/products/' + productId + '/images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: file.url, sortOrder: nextOrder++ })
              });
              
              if (saveRes.ok) {
                saved++;
                // Add preview immediately
                const imagesList = document.getElementById('imagesList');
                const noImagesMsg = imagesList.querySelector('p');
                if (noImagesMsg) noImagesMsg.remove();
                
                const imgCard = document.createElement('div');
                imgCard.className = 'image-card';
                imgCard.innerHTML = '<img src="' + file.url + '" alt="Product image"><button class="image-delete-btn" onclick="this.parentElement.remove()">×</button>';
                imagesList.appendChild(imgCard);
              }
            }
            
            progressFill.style.width = '100%';
            progressText.textContent = 'Caricate ' + saved + ' immagini!';
            
            setTimeout(() => {
              uploadProgress.style.display = 'none';
              progressFill.style.width = '0%';
            }, 2000);
            
          } catch (err) {
            console.error('Upload failed:', err);
            progressText.textContent = 'Errore: ' + err.message;
            progressFill.style.background = '#ef4444';
            
            setTimeout(() => {
              uploadProgress.style.display = 'none';
              progressFill.style.width = '0%';
              progressFill.style.background = '#2563eb';
            }, 3000);
          }
        }
        
        async function deleteImage(id) {
          if (!confirm('Eliminare questa immagine?')) return;
          await fetch('/api/admin/product-images/' + id, { method: 'DELETE' });
          document.querySelector('.image-card[data-id="' + id + '"]').remove();
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
        <a href="/admin/orders">Orders</a>
        <a href="/admin/contacts">Contacts</a>
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

// Admin Orders Page
function getAdminOrdersPage(orders: any[]): string {
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending_payment: { label: "In attesa pagamento", color: "#ffc107" },
    awaiting_bank: { label: "Attesa bonifico", color: "#17a2b8" },
    paid: { label: "Pagato", color: "#28a745" },
    shipped: { label: "Spedito", color: "#6f42c1" },
    completed: { label: "Completato", color: "#6c757d" },
    cancelled: { label: "Annullato", color: "#dc3545" },
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orders - Admin Panel</title>
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
        table { width: 100%; background: white; border-collapse: collapse; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f8f8; font-weight: 600; }
        .status-badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: white; }
        .btn { padding: 0.5rem 1rem; background: #000; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; text-decoration: none; display: inline-block; }
        .btn:hover { background: #333; }
        .btn-small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
        select { padding: 0.25rem 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>VIPIESSE Admin Panel</h1>
        <button class="logout" onclick="logout()">Logout</button>
      </div>
      <div class="nav">
        <a href="/admin/products">Products</a>
        <a href="/admin/collections">Collections</a>
        <a href="/admin/orders" class="active">Orders</a>
        <a href="/admin/contacts">Contacts</a>
      </div>
      <div class="container">
        <h2 style="margin-bottom: 1rem;">Orders (${orders.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orders.length === 0 ? '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No orders yet</td></tr>' : orders.map(o => {
              const status = statusLabels[o.status] || { label: o.status, color: "#666" };
              const date = new Date(o.createdAt).toLocaleDateString('it-IT');
              return `
                <tr>
                  <td><a href="/admin/orders/${o.id}"><strong>${o.orderNumber}</strong></a></td>
                  <td>${date}</td>
                  <td>${o.customerName} ${o.customerSurname}<br><small>${o.customerEmail}</small></td>
                  <td>€${(o.totalCents / 100).toFixed(2)}</td>
                  <td>${o.paymentMethod === 'paypal' ? 'PayPal' : 'Bonifico'}</td>
                  <td>
                    <select onchange="updateStatus(${o.id}, this.value)" style="background-color: ${status.color}; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px;">
                      <option value="pending_payment" ${o.status === 'pending_payment' ? 'selected' : ''}>In attesa pagamento</option>
                      <option value="awaiting_bank" ${o.status === 'awaiting_bank' ? 'selected' : ''}>Attesa bonifico</option>
                      <option value="paid" ${o.status === 'paid' ? 'selected' : ''}>Pagato</option>
                      <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Spedito</option>
                      <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Completato</option>
                      <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Annullato</option>
                    </select>
                  </td>
                  <td>
                    <a href="/admin/orders/${o.id}" class="btn btn-small">View</a>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <script>
        async function logout() {
          await fetch('/api/admin/logout', { method: 'POST' });
          window.location.href = '/login';
        }
        
        async function updateStatus(id, status) {
          await fetch('/api/admin/orders/' + id + '/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
          location.reload();
        }
      </script>
    </body>
    </html>
  `;
}

// Admin Order Detail Page
function getAdminOrderDetailPage(order: any): string {
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending_payment: { label: "In attesa pagamento", color: "#ffc107" },
    awaiting_bank: { label: "Attesa bonifico", color: "#17a2b8" },
    paid: { label: "Pagato", color: "#28a745" },
    shipped: { label: "Spedito", color: "#6f42c1" },
    completed: { label: "Completato", color: "#6c757d" },
    cancelled: { label: "Annullato", color: "#dc3545" },
  };
  
  const status = statusLabels[order.status] || { label: order.status, color: "#666" };
  const date = new Date(order.createdAt).toLocaleDateString('it-IT', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order ${order.orderNumber} - Admin Panel</title>
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
        .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .back-link { color: #666; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
        .back-link:hover { color: #000; }
        .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .order-number { font-size: 1.5rem; font-weight: bold; }
        .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.85rem; font-weight: 600; color: white; margin-left: 1rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card h3 { margin-bottom: 1rem; font-size: 1.1rem; color: #333; }
        .info-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #666; }
        .info-value { font-weight: 500; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .items-table th, .items-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
        .items-table th { font-weight: 600; color: #666; font-size: 0.85rem; }
        .item-img { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; }
        .btn { padding: 0.5rem 1rem; background: #000; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; text-decoration: none; display: inline-block; }
        .btn:hover { background: #333; }
        select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>VIPIESSE Admin Panel</h1>
        <button class="logout" onclick="logout()">Logout</button>
      </div>
      <div class="nav">
        <a href="/admin/products">Products</a>
        <a href="/admin/collections">Collections</a>
        <a href="/admin/orders" class="active">Orders</a>
        <a href="/admin/contacts">Contacts</a>
      </div>
      <div class="container">
        <a href="/admin/orders" class="back-link">← Back to Orders</a>
        
        <div class="order-header">
          <div>
            <span class="order-number">${order.orderNumber}</span>
            <span class="status-badge" style="background-color: ${status.color}">${status.label}</span>
          </div>
          <div>
            <select id="statusSelect" onchange="updateStatus(${order.id}, this.value)">
              <option value="pending_payment" ${order.status === 'pending_payment' ? 'selected' : ''}>In attesa pagamento</option>
              <option value="awaiting_bank" ${order.status === 'awaiting_bank' ? 'selected' : ''}>Attesa bonifico</option>
              <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Pagato</option>
              <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Spedito</option>
              <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completato</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Annullato</option>
            </select>
          </div>
        </div>
        
        <div class="grid">
          <div class="card">
            <h3>Customer Details</h3>
            <div class="info-row">
              <span class="info-label">Name</span>
              <span class="info-value">${order.customerName} ${order.customerSurname}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">${order.customerEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone</span>
              <span class="info-value">${order.customerPhone || '-'}</span>
            </div>
          </div>
          
          <div class="card">
            <h3>Shipping Address</h3>
            <div class="info-row">
              <span class="info-label">Address</span>
              <span class="info-value">${order.shippingAddress}</span>
            </div>
            <div class="info-row">
              <span class="info-label">City</span>
              <span class="info-value">${order.shippingCity}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Province</span>
              <span class="info-value">${order.shippingProvince || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CAP</span>
              <span class="info-value">${order.shippingCap || '-'}</span>
            </div>
          </div>
        </div>
        
        <div class="card" style="margin-top: 2rem;">
          <h3>Order Details</h3>
          <div class="info-row">
            <span class="info-label">Order Date</span>
            <span class="info-value">${date}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Method</span>
            <span class="info-value">${order.paymentMethod === 'paypal' ? 'PayPal' : 'Bonifico Bancario'}</span>
          </div>
          ${order.paypalOrderId ? `
          <div class="info-row">
            <span class="info-label">PayPal Order ID</span>
            <span class="info-value">${order.paypalOrderId}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Subtotal</span>
            <span class="info-value">€${(order.subtotalCents / 100).toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Shipping</span>
            <span class="info-value">${order.shippingCents === 0 ? 'Free' : '€' + (order.shippingCents / 100).toFixed(2)}</span>
          </div>
          <div class="info-row" style="font-weight: bold; font-size: 1.1rem;">
            <span class="info-label">Total</span>
            <span class="info-value">€${(order.totalCents / 100).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="card" style="margin-top: 2rem;">
          <h3>Order Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Color</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item: any) => `
                <tr>
                  <td>${item.imageUrl ? `<img src="${item.imageUrl}" class="item-img" />` : '-'}</td>
                  <td>${item.productName}</td>
                  <td>${item.variantColor || '-'}</td>
                  <td>${item.variantSize || '-'}</td>
                  <td>${item.quantity}</td>
                  <td>€${(item.priceCents / 100).toFixed(2)}</td>
                  <td>€${((item.priceCents * item.quantity) / 100).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${order.notes ? `
        <div class="card" style="margin-top: 2rem;">
          <h3>Customer Notes</h3>
          <p>${order.notes}</p>
        </div>
        ` : ''}
      </div>
      <script>
        async function logout() {
          await fetch('/api/admin/logout', { method: 'POST' });
          window.location.href = '/login';
        }
        
        async function updateStatus(id, status) {
          await fetch('/api/admin/orders/' + id + '/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
          location.reload();
        }
      </script>
    </body>
    </html>
  `;
}

// Admin Contacts Page
function getAdminContactsPage(contacts: any[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Contact Messages - Admin Panel</title>
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
        .contact-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1rem; }
        .contact-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .contact-info { display: flex; gap: 1rem; align-items: center; }
        .contact-name { font-weight: 600; font-size: 1.1rem; }
        .contact-email { color: #666; }
        .contact-date { color: #999; font-size: 0.85rem; }
        .contact-subject { font-weight: 500; margin-bottom: 0.5rem; color: #333; }
        .contact-message { color: #666; line-height: 1.5; }
        .status-badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
        .status-new { background: #ffc107; color: #000; }
        .status-read { background: #6c757d; color: white; }
        .status-replied { background: #28a745; color: white; }
        .btn { padding: 0.25rem 0.5rem; background: #000; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; text-decoration: none; display: inline-block; margin-left: 0.5rem; }
        .btn:hover { background: #333; }
        .empty { text-align: center; padding: 4rem; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>VIPIESSE Admin Panel</h1>
        <button class="logout" onclick="logout()">Logout</button>
      </div>
      <div class="nav">
        <a href="/admin/products">Products</a>
        <a href="/admin/collections">Collections</a>
        <a href="/admin/orders">Orders</a>
        <a href="/admin/contacts" class="active">Contacts</a>
      </div>
      <div class="container">
        <h2 style="margin-bottom: 1.5rem;">Contact Messages (${contacts.length})</h2>
        
        ${contacts.length === 0 ? '<div class="empty">No contact messages yet</div>' : contacts.map(c => {
          const date = new Date(c.createdAt).toLocaleDateString('it-IT', { 
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          });
          const statusClass = c.status === 'new' ? 'status-new' : c.status === 'replied' ? 'status-replied' : 'status-read';
          return `
            <div class="contact-card">
              <div class="contact-header">
                <div class="contact-info">
                  <span class="contact-name">${c.name}</span>
                  <span class="contact-email">${c.email}</span>
                  ${c.phone ? `<span class="contact-email">${c.phone}</span>` : ''}
                </div>
                <div>
                  <span class="contact-date">${date}</span>
                  <span class="status-badge ${statusClass}">${c.status}</span>
                  ${c.status === 'new' ? `<button class="btn" onclick="markRead(${c.id})">Mark Read</button>` : ''}
                  ${c.status !== 'replied' ? `<button class="btn" onclick="markReplied(${c.id})">Mark Replied</button>` : ''}
                </div>
              </div>
              ${c.subject ? `<div class="contact-subject">${c.subject}</div>` : ''}
              <div class="contact-message">${c.message}</div>
            </div>
          `;
        }).join('')}
      </div>
      <script>
        async function logout() {
          await fetch('/api/admin/logout', { method: 'POST' });
          window.location.href = '/login';
        }
        
        async function markRead(id) {
          await fetch('/api/admin/contacts/' + id + '/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'read' })
          });
          location.reload();
        }
        
        async function markReplied(id) {
          await fetch('/api/admin/contacts/' + id + '/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'replied' })
          });
          location.reload();
        }
      </script>
    </body>
    </html>
  `;
}
