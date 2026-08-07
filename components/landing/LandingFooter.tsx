'use client';

import React from 'react';
import Link from 'next/link';
import { Scissors, ShieldCheck, Mail, MapPin, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const LandingFooter: React.FC = () => {
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
              Ton atelier, organisé et visible. La plateforme gratuite dédiée aux artisans couturiers du monde entier.
            </p>

            <div className="pt-1">
              <Link href="/login">
                <Button variant="accent" size="sm" className="rounded-full px-6 font-extrabold shadow-md hover:scale-105 transition-transform">
                  Rejoindre Ourlette →
                </Button>
              </Link>
            </div>

            {/* RGPD Badge inspired by Farata screenshot #4 */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>RGPD 100% Conforme & Privé</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gold uppercase tracking-widest">Navigation</h4>
            <ul className="space-y-2 text-sm font-medium text-clair/80">
              <li>
                <Link href="/#hero" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Accueil</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Comment ça marche ?</Link>
              </li>
              <li>
                <Link href="/#tarifs" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Tarifs</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-gold hover:translate-x-1 transition-all inline-block">FAQ</Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions Couture SEO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gold uppercase tracking-widest">Solutions Couture</h4>
            <ul className="space-y-2 text-sm font-medium text-clair/80">
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Logiciel pour couturier</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Carnet de commandes couture</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Application couturier gratuite</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Gestion d'atelier de couture</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Vitrine en ligne WhatsApp</Link>
              </li>
              <li>
                <Link href="/comment-ca-marche" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Fiche mesures client numérique</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gold uppercase tracking-widest">Légal & Contact</h4>
            <ul className="space-y-2 text-sm font-medium text-clair/80">
              <li>
                <Link href="/politique-confidentialite" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Politique de confidentialité</Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Mentions légales</Link>
              </li>
              <li>
                <Link href="/cgu" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Conditions Générales (CGU)</Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-gold hover:translate-x-1 transition-all inline-block">Politique de cookies</Link>
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
          <p>© 2026 Ourlette. Tous droits réservés.</p>
          <p className="flex items-center gap-1.5 font-medium">
            <span>Fait avec</span>
            <span className="text-accent text-sm animate-pulse">🧵</span>
            <span>pour les couturiers et ateliers du monde entier</span>
          </p>
          <p className="text-[10px] font-mono text-clair/40">v1.0.0</p>
        </div>
      </div>
    </footer>
  );
};
