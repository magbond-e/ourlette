import React from 'react';
import Image from 'next/image';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Politique de cookies — Ourlette',
  description: 'Informations concernant l’utilisation des cookies sur Ourlette.',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans selection:bg-accent selection:text-white">
      <LandingHeader />

      {/* Header Visual */}
      <section className="relative bg-sombre text-white py-14 border-b border-accent/20 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <Image
            src="/images/secondary_header_bg.png"
            alt="Cookies Ourlette"
            fill
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-sombre via-sombre/80 to-transparent"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Politique de cookies
          </h1>
          <p className="text-sm text-gold font-semibold">Respect de vos données de navigation</p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 flex-1 text-sombre">
        <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-10 shadow-xs space-y-6 leading-relaxed text-sm sm:text-base font-medium">
          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">1. Cookies strictement nécessaires</h2>
            <p className="text-sombre/80">
              Ourlette utilise un cookie de session essentiel pour vous maintenir connecté en toute sécurité à votre carnet d'atelier. Ce cookie est indispensable au fonctionnement de l'application et ne stocke aucune donnée publicitaire.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">2. Absence de traqueurs publicitaires</h2>
            <p className="text-sombre/80">
              Notre plateforme ne contient aucun cookie tiers de ciblage publicitaire ni aucun traqueur commercial. Vos habitudes d'utilisation restent strictement privées.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">3. Gestion via votre navigateur</h2>
            <p className="text-sombre/80">
              Vous pouvez configurer les paramètres de votre navigateur web (Chrome, Safari, Firefox, Edge) pour bloquer les cookies. Notez toutefois que le cookie de session est requis pour accéder à l'espace membre de votre atelier.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
