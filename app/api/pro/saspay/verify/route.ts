import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { SasPayService } from '@/lib/services/saspayService';
import { PRO_PLAN_PRICE } from '@/lib/utils/planLimits';

export const dynamic = 'force-dynamic';

/**
 * Route sécurisée de vérification de paiement SasPay
 * Règle impérative SasPay : Ne livrer que si GET /payments/{payment_id}/verify/ renvoie SUCCESS
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const adminDb = createServiceClient() || supabase;

    // 1. Vérifier l'authentification de l'utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Extraire payment_id ou transaction_id
    const body = await request.json().catch(() => ({}));
    const paymentId = body.paymentId || body.payment_id || body.transaction_id;

    if (!paymentId) {
      return NextResponse.json({ error: 'Identifiant de paiement manquant' }, { status: 400 });
    }

    // 3. Récupérer le couturier lié à l'utilisateur
    const { data: couturier, error: couturierError } = await adminDb
      .from('couturiers')
      .select('id, plan, email')
      .eq('id', user.id)
      .maybeSingle();

    if (couturierError || !couturier) {
      return NextResponse.json({ error: 'Profil couturier introuvable' }, { status: 404 });
    }

    // 4. Si déjà Pro et abonnement présent, idempotent
    if (couturier.plan === 'pro') {
      return NextResponse.json({ success: true, alreadyPro: true, status: 'SUCCESS' });
    }

    // 5. Appel serveur vers SasPay : GET /payments/{payment_id}/verify/
    const verification = await SasPayService.verifyPayment(paymentId);

    if (verification.status !== 'SUCCESS') {
      return NextResponse.json({
        success: false,
        status: verification.status,
        message: `Paiement en attente ou non confirmé (${verification.status})`,
      });
    }

    // 6. Sécurité : vérifier que le paiement correspond bien à cet atelier
    const paymentMetadataCouturierId =
      (verification as any).metadata?.couturier_id ||
      (verification as any).metadata?.user_id;

    if (
      paymentMetadataCouturierId &&
      paymentMetadataCouturierId !== couturier.id &&
      paymentMetadataCouturierId !== user.id
    ) {
      console.error('[SasPay Verify] Suspicion de fraude — couturierId mismatch:', {
        metaId: paymentMetadataCouturierId,
        actualId: couturier.id,
      });
      return NextResponse.json({ error: 'Paiement non rattaché à ce compte' }, { status: 403 });
    }

    // 7. Vérifier si l'abonnement a déjà été inséré (ex: par le webhook)
    const { data: existingAbonnement } = await adminDb
      .from('abonnements')
      .select('id, statut')
      .eq('transaction_id', paymentId)
      .maybeSingle();

    if (existingAbonnement?.statut === 'actif') {
      // S'assurer que le couturier a le statut Pro à jour
      await adminDb
        .from('couturiers')
        .update({ plan: 'pro', plan_change_manuel: false, updated_at: new Date().toISOString() })
        .eq('id', couturier.id);

      return NextResponse.json({ success: true, source: 'webhook_already_processed', status: 'SUCCESS' });
    }

    // 8. Activer le plan Pro pour le couturier
    const { error: updateError } = await adminDb
      .from('couturiers')
      .update({ plan: 'pro', plan_change_manuel: false, updated_at: new Date().toISOString() })
      .eq('id', couturier.id);

    if (updateError) {
      console.error('[SasPay Verify] Erreur update couturier :', updateError);
      return NextResponse.json({ error: 'Erreur mise à jour plan' }, { status: 500 });
    }

    // 9. Insérer l'enregistrement dans la table abonnements
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const paidAmount =
      parseFloat(verification.debited_amount || verification.requested_amount || '1999') ||
      PRO_PLAN_PRICE;

    await adminDb.from('abonnements').insert([
      {
        couturier_id: couturier.id,
        plan: 'pro',
        montant: paidAmount,
        devise: verification.currency || 'XOF',
        transaction_id: paymentId,
        date_debut: now.toISOString(),
        date_fin: expiry.toISOString(),
        statut: 'actif',
      },
    ]);

    // 10. Notification de félicitations
    await adminDb.from('notifications').insert([
      {
        couturier_id: couturier.id,
        type: 'feature_update',
        category: 'account',
        priority: 'high',
        title: '👑 Votre Plan Pro est activé !',
        message:
          'Votre paiement SasPay a été validé avec succès. Vous bénéficiez désormais de commandes et photos vitrine illimitées.',
        link: '/commandes',
        read: false,
      },
    ]);

    return NextResponse.json({
      success: true,
      status: 'SUCCESS',
      source: 'server_verified',
      reference: verification.reference,
    });
  } catch (error: any) {
    console.error('[SasPay Verify] Erreur :', error);
    return NextResponse.json(
      {
        error: error.message || 'Erreur lors de la vérification du paiement',
        code: error.code || 'verification_failed',
      },
      { status: error.status || 500 }
    );
  }
}
