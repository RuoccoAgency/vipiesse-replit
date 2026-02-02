// server/paypal.ts
import { Request, Response } from "express";
import { storage } from "./storage";
import paypal from "@paypal/checkout-server-sdk";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = (process.env.PAYPAL_MODE || "live").toLowerCase();

const isPayPalConfigured = !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);

function getPayPalClient(): paypal.core.PayPalHttpClient | null {
  if (!isPayPalConfigured) return null;
  
  const environment = PAYPAL_MODE === "sandbox"
    ? new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID!, PAYPAL_CLIENT_SECRET!)
    : new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID!, PAYPAL_CLIENT_SECRET!);
  
  return new paypal.core.PayPalHttpClient(environment);
}

const paypalClient = getPayPalClient();

if (isPayPalConfigured) {
  console.log(`PayPal SDK initialized (${PAYPAL_MODE})`);
} else {
  console.warn("PayPal not configured: Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
}

function generateOrderNumber(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VIP-${yy}${mm}${dd}-${random}`;
}

export async function loadPaypalDefault(req: Request, res: Response) {
  if (!isPayPalConfigured) {
    return res.status(503).json({ error: "PayPal non configurato" });
  }
  return res.json({ clientId: PAYPAL_CLIENT_ID });
}

export async function createPaypalOrder(req: Request, res: Response) {
  if (!isPayPalConfigured || !paypalClient) {
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
      shippingCap,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Il carrello è vuoto" });
    }
    if (!customerEmail || !customerName) {
      return res.status(400).json({ error: "Email e nome sono obbligatori" });
    }

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
      if (!variant || !variant.active) {
        return res.status(400).json({ error: "Prodotto non disponibile" });
      }
      if (variant.stockQty < item.quantity) {
        return res.status(400).json({
          error: `Stock insufficiente per ${variant.sku}. Disponibili: ${variant.stockQty}`,
        });
      }

      const product = await storage.getProductById(variant.productId);
      if (!product || !product.active) {
        return res.status(400).json({ error: "Prodotto non disponibile" });
      }

      const images = await storage.getImagesByProduct(product.id);
      const imageUrl = images.length > 0 ? images[0].imageUrl : undefined;

      const priceCents = variant.priceCents ?? product.basePriceCents ?? 0;
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
    const totalEur = (totalCents / 100).toFixed(2);

    if (totalCents <= 0) {
      return res.status(400).json({ error: "Il totale dell'ordine non può essere zero" });
    }

    const orderNumber = generateOrderNumber();

    const sessionId = req.cookies?.user_session;
    let userId: number | null = null;
    if (sessionId) {
      const session = await storage.getSession(sessionId);
      if (session && session.userId && session.expiresAt > new Date()) {
        userId = session.userId;
      }
    }

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

    const response = await paypalClient.execute(request);
    const paypalOrderId = response.result.id;

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
        totalCents,
      },
      orderItems
    );

    if ("error" in result) return res.status(400).json({ error: result.error });

    await storage.updateOrderPaypalId(result.order.id, paypalOrderId);

    return res.status(200).json({
      paypalOrderId,
      orderNumber,
      orderId: result.order.id,
      totalCents,
    });
  } catch (error) {
    console.error("Failed to create order:", error);
    return res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  if (!isPayPalConfigured || !paypalClient) {
    return res.status(503).json({ error: "PayPal non configurato" });
  }

  try {
    const { orderID } = req.params;

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.prefer("return=representation");
    request.requestBody({});

    const response = await paypalClient.execute(request);
    const captureResult = response.result;

    const order = await storage.getOrderByPaypalId(orderID);
    if (order) await storage.updateOrderStatus(order.id, "paid");

    const orderNumber =
      order?.orderNumber || captureResult?.purchase_units?.[0]?.reference_id || "";

    return res.status(200).json({ ...captureResult, orderNumber, status: "paid" });
  } catch (error) {
    console.error("Failed to capture order:", error);
    return res.status(500).json({ error: "Failed to capture order." });
  }
}
