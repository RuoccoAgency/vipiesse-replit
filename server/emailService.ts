interface OrderEmailData {
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

const BRT_TRACKING_BASE_URL = 'https://vas.brt.it/vas/sped_det.hsm?tession=';

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
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'VIPIESSE <noreply@vipiesse.it>';
  
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not configured, email not sent');
    console.log('[Email] Would send to:', to);
    console.log('[Email] Subject:', subject);
    return false;
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Resend API error:', error);
      return false;
    }
    
    console.log('[Email] Sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
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
          <p style="margin: 0;">Hai domande? Contattaci a info@vipiesse.it</p>
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
          <p style="margin: 0;">Hai domande? Contattaci a info@vipiesse.it</p>
          <p style="margin: 12px 0 0;">&copy; ${new Date().getFullYear()} VIPIESSE - Ingrosso Calzature</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendWithResend(order.customerEmail, `Il tuo ordine è in viaggio! - ${order.orderNumber}`, emailHtml);
}
