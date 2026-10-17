import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SasPayService } from '@/lib/services/saspayService';
import { SasPayWebhookPayload, SasPayWebhookTransactionData } from '@/lib/types/saspay';

export const dynamic = 'force-dynamic';

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    // 1. Lire le corps BRUT obligatoire pour le calcul de signature HMAC
    const rawBody = await request.text();

    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');
    const eventType = request.headers.get('x-webhook-event');

    // 2. Vérification cryptographique de la signature et de l'âge du webhook
    const verification = SasPayService.verifyWebhookSignature(rawBody, signature, timestamp);
    if (!verification.valid) {
      console.error('[SasPay Webhook] Rejet de sécurité :', verification.reason);
      return NextResponse.json(
        { error: 'Signature invalide ou horodatage expiré', reason: verification.reason },
        { status: 403 }
      );
    }

    // 3. Parser le corps JSON après validation de signature
    let payload: SasPayWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
    }

    const event = payload.event || eventType;

    // 4. Cas de test de webhook depuis le dashboard
    if (event === 'webhook.test') {
      return NextResponse.json(
        { success: true, message: 'Webhook test validé avec succès' },
        { status: 200 }
      );
    }

    // 5. Traitement des transactions réussies
    if (event === 'transaction.success') {
      const data = payload.data as SasPayWebhookTransactionData;
      const paymentId = data?.id;

      if (!paymentId) {
        return NextResponse.json({ error: 'ID de transaction manquant' }, { status: 400 });
      }

      // Règle formelle SasPay : ne livrer QUE si GET /payments/{payment_id}/verify/ renvoie SUCCESS
      let verificationResult;
      try {
        verificationResult = await SasPayService.verifyPayment(paymentId);
      } catch (err: any) {
        console.error('[SasPay Webhook] Erreur lors de la vérification API du paiement :', err);
        return NextResponse.json(
          { error: 'Échec de la vérification du paiement auprès de SasPay' },
          { status: 502 }
        );
      }

      if (verificationResult.status !== 'SUCCESS') {
        console.warn(
          `[SasPay Webhook] Paiement ${paymentId} non confirmé (statut: ${verificationResult.status})`
        );
        return NextResponse.json(
          { message: `Statut non éligible à la livraison: ${verificationResult.status}` },
          { status: 200 }
        );
      }

      const supabase = createServiceClient();
      if (!supabase) {
        console.error('[SasPay Webhook] Client Supabase indisponible');
        return NextResponse.json({ error: 'Configuration base de données manquante' }, { status: 500 });
      }

      // 6. Idempotence : vérifier si cette transaction a déjà été traitée
      const { data: existingAbonnement } = await supabase
        .from('abonnements')
        .select('id, statut')
        .eq('transaction_id', paymentId)
        .maybeSingle();

      if (existingAbonnement) {
        return NextResponse.json(
          { success: true, message: 'Transaction déjà traitée (idempotent)' },
          { status: 200 }
        );
      }

      // Retrouver le couturier par metadata ou email
      let couturierId =
        data.metadata?.couturier_id ||
        data.metadata?.ref ||
        data.metadata?.user_id;

      const customerEmail =
        typeof verificationResult.customer === 'object'
          ? verificationResult.customer?.email
          : undefined;

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
        console.error('[SasPay Webhook] Impossible de trouver le couturier associé :', {
          metadata: data.metadata,
          customerEmail,
        });
        return NextResponse.json({ error: 'Identifiant couturier introuvable' }, { status: 400 });
      }

      // 7. Activer le plan Pro
      const { error: updateError } = await supabase
        .from('couturiers')
        .update({
          plan: 'pro',
          plan_change_manuel: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', couturierId);

      if (updateError) {
        console.error('[SasPay Webhook] Erreur mise à jour plan couturier :', updateError);
      }

      // 8. Enregistrer l'abonnement
      const now = new Date();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      const chargedAmount =
        parseFloat(verificationResult.debited_amount || verificationResult.requested_amount || '1999');

      await supabase.from('abonnements').insert([
        {
          couturier_id: couturierId,
          plan: 'pro',
          montant: chargedAmount,
          devise: verificationResult.currency || 'XOF',
          transaction_id: paymentId,
          date_debut: now.toISOString(),
          date_fin: expiry.toISOString(),
          statut: 'actif',
        },
      ]);

      // 9. Notification utilisateur
      try {
        await supabase.from('notifications').insert([
          {
            couturier_id: couturierId,
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
      } catch (notifErr) {
        console.warn('[SasPay Webhook] Notification note :', notifErr);
      }

      return NextResponse.json(
        { success: true, message: 'Plan Pro activé avec succès via SasPay' },
        { status: 200 }
      );
    }

    // Autres événements (transaction.failed, transaction.cancelled, etc.)
    return NextResponse.json(
      { success: true, message: `Événement ${event} reçu et archivé` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[SasPay Webhook] Erreur inattendue :', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
