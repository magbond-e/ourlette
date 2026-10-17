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
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { SHOW_ACCOUNT_PLANS } from '@/lib/utils/planLimits';

type ActivationState = 'loading' | 'success' | 'already_pro' | 'error' | 'unauthorized';

function ProConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const { createNotification } = useNotifications();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  useEffect(() => {
    if (!SHOW_ACCOUNT_PLANS) {
      router.replace('/commandes');
    }
  }, [router]);

  const [state, setState] = useState<ActivationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function handleActivation() {
      if (!user?.id) {
        setState('unauthorized');
        return;
      }

      // Récupérer les paramètres envoyés dans l'URL de retour
      const paymentId =
        searchParams.get('payment_id') ||
        searchParams.get('paymentId') ||
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

      // Appel sécurisé côté serveur pour vérifier et activer via SasPay API v1
      try {
        const idToVerify = paymentId || ref;
        if (!idToVerify) {
          setErrorMessage(isEn ? 'Payment ID not found.' : 'Identifiant de paiement introuvable.');
          setState('error');
          return;
        }

        const response = await fetch('/api/pro/saspay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: idToVerify }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          await refreshProfile();

          if (!data.alreadyPro) {
            await createNotification({
              type: 'feature_update',
              category: 'account',
              priority: 'high',
              title: isEn ? '🎉 Congratulations! Your Pro Plan is Active' : '🎉 Félicitations ! Votre Plan Pro est actif',
              message: isEn
                ? 'Your workshop now has unlimited orders, showcase gallery, and branded link.'
                : 'Votre atelier est désormais configuré avec toutes les fonctionnalités illimitées sur Ourlette.',
              link: '/commandes',
            });
          }

          setState(data.alreadyPro ? 'already_pro' : 'success');
        } else if (response.status === 401) {
          setState('unauthorized');
        } else {
          setErrorMessage(
            data.error ||
              (isEn ? 'An error occurred while validating your payment.' : 'Une erreur est survenue lors de la validation de votre paiement.')
          );
          setState('error');
        }
      } catch (err) {
        console.error('[ProConfirmation] Erreur réseau:', err);
        setErrorMessage(isEn ? 'Unable to reach server. Please check your connection.' : 'Impossible de contacter le serveur. Veuillez réessayer.');
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
        <ThreadSpoolLoader label={isEn ? 'Validating your secure Pro subscription…' : 'Validation de votre abonnement Pro sécurisé…'} size="lg" />
      </div>
    );
  }

  // ── Non authentifié ───────────────────────────────────────────
  if (state === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 font-sans relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md p-8 bg-white border border-red-200 shadow-xl rounded-3xl text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-sombre">{isEn ? 'Authentication Required' : 'Connexion requise'}</h1>
          <p className="text-sm text-sombre/70">
            {isEn ? 'You must be logged in to confirm your workshop subscription.' : 'Vous devez être connecté à votre compte Ourlette pour valider votre abonnement.'}
          </p>
          <Link href="/login?redirect=/pro/confirmation">
            <Button variant="accent" fullWidth className="rounded-full font-bold">
              {dict.nav.login}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ── Erreur ────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 font-sans relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md p-8 bg-white border border-amber-200 shadow-xl rounded-3xl text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-sombre">{isEn ? 'Pending Validation' : 'Validation en attente'}</h1>
          <p className="text-sm text-sombre/70">{errorMessage}</p>
          <p className="text-xs text-sombre/50">
            {isEn
              ? 'If you completed your payment, your plan will activate automatically in a few moments. Contact support if this persists.'
              : 'Si vous avez bien effectué le paiement, votre plan sera activé automatiquement dans quelques minutes. Vous pouvez contacter le support si le problème persiste.'}
          </p>
          <div className="flex gap-3">
            <Link href="/commandes" className="flex-1">
              <Button variant="outline" fullWidth className="rounded-full font-semibold text-sm">
                {dict.nav.commandes}
              </Button>
            </Link>
            <Link href="/pro" className="flex-1">
              <Button variant="accent" fullWidth className="rounded-full font-semibold text-sm">
                {dict.common.retry}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ── Succès ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 sm:p-6 font-sans relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
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
            <span>{isEn ? 'SasPay Payment Confirmed' : 'Paiement SasPay Confirmé'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
            {state === 'already_pro'
              ? (isEn ? 'Pro Plan Already Active!' : 'Plan Pro déjà actif !')
              : (isEn ? 'Welcome to Ourlette Pro!' : 'Bienvenue sur le Plan Pro !')}
          </h1>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold max-w-sm mx-auto">
            {state === 'already_pro'
              ? (isEn ? 'Your workshop already enjoys all unlimited features.' : 'Votre atelier bénéficie déjà de toutes les fonctionnalités illimitées.')
              : (isEn
                  ? 'Your payment of 1,999 FCFA has been verified successfully. Your atelier now enjoys unlimited orders and gallery.'
                  : 'Votre paiement de 1 999 FCFA a été validé avec succès. Votre atelier bénéficie désormais de la formule illimitée.')}
          </p>
        </div>

        {/* Unlocked Features Summary */}
        <div className="p-4 sm:p-5 bg-[#FAF9F6] border border-sable/70 rounded-2xl text-left space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            {dict.pro.featuresTitle} :
          </p>
          <div className="space-y-2 text-xs sm:text-sm font-semibold text-sombre">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isEn ? 'Order book ' : 'Carnet de commandes '}<strong>{isEn ? '100% unlimited' : '100% illimité'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isEn ? 'Showcase gallery ' : 'Galerie de réalisations vitrine '}<strong>{isEn ? 'unlimited' : 'illimitée'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dict.pro.featCustomSlug}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dict.pro.featDirectSupport}</span>
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
              <span>{isEn ? 'Access My Workshop' : 'Accéder à mon Atelier'}</span>
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
          <ThreadSpoolLoader label="Validation de votre abonnement Pro SasPay…" size="lg" />
        </div>
      }
    >
      <ProConfirmationContent />
    </Suspense>
  );
}
