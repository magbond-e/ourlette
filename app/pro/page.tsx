'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Crown,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Lock,
  ArrowRight,
  Smartphone,
  CreditCard,
  Tag,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import { PRO_PLAN_PRICE, isProPlan, SHOW_ACCOUNT_PLANS } from '@/lib/utils/planLimits';
import { formatFCFA } from '@/lib/utils/formatters';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function ProUpgradePage() {
  const router = useRouter();
  const { user, couturier, refreshProfile } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  useEffect(() => {
    if (!SHOW_ACCOUNT_PLANS) {
      router.replace('/commandes');
    }
  }, [router]);

  if (!SHOW_ACCOUNT_PLANS) {
    return null;
  }

  const [processingPayment, setProcessingPayment] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(
    couturier?.telephone || couturier?.whatsapp_contact || ''
  );
  const [errorMessage, setErrorMessage] = useState('');

  // Promo Code State (replié par défaut)
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState('');
  const [promoErrorMsg, setPromoErrorMsg] = useState('');

  const isAlreadyPro = isProPlan(couturier);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setPromoErrorMsg(
        isEn
          ? 'Internet connection required to validate a promo code.'
          : 'Connexion internet requise pour valider un code promo.'
      );
      return;
    }

    setPromoApplying(true);
    setPromoErrorMsg('');
    setPromoSuccessMsg('');

    try {
      const res = await fetch('/api/pro/promo/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPromoSuccessMsg(data.message || (isEn ? 'Promo code applied!' : 'Code promo validé !'));
        if (data.activated) {
          await refreshProfile();
          setTimeout(() => {
            router.push('/commandes');
          }, 1500);
        }
      } else {
        setPromoErrorMsg(data.error || (isEn ? 'Invalid promo code.' : 'Code promotionnel invalide.'));
      }
    } catch {
      setPromoErrorMsg(isEn ? 'Network error. Please try again.' : 'Erreur réseau. Veuillez réessayer.');
    } finally {
      setPromoApplying(false);
    }
  };

  const handleSasPayCheckout = async () => {
    if (!user?.id) {
      router.push('/login?redirect=/pro');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMessage(
        isEn
          ? 'Internet connection required to activate the Pro Plan. Your local orders and measurements remain fully accessible.'
          : 'Connexion internet requise pour souscrire au plan Pro. Vos commandes et mesures locales restent pleinement accessibles.'
      );
      return;
    }

    setProcessingPayment(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/pro/saspay/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'checkout',
          country: couturier?.pays || 'BJ',
          currency: 'XOF',
          phone: phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setErrorMessage(
          data.error ||
            (isEn
              ? 'Unable to initialize SasPay checkout. Please try again.'
              : 'Impossible d’initialiser le paiement SasPay. Veuillez réessayer.')
        );
        setProcessingPayment(false);
      }
    } catch (err) {
      console.error('[ProUpgrade] Erreur:', err);
      setErrorMessage(
        isEn
          ? 'Network error. Please check your connection.'
          : 'Erreur réseau. Veuillez vérifier votre connexion.'
      );
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans text-sombre">
      {/* ── En-tête Mobile-First ──────────────────────────────────────── */}
      <header className="bg-sombre text-white pt-4 pb-10 px-4 rounded-b-3xl shadow-md border-b border-gold/30">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{locale === 'fr' ? 'Retour' : 'Back'}</span>
            </button>
            <LanguageSwitcher isDark variant="compact" />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold border border-gold/40 flex items-center justify-center font-bold shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white">
                {locale === 'fr' ? 'Ourlette Pro' : 'Ourlette Pro'}
              </h1>
              <p className="text-xs text-sable">
                {locale === 'fr'
                  ? 'Libérez tout le potentiel de votre atelier'
                  : 'Unlock your workshop full capacity'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenu Principal ─────────────────────────────────────────── */}
      <main className="max-w-md mx-auto px-4 -mt-6 space-y-4">

        {/* Carte de Tarif & Paiement */}
        <Card className="p-5 bg-white border border-sable/70 rounded-3xl shadow-sm space-y-5">
          {/* Prix lu depuis la configuration (jamais codé en dur) */}
          <div className="border-b border-sable/40 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              {locale === 'fr' ? 'Abonnement Mensuel' : 'Monthly Subscription'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-display font-bold text-sombre">
                {formatFCFA(PRO_PLAN_PRICE)} FCFA
              </span>
              <span className="text-xs text-sombre/60 font-semibold">
                /{locale === 'fr' ? 'mois' : 'month'}
              </span>
            </div>
            <p className="text-[11px] text-sombre/60 mt-0.5 font-medium">
              {locale === 'fr' ? 'Sans engagement · Annulable à tout moment' : 'No commitment · Cancel anytime'}
            </p>

            {isAlreadyPro && (
              <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-300 text-xs font-bold flex items-center gap-2">
                <Crown className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{locale === 'fr' ? 'Votre atelier est déjà abonné au Plan Pro.' : 'Your workshop is already on Pro.'}</span>
              </div>
            )}
          </div>

          {/* 4-5 Avantages concrets selon Section 3.O */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-fonce">
              {locale === 'fr' ? 'Ce qui est inclus en Pro :' : 'Included in Pro:'}
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 bg-[#FAFAF8] rounded-2xl border border-sable/50">
                <CheckCircle2 className="w-4 h-4 text-vertbouton shrink-0 mt-0.5" />
                <span><strong>{locale === 'fr' ? 'Commandes actives illimitées' : 'Unlimited active orders'}</strong> ({locale === 'fr' ? 'aucun blocage à 10 commandes' : 'no 10-order cap'})</span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-[#FAFAF8] rounded-2xl border border-sable/50">
                <CheckCircle2 className="w-4 h-4 text-vertbouton shrink-0 mt-0.5" />
                <span><strong>{locale === 'fr' ? 'Photos de vitrine illimitées' : 'Unlimited showcase photos'}</strong> ({locale === 'fr' ? 'au-delà de 8 photos' : 'beyond 8 photos'})</span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-[#FAFAF8] rounded-2xl border border-sable/50">
                <CheckCircle2 className="w-4 h-4 text-vertbouton shrink-0 mt-0.5" />
                <span><strong>{locale === 'fr' ? 'Lien personnalisé' : 'Custom URL link'}</strong> (ourlette.app/nom-atelier)</span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-[#FAFAF8] rounded-2xl border border-sable/50">
                <CheckCircle2 className="w-4 h-4 text-vertbouton shrink-0 mt-0.5" />
                <span><strong>{locale === 'fr' ? 'Retrait de la mention « Créé avec Ourlette »' : 'Remove “Created with Ourlette” badge'}</strong></span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-[#FAFAF8] rounded-2xl border border-sable/50">
                <CheckCircle2 className="w-4 h-4 text-vertbouton shrink-0 mt-0.5" />
                <span><strong>{locale === 'fr' ? 'Export des données & Support prioritaire WhatsApp 7j/7' : 'Data export & Priority WhatsApp support'}</strong></span>
              </div>
            </div>
          </div>

          {/* Opérateurs acceptés via SasPay */}
          <div className="space-y-2 pt-1 border-t border-sable/30">
            <span className="text-[11px] font-bold text-sombre/70 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-fonce" />
              <span>{locale === 'fr' ? 'Mobile Money & Cartes (SasPay)' : 'Mobile Money & Cards (SasPay)'}</span>
            </span>

            <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold text-sombre text-center">
              <div className="p-2 bg-[#FAFAF8] rounded-xl border border-sable/60">MTN</div>
              <div className="p-2 bg-[#FAFAF8] rounded-xl border border-sable/60">Moov</div>
              <div className="p-2 bg-[#FAFAF8] rounded-xl border border-sable/60">Wave</div>
              <div className="p-2 bg-[#FAFAF8] rounded-xl border border-sable/60">Orange</div>
            </div>
          </div>

          {/* Champ « J'ai un code » replié par défaut */}
          <div className="pt-1 border-t border-sable/30">
            <button
              type="button"
              onClick={() => setShowPromoInput(!showPromoInput)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-fonce hover:underline cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{locale === 'fr' ? 'J’ai un code promo' : 'I have a promo code'}</span>
              {showPromoInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showPromoInput && (
              <form onSubmit={handleApplyPromo} className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="EX: PROMO100"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 h-10 px-3 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs font-mono font-bold text-sombre focus:outline-hidden focus:border-fonce uppercase"
                />
                <Button
                  type="submit"
                  disabled={promoApplying || !promoCode.trim()}
                  className="rounded-xl h-10 text-xs px-4 bg-sombre text-white font-bold shrink-0"
                >
                  {promoApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === 'fr' ? 'Appliquer' : 'Apply')}
                </Button>
              </form>
            )}

            {promoSuccessMsg && (
              <p className="text-xs font-bold text-vertbouton mt-2 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{promoSuccessMsg}</span>
              </p>
            )}
            {promoErrorMsg && (
              <p className="text-xs font-bold text-rose-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{promoErrorMsg}</span>
              </p>
            )}
          </div>

          {/* Message d'erreur SasPay si présent */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Bouton Payer X FCFA (montant lu dynamiquement depuis la configuration) */}
          {!isAlreadyPro && (
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleSasPayCheckout}
                disabled={processingPayment}
                className="w-full rounded-2xl h-12 bg-accent hover:bg-fonce text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {processingPayment
                    ? (locale === 'fr' ? 'Ouverture du paiement SasPay…' : 'Opening checkout…')
                    : (locale === 'fr' ? `Payer ${formatFCFA(PRO_PLAN_PRICE)} FCFA` : `Pay ${formatFCFA(PRO_PLAN_PRICE)} FCFA`)}
                </span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          )}

          {/* Sécurité */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-sombre/60 font-semibold border-t border-sable/30">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-vertbouton" />
              <span>Paiement sécurisé SasPay</span>
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-sombre/40" />
              <span>Cryptage SSL 256-bit</span>
            </span>
          </div>
        </Card>

      </main>
    </div>
  );
}
