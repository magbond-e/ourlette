'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import { DataService } from '@/lib/services/dataService';

export const CookieBanner: React.FC<{ isDashboard?: boolean }> = ({ isDashboard = false }) => {
  const { user, couturier, refreshProfile } = useAuth();
  const [accepted, setAccepted] = useState<boolean>(true); // default true until checked
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const localConsent = localStorage.getItem('ourlette_cookie_consent');
    const hasDbConsent = Boolean(couturier?.cookie_consent_at);

    if (localConsent || hasDbConsent) {
      setAccepted(true);
    } else {
      setAccepted(false);
    }
  }, [couturier?.cookie_consent_at]);

  const handleAccept = async () => {
    const nowIso = new Date().toISOString();
    localStorage.setItem('ourlette_cookie_consent', nowIso);
    setAccepted(true);

    if (user?.id) {
      await DataService.updateCouturier(user.id, {
        cookie_consent_at: nowIso,
      });
      await refreshProfile();
    }
  };

  if (!mounted || accepted) return null;

  // On dashboard: Forced mandatory modal overlay
  if (isDashboard) {
    return (
      <div className="fixed inset-0 z-50 bg-sombre/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-accent text-center space-y-5 animate-slide-up">
          <div className="w-16 h-16 rounded-3xl bg-accent/10 text-accent flex items-center justify-center mx-auto shadow-sm">
            <Cookie className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent inline-flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Conformité & Protection RGPD</span>
            </span>
            <h3 className="text-2xl font-display font-bold text-sombre">
              Acceptation des Cookies Obligatoire
            </h3>
            <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
              Pour accéder à ton espace atelier et garantir la sauvegarde sécurisée de tes fiches clients et commandes, l'acceptation du stockage local et des cookies essentiels est requise.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleAccept}
              variant="accent"
              fullWidth
              size="lg"
              className="rounded-full font-extrabold text-sm py-4 shadow-xl gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <Check className="w-5 h-5" />
              <span>J'accepte les cookies & j'accède à l'atelier →</span>
            </Button>
          </div>

          <p className="text-[11px] text-sombre/50 font-semibold flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-gold" />
            <span>Vos données d'atelier sont strictement confidentielles</span>
          </p>
        </div>
      </div>
    );
  }

  // Public / Landing Page: Non-intrusive floating bottom banner
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-sombre text-white p-5 rounded-3xl shadow-2xl border border-gold/40 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-bold text-sm text-white">Cookies & Expérience Atelier</h4>
            <p className="text-xs text-white/80 font-medium leading-relaxed">
              Ourlette utilise des cookies essentiels pour assurer le bon fonctionnement de votre carnet d'atelier et de votre vitrine.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            onClick={handleAccept}
            variant="gold"
            size="sm"
            className="rounded-full text-xs font-bold px-5 py-2 shadow-md hover:scale-105 active:scale-95 transition-transform"
          >
            Accepter les cookies ✓
          </Button>
        </div>
      </div>
    </div>
  );
};
