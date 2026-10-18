import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const code = (body.code || '').trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: 'Veuillez saisir un code promo.' },
        { status: 400 }
      );
    }

    const adminSupabase = createServiceClient();
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Service backend indisponible.' },
        { status: 500 }
      );
    }

    // 1. Tenter la recherche dans la table promo_codes
    const { data: promo, error: promoError } = await adminSupabase
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .eq('actif', true)
      .maybeSingle();

    if (promoError || !promo) {
      return NextResponse.json(
        { error: 'Code promotionnel invalide ou expiré.' },
        { status: 404 }
      );
    }

    // 2. Contrôle de limite d'utilisations
    if (
      promo.utilisations_max != null &&
      (promo.utilisations_actuelles || 0) >= promo.utilisations_max
    ) {
      return NextResponse.json(
        { error: 'Ce code a atteint le nombre maximal d’utilisations autorisées.' },
        { status: 400 }
      );
    }

    // 3. Contrôle de date d'expiration
    if (promo.date_expiration && new Date(promo.date_expiration) < new Date()) {
      return NextResponse.json(
        { error: 'Ce code promotionnel a expiré.' },
        { status: 400 }
      );
    }

    // 4. Si 100% de réduction ou mois offerts : activation immédiate du Plan Pro
    if (promo.pourcentage_reduction === 100 || promo.mois_offerts) {
      await adminSupabase
        .from('couturiers')
        .update({
          plan: 'pro',
          plan_change_manuel: true,
        })
        .eq('id', user.id);

      // Incrément atomique d'utilisation
      await adminSupabase
        .from('promo_codes')
        .update({
          utilisations_actuelles: (promo.utilisations_actuelles || 0) + 1,
        })
        .eq('id', promo.id);

      return NextResponse.json({
        success: true,
        activated: true,
        message: 'Plan Pro activé avec succès grâce à votre code promo !',
      });
    }

    return NextResponse.json({
      success: true,
      activated: false,
      discountPercent: promo.pourcentage_reduction || 0,
      discountAmount: promo.montant_reduction || 0,
      message: `Code promo valide (-${promo.pourcentage_reduction}%)`,
    });
  } catch (err: any) {
    console.error('Erreur promo apply:', err);
    return NextResponse.json(
      { error: err?.message || 'Erreur lors de la vérification du code promo.' },
      { status: 500 }
    );
  }
}
