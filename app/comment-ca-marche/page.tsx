'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Scissors,
  CheckCircle2,
  Search,
  Filter,
  Ruler,
  Store,
  Wallet,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/i18n';

export default function CommentCaMarchePage() {
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans selection:bg-accent selection:text-white">
      <LandingHeader activeTab={isEn ? 'how it works' : 'comment ça marche ?'} />

      {/* Header Visual Hero */}
      <section className="relative bg-sombre text-white py-16 sm:py-20 border-b border-accent/20 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/images/secondary_header_bg.png"
            alt="Atelier de haute couture"
            fill
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-sombre via-sombre/80 to-transparent"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs sm:text-sm font-bold text-gold">
            <Sparkles className="w-4 h-4" />
            <span>{dict.howItWorks.badge}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            {dict.howItWorks.title}
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-2xl mx-auto font-medium">
            {dict.howItWorks.subtitle}
          </p>
        </div>
      </section>

      {/* Main 4 Detailed Steps Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 flex-1">
        <div className="space-y-12">
          {/* Step 01 */}
          <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-10 shadow-xs space-y-4">
            <div className="flex items-center gap-4 border-b border-sable/40 pb-4">
              <span className="text-4xl sm:text-5xl font-display font-bold text-accent">01</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
                {dict.howItWorks.step1Title}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-sombre/80 leading-relaxed font-medium">
              {isEn ? (
                <>
                  Sign up in 2 minutes with email or Google. On first login, the onboarding screen sets up your workshop essentials (name, city, WhatsApp). On the <strong>Free Starter Plan</strong>, a secure showcase link is generated (e.g. <code className="bg-clair/60 px-2 py-0.5 rounded text-accent font-bold">ourlette.app/atelier-k7x9p2</code>). On the <strong>Pro Plan (1,999 FCFA/mo)</strong>, you can freely customize your signature atelier link (e.g. <code className="bg-clair/60 px-2 py-0.5 rounded text-accent font-bold">ourlette.app/your-brand</code>).
                </>
              ) : (
                <>
                  Inscris-toi en 2 minutes par email ou via ton compte Google. Lors du premier accès, l&apos;écran d&apos;onboarding configure automatiquement ton atelier (nom, ville, téléphone). En <strong>Plan Starter (Gratuit)</strong>, un lien de vitrine sécurisé est généré (ex: <code className="bg-clair/60 px-2 py-0.5 rounded text-accent font-bold">ourlette.app/atelier-k7x9p2</code>). En <strong>Plan Pro (1 999 FCFA/mois)</strong>, tu personnalises librement ton lien sur-mesure (ex: <code className="bg-clair/60 px-2 py-0.5 rounded text-accent font-bold">ourlette.app/ma-maison-couture</code>).
                </>
              )}
            </p>
          </div>

          {/* Step 02 */}
          <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-10 shadow-xs space-y-4">
            <div className="flex items-center gap-4 border-b border-sable/40 pb-4">
              <span className="text-4xl sm:text-5xl font-display font-bold text-accent">02</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
                {dict.howItWorks.step2Title}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-sombre/80 leading-relaxed font-medium">
              {isEn ? (
                <>
                  Create a profile for every client (name, phone, notes). The measurement form comes with all standard fields ready (bust, waist, hips, sleeve length, dress length, neck, shoulder width) and you can add custom ones as needed. If multiple tailors take measurements in your workshop, indicate who did it in the &quot;Taken by&quot; field—no separate accounts required.
                </>
              ) : (
                <>
                  Crée une fiche pour chaque client (nom, téléphone, notes éventuelles). Le formulaire de mesures a les champs standards déjà prêts (tour de poitrine, taille, hanches, longueur manche, longueur robe, tour de cou, largeur d&apos;épaules) et tu peux en ajouter d&apos;autres si besoin. Si vous êtes plusieurs dans l&apos;atelier à prendre des mesures, indique qui l&apos;a fait dans le champ &quot;Pris par&quot; — pas besoin de comptes séparés.
                </>
              )}
            </p>
          </div>

          {/* Step 03 */}
          <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-10 shadow-xs space-y-4">
            <div className="flex items-center gap-4 border-b border-sable/40 pb-4">
              <span className="text-4xl sm:text-5xl font-display font-bold text-accent">03</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
                {dict.howItWorks.step3Title}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-sombre/80 leading-relaxed font-medium">
              {isEn ? (
                <>
                  Select a client (or create one on the fly), specify whether it&apos;s a <strong>full bespoke tailoring</strong> or an <strong>alteration of an existing garment</strong>. Add the fabric, total price, deposit paid (remaining balance is calculated automatically), and delivery date. Then, one tap advances the order status:
                </>
              ) : (
                <>
                  Choisis le client (ou crée-en un nouveau à la volée), précise s&apos;il s&apos;agit d&apos;une <strong>couture complète</strong> ou d&apos;une <strong>retouche de tenue existante</strong> — le formulaire s&apos;adapte à chaque cas. Ajoute le tissu, le prix total, l&apos;acompte versé (le solde restant est calculé automatiquement), et la date de livraison prévue. Ensuite, un tap suffit pour faire avancer le statut de la commande :
                </>
              )}
            </p>

            <div className="bg-[#FAFAF8] p-4 sm:p-6 rounded-2xl border border-sable/60 font-bold text-xs sm:text-sm text-sombre flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-center">
              <span className="px-3 py-1 bg-white border border-sable rounded-full">{dict.commandes.statusReceived}</span>
              <span className="text-accent">→</span>
              <span className="px-3 py-1 bg-white border border-sable rounded-full">{dict.commandes.statusInProgress}</span>
              <span className="text-accent">→</span>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full">{dict.commandes.statusFitting}</span>
              <span className="text-accent">→</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full">{dict.commandes.statusReady}</span>
              <span className="text-accent">→</span>
              <span className="px-3 py-1 bg-sombre text-white rounded-full">{dict.commandes.statusDelivered}</span>
            </div>

            <p className="text-xs sm:text-sm text-sombre/70 italic">
              {isEn
                ? 'Overdue orders and delivery reminders trigger alerts directly in the header bell icon and on your dashboard. Starter Plan manages up to 10 active orders, while Pro Plan (1,999 FCFA/month) offers unlimited orders.'
                : 'Les commandes en retard et rappels de livraison déclenchent une alerte directe dans l’icône de cloche du header et sur ton tableau de bord. Le Plan Starter te permet de gérer jusqu’à 10 commandes actives simultanées, tandis que le Plan Pro (1 999 FCFA/mois) offre des commandes illimitées.'}
            </p>
          </div>

          {/* Step 04 */}
          <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-10 shadow-xs space-y-4">
            <div className="flex items-center gap-4 border-b border-sable/40 pb-4">
              <span className="text-4xl sm:text-5xl font-display font-bold text-accent">04</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
                {dict.howItWorks.step4Title}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-sombre/80 leading-relaxed font-medium">
              {isEn
                ? 'Add photos of your finest tailoring creations (up to 8 photos in Starter, unlimited in Pro). Share your showcase link on WhatsApp, Instagram, or SMS. Prospective clients browse your gallery and message you directly on WhatsApp in 1 click.'
                : 'Ajoute tes plus belles réalisations couture (jusqu’à 8 photos en Plan Starter, illimité en Plan Pro). Partage ton lien de vitrine sur WhatsApp, Instagram ou par SMS. Tes clients potentiels parcourent ta galerie et te contactent directement sur WhatsApp en 1 clic.'}
            </p>
          </div>
        </div>

        {/* Section Daily Usage */}
        <div className="bg-sombre text-white rounded-3xl p-8 sm:p-12 space-y-6 shadow-xl border border-accent/20">
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-gold">
            {isEn ? 'What you can do daily on Ourlette' : 'Ce que tu peux faire au quotidien sur Ourlette'}
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base font-medium text-white/90">
            <li className="flex items-start gap-3">
              <Search className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <span>
                <strong>{isEn ? 'Search & Filter' : 'Rechercher & Filtrer'}</strong>{' '}
                {isEn ? 'your orders by client name, fabric, status, or workshop tailor' : 'tes commandes par nom, tissu, statut ou responsable d’atelier'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Ruler className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <span>
                <strong>{isEn ? 'Access Measurements' : 'Consulter les mesures'}</strong>{' '}
                {isEn ? 'of any client instantly when logging a new garment order' : 'd’un client instantanément lors de la création d’une commande'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Store className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <span>
                <strong>{isEn ? 'Manage Showcase' : 'Gérer ta vitrine'}</strong> :{' '}
                {isEn ? 'photos of garments, workshop logo, direct WhatsApp ordering link' : 'photos de créations, logo d’atelier, lien WhatsApp direct'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <span>
                <strong>{isEn ? 'Track Balances & Quotas' : 'Suivre tes encaissements & jauges'}</strong> :{' '}
                {isEn ? 'unpaid balances to collect and quota gauges in Settings' : 'soldes à encaisser et jauge d’abonnement dans les Paramètres'}
              </span>
            </li>
          </ul>

          <div className="pt-4 text-center">
            <Link href="/login">
              <Button variant="accent" size="lg" className="rounded-full px-8 py-4 font-extrabold shadow-lg">
                {dict.landing.startFree}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
