import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SasPayService } from '@/lib/services/saspayService';
import { PRO_PLAN_PRICE } from '@/lib/utils/planLimits';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: couturier } = await supabase
      .from('couturiers')
      .select('id, nom, nom_atelier, email, telephone, pays')
      .eq('id', user.id)
      .maybeSingle();

    const body = await request.json().catch(() => ({}));
    const mode = body.mode === 'softpay' ? 'softpay' : 'checkout';
    const country = SasPayService.normalizeCountryCode(body.country || couturier?.pays) || 'BJ';
    const currency = body.currency || 'XOF';
    const network = body.network; // ex: "mtn_bj", "moov_bj", "wave_ci"
    const phone = body.phone || couturier?.telephone || '';

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get('origin') ||
      'https://ourlette.app';

    const customerName =
      couturier?.nom_atelier ||
      couturier?.nom ||
      user.user_metadata?.full_name ||
      'Atelier Ourlette';

    const customerEmail = couturier?.email || user.email || 'contact@ourlette.app';

    const formattedAmount = SasPayService.formatAmount(PRO_PLAN_PRICE);

    // Option 1 : Softpay (Push USSD direct ou redirection selon réseau)
    if (mode === 'softpay' && network && phone) {
      const nameParts = customerName.split(' ');
      const firstName = nameParts[0] || 'Couturier';
      const lastName = nameParts.slice(1).join(' ') || 'Ourlette';

      const softpayResponse = await SasPayService.softpay({
        amount: formattedAmount,
        currency,
        country,
        network,
        description: 'Abonnement mensuel Ourlette Pro',
        customer: {
          email: customerEmail,
          first_name: firstName,
          last_name: lastName,
          phone,
        },
        metadata: {
          couturier_id: couturier?.id || user.id,
          user_id: user.id,
          plan: 'pro',
        },
      });

      return NextResponse.json({
        success: true,
        mode: 'softpay',
        id: softpayResponse.id,
        status: softpayResponse.status,
        checkout_url: softpayResponse.checkout_url || null,
        message: softpayResponse.message,
      });
    }

    // Option 2 : Checkout hébergé SasPay (Recommandé - multi-opérateurs et cartes)
    const returnUrl = `${origin}/pro/confirmation?provider=saspay`;

    const sessionResponse = await SasPayService.createCheckoutSession({
      amount: formattedAmount,
      currency,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: phone || undefined,
      country,
      description: 'Abonnement mensuel Ourlette Pro',
      return_url: returnUrl,
      metadata: {
        couturier_id: couturier?.id || user.id,
        user_id: user.id,
        plan: 'pro',
      },
    });

    const checkoutUrl = sessionResponse.checkout_url || (sessionResponse as any).data?.checkout_url;
    const sessionId = sessionResponse.id || (sessionResponse as any).data?.id;
    const sessionSlug = sessionResponse.slug || (sessionResponse as any).data?.slug;
    const sessionStatus = sessionResponse.status || (sessionResponse as any).data?.status;

    return NextResponse.json({
      success: true,
      mode: 'checkout',
      id: sessionId,
      checkout_url: checkoutUrl,
      slug: sessionSlug,
      status: sessionStatus,
    });
  } catch (error: any) {
    console.error('[SasPay Initialize] Erreur :', error);
    return NextResponse.json(
      {
        error: error.message || 'Impossible d’initialiser le paiement SasPay',
        code: error.code || 'initialization_failed',
      },
      { status: error.status || 500 }
    );
  }
}
