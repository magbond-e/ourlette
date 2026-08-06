import React from 'react';
import Image from 'next/image';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Mentions légales — Ourlette',
  description: 'Mentions légales et informations sur l’éditeur et l’hébergement de la plateforme Ourlette.',
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans selection:bg-accent selection:text-white">
      <LandingHeader />

      {/* Header Visual */}
      <section className="relative bg-sombre text-white py-14 border-b border-accent/20 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <Image
            src="/images/secondary_header_bg.png"
            alt="Atelier de Couture"
            fill
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-sombre via-sombre/80 to-transparent"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Mentions légales
          </h1>
          <p className="text-sm text-gold font-semibold">Ourlette — Plateforme Couture SaaS</p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 flex-1 text-sombre">
        <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-10 shadow-xs space-y-6 leading-relaxed text-sm sm:text-base font-medium">
          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">1. Éditeur du site</h2>
            <ul className="space-y-1 text-sombre/80">
              <li><strong>Nom du service :</strong> Ourlette</li>
              <li><strong>Activité :</strong> Plateforme SaaS de gestion d'atelier de couture</li>
              <li><strong>Email de contact :</strong> contact@ourlette.app</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">2. Hébergement</h2>
            <ul className="space-y-2 text-sombre/80">
              <li>
                <strong>Hébergeur de l'application Web :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
              </li>
              <li>
                <strong>Hébergeur de la base de données & authentification :</strong> Supabase Inc., 970 Toa Payoh North #07-04, Singapour.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">3. Propriété intellectuelle</h2>
            <p className="text-sombre/80">
              Le nom "Ourlette", le logo, la charte graphique et la marque figurative associée sont la propriété exclusive d'Ourlette. Toute reproduction, modification ou diffusion non autorisée est strictement interdite.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
