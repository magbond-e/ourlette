import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { MAKETOU_CONFIG } from '@/lib/services/maketouService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[MakeTou Webhook] Received payload:', body);

    // Optional secret key / signature check
    const authHeader =
      request.headers.get('x-maketou-secret') ||
      request.headers.get('x-api-key') ||
      request.headers.get('authorization');

    if (authHeader && authHeader.replace('Bearer ', '') !== MAKETOU_CONFIG.apiKey) {
      console.warn('[MakeTou Webhook] Secret header mismatch:', authHeader);
    }

    // Extract transaction info from various possible MakeTou payload schemas
    const status = (body.status || body.event || body.payment_status || '').toUpperCase();
    const isSuccess =
      status.includes('SUCCESS') ||
      status.includes('PAID') ||
      status.includes('COMPLETED') ||
      body.event === 'payment.success';

    if (!isSuccess && status) {
      console.log('[MakeTou Webhook] Event is not a successful payment:', status);
      return NextResponse.json({ message: 'Event ignored (not successful)' }, { status: 200 });
    }

    // Extract couturier identifier from metadata, custom_data, ref, or customer email
    let couturierId =
      body.custom_data ||
      body.ref ||
      body.reference ||
      body.metadata?.couturier_id ||
      body.metadata?.ref ||
      body.metadata?.user_id;

    const customerEmail = body.email || body.customer?.email || body.customer_email;
    const amount = body.amount || body.total || body.price || MAKETOU_CONFIG.defaultPrice;
    const transactionId = body.id || body.transaction_id || body.order_id || `maketou_${Date.now()}`;

    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    // If couturierId is not explicitly passed, lookup by customer email
    if (!couturierId && customerEmail) {
      const { data: found } = await supabase
        .from('couturiers')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle();

      if (found?.id) {
        couturierId = found.id;
      }
    }

    if (!couturierId) {
      console.error('[MakeTou Webhook] Could not determine couturierId from payload:', body);
      return NextResponse.json({ error: 'Missing couturier identifier' }, { status: 400 });
    }

    // 1. Upgrade couturier plan to 'pro'
    const { error: updateError } = await supabase
      .from('couturiers')
      .update({
        plan: 'pro',
        plan_change_manuel: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', couturierId);

    if (updateError) {
      console.error('[MakeTou Webhook] Error updating couturier plan:', updateError);
    }

    // 2. Insert record into `abonnements` table
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    await supabase.from('abonnements').insert([
      {
        couturier_id: couturierId,
        plan: 'pro',
        montant: amount,
        devise: 'FCFA',
        transaction_id: transactionId,
        date_debut: now.toISOString(),
        date_fin: expiry.toISOString(),
        statut: 'actif',
      },
    ]);

    // 3. Create real-time notification
    try {
      await supabase.from('notifications').insert([
        {
          couturier_id: couturierId,
          type: 'feature_update',
          category: 'account',
          priority: 'high',
          title: '👑 Votre Plan Pro est activé !',
          message: 'Votre paiement MakeTou a été validé. Vous bénéficiez désormais de commandes et photos vitrine illimitées.',
          link: '/commandes',
          read: false,
        },
      ]);
    } catch (notifErr) {
      console.warn('[MakeTou Webhook] Notification insert note:', notifErr);
    }

    return NextResponse.json({ success: true, message: 'MakeTou subscription processed successfully' }, { status: 200 });
  } catch (error) {
    console.error('[MakeTou Webhook] Processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
