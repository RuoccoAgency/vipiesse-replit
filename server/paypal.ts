// server/paypal.ts
import { Request, Response } from "express";
import { storage } from "./storage";
import * as paypal from "@paypal/checkout-server-sdk";

// ====== CONFIG ======
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = (process.env.PAYPAL_MODE || "sandbox").toLowerCase(); // "live" | "sandbox"

const isPayPalConfigured = !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);

function getPayPalClient() {
  if (!isPayPalConfigured) {
    throw new Error("PayPal non configurato: manca PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET");
  }

  const env =
    PAYPAL_MODE === "live"
      ? new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID!, PAYPAL_CLIENT_SECRET!)
      : new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID!, PAYPAL_CLIENT_SECRET!);

  return new paypal.core.PayPalHttpClient(env);
}

// ====== UTILS ======
function generateOrderNumber(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VIP-${yy}${mm}${dd}-${random}`;
}

// ====== API ======

// Create PayPal order + local order
export async function createPaypalOrder(req: Request, res: Response) {
  if (!isPayPalConfigured) return res.status(503).json({ error: "PayPal non configurato" });

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
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Il carrello è vuoto" });
    }
    if (!customerEmail || !customerName) {
      return res.status(400).json({ error: "Email e nome sono obbligatori" });
    }

    // Calcolo totali + item dettagli
    const orderItems: {
      variantId: number;
      productName: string;
      variantSku: string;
      variantColor: string;
      variantSize: string;
      quantity: number;
      priceCents: number;
      imageUrl?: string;
    }[] = [];

    let subtotalCents = 0;

    for (const item of items) {
      const variant = await storage.getVariantById(item.variantId);
      if (!variant) return res.status(400).json({ error: "Prodotto non trovato" });
      if (!variant.active) return res.status(400).json({ error: `Prodotto ${variant.sku} non disponibile` });
      if (variant.stockQty < item.quantity) {
        return res.status(400).json({ error: `Stock insufficiente per ${variant.sku}. Disponibili: ${variant.stockQty}` });
      }

      const product = await storage.getProductById(variant.productId);
      if (!product || !product.active) return res.status(400).json({ error: "Prodotto non disponibile" });

      const images = await storage.getImagesByProduct(product.id);
      const imageUrl = images?.[0]?.imageUrl;

      const priceCents = variant.priceCents ?? product.basePriceCents ?? 0;
      if (priceCents <= 0) return res.status(400).json({ error: `Prezzo non valido per ${variant.sku}` });

      subtotalCents += priceCents * item.quantity;

      orderItems.push({
        variantId: item.variantId,
        productName: product.name,
        variantSku: variant.sku,
        variantColor: variant.color,
        variantSize: variant.size,
        quantity: item.quantity,
        priceCents,
        imageUrl,
      });
    }

    const shippingCents = subtotalCents >= 5000 ? 0 : 590;
    const totalCents = subtotalCents + shippingCents;
    if (totalCents <= 0) return res.status(400).json({ error: "Il totale dell'ordine non può essere zero" });

    const totalEur = (totalCents / 100).toFixed(2);
    const orderNumber = generateOrderNumber();

    // Session user (se loggato)
    const sessionId = req.cookies?.user_session;
    let userId: number | null = null;
    if (sessionId) {
      const session = await storage.getSession(sessionId);
      if (session?.userId && session.expiresAt > new Date()) userId = session.userId;
    }

    // 1) Crea ordine locale (pending_payment)
    const created = await storage.createOrderWithItems(
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
        totalCents,
      },
      orderItems
    );

    if ("error" in created) return res.status(400).json({ error: created.error });

    // 2) Crea PayPal order (CAPTURE)
    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderNumber,
          description: `Ordine VIPIESSE ${orderNumber}`,
          amount: {
            currency_code: "EUR",
            value: totalEur,
          },
        },
      ],
    });

    const ppRes = await client.execute(request);
    const paypalOrderId = ppRes?.result?.id;

    if (!paypalOrderId) {
      return res.status(500).json({ error: "Errore nella creazione ordine PayPal (id mancante)" });
    }

    await storage.updateOrderPaypalId(created.order.id, paypalOrderId);

    res.status(200).json({
      paypalOrderId,
      orderNumber,
      orderId: created.order.id,
      totalCents,
      items: orderItems.map(i => ({
        name: i.productName,
        sku: i.variantSku,
        qty: i.quantity,
        priceCents: i.priceCents,
        imageUrl: i.imageUrl,
      })),
    });
  } catch (err) {
    console.error("Failed to create PayPal order:", err);
    res.status(500).json({ error: "Failed to create PayPal order." });
  }
}

// Capture PayPal order + set local order paid
export async function capturePaypalOrder(req: Request, res: Response) {
  if (!isPayPalConfigured) return res.status(503).json({ error: "PayPal non configurato" });

  try {
    const { orderID } = req.params;

    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const ppRes = await client.execute(request);

    // Aggiorna ordine locale
    const order = await storage.getOrderByPaypalId(orderID);
    if (order) await storage.updateOrderStatus(order.id, "paid");

    res.status(200).json({
      status: "paid",
      orderNumber: order?.orderNumber || ppRes?.result?.purchase_units?.[0]?.reference_id || "",
      paypal: ppRes.result,
    });
  } catch (err) {
    console.error("Failed to capture PayPal order:", err);
    res.status(500).json({ error: "Failed to capture PayPal order." });
  }
}

// Client token: con checkout-server-sdk NON serve per i PayPal Buttons classici.
// Se nel frontend stai usando PayPal JS SDK (script + Buttons), ti basta il Client ID.
// Quindi questo endpoint puoi anche non usarlo.
export async function loadPaypalDefault(_req: Request, res: Response) {
  if (!isPayPalConfigured) return res.status(503).json({ error: "PayPal non configurato" });
  res.json({ ok: true, mode: PAYPAL_MODE });
}