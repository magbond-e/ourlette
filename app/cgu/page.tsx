import React from 'react';
import Image from 'next/image';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'CGU — Conditions Générales d’Utilisation — Ourlette',
  description: 'Conditions Générales d’Utilisation du service Ourlette.',
};

export default function CguPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans selection:bg-accent selection:text-white">
      <LandingHeader />

      {/* Header Visual */}
      <section className="relative bg-sombre text-white py-14 border-b border-accent/20 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <Image
            src="/images/secondary_header_bg.png"
            alt="Textiles & Couture"
            fill
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-sombre via-sombre/80 to-transparent"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-sm text-gold font-semibold">Ourlette — Plateforme Couture SaaS</p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 flex-1 text-sombre">
        <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-10 shadow-xs space-y-6 leading-relaxed text-sm sm:text-base font-medium">
          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">1. Objet</h2>
            <p className="text-sombre/80">
              Ourlette est une plateforme gratuite permettant aux couturiers et ateliers de couture de gérer leurs commandes, de conserver les fiches mesures de leurs clients, et de publier une vitrine publique de leurs réalisations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">2. Inscription</h2>
            <p className="text-sombre/80">
              L'inscription est gratuite et ouverte à toute personne exerçant une activité de couture, de retouche ou d'artisanat textile. L'utilisateur s'engage à fournir des informations exactes lors de la création de son compte atelier.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">3. Utilisation du service</h2>
            <ul className="list-disc pl-5 space-y-1 text-sombre/80">
              <li>L'utilisateur est seul responsable des contenus et visuels qu'il publie sur sa vitrine (photos, descriptions, tarifs).</li>
              <li>Il est interdit de publier du contenu illicite, offensant, ou portant atteinte aux droits de propriété intellectuelle de tiers.</li>
              <li>Ourlette se réserve le droit de suspendre ou fermer un compte en cas de non-respect manifeste de ces règles d'utilisation.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">4. Disponibilité du service</h2>
            <p className="text-sombre/80">
              Le service est fourni "en l'état". Des opérations ponctuelles de maintenance ou des mises à jour réseau peuvent entraîner de courtes interruptions temporaires d'accès.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">5. Évolution du service</h2>
            <p className="text-sombre/80">
              Ourlette se réserve le droit de faire évoluer les fonctionnalités de la plateforme. L'introduction future éventuelle d'une offre premium (Plan Pro) ne retirera pas les fonctionnalités gratuites existantes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">6. Résiliation</h2>
            <p className="text-sombre/80">
              L'utilisateur peut demander la clôture et la suppression de son compte atelier à tout moment via l'interface de paramétrage ou par contact direct par email.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
