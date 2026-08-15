'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Crown, CheckCircle2, ArrowLeft, Tag, ShieldCheck, Zap, Lock, ExternalLink, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/context/AuthContext';
import { MakeTouService, MAKETOU_CONFIG } from '@/lib/services/maketouService';
import { PRO_PLAN_PRICE, isProPlan } from '@/lib/utils/planLimits';
import { formatFCFA } from '@/lib/utils/formatters';

export default function ProUpgradePage() {
  const router = useRouter();
  const { user, couturier } = useAuth();

  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleTriggerPayment = () => {
    if (!user?.id) return;
    setProcessingPayment(true);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ourlette.app';
    const returnUrl = `${origin}/pro/confirmation`;

    const checkoutUrl = MakeTouService.buildCheckoutUrl({
      couturierId: user.id,
      email: couturier?.email || user.email || '',
      phone: couturier?.telephone || couturier?.whatsapp_contact || '',
      name: couturier?.nom_atelier || couturier?.nom || 'Atelier Ourlette',
      returnUrl,
      amount: PRO_PLAN_PRICE,
    });

    // Redirect to MakeTou Secure Checkout
    window.location.href = checkoutUrl;
  };

  const isAlreadyPro = isProPlan(couturier);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
      <header className="bg-gradient-to-b from-sombre to-[#3D1A1E] text-white pt-6 pb-12 px-4 rounded-b-3xl shadow-lg border-b border-gold/30">
        <div className="max-w-3xl mx-auto space-y-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-sable hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold border border-gold/40 flex items-center justify-center font-bold shadow-md">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-2">
                <span>Passer au Plan Pro</span>
                <span className="text-xs bg-gold text-sombre px-2.5 py-0.5 rounded-full font-extrabold uppercase shadow-xs">
                  Illimité
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-clair/80 font-medium mt-0.5">
                Débloquez toute la puissance d’Ourlette pour faire grandir et professionnaliser votre atelier
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-6 space-y-6">
        {/* Card Pricing */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-gold/40 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sable/50 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Formule Atelier Pro</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-display font-extrabold text-sombre font-mono">
                  {formatFCFA(PRO_PLAN_PRICE)}
                </span>
                <span className="text-xs sm:text-sm text-sombre/60 font-bold">/ mois</span>
              </div>
              <p className="text-xs text-sombre/60 font-semibold mt-1">
                Sans engagement • Annulation à tout moment
              </p>
            </div>

            {isAlreadyPro ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-300 text-xs font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Votre atelier bénéficie déjà du Plan Pro Illimité.</span>
              </div>
            ) : (
              <Button
                variant="gold"
                size="lg"
                onClick={handleTriggerPayment}
                disabled={processingPayment}
                className="rounded-full text-sombre font-extrabold text-sm sm:text-base px-8 py-4 shadow-lg hover:scale-[1.02] transition-transform gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>
                  {processingPayment
                    ? 'Redirection vers MakeTou…'
                    : 'Payer via Mobile Money / Carte'}
                </span>
              </Button>
            )}
          </div>

          {/* Features Comparison */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-sombre border-b border-sable/40 pb-2">
              Avantages inclus dans le Plan Pro :
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-sombre">
              <div className="flex items-center gap-2.5 p-3.5 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Commandes illimitées</strong> (vs 10 max)</span>
              </div>

              <div className="flex items-center gap-2.5 p-3.5 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Photos de vitrine illimitées</strong> (vs 8 max)</span>
              </div>

              <div className="flex items-center gap-2.5 p-3.5 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Lien personnalisé sur-mesure</strong> (ourlette.app/votre-atelier)</span>
              </div>

              <div className="flex items-center gap-2.5 p-3.5 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Badge d'Atelier Certifié</strong> sur votre vitrine</span>
              </div>

              <div className="flex items-center gap-2.5 p-3.5 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Support prioritaire WhatsApp 7j/7</strong></span>
              </div>

              <div className="flex items-center gap-2.5 p-3.5 bg-[#FAF9F6] border border-sable/50 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Exportation des fiches clients & mesures</strong></span>
              </div>
            </div>
          </div>

          {/* Secure Payment Badges */}
          <div className="pt-4 border-t border-sable/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-sombre/70 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Paiement 100% sécurisé par MakeTou (MTN, Moov, Wave, Orange, Cartes)
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Sans engagement
            </span>
          </div>
        </Card>
      </main>
    </div>
  );
}
