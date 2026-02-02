// PayPal integration for VIPIESSE e-commerce
// Based on blueprint:javascript_paypal
import { Request, Response } from "express";
import { storage } from "./storage";
import * as PayPalSDK from "@paypal/paypal-server-sdk";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

// Guard: only initialize PayPal if credentials are present
const isPayPalConfigured = !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);

let ordersController: any = null;
let oAuthAuthorizationController: any = null;

if (isPayPalConfigured) {
  try {
    const { Client, Environment, LogLevel, OrdersController, OAuthAuthorizationController } = PayPalSDK;

    const client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
      },
      timeout: 0,
      environment:
                    process.env.NODE_ENV === "production"
                      ? Environment.Production
                      : Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: {
          logBody: true,
        },
        logResponse: {
          logHeaders: true,
        },
      },
    });
    ordersController = new OrdersController(client);
    oAuthAuthorizationController = new OAuthAuthorizationController(client);
    console.log("PayPal SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize PayPal SDK:", error);
  }
} else {
  console.warn("PayPal not configured: Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
}

// Generate unique order number
function generateOrderNumber(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VIP-${yy}${mm}${dd}-${random}`;
}

/* Token generation helpers */

export async function getClientToken() {
  if (!isPayPalConfigured || !oAuthAuthorizationController) {
    throw new Error("PayPal non configurato");
  }

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

// Create PayPal order AND local order in one request
export async function createPaypalOrder(req: Request, res: Response) {
  if (!isPayPalConfigured || !ordersController) {
    return res.status(503).json({ error: "PayPal non configurato" });
  }

  try {
    const { 
      items, 
      customerEmail, 
      customerName, 
      customerSurname,
      customerPhone, 
      shippingAddress,
      shippingCity,
      shippingCap
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Il carrello è vuoto" });
    }

    if (!customerEmail || !customerName) {
      return res.status(400).json({ error: "Email e nome sono obbligatori" });
    }

    // Calculate totals and prepare order items
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
    const totalEur = (totalCents / 100).toFixed(2);

    if (totalCents <= 0) {
      return res.status(400).json({ error: "Il totale dell'ordine non può essere zero" });
    }

    // Generate unique order number
    const orderNumber = generateOrderNumber();

    // Get user ID from session if logged in
    const sessionId = req.cookies?.user_session;
    let userId: number | null = null;
    if (sessionId) {
      const session = await storage.getSession(sessionId);
      if (session && session.userId && session.expiresAt > new Date()) {
        userId = session.userId;
      }
    }

    // Create PayPal order first
    const collect = {
      body: {
        intent: "CAPTURE",
        purchaseUnits: [
          {
            reference_id: orderNumber,
            description: `Ordine VIPIESSE ${orderNumber}`,
            amount: {
              currencyCode: "EUR",
              value: totalEur,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.createOrder(collect);
    const jsonResponse = JSON.parse(String(body));

    if (httpResponse.statusCode !== 200 && httpResponse.statusCode !== 201) {
      return res.status(httpResponse.statusCode).json({ error: "Errore nella creazione dell'ordine PayPal" });
    }

    const paypalOrderId = jsonResponse.id;

    // Create local order in database with pending_payment status
    const result = await storage.createOrderWithItems(
      {
        orderNumber,
        userId,
        status: "pending_payment",
        paymentMethod: "paypal",
        customerEmail,
        customerName,
        customerSurname: customerSurname || null,
        customerPhone: customerPhone || null,
        shippingAddress: shippingAddress || "",
        shippingCity: shippingCity || null,
        shippingCap: shippingCap || null,
        subtotalCents,
        shippingCents,
        totalCents
      },
      orderItems
    );

    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }

    // Store PayPal order ID in our order
    await storage.updateOrderPaypalId(result.order.id, paypalOrderId);

    res.status(200).json({
      paypalOrderId,
      orderNumber,
      orderId: result.order.id,
      totalCents
    });
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

// Capture PayPal order and update local order status
export async function capturePaypalOrder(req: Request, res: Response) {
  if (!isPayPalConfigured || !ordersController) {
    return res.status(503).json({ error: "PayPal non configurato" });
  }

  try {
    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.captureOrder(collect);
    const jsonResponse = JSON.parse(String(body));

    if (httpResponse.statusCode !== 200 && httpResponse.statusCode !== 201) {
      return res.status(httpResponse.statusCode).json({ 
        error: "Errore nella conferma del pagamento",
        details: jsonResponse 
      });
    }

    // Find and update local order
    const order = await storage.getOrderByPaypalId(orderID);
    if (order) {
      await storage.updateOrderStatus(order.id, "paid");
    }

    // Get the order number to return
    const orderNumber = order?.orderNumber || jsonResponse.purchase_units?.[0]?.reference_id || "";

    res.status(200).json({
      ...jsonResponse,
      orderNumber,
      status: "paid"
    });
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  if (!isPayPalConfigured || !oAuthAuthorizationController) {
    return res.status(503).json({ error: "PayPal non configurato" });
  }

  try {
    const clientToken = await getClientToken();
    res.json({
      clientToken,
    });
  } catch (error) {
    console.error("Failed to get PayPal client token:", error);
    res.status(500).json({ error: "PayPal setup failed" });
  }
}
