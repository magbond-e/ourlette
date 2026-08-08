'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cookie, ShieldCheck, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import { DataService } from '@/lib/services/dataService';

export const CookieBanner: React.FC<{ isDashboard?: boolean }> = ({ isDashboard = false }) => {
  const pathname = usePathname();
  const { user, couturier, refreshProfile } = useAuth();
  const [accepted, setAccepted] = useState<boolean>(true); // default true until checked
  const [mounted, setMounted] = useState<boolean>(false);

  const isDashboardRoute = pathname ? (
    pathname.startsWith('/commandes') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/vitrine/gerer') ||
    pathname.startsWith('/parametres')
  ) : false;

  useEffect(() => {
    setMounted(true);
    const localConsent = typeof window !== 'undefined' ? localStorage.getItem('ourlette_cookie_consent') : null;
    const hasDbConsent = Boolean(couturier?.cookie_consent_at);

    if (localConsent || hasDbConsent) {
      setAccepted(true);
    } else {
      setAccepted(false);
    }
  }, [couturier?.cookie_consent_at]);

  const handleAccept = async () => {
    const nowIso = new Date().toISOString();
    if (typeof window !== 'undefined') {
      localStorage.setItem('ourlette_cookie_consent', nowIso);
    }
    setAccepted(true);

    if (user?.id) {
      await DataService.updateCouturier(user.id, {
        cookie_consent_at: nowIso,
      });
      await refreshProfile();
    }
  };

  if (!mounted || accepted) return null;

  // Prevent public floating banner on dashboard routes
  if (!isDashboard && isDashboardRoute) return null;

  // Prevent dashboard modal on public non-dashboard routes
  if (isDashboard && !isDashboardRoute) return null;

  // On dashboard: Non-intrusive bottom banner if onboarding modal already handled profile
  if (isDashboard) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-slide-up">
        <div className="bg-sombre text-white p-5 rounded-3xl shadow-2xl border border-gold/40 space-y-3 font-sans">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-white">Cookies & Conditions d'Utilisation</h4>
              <p className="text-xs text-white/80 font-medium leading-relaxed">
                Ourlette utilise des cookies essentiels. En continuant, vous acceptez nos{' '}
                <Link href="/cgu" target="_blank" className="text-gold underline font-bold">
                  CGU
                </Link>{' '}
                et notre{' '}
                <Link href="/politique-confidentialite" target="_blank" className="text-gold underline font-bold">
                  Politique de Confidentialité
                </Link>.
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
              Accepter et Continuer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Public / Landing Page: Floating bottom banner with CGU & Privacy links
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up font-sans">
      <div className="bg-sombre text-white p-5 rounded-3xl shadow-2xl border border-gold/40 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-bold text-sm text-white">Cookies & Protection des Données</h4>
            <p className="text-xs text-white/80 font-medium leading-relaxed">
              Nous utilisons des cookies essentiels. En naviguant sur Ourlette, vous acceptez nos{' '}
              <Link href="/cgu" target="_blank" className="text-gold underline font-bold">
                CGU
              </Link>{' '}
              et notre{' '}
              <Link href="/politique-confidentialite" target="_blank" className="text-gold underline font-bold">
                Politique de Confidentialité
              </Link>.
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
            Accepter et Continuer
          </Button>
        </div>
      </div>
    </div>
  );
};
