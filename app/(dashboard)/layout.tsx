import React from 'react';
import { Header } from '@/components/ui/Header';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { MandatoryOnboardingModal } from '@/components/ui/MandatoryOnboardingModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Header fixe — monté une seule fois pour tout le dashboard */}
      <Header />

      {/* Mandatory Onboarding Modal if info is missing */}
      <MandatoryOnboardingModal />

      {/* Mandatory Cookie Acceptance Modal on Dashboard if not accepted yet */}
      <CookieBanner isDashboard />

      {/* Contenu : offset pour header fixe 64px */}
      <div className="pt-[64px]">
        {children}
      </div>
    </>
  );
}
