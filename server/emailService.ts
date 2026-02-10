// Email service using Replit Resend integration
import { Resend } from 'resend';

// Constants
const DEFAULT_FROM = 'VIPIESSE <noreply@vipiesse.com>';
const BRT_TRACKING_BASE_URL = 'https://vas.brt.it/vas/sped_det.hsm?tession=';
const CREDENTIALS_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  shippingAddress: string;
  shippingCity?: string;
  shippingCap?: string;
  estimatedDeliveryDate?: Date | null;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items: Array<{
    productName: string;
    variantColor: string;
    variantSize: string;
    quantity: number;
    priceCents: number;
  }>;
}

// Cached credentials
let cachedCredentials: { apiKey: string; fromEmail: string | null } | null = null;
let credentialsCachedAt: number = 0;

async function getResendCredentials(): Promise<{ apiKey: string; fromEmail: string | null } | null> {
  // Check cache first
  const now = Date.now();
  if (cachedCredentials && (now - credentialsCachedAt) < CREDENTIALS_CACHE_TTL_MS) {
    return cachedCredentials;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    console.warn('[Email] Replit connector not available (missing hostname or token)');
    return null;
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );
    
    const data = await response.json();
    const connectionSettings = data.items?.[0];

    if (!connectionSettings?.settings?.api_key) {
      console.warn('[Email] Resend not connected or api_key missing');
      return null;
    }

    // Cache the credentials
    cachedCredentials = {
      apiKey: connectionSettings.settings.api_key,
      fromEmail: connectionSettings.settings.from_email || null
    };
    credentialsCachedAt = now;

    console.log('[Email] Resend credentials loaded and cached');
    return cachedCredentials;
  } catch (error) {
    console.error('[Email] Failed to get Resend credentials:', error);
    return null;
  }
}

function getReplyTo(): string {
  return process.env.REPLY_TO_EMAIL 
    || process.env.ADMIN_EMAIL 
    || 'vipiesses@gmail.com';
}

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getOrderItemsHtml(items: OrderEmailData['items']): string {
  return items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.productName}</strong><br>
        <span style="color: #666; font-size: 14px;">${item.variantColor} - Taglia ${item.variantSize}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.priceCents * item.quantity)}</td>
    </tr>
  `).join('');
}

async function sendWithResend(to: string, subject: string, html: string): Promise<boolean> {
  const credentials = await getResendCredentials();
  
  if (!credentials) {
    console.warn('[Email] Resend not configured, email not sent');
    console.log('[Email] Would send to:', to, '| Subject:', subject);
    return false;
  }
  
  const fromEmail = credentials.fromEmail || DEFAULT_FROM;
  const replyTo = getReplyTo();

  console.log('[Email] Attempting to send:', { to, subject, from: fromEmail, replyTo });
  
  try {
    const resend = new Resend(credentials.apiKey);
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      replyTo: replyTo,
    });
    
    if (error) {
      console.error('[Email] Resend API error:', { 
        to, 
        subject, 
        from: fromEmail,
        error: error.message || error 
      });
      return false;
    }
    
    console.log('[Email] Sent successfully:', { 
      to, 
      subject, 
      from: fromEmail, 
      replyTo,
      messageId: data?.id 
    });
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send:', { 
      to, 
      subject, 
      from: fromEmail,
      error: error.message || error 
    });
    return false;
  }
}

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<boolean> {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
        <div style="background: #000; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">VIPIESSE</h1>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 8px;">Grazie per il tuo ordine!</h2>
          <p style="color: #666; margin: 0 0 24px;">Ciao ${order.customerName}, abbiamo ricevuto il tuo ordine.</p>
          
          <div style="background: #f8f8f8; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0;"><strong>Numero ordine:</strong> ${order.orderNumber}</p>
            ${order.estimatedDeliveryDate ? `<p style="margin: 8px 0 0;"><strong>Consegna prevista:</strong> ${formatDate(order.estimatedDeliveryDate)}</p>` : ''}
          </div>
          
          <h3 style="margin: 0 0 12px;">Articoli ordinati</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f8f8;">
                <th style="padding: 12px; text-align: left;">Articolo</th>
                <th style="padding: 12px; text-align: center;">Qtà</th>
                <th style="padding: 12px; text-align: right;">Prezzo</th>
              </tr>
            </thead>
            <tbody>
              ${getOrderItemsHtml(order.items)}
            </tbody>
          </table>
          
          <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #000;">
            <p style="margin: 0; font-size: 18px; text-align: right;"><strong>Totale: ${formatPrice(order.totalCents)}</strong></p>
          </div>
          
          <h3 style="margin: 24px 0 12px;">Indirizzo di spedizione</h3>
          <p style="margin: 0; color: #666;">
            ${order.shippingAddress}<br>
            ${order.shippingCap || ''} ${order.shippingCity || ''}<br>
            Italia
          </p>
        </div>
        
        <div style="background: #f8f8f8; padding: 24px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">Hai domande? Contattaci a info@vipiesse.com</p>
          <p style="margin: 12px 0 0;">&copy; ${new Date().getFullYear()} VIPIESSE - Ingrosso Calzature</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendWithResend(order.customerEmail, `Ordine confermato - ${order.orderNumber}`, emailHtml);
}

export async function sendAdminOrderNotification(order: OrderEmailData): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.log('[Email] ADMIN_EMAIL not configured, skipping admin notification');
    return false;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
      <h1 style="color: #000;">Nuovo ordine pagato!</h1>
      
      <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0;"><strong>Ordine:</strong> ${order.orderNumber}</p>
        <p style="margin: 8px 0 0;"><strong>Totale:</strong> ${formatPrice(order.totalCents)}</p>
      </div>
      
      <h2>Cliente</h2>
      <p>
        <strong>Nome:</strong> ${order.customerName}<br>
        <strong>Email:</strong> ${order.customerEmail}
      </p>
      
      <h2>Spedizione</h2>
      <p>
        ${order.shippingAddress}<br>
        ${order.shippingCap || ''} ${order.shippingCity || ''}<br>
        Italia
      </p>
      
      <h2>Articoli (${order.items.length})</h2>
      <ul>
        ${order.items.map(item => `<li>${item.productName} - ${item.variantColor} - Taglia ${item.variantSize} (x${item.quantity})</li>`).join('')}
      </ul>
      
      <p style="margin-top: 24px;">
        <a href="/admin/orders" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Gestisci Ordini</a>
      </p>
    </body>
    </html>
  `;

  return sendWithResend(adminEmail, `Nuovo ordine pagato - ${order.orderNumber}`, emailHtml);
}

