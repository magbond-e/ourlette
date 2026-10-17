'use client';

import React from 'react';
import Link from 'next/link';
import { Scissors, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/lib/i18n';
import { SHOW_ACCOUNT_PLANS } from '@/lib/utils/planLimits';

export const LandingFooter: React.FC = () => {
  const { dict } = useLanguage();

  return (
    <footer className="bg-sombre text-white relative overflow-hidden border-t border-accent/20">
      {/* Top Farata Colored Pattern Accent Bar */}
      <div className="h-2 w-full bg-gradient-to-r from-accent via-gold to-fonce"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 space-y-12 relative z-10">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Logo & Brand Tagline & RGPD Badge */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                Ourlette<span className="text-gold title-highlight font-normal">.</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-clair/80 font-sans leading-relaxed">
              {dict.footer.tagline}
            </p>

            <div className="flex items-center gap-3 pt-1">
              <Link href="/login">
                <Button variant="accent" size="sm" className="rounded-full px-5 font-extrabold shadow-md hover:scale-105 transition-transform">
                  {dict.footer.joinButton}
                </Button>
              </Link>
              <LanguageSwitcher isDark />
            </div>

            {/* RGPD Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{dict.footer.rgpdBadge}</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gold uppercase tracking-widest">{dict.footer.navColTitle}</h4>
            <ul className="space-y-2 text-sm font-medium text-clair/80">
              <li>
                <Link href="/#hero" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.home}</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.howItWorks}</Link>
              </li>
              {SHOW_ACCOUNT_PLANS && (
                <li>
                  <Link href="/#tarifs" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.pricing}</Link>
                </li>
              )}
              <li>
                <Link href="/faq" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.faq}</Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.contact}</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions Couture SEO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gold uppercase tracking-widest">{dict.footer.solutionsColTitle}</h4>
            <ul className="space-y-2 text-sm font-medium text-clair/80">
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.softwareTailor}</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.orderBook}</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.freeApp}</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.workshopManagement}</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.onlineShowcase}</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.digitalMeasurements}</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gold uppercase tracking-widest">{dict.footer.legalColTitle}</h4>
            <ul className="space-y-2 text-sm font-medium text-clair/80">
              <li>
                <Link href="/politique-confidentialite" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.privacyPolicy}</Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.legalMentions}</Link>
              </li>
              <li>
                <Link href="/cgu" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.termsOfService}</Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-gold hover:translate-x-1 transition-all inline-block">{dict.footer.cookiePolicy}</Link>
              </li>
            </ul>
            <div className="pt-3 space-y-2 text-xs text-clair/70 border-t border-white/10">
              <div className="flex items-center gap-2 text-clair">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <a href="mailto:ourlette.app@gmail.com" className="hover:underline text-gold font-bold">ourlette.app@gmail.com</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold shrink-0" />
                <span>Abidjan · Dakar · Paris · Worldwide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-clair/60">
          <p>{dict.footer.rightsReserved}</p>
          <p className="flex items-center gap-1.5 font-medium">
            <span>{dict.footer.madeWithLove}</span>
            <span>{dict.footer.worldwideTailors}</span>
          </p>
          <p className="text-[10px] font-mono text-clair/40">v1.0.0</p>
        </div>
      </div>
    </footer>
  );
};
