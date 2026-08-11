import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { KKIAPAY_CONFIG } from '@/lib/services/kkiapayService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, status, amount, customData, isHeaderValid } = body;

    // Optional signature check if KKiaPay header present
    const kkiapayHeader = request.headers.get('x-kkiapay-secret');
    if (kkiapayHeader && kkiapayHeader !== KKIAPAY_CONFIG.secretKey) {
      return NextResponse.json({ error: 'Unauthorized webhook signature' }, { status: 401 });
    }

    if (status !== 'SUCCESS' && status !== 'SUCCESSFUL') {
      return NextResponse.json({ message: 'Transaction status not successful, ignored' }, { status: 200 });
    }

    // Attempt to parse couturierId from customData
    let couturierId = customData;
    if (typeof customData === 'string' && customData.includes(' - ')) {
      const parts = customData.split(' - ');
      couturierId = parts[parts.length - 1];
    }

    if (!couturierId) {
      return NextResponse.json({ error: 'Missing couturierId in webhook payload' }, { status: 400 });
    }

    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    // Upgrade couturier plan to 'pro'
    const { error: updateError } = await supabase
      .from('couturiers')
      .update({ plan: 'pro', plan_change_manuel: false, updated_at: new Date().toISOString() })
      .eq('id', couturierId);

    if (updateError) {
      console.error('Webhook error updating couturier plan:', updateError);
    }

    // Calculate dates for 30-day subscription
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    // Record subscription in `abonnements` table
    await supabase.from('abonnements').insert([
      {
        couturier_id: couturierId,
        plan: 'pro',
        montant: amount || KKIAPAY_CONFIG.defaultPrice,
        devise: 'FCFA',
        transaction_id: transactionId || `trx_${Date.now()}`,
        date_debut: now.toISOString(),
        date_fin: expiry.toISOString(),
        statut: 'actif',
      },
    ]);

    return NextResponse.json({ success: true, message: 'Subscription successfully processed' }, { status: 200 });
  } catch (error) {
    console.error('KKiaPay Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
