import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runProductionSync } from "./production-sync";
import { generateSyncData } from "./generate-sync";
import { storage } from "./storage";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// SEO: robots.txt
app.get("/robots.txt", (req, res) => {
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || req.get('host');
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://${domain}/sitemap.xml`;
  res.type("text/plain");
  res.send(robotsTxt);
});

// Google Verification
app.get("/google7bd29224249f4200.html", (req, res) => {
  res.send("google-site-verification: google7bd29224249f4200.html");
});

// SEO: sitemap.xml
app.get("/sitemap.xml", async (req, res) => {
  try {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || req.get('host');
    const baseUrl = `https://${domain}`;
    
    const staticRoutes = [
      "",
      "/shop",
      "/shop/donna",
      "/shop/uomo",
      "/shop/bambino",
      "/outlet",
      "/business",
      "/login",
    ];
    
    const products = await storage.getAllProducts();
    const productRoutes = products
      .filter(p => p.active)
      .map(p => `/product/${p.id}`);
      
    const allRoutes = [...staticRoutes, ...productRoutes];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`).join("")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).end();
  }
});

(async () => {
  await registerRoutes(httpServer, app);

  await generateSyncData();
  await runProductionSync();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