export async function sendShippingNotification(order: OrderEmailData): Promise<boolean> {
  const trackingLink = order.trackingUrl || (order.trackingNumber ? `${BRT_TRACKING_BASE_URL}${order.trackingNumber}` : null);
  const carrierName = order.carrier || 'BRT';

  const trackingSection = trackingLink
    ? `<p style="margin: 24px 0;"><a href="${trackingLink}" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Traccia la spedizione</a></p>`
    : '';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
        <div style="background: #000; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">VIPIESSE</h1>
        </div>
        
        <div style="padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; background: #ede9fe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="font-size: 32px;">📦</span>
            </div>
            <h2 style="margin: 0;">Il tuo ordine è in viaggio!</h2>
          </div>
          
          <p style="color: #666;">Ciao ${order.customerName},</p>
          <p style="color: #666;">Siamo lieti di informarti che il tuo ordine <strong>${order.orderNumber}</strong> è stato spedito!</p>
          
          <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0 0 8px;"><strong>Corriere:</strong> ${carrierName}</p>
            ${order.trackingNumber ? `<p style="margin: 0 0 8px;"><strong>Numero tracking:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 4px;">${order.trackingNumber}</span></p>` : ''}
            ${order.estimatedDeliveryDate ? `<p style="margin: 0;"><strong>Consegna prevista:</strong> ${formatDate(order.estimatedDeliveryDate)}</p>` : ''}
          </div>
          
          ${trackingSection}
          
          <h3 style="margin: 24px 0 12px;">Indirizzo di consegna</h3>
          <p style="margin: 0; color: #666;">
            ${order.shippingAddress}<br>
            ${order.shippingCap || ''} ${order.shippingCity || ''}<br>
            Italia
          </p>
        </div>
        
        <div style="background: #f8f8f8; padding: 24px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">Hai domande? Contattaci a info@vipiesse.com</p>
          <p style="margin: 12px 0 0;">&copy; ${new Date().getFullYear()} VIPIESSE - Ingrosso Calzature</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendWithResend(order.customerEmail, `Il tuo ordine è in viaggio! - ${order.orderNumber}`, emailHtml);
}

