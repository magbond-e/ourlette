'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Crown, CheckCircle, Sparkles, ArrowRight, Scissors, ShieldCheck, Store, ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';
import { MakeTouService } from '@/lib/services/maketouService';

function ProConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, couturier, refreshProfile } = useAuth();
  const { createNotification } = useNotifications();
  const [activating, setActivating] = useState(true);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    async function handleActivation() {
      if (!user?.id) {
        setActivating(false);
        return;
      }

      // Activate Pro subscription
      const success = await MakeTouService.activateProSubscription(user.id);
      if (success) {
        await refreshProfile();
        setActivated(true);

        await createNotification({
          type: 'feature_update',
          category: 'account',
          priority: 'high',
          title: '🎉 Félicitations ! Votre Plan Pro est actif',
          message: 'Votre atelier est désormais configuré avec toutes les fonctionnalités illimitées sur Ourlette.',
          link: '/commandes',
        });
      }
      setActivating(false);
    }

    handleActivation();
  }, [user?.id]);

  if (activating) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 font-sans">
        <ThreadSpoolLoader label="Validation de votre abonnement Pro MakeTou…" size="lg" />
      </div>
    );
  }

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
            Bienvenue sur le Plan Pro !
          </h1>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold max-w-sm mx-auto">
            Votre paiement de <span className="text-sombre font-extrabold">1 999 FCFA</span> a été validé avec succès. Votre atelier bénéficie désormais de la formule illimitée.
          </p>
        </div>

        {/* Unlocked Features Summary */}
        <div className="p-4 sm:p-5 bg-[#FAF9F6] border border-sable/70 rounded-2xl text-left space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Vos avantages actifs dès maintenant :</p>
          <div className="space-y-2 text-xs sm:text-sm font-semibold text-sombre">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Carnet de commandes <strong>100% illimité</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Galerie de réalisations vitrine <strong>illimitée</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Lien personnalisé de vitrine d’atelier</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sauvegarde continue & support prioritaire 7j/7</span>
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
