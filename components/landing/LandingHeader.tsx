'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scissors, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LandingHeaderProps {
  activeTab?: string;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ activeTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: 'Accueil', href: '/#hero' },
    { label: 'Comment ça marche ?', href: '/comment-ca-marche' },
    { label: 'Tarifs', href: '/#tarifs' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/#contact' },
  ];

  const isTabActive = (itemLabel: string, itemHref: string) => {
    const labelLower = itemLabel.toLowerCase();
    if (activeTab) {
      return activeTab.toLowerCase() === labelLower;
    }
    if (itemHref === '/comment-ca-marche') {
      return pathname === '/comment-ca-marche';
    }
    if (itemHref === '/faq') {
      return pathname === '/faq';
    }
    if (itemHref === '/#hero' || itemHref === '/#tarifs' || itemHref === '/#contact') {
      return pathname === '/';
    }
    return false;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-sable/60 shadow-sm w-full transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo Wordmark with Gold Dot & Scissors Icon */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="text-2xl sm:text-3xl font-display font-bold text-sombre tracking-tight">
              Ourlette<span className="text-gold title-highlight font-normal">.</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const active = isTabActive(item.label, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-sm sm:text-base font-bold transition-colors ${
                    active
                      ? 'text-accent border-b-2 border-accent pb-0.5'
                      : 'text-sombre/80 hover:text-accent'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="accent" size="sm" className="rounded-full px-6 text-sm font-bold shadow-md">
                Connexion
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-clair text-sombre hover:text-accent transition-colors touch-target flex items-center justify-center"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Collapsible Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-sable/60 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const active = isTabActive(item.label, item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2.5 rounded-2xl text-base font-bold transition-colors ${
                      active
                        ? 'bg-accent/10 text-accent'
                        : 'text-sombre hover:bg-clair hover:text-accent'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-2 border-t border-sable/40 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="accent" fullWidth size="md" className="rounded-full font-bold shadow-md">
                  Connexion
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" fullWidth size="md" className="rounded-full font-bold border-accent text-accent">
                  Créer un compte atelier
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>
      {/* Invisible DOM Spacer ensuring content stays properly offset below fixed header */}
      <div className="h-16 sm:h-20 shrink-0 pointer-events-none" aria-hidden="true" />
    </>
  );
};

