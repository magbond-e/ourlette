'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Crown, CheckCircle2, ArrowLeft, Tag, ShieldCheck, Zap, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { useAuth } from '@/lib/context/AuthContext';
import { DataService } from '@/lib/services/dataService';
import { KkiapayService } from '@/lib/services/kkiapayService';
import { PRO_PLAN_PRICE, isProPlan } from '@/lib/utils/planLimits';
import { formatFCFA } from '@/lib/utils/formatters';
import { CodePromo } from '@/lib/types/database';

export default function ProUpgradePage() {
  const router = useRouter();
  const { user, couturier, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<CodePromo | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(PRO_PLAN_PRICE);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    KkiapayService.loadScript();
  }, []);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    setLoading(true);
    setPromoMessage(null);

    const result = await KkiapayService.validatePromoCode(promoCodeInput);

    if (result.valid) {
      setAppliedPromo(result.promo || null);
      setDiscountAmount(result.discountAmount);
      setFinalPrice(result.finalPrice);
      setPromoMessage({ text: result.message || 'Code promo appliqué avec succès !', isError: false });
    } else {
      setAppliedPromo(null);
      setDiscountAmount(0);
      setFinalPrice(PRO_PLAN_PRICE);
      setPromoMessage({ text: result.message || 'Code promo invalide.', isError: true });
    }
    setLoading(false);
  };

  const handleTriggerPayment = async () => {
    if (!user?.id) return;
    setProcessingPayment(true);

    try {
      await KkiapayService.openPaymentWidget({
        amount: finalPrice,
        email: couturier?.email || user.email || '',
        phone: couturier?.telephone || '',
        name: couturier?.nom_atelier || couturier?.nom || 'Couturier Ourlette',
        data: `Abonnement Pro - ${couturier?.nom_atelier || user.id}`,
        onSuccess: async (res) => {
          // Upgrade user to Pro in database
          const updated = await DataService.updateCouturier(user.id, {
            plan: 'pro',
            plan_change_manuel: false,
          });

          if (updated) {
            await refreshProfile();
            setSuccessMessage('🎉 Félicitations ! Votre atelier est désormais activé sur le Plan Pro !');
            setTimeout(() => {
              router.push('/commandes');
            }, 2500);
          }
        },
        onFailed: (err) => {
          console.error('KKiaPay Payment failed:', err);
          alert('Le paiement n’a pas pu être finalisé. Veuillez réessayer ou contacter le support.');
          setProcessingPayment(false);
        },
      });
    } catch (err) {
      console.error(err);
      setProcessingPayment(false);
    }
  };

  const isAlreadyPro = isProPlan(couturier);

  return (
    <div className="min-h-screen bg-clair pb-28 font-sans">
      <header className="bg-sombre text-white pt-6 pb-12 px-4 rounded-b-3xl shadow-lg border-b border-gold/30">
        <div className="max-w-3xl mx-auto space-y-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-sable hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold border border-gold/40 flex items-center justify-center font-bold">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-2">
                <span>Passer au Plan Pro</span>
                <span className="text-xs bg-gold text-sombre px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                  Illimité
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-clair/80 font-medium mt-0.5">
                Débloquez toute la puissance d’Ourlette pour faire grandir votre atelier
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-6 space-y-6">
        {successMessage && (
          <div className="p-4 bg-emerald-500 text-white rounded-2xl text-sm font-bold flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Card Pricing */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-gold/40 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sable/50 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Formule Atelier Pro</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-display font-extrabold text-sombre font-mono">
                  {formatFCFA(finalPrice)}
                </span>
                <span className="text-xs sm:text-sm text-sombre/60 font-bold">/ mois</span>
              </div>
              {discountAmount > 0 && (
                <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Prix initial : {formatFCFA(PRO_PLAN_PRICE)} (-{formatFCFA(discountAmount)})</span>
                </p>
              )}
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
                <span>{processingPayment ? 'Ouverture de KKiaPay…' : 'Payer via Mobile Money / CB'}</span>
              </Button>
            )}
          </div>

          {/* Code Promo Form */}
          {!isAlreadyPro && (
            <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-sable/60 space-y-3">
              <label className="text-xs font-bold text-sombre flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-accent" />
                <span>Vous avez un code promo ?</span>
              </label>

              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="ex: PARRAIN2026"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  className="bg-white uppercase font-mono"
                />
                <Button type="submit" variant="outline" disabled={loading || !promoCodeInput.trim()} className="rounded-2xl shrink-0 font-bold">
                  {loading ? 'Vérification…' : 'Appliquer'}
                </Button>
              </form>

              {promoMessage && (
                <p className={`text-xs font-bold ${promoMessage.isError ? 'text-accent' : 'text-emerald-600'}`}>
                  {promoMessage.text}
                </p>
              )}
            </div>
          )}

          {/* Features Comparison */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-sombre border-b border-sable/40 pb-2">
              Avantages inclus dans le Plan Pro :
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-sombre">
              <div className="flex items-center gap-2 p-3 bg-clair/70 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Commandes illimitées</strong> (vs 10 max)</span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-clair/70 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Vitrine avec photos illimitées</strong> (vs 8 max)</span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-clair/70 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Lien personnalisé sur-mesure</strong> (ex: ourlette.app/votre-atelier)</span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-clair/70 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Badge Certifié sur la vitrine</strong></span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-clair/70 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Support client prioritaire WhatsApp</strong></span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-clair/70 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span><strong>Exportation des fiches clients & mesures</strong></span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-sable/40 flex items-center justify-between text-xs text-sombre/60 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Paiement 100% sécurisé par KKiaPay (MTN, Moov, Carte)
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