export async function sendBankTransferOrderEmail(order: OrderEmailData): Promise<boolean> {
  const bankName = process.env.BANK_NAME || 'N/A';
  const bankIban = process.env.BANK_IBAN || 'N/A';
  const bankAccountName = process.env.BANK_ACCOUNT_NAME || 'VIPIESSE';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
        <div style="background: #000; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">VIPIESSE</h1>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 8px;">Ordine ricevuto!</h2>
          <p style="color: #666; margin: 0 0 24px;">Ciao ${order.customerName}, abbiamo ricevuto il tuo ordine. Per completarlo, effettua il bonifico bancario con i dati indicati di seguito.</p>
          
          <div style="background: #f8f8f8; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0;"><strong>Numero ordine:</strong> ${order.orderNumber}</p>
            <p style="margin: 8px 0 0;"><strong>Totale da pagare:</strong> ${formatPrice(order.totalCents)}</p>
          </div>
          
          <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px; color: #92400e;">Dati per il bonifico bancario</h3>
            <p style="margin: 0 0 8px;"><strong>Intestatario:</strong> ${bankAccountName}</p>
            <p style="margin: 0 0 8px;"><strong>Banca:</strong> ${bankName}</p>
            <p style="margin: 0 0 8px;"><strong>IBAN:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 4px;">${bankIban}</span></p>
            <p style="margin: 0;"><strong>Causale:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 4px;">${order.orderNumber}</span></p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
            <strong>Importante:</strong> Inserisci il numero d'ordine come causale del bonifico per velocizzare la conferma del pagamento. 
            L'ordine verrà confermato dopo la ricezione del pagamento.
          </p>
          
          <h3 style="margin: 0 0 12px;">Articoli ordinati</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f8f8;">
                <th style="padding: 12px; text-align: left;">Articolo</th>
                <th style="padding: 12px; text-align: center;">Qtà</th>
                <th style="padding: 12px; text-align: right;">Prezzo</th>
              </tr>
            </thead>
            <tbody>
              ${getOrderItemsHtml(order.items)}
            </tbody>
          </table>
          
          <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #000;">
            <p style="margin: 0; font-size: 18px; text-align: right;"><strong>Totale: ${formatPrice(order.totalCents)}</strong></p>
          </div>
          
          <h3 style="margin: 24px 0 12px;">Indirizzo di spedizione</h3>
          <p style="margin: 0; color: #666;">
            ${order.shippingAddress}<br>
            ${order.shippingCap || ''} ${order.shippingCity || ''}<br>
            Italia
          </p>
        </div>
        
        <div style="background: #f8f8f8; padding: 24px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">Hai domande? Contattaci a info@vipiesse.com</p>
          <p style="margin: 12px 0 0;">&copy; ${new Date().getFullYear()} VIPIESSE - Ingrosso Calzature</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendWithResend(order.customerEmail, `Ordine ricevuto - Istruzioni pagamento - ${order.orderNumber}`, emailHtml);
}

