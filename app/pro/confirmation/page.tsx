'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Crown,
  CheckCircle,
  Sparkles,
  ArrowRight,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';

type ActivationState = 'loading' | 'success' | 'already_pro' | 'error' | 'unauthorized';

function ProConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const { createNotification } = useNotifications();
  const [state, setState] = useState<ActivationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function handleActivation() {
      if (!user?.id) {
        setState('unauthorized');
        return;
      }

      // Récupérer les paramètres envoyés par MakeTou dans l'URL de retour
      const orderId =
        searchParams.get('order_id') ||
        searchParams.get('orderId') ||
        searchParams.get('id') ||
        searchParams.get('transaction_id') ||
        undefined;

      const ref =
        searchParams.get('ref') ||
        searchParams.get('custom_data') ||
        searchParams.get('reference') ||
        undefined;

      // Appel sécurisé côté serveur pour vérifier et activer
      try {
        const response = await fetch('/api/pro/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, ref }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          await refreshProfile();

          if (!data.alreadyPro) {
            await createNotification({
              type: 'feature_update',
              category: 'account',
              priority: 'high',
              title: '🎉 Félicitations ! Votre Plan Pro est actif',
              message:
                'Votre atelier est désormais configuré avec toutes les fonctionnalités illimitées sur Ourlette.',
              link: '/commandes',
            });
          }

          setState(data.alreadyPro ? 'already_pro' : 'success');
        } else if (response.status === 401) {
          setState('unauthorized');
        } else {
          setErrorMessage(
            data.error ||
              'Une erreur est survenue lors de la validation de votre paiement.'
          );
          setState('error');
        }
      } catch (err) {
        console.error('[ProConfirmation] Erreur réseau:', err);
        setErrorMessage('Impossible de contacter le serveur. Veuillez réessayer.');
        setState('error');
      }
    }

    handleActivation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Chargement ────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 font-sans">
        <ThreadSpoolLoader label="Validation de votre abonnement Pro MakeTou…" size="lg" />
      </div>
    );
  }

  // ── Non authentifié ───────────────────────────────────────────
  if (state === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-md p-8 bg-white border border-red-200 shadow-xl rounded-3xl text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-sombre">Connexion requise</h1>
          <p className="text-sm text-sombre/70">
            Vous devez être connecté à votre compte Ourlette pour valider votre abonnement.
          </p>
          <Link href="/auth/login?redirect=/pro/confirmation">
            <Button variant="accent" fullWidth className="rounded-full font-bold">
              Se connecter
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ── Erreur ────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-md p-8 bg-white border border-amber-200 shadow-xl rounded-3xl text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-sombre">Validation en attente</h1>
          <p className="text-sm text-sombre/70">{errorMessage}</p>
          <p className="text-xs text-sombre/50">
            Si vous avez bien effectué le paiement, votre plan sera activé automatiquement dans quelques minutes.
            Vous pouvez contacter le support si le problème persiste.
          </p>
          <div className="flex gap-3">
            <Link href="/commandes" className="flex-1">
              <Button variant="outline" fullWidth className="rounded-full font-semibold text-sm">
                Mon atelier
              </Button>
            </Link>
            <Link href="/pro" className="flex-1">
              <Button variant="accent" fullWidth className="rounded-full font-semibold text-sm">
                Réessayer
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ── Succès ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 sm:p-6 font-sans">
      <Card className="w-full max-w-lg p-6 sm:p-9 bg-white border border-gold/40 shadow-2xl rounded-3xl text-center space-y-6 animate-in fade-in zoom-in-95">
        {/* Gold Crown Badge */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-sombre to-[#4A151C] flex items-center justify-center shadow-xl border-2 border-gold text-gold">
          <Crown className="w-10 h-10 animate-bounce" />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-extrabold shadow-md">
            ✓
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/15 text-sombre rounded-full text-xs font-bold border border-gold/40">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Paiement MakeTou Confirmé</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
            {state === 'already_pro' ? 'Plan Pro déjà actif !' : 'Bienvenue sur le Plan Pro !'}
          </h1>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold max-w-sm mx-auto">
            {state === 'already_pro'
              ? 'Votre atelier bénéficie déjà de toutes les fonctionnalités illimitées.'
              : 'Votre paiement de '}
            {state !== 'already_pro' && (
              <>
                <span className="text-sombre font-extrabold">1 999 FCFA</span> a été validé avec
                succès. Votre atelier bénéficie désormais de la formule illimitée.
              </>
            )}
          </p>
        </div>

        {/* Unlocked Features Summary */}
        <div className="p-4 sm:p-5 bg-[#FAF9F6] border border-sable/70 rounded-2xl text-left space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            Vos avantages actifs dès maintenant :
          </p>
          <div className="space-y-2 text-xs sm:text-sm font-semibold text-sombre">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Carnet de commandes <strong>100% illimité</strong>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Galerie de réalisations vitrine <strong>illimitée</strong>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Lien personnalisé de vitrine d&apos;atelier</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sauvegarde continue &amp; support prioritaire 7j/7</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link href="/commandes">
            <Button
              variant="accent"
              size="lg"
              fullWidth
              className="rounded-full font-extrabold text-sm gap-2 shadow-lg shadow-accent/20"
            >
              <span>Accéder à mon Atelier</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function ProConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 font-sans">
          <ThreadSpoolLoader label="Validation de votre abonnement Pro MakeTou…" size="lg" />
        </div>
      }
    >
      <ProConfirmationContent />
    </Suspense>
  );
}
