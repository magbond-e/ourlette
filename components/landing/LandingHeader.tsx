'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scissors, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/context/AuthContext';
import { SHOW_ACCOUNT_PLANS } from '@/lib/utils/planLimits';

interface LandingHeaderProps {
  activeTab?: string;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ activeTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { dict, locale } = useLanguage();
  const { user } = useAuth();
  const isEn = locale === 'en';

  const navItems = [
    { label: dict.nav.home, href: '/#hero', key: 'home' },
    { label: dict.nav.howItWorks, href: '/comment-ca-marche', key: 'how' },
    ...(SHOW_ACCOUNT_PLANS ? [{ label: dict.nav.pricing, href: '/#tarifs', key: 'pricing' }] : []),
    { label: dict.nav.faq, href: '/faq', key: 'faq' },
    { label: dict.nav.contact, href: '/#contact', key: 'contact' },
  ];

  const isTabActive = (itemKey: string, itemHref: string) => {
    if (activeTab) {
      const activeLower = activeTab.toLowerCase();
      if (itemKey === 'home' && (activeLower === 'accueil' || activeLower === 'home')) return true;
      if (itemKey === 'how' && (activeLower.includes('comment') || activeLower.includes('how'))) return true;
      if (itemKey === 'pricing' && (activeLower.includes('tarif') || activeLower.includes('pricing'))) return true;
      if (itemKey === 'faq' && activeLower.includes('faq')) return true;
      if (itemKey === 'contact' && activeLower.includes('contact')) return true;
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
          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => {
              const active = isTabActive(item.key, item.href);
              return (
                <Link
                  key={item.key}
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

          {/* Right CTA Button & Language Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link href="/commandes">
                <Button variant="accent" size="sm" className="rounded-full px-5 text-sm font-bold shadow-md">
                  {isEn ? 'My Workshop' : 'Mon atelier'}
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="accent" size="sm" className="rounded-full px-5 text-sm font-bold shadow-md">
                  {dict.nav.login}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher variant="pill" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-clair text-sombre hover:text-accent transition-colors touch-target flex items-center justify-center"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Collapsible Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-sable/60 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const active = isTabActive(item.key, item.href);
                return (
                  <Link
                    key={item.key}
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
              {user ? (
                <Link href="/commandes" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="accent" fullWidth size="md" className="rounded-full font-bold shadow-md">
                    {isEn ? 'My Workshop' : 'Mon atelier'}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="accent" fullWidth size="md" className="rounded-full font-bold shadow-md">
                      {dict.nav.login}
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth size="md" className="rounded-full font-bold border-accent text-accent">
                      {dict.nav.signup}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      {/* Invisible DOM Spacer ensuring content stays properly offset below fixed header */}
      <div className="h-16 sm:h-20 shrink-0 pointer-events-none" aria-hidden="true" />
    </>
  );
};
