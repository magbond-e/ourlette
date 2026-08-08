'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { MandatoryOnboardingModal } from '@/components/ui/MandatoryOnboardingModal';
import { NotificationProvider } from '@/lib/context/NotificationContext';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { useAuth } from '@/lib/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, couturier, loading } = useAuth();

  const isMissingOnboarding = Boolean(
    !couturier ||
    !couturier.nom || couturier.nom.trim() === '' || couturier.nom.trim() === 'Artisan Couturier' ||
    !couturier.nom_atelier || couturier.nom_atelier.trim() === '' || couturier.nom_atelier.trim() === 'Mon Atelier' ||
    (!couturier.telephone && !couturier.whatsapp_contact) ||
    !couturier.ville || couturier.ville.trim() === '' ||
    !couturier.pays || couturier.pays.trim() === '' ||
    !couturier.cookie_consent_at
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-clair flex items-center justify-center font-sans">
        <ThreadSpoolLoader label="Chargement de votre atelier…" size="lg" />
      </div>
    );
  }

  return (
    <NotificationProvider>
      {/* Header fixe — monté une seule fois pour tout le dashboard */}
      <Header />

      {/* Offline sync status banner */}
      <OfflineBanner />

      {/* If onboarding is incomplete, strictly block app children */}
      {isMissingOnboarding ? (
        <MandatoryOnboardingModal />
      ) : (
        <>
          {/* Mandatory Cookie Acceptance Modal on Dashboard if not accepted yet */}
          <CookieBanner isDashboard />

          {/* Contenu : offset pour header fixe 64px */}
          <div className="pt-[64px]">
            {children}
          </div>
        </>
      )}
    </NotificationProvider>
  );
}
