'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import { useEffect } from 'react';
import { PRO_PLAN_PRICE, isProPlan, SHOW_ACCOUNT_PLANS } from '@/lib/utils/planLimits';
import { formatFCFA } from '@/lib/utils/formatters';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function ProUpgradePage() {
  const router = useRouter();
  const { user, couturier } = useAuth();
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

  const isAlreadyPro = isProPlan(couturier);

  const handleSasPayCheckout = async () => {
    if (!user?.id) {
      router.push('/login?redirect=/pro');
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
        // Redirection vers la page de paiement sécurisée SasPay
        window.location.href = data.checkout_url;
      } else {
        setErrorMessage(
          data.error || (isEn ? 'Unable to initialize SasPay checkout. Please try again.' : 'Impossible d’initialiser le paiement SasPay. Veuillez réessayer.')
        );
        setProcessingPayment(false);
      }
    } catch (err) {
      console.error('[ProUpgrade] Erreur:', err);
      setErrorMessage(isEn ? 'Network error. Please check your connection.' : 'Erreur réseau. Veuillez vérifier votre connexion.');
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] pb-24 font-sans selection:bg-gold/30">
      {/* ── Top Header Modern Mobile-First ─────────────────────────────── */}
      <header className="relative bg-gradient-to-b from-[#221013] via-[#331419] to-sombre text-white pt-6 pb-14 px-4 rounded-b-[2.5rem] shadow-xl overflow-hidden border-b border-gold/20">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md text-xs font-bold text-sable transition-colors border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{dict.common.back}</span>
            </button>
            <LanguageSwitcher isDark variant="compact" />
          </div>

          <div className="flex items-center gap-3.5 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 text-gold border border-gold/40 flex items-center justify-center font-bold shadow-lg shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                  {dict.pro.heroTitle}
                </h1>
                <span className="text-[11px] bg-gold text-sombre px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-xs">
                  {dict.parametres.unlimited}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-clair/80 font-medium mt-0.5">
                {dict.pro.heroSubtitle}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ─────────────────────────────────────── */}
      <main className="max-w-xl mx-auto px-4 -mt-8 space-y-5 relative z-20">
        {/* Pricing Card */}
        <Card className="p-5 sm:p-7 bg-white border border-gold/40 rounded-3xl shadow-xl space-y-6">
          {/* Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sable/50 pb-5">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-accent">
                {isEn ? 'Single & Transparent Pricing' : 'Tarif Unique & Transparent'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-display font-extrabold text-sombre font-mono tracking-tight">
                  {formatFCFA(PRO_PLAN_PRICE)}
                </span>
                <span className="text-xs sm:text-sm text-sombre/60 font-bold">{dict.pro.perMonth}</span>
              </div>
              <p className="text-[11px] text-sombre/60 font-semibold mt-1">
                {isEn ? 'No commitment • Instant activation 24/7' : 'Sans engagement • Activation immédiate 24/7'}
              </p>
            </div>

            {isAlreadyPro ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-300 text-xs font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{isEn ? 'Your workshop is already on the Unlimited Pro Plan.' : 'Votre atelier est déjà sur le Plan Pro Illimité.'}</span>
              </div>
            ) : null}
          </div>

          {/* Payment Method Badges (SasPay Multi-Network) */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-sombre uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-accent" />
              <span>{isEn ? 'Accepted Payment Methods (SasPay):' : 'Modes de paiement acceptés (SasPay) :'}</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-sable/60 flex items-center gap-2 text-xs font-bold text-sombre shadow-2xs">
                <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                <span>MTN Money</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-sable/60 flex items-center gap-2 text-xs font-bold text-sombre shadow-2xs">
                <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span>Moov Money</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-sable/60 flex items-center gap-2 text-xs font-bold text-sombre shadow-2xs">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shrink-0" />
                <span>Wave</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-sable/60 flex items-center gap-2 text-xs font-bold text-sombre shadow-2xs">
                <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                <span>Orange Money</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-sombre/60 font-semibold pt-1">
              <CreditCard className="w-3.5 h-3.5 text-accent" />
              <span>{isEn ? 'Visa, Mastercard & Djamo cards also accepted.' : 'Cartes bancaires Visa, Mastercard & Djamo également disponibles.'}</span>
            </div>
          </div>

          {/* Error notification if any */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Action Button */}
          {!isAlreadyPro && (
            <div className="pt-2">
              <Button
                variant="gold"
                size="lg"
                fullWidth
                onClick={handleSasPayCheckout}
                disabled={processingPayment}
                className="rounded-2xl text-sombre font-extrabold text-sm sm:text-base py-4 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all gap-2"
              >
                <Sparkles className="w-5 h-5 text-sombre" />
                <span>
                  {processingPayment
                    ? (isEn ? 'Opening SasPay Checkout…' : 'Ouverture du paiement SasPay…')
                    : dict.pro.paySasPayBtn}
                </span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          )}

          {/* Feature Highlights Grouped */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sombre border-b border-sable/40 pb-2">
              {dict.pro.featuresTitle}
            </h3>

            <div className="grid grid-cols-1 gap-2.5 text-xs font-semibold text-sombre">
              <div className="flex items-center gap-2.5 p-3 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>{dict.pro.featUnlimitedOrders}</strong> ({dict.pro.featUnlimitedOrdersDesc})</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>{dict.pro.featUnlimitedPhotos}</strong> ({dict.pro.featUnlimitedPhotosDesc})</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>{dict.pro.featCustomSlug}</strong> ({dict.pro.featCustomSlugDesc})</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>{dict.pro.featCertifiedBadge}</strong> ({dict.pro.featCertifiedBadgeDesc})</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>{isEn ? 'Export Client Profiles & Measurements' : 'Exportation des fiches clients & mesures'}</strong></span>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>{dict.pro.featDirectSupport}</strong> ({dict.pro.featDirectSupportDesc})</span>
              </div>
            </div>
          </div>

          {/* Security guarantee */}
          <div className="pt-3 border-t border-sable/40 flex items-center justify-between gap-2 text-[11px] text-sombre/70 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dict.pro.saspayGuarantee}</span>
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>{isEn ? 'Cancel anytime' : 'Annulation libre'}</span>
            </span>
          </div>
        </Card>
      </main>
    </div>
  );
}
