// PayPal integration for VIPIESSE e-commerce
// Based on blueprint:javascript_paypal with ESM compatibility fix
import { Request, Response } from "express";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

// Guard: only initialize PayPal if credentials are present
const isPayPalConfigured = !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);

let ordersController: any = null;
let oAuthAuthorizationController: any = null;

if (isPayPalConfigured) {
  try {
    const { Client, Environment, LogLevel, OrdersController, OAuthAuthorizationController } = require("@paypal/paypal-server-sdk");

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

export async function createPaypalOrder(req: Request, res: Response) {
  if (!isPayPalConfigured || !ordersController) {
    return res.status(503).json({ error: "PayPal non configurato" });
  }

  try {
    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

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

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
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