export async function sendAdminBankTransferNotification(order: OrderEmailData): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.log('[Email] ADMIN_EMAIL not configured, skipping admin notification');
    return false;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
      <h1 style="color: #000;">Nuovo ordine - Bonifico bancario</h1>
      
      <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px;"><strong>Ordine:</strong> ${order.orderNumber}</p>
        <p style="margin: 0 0 8px;"><strong>Totale:</strong> ${formatPrice(order.totalCents)}</p>
        <p style="margin: 0;"><strong>Pagamento:</strong> In attesa di bonifico bancario</p>
      </div>
      
      <h2>Cliente</h2>
      <p>
        <strong>Nome:</strong> ${order.customerName}<br>
        <strong>Email:</strong> ${order.customerEmail}
      </p>
      
      <h2>Spedizione</h2>
      <p>
        ${order.shippingAddress}<br>
        ${order.shippingCap || ''} ${order.shippingCity || ''}<br>
        Italia
      </p>
      
      <h2>Articoli (${order.items.length})</h2>
      <ul>
        ${order.items.map(item => `<li>${item.productName} - ${item.variantColor} - Taglia ${item.variantSize} (x${item.quantity})</li>`).join('')}
      </ul>
      
      <p style="margin-top: 24px;">
        <a href="/admin/orders" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Gestisci Ordini</a>
      </p>
    </body>
    </html>
  `;

  return sendWithResend(adminEmail, `Nuovo ordine (bonifico) - ${order.orderNumber}`, emailHtml);
}

export async function sendPaymentConfirmedEmail(order: OrderEmailData): Promise<boolean> {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
        <div style="background: #000; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">VIPIESSE</h1>
        </div>
        
        <div style="padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="font-size: 32px;">&#10003;</span>
            </div>
            <h2 style="margin: 0;">Pagamento confermato!</h2>
          </div>
          
          <p style="color: #666;">Ciao ${order.customerName},</p>
          <p style="color: #666;">Il pagamento per il tuo ordine <strong>${order.orderNumber}</strong> è stato confermato. Stiamo preparando la tua spedizione!</p>
          
          <div style="background: #f0fdf4; border: 1px solid #22c55e; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0;"><strong>Numero ordine:</strong> ${order.orderNumber}</p>
            <p style="margin: 8px 0 0;"><strong>Totale pagato:</strong> ${formatPrice(order.totalCents)}</p>
          </div>
          
          <p style="color: #666;">Riceverai un'altra email con il numero di tracking non appena il tuo ordine verrà spedito.</p>
        </div>
        
        <div style="background: #f8f8f8; padding: 24px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">Hai domande? Contattaci a info@vipiesse.com</p>
          <p style="margin: 12px 0 0;">&copy; ${new Date().getFullYear()} VIPIESSE - Ingrosso Calzature</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendWithResend(order.customerEmail, `Pagamento confermato - ${order.orderNumber}`, emailHtml);
}

export interface DeliveredEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  deliveredAt: Date;
  items: Array<{
    productName: string;
    variantColor: string;
    variantSize: string;
    quantity: number;
    priceCents: number;
  }>;
}

export async function sendDeliveredEmail(order: DeliveredEmailData): Promise<boolean> {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
        <div style="background: #000; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">VIPIESSE</h1>
        </div>
        
        <div style="padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="font-size: 32px;">&#10003;</span>
            </div>
            <h2 style="margin: 0;">Ordine consegnato!</h2>
          </div>
          
          <p style="color: #666;">Ciao ${order.customerName},</p>
          <p style="color: #666;">Siamo lieti di informarti che il tuo ordine <strong>${order.orderNumber}</strong> è stato consegnato con successo.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #22c55e; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0;"><strong>Numero ordine:</strong> ${order.orderNumber}</p>
            <p style="margin: 8px 0 0;"><strong>Consegnato il:</strong> ${formatDate(order.deliveredAt)}</p>
          </div>
          
          <h3 style="margin: 24px 0 12px;">Articoli consegnati</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f8f8;">
                <th style="padding: 12px; text-align: left;">Articolo</th>
                <th style="padding: 12px; text-align: center;">Qtà</th>
                <th style="padding: 12px; text-align: right;">Prezzo</th>
              </tr>
            </thead>
            <tbody>
              ${getOrderItemsHtml(order.items)}
            </tbody>
          </table>
          
          <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #000;">
            <p style="margin: 0; font-size: 18px; text-align: right;"><strong>Totale: ${formatPrice(order.totalCents)}</strong></p>
          </div>
          
          <p style="color: #666; margin-top: 24px;">Grazie per aver scelto VIPIESSE! Se hai bisogno di assistenza, non esitare a contattarci.</p>
        </div>
        
        <div style="background: #f8f8f8; padding: 24px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">Hai domande? Contattaci a info@vipiesse.com</p>
          <p style="margin: 12px 0 0;">&copy; ${new Date().getFullYear()} VIPIESSE - Ingrosso Calzature</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendWithResend(order.customerEmail, `Ordine consegnato - ${order.orderNumber}`, emailHtml);
}

// Test helper - creates dummy order data for testing
export function createDummyOrderData(): OrderEmailData {
  return {
    orderNumber: 'VIP-TEST-' + Date.now(),
    customerName: 'Test Cliente',
    customerEmail: process.env.ADMIN_EMAIL || 'test@example.com',
    totalCents: 5990,
    shippingAddress: 'Via Test 123',
    shippingCity: 'Napoli',
    shippingCap: '80100',
    estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    carrier: 'BRT',
    trackingNumber: 'TEST123456789',
    items: [
      {
        productName: 'Ciabatta Test',
        variantColor: 'Nero',
        variantSize: '42',
        quantity: 1,
        priceCents: 2990,
      },
      {
        productName: 'Sandalo Test',
        variantColor: 'Marrone',
        variantSize: '40',
        quantity: 1,
        priceCents: 3000,
      },
    ],
  };
}
