import React from 'react';
import { Header } from '@/components/ui/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Header fixe — monté une seule fois pour tout le dashboard */}
      <Header />

      {/* Contenu : offset pour header fixe 64px */}
      <div className="pt-[64px]">
        {children}
      </div>
    </>
  );
}
