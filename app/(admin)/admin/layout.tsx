'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, LayoutDashboard, Users, Tag, TrendingUp, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const navItems = [
    { label: "Vue d'ensemble", href: '/admin', icon: LayoutDashboard },
    { label: 'Comptes Couturiers', href: '/admin/comptes', icon: Users },
    { label: 'Codes Promo', href: '/admin/codes-promo', icon: Tag },
    { label: 'Finances & SaaS', href: '/admin/finances', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-sombre font-sans flex flex-col">
      {/* Top Header Admin */}
      <header className="bg-sombre text-white border-b border-gold/30 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 text-gold border border-gold/40 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-base sm:text-lg tracking-wide text-white flex items-center gap-2">
                Ourlette <span className="text-xs bg-gold/20 text-gold border border-gold/30 px-2 py-0.5 rounded-full font-mono uppercase">Admin</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/commandes"
              className="text-xs font-bold text-clair/80 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour Dashboard Atelier</span>
            </Link>

            <button
              onClick={async () => {
                await signOut();
                router.push('/login');
              }}
              className="text-xs font-bold text-accent/90 hover:text-accent flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 hover:bg-accent/20 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 border-t border-white/10 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-gold text-gold bg-white/5'
                    : 'border-transparent text-clair/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {children}
      </main>
    </div>
  );
}
