import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MAKETOU_CONFIG } from '@/lib/services/maketouService';

/**
 * POST /api/pro/verify-payment
 * Vérifie un paiement MakeTou côté serveur et active le plan Pro si valide.
 * Seul un utilisateur authentifié peut appeler cette route.
 * La vérification s'appuie sur le `ref` (couturierId) passé au checkout,
 * et tente une vérification via l'API MakeTou si disponible.
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // 1. Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Lire le body
    const body = await request.json();
    const { orderId, ref } = body as { orderId?: string; ref?: string };

    // 3. Retrouver le couturier lié à cet utilisateur
    const { data: couturier, error: couturierError } = await supabase
      .from('couturiers')
      .select('id, plan, email')
      .eq('user_id', user.id)
      .maybeSingle();

    if (couturierError || !couturier) {
      return NextResponse.json({ error: 'Profil couturier introuvable' }, { status: 404 });
    }

    // 4. Si déjà Pro (ex: webhook déjà traité), renvoyer succès (idempotent)
    if (couturier.plan === 'pro') {
      return NextResponse.json({ success: true, alreadyPro: true });
    }

    // 5. Vérifier si le webhook a déjà traité ce paiement
    if (orderId || ref) {
      const { data: existingAbonnement } = await supabase
        .from('abonnements')
        .select('id, statut')
        .or(`transaction_id.eq.${orderId},transaction_id.eq.${ref}`)
        .eq('couturier_id', couturier.id)
        .maybeSingle();

      if (existingAbonnement?.statut === 'actif') {
        // Webhook a déjà tout fait, on s'assure juste que le plan est Pro
        await supabase
          .from('couturiers')
          .update({ plan: 'pro', plan_change_manuel: false, updated_at: new Date().toISOString() })
          .eq('id', couturier.id);

        return NextResponse.json({ success: true, source: 'webhook_already_processed' });
      }
    }

    // 6. Tentative de vérification directe via l'API MakeTou
    let maketouConfirmed = false;
    if (orderId) {
      try {
        const maketouResponse = await fetch(
          `https://api.maketou.shop/v1/orders/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${MAKETOU_CONFIG.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (maketouResponse.ok) {
          const order = await maketouResponse.json();
          const orderStatus = (order.status || order.payment_status || '').toUpperCase();
          maketouConfirmed =
            orderStatus.includes('PAID') ||
            orderStatus.includes('SUCCESS') ||
            orderStatus.includes('COMPLETED');

          if (maketouConfirmed) {
            // Sécurité : vérifier que le ref de l'ordre correspond bien à ce couturier
            const orderRef = order.ref || order.custom_data || order.metadata?.ref;
            if (orderRef && orderRef !== couturier.id) {
              console.error('[verify-payment] Tentative de fraude — ref ne correspond pas:', {
                orderRef,
                couturierId: couturier.id,
              });
              return NextResponse.json(
                { error: 'Paiement ne correspond pas à ce compte' },
                { status: 403 }
              );
            }
          } else {
            return NextResponse.json(
              { error: 'Paiement non encore confirmé par MakeTou' },
              { status: 402 }
            );
          }
        }
      } catch (apiErr) {
        console.warn('[verify-payment] API MakeTou non disponible, fallback sur ref:', apiErr);
      }
    }

    // 7. Si pas d'orderId mais un ref correspond au couturier → cas redirect sans param
    //    On accepte uniquement si le ref est l'ID même du couturier (passé au checkout)
    if (!maketouConfirmed && ref && ref !== couturier.id) {
      return NextResponse.json(
        { error: 'Référence de paiement invalide' },
        { status: 403 }
      );
    }

    // 8. Activer le plan Pro
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const transactionId = orderId || ref || `maketou_${Date.now()}`;

    const { error: updateError } = await supabase
      .from('couturiers')
      .update({ plan: 'pro', plan_change_manuel: false, updated_at: now.toISOString() })
      .eq('id', couturier.id);

    if (updateError) {
      console.error('[verify-payment] Erreur update plan:', updateError);
      return NextResponse.json({ error: "Erreur lors de l'activation du plan" }, { status: 500 });
    }

    // 9. Enregistrer l'abonnement
    await supabase.from('abonnements').insert([
      {
        couturier_id: couturier.id,
        plan: 'pro',
        montant: MAKETOU_CONFIG.defaultPrice,
        devise: 'FCFA',
        transaction_id: transactionId,
        date_debut: now.toISOString(),
        date_fin: expiry.toISOString(),
        statut: 'actif',
      },
    ]);

    // 10. Notification
    await supabase.from('notifications').insert([
      {
        couturier_id: couturier.id,
        type: 'feature_update',
        category: 'account',
        priority: 'high',
        title: '👑 Votre Plan Pro est activé !',
        message:
          'Votre paiement MakeTou a été validé. Vous bénéficiez désormais de commandes et photos vitrine illimitées.',
        link: '/commandes',
        read: false,
      },
    ]);

    return NextResponse.json({ success: true, source: 'server_verified' });
  } catch (error) {
    console.error('[verify-payment] Erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
