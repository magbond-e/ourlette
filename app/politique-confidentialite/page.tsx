import React from 'react';
import Image from 'next/image';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Politique de confidentialité — Ourlette',
  description: 'Politique de confidentialité et protection des données personnelles sur Ourlette.',
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans selection:bg-accent selection:text-white">
      <LandingHeader />

      {/* Header Visual */}
      <section className="relative bg-sombre text-white py-14 border-b border-accent/20 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <Image
            src="/images/secondary_header_bg.png"
            alt="Protection données ateliers couture"
            fill
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-sombre via-sombre/80 to-transparent"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Politique de confidentialité
          </h1>
          <p className="text-sm text-gold font-semibold">Protection de vos données & Respect de la vie privée</p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 flex-1 text-sombre">
        <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-10 shadow-xs space-y-6 leading-relaxed text-sm sm:text-base font-medium">
          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">1. Données collectées</h2>
            <ul className="list-disc pl-5 space-y-1 text-sombre/80">
              <li><strong>Compte couturier :</strong> Nom, nom de l'atelier, adresse email ou numéro de téléphone, ville, pays.</li>
              <li><strong>Fiches clients :</strong> Nom, prénom, numéro de téléphone, notes de confection saisies par le couturier.</li>
              <li><strong>Mesures textiles :</strong> Données de mensurations enregistrées par le couturier pour son usage professionnel.</li>
              <li><strong>Commandes :</strong> Description du modèle, type de tissu, statut d'avancement, prix et versements d'acomptes.</li>
              <li><strong>Vitrine :</strong> Photographies de réalisations publiées volontairement par l'atelier sur sa vitrine publique.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">2. Finalité du traitement</h2>
            <p className="text-sombre/80">
              Ces informations servent exclusivement au fonctionnement technique de la plateforme (gestion du carnet d'atelier, calcul des soldes, affichage de la vitrine WhatsApp). <strong>Aucune donnée n'est vendue ni cédée à des tiers.</strong>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">3. Sous-traitants techniques</h2>
            <p className="text-sombre/80">
              Ourlette s'appuie sur des infrastructures certifiées pour garantir la confidentialité : Supabase (base de données et stockage sécurisé des images) et Vercel (hébergement haute performance).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">4. Durée de conservation & Droits</h2>
            <p className="text-sombre/80">
              Les données sont conservées durant toute la durée d'activité de votre compte atelier. Vous disposez d'un droit d'accès, de rectification, d'exportation et de suppression de vos données sur simple demande par email à <a href="mailto:ourlette.app@gmail.com" className="text-accent font-bold underline">ourlette.app@gmail.com</a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-display font-bold text-sombre border-b border-sable/40 pb-2">5. Données des clients de l'atelier</h2>
            <p className="text-sombre/80">
              Le couturier reste responsable des informations qu'il enregistre concernant ses propres clients. Ourlette agit en tant que sous-traitant technique d'hébergement sécurisé.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
