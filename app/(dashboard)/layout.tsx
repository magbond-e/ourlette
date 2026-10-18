'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { NotificationProvider } from '@/lib/context/NotificationContext';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { PowerSyncProvider } from '@/lib/powersync/PowerSyncProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, couturier, loading } = useAuth();
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-sans">
        <ThreadSpoolLoader label={isEn ? 'Loading your workshop…' : 'Chargement de votre atelier…'} size="lg" />
      </div>
    );
  }

  return (
    <PowerSyncProvider>
      <NotificationProvider>
        {/* Header fixe — monté une seule fois pour tout le dashboard */}
        <Header />

        {/* Contenu : offset pour header fixe 64px */}
        <div className="pt-[64px]">
          {children}
        </div>
      </NotificationProvider>
    </PowerSyncProvider>
  );
}
