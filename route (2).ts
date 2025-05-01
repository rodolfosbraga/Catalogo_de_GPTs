import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Define the structure of the environment bindings provided by Cloudflare
interface Env {
  DB: D1Database;
  // HOTMART_SECRET is accessed via process.env as it's a var/secret, not a binding
}

// Define the expected structure of the Hotmart webhook payload (adjust based on actual data)
interface HotmartWebhookPayload {
  event: string; // e.g., 'purchase.approved', 'purchase.canceled'
  data: {
    buyer: {
      email: string;
    };
    purchase: {
      transaction: string; // Unique transaction ID
      status: string; // e.g., 'approved', 'canceled'
      // Add other relevant fields like product ID, price, etc.
    };
    // ... other fields
  };
  hottok: string; // Hotmart security token/signature
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as HotmartWebhookPayload;
    const { env } = getRequestContext();
    const { DB } = env as Env; // Get D1 binding

    // Get HOTMART_SECRET from environment variables/secrets
    const hotmartSecret = process.env.HOTMART_SECRET;

    if (!hotmartSecret) {
        console.error('HOTMART_SECRET environment variable not set.');
        return NextResponse.json({ error: 'Configuração interna do servidor incompleta.' }, { status: 500 });
    }

    console.log('Received Hotmart Webhook:', JSON.stringify(payload, null, 2));

    // --- 1. Verify Webhook Signature (CRUCIAL for security) ---
    // Hotmart sends a 'hottok' in the payload or a signature in headers.
    // You MUST verify this signature using your HOTMART_SECRET to ensure the request is genuinely from Hotmart.
    // The exact verification method depends on Hotmart's documentation for the specific webhook version.
    // This is a placeholder - IMPLEMENT ACTUAL VERIFICATION!
    const isVerified = payload.hottok === hotmartSecret; // Replace with actual verification logic

    if (!isVerified) {
      console.error('Hotmart Webhook Verification Failed!');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- 2. Process the Event --- 
    const { event, data } = payload;
    const userEmail = data?.buyer?.email;
    const transactionStatus = data?.purchase?.status;

    if (!userEmail) {
        console.error('Webhook payload missing buyer email.');
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Handle relevant events (e.g., payment approved)
    if (event === 'purchase.approved' && transactionStatus === 'approved') {
      console.log(`Processing approved purchase for email: ${userEmail}`);

      // Find the user by email
      const user = await DB.prepare('SELECT id, role FROM users WHERE email = ?').bind(userEmail).first<{ id: number; role: string }>();

      if (!user) {
        console.warn(`User not found for email: ${userEmail}. Payment received but no matching user.`);
        // Optionally, create a pending record or notify admin
        return NextResponse.json({ message: 'User not found, but webhook received.' }, { status: 200 });
      }

      // Update user role to 'paid' if they are currently 'guest'
      if (user.role === 'guest') {
        await DB.prepare('UPDATE users SET role = ?, hotmart_status = ? WHERE id = ?')
          .bind('paid', `approved:${data.purchase.transaction}`, user.id)
          .run();
        console.log(`User ${userEmail} (ID: ${user.id}) role updated to 'paid'.`);
      } else {
        console.log(`User ${userEmail} (ID: ${user.id}) already has role '${user.role}'. No update needed.`);
        // Optionally update hotmart_status even if role is not 'guest'
         await DB.prepare('UPDATE users SET hotmart_status = ? WHERE id = ?')
          .bind(`approved:${data.purchase.transaction}`, user.id)
          .run();
      }

    } else if (event === 'purchase.refunded' || event === 'purchase.chargeback' || event === 'purchase.canceled') {
        // Handle refunds, chargebacks, cancellations - potentially downgrade user role
        console.log(`Processing ${event} for email: ${userEmail}`);
        // Add logic here to potentially change user role back to 'guest' or restrict access
        await DB.prepare('UPDATE users SET role = ?, hotmart_status = ? WHERE email = ?')
          .bind('guest', `${event}:${data?.purchase?.transaction || 'N/A'}`, userEmail)
          .run();
         console.log(`User ${userEmail} role potentially downgraded due to ${event}.`);
    } else {
      console.log(`Received unhandled Hotmart event: ${event}`);
    }

    // Respond to Hotmart confirming receipt
    return NextResponse.json({ message: 'Webhook received successfully' }, { status: 200 });

  } catch (error) {
    console.error('Hotmart Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error processing webhook.' }, { status: 500 });
  }
}

