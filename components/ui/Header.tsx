'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Ruler, Store, Settings, Plus, Scissors } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { MockStorageService } from '@/lib/services/mockStorage';
import { Couturier } from '@/lib/types/database';
import { Button } from '@/components/ui/Button';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { couturier: authCouturier } = useAuth();
  const [localCouturier, setLocalCouturier] = useState<Couturier>(() => MockStorageService.getCouturier());

  useEffect(() => {
    setLocalCouturier(MockStorageService.getCouturier());
  }, []);

  const couturier = authCouturier || localCouturier;

  const navItems = [
    { href: '/commandes', label: 'Commandes', icon: ClipboardList },
    { href: '/clients', label: 'Clients', icon: Ruler },
    { href: '/vitrine/gerer', label: 'Vitrine', icon: Store },
    { href: '/parametres', label: 'Paramètres', icon: Settings },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          HEADER FIXE MODERN — BARRE UNIQUE INTEGREE (64px)
          ═══════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-sable/60 shadow-xs h-16 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">

          {/* Left: Brand Identity & Atelier Name */}
          <Link href="/commandes" className="flex items-center gap-2.5 group shrink-0">
            {couturier.logo_url ? (
              <img
                src={couturier.logo_url}
                alt="Logo Atelier"
                className="w-9 h-9 rounded-xl object-cover border border-sable/80 shadow-xs group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                <Scissors className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xl sm:text-2xl font-display font-bold text-sombre tracking-tight block leading-none">
                Ourlette<span className="text-gold title-highlight font-normal">.</span>
              </span>
              <span suppressHydrationWarning className="text-[10px] sm:text-xs text-sombre/60 font-semibold truncate max-w-[140px] sm:max-w-[180px] block leading-tight mt-0.5">
                {couturier.nom_atelier || 'Atelier Couture'}
              </span>
            </div>
          </Link>

          {/* Center: Desktop Segmented Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-[#F7F7F5] border border-sable/50 p-1 rounded-full shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200
                    ${isActive
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-sombre/70 hover:text-sombre hover:bg-white/80'
                    }
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-sombre/50'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Quick Action CTA & Atelier Status & Notifications */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/60 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>En ligne</span>
            </div>

            {/* Notification Dropdown Icon */}
            <NotificationDropdown />

            {/* Hidden on phone/mobile header, visible on desktop/PC */}
            <Link href="/commandes/nouvelle" className="hidden md:inline-flex">
              <Button variant="accent" size="sm" className="rounded-full text-xs font-bold px-4 py-1.5 shadow-sm gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Nouvelle commande</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Nav mobile — fixée en bas, strictement cachée sur PC (md:hidden) ─────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-sable/70 shadow-2xl">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1
                  flex-1 py-1.5 px-1 rounded-2xl text-xs font-bold transition-all
                  ${isActive
                    ? 'bg-sombre text-white shadow-xs'
                    : 'text-sombre/60 hover:text-accent'
                  }
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gold' : 'text-sombre/50'}`} />
                <span className="text-[10px] font-bold leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

