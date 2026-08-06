import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Scissors,
  ClipboardList,
  Ruler,
  Store,
  Heart,
  Lock,
  Wifi,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { AppMockupPreview } from '@/components/landing/AppMockupPreview';
import { FaqAccordion } from '@/components/landing/FaqAccordion';
import { SectionHeader } from '@/components/landing/SectionHeader';
import { Button } from '@/components/ui/Button';

// Top 5 FAQ Items for Landing Page (Legal & Pricing Compliant)
const landingFaqItems = [
  {
    id: "gratuit",
    question: "Comment puis-je essayer Ourlette gratuitement ?",
    answer:
      "Tu peux créer ton compte en 2 minutes sans carte bancaire. Tu accèdes immédiatement au carnet de commandes d'atelier, aux fiches mesures et à ta vitrine publique WhatsApp.",
  },
  {
    id: "carte",
    question: "Ai-je besoin d'une carte bancaire pour m'inscrire ?",
    answer:
      "Non. L'inscription ne demande aucune information de paiement. Tu commences gratuitement dès ton inscription.",
  },
  {
    id: "3g",
    question: "Ourlette fonctionne-t-il avec une connexion internet faible ?",
    answer:
      "Oui. Ourlette est conçu mobile-first (images compressées, polices optimisées, vitesse d'affichage) pour rester rapide même avec une connexion 3G modeste.",
  },
  {
    id: "multi",
    question: "Puis-je utiliser Ourlette si nous sommes plusieurs dans l'atelier ?",
    answer:
      "Oui. Chaque commande et chaque fiche mesures intègre un champ \"responsable\" en texte libre pour savoir qui gère quelle tenue.",
  },
  {
    id: "contact-clients",
    question: "Comment mes clients me contactent-ils depuis ma vitrine ?",
    answer:
      "Via un bouton de contact direct sur WhatsApp ou appel téléphonique, sans qu'ils n'aient besoin de télécharger d'application.",
  },
];

export default function LandingPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: landingFaqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans selection:bg-accent selection:text-white">
      {/* JSON-LD SEO Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* 1. Header Navigation Sticky */}
      <LandingHeader activeTab="accueil" />

      {/* 2. Hero Section */}
      <section id="hero" className="relative bg-sombre text-white overflow-hidden py-16 lg:py-24 border-b border-accent/20">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="absolute bottom-0 -left-24 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs sm:text-sm font-bold text-white shadow-sm hover:scale-105 transition-transform">
                <span className="animate-spin duration-3000">🧵</span>
                <span>Fait pour les couturiers, partout dans le monde</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                Fini le cahier. <br className="hidden sm:inline" />
                Place à <span className="text-gold title-highlight font-normal">Ourlette.</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-white/85 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Le carnet de commandes, les mesures de tes clients et ta vitrine en ligne — tout ce dont ton atelier a besoin dans un outil simple et fluide.
              </p>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-full font-extrabold px-8 py-4 shadow-xl text-base hover:scale-105 active:scale-95 transition-all">
                    Commencer gratuitement →
                  </Button>
                </Link>
                <Link href="#apercu" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full border-white/30 text-white hover:bg-white/10 text-base font-bold transition-all">
                    Voir comment ça marche
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-white/60 font-semibold pt-1 flex items-center justify-center lg:justify-start gap-1.5">
                <Zap className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>2 minutes suffisent · Aucune carte bancaire requise</span>
              </p>
            </div>

            {/* Hero Right Visual */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-none aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-gold/40 hover:border-gold transition-colors group">
                <Image
                  src="/images/hero_couturier.png"
                  alt="Couturiers en atelier Haute Couture"
                  fill
                  priority
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sombre/90 via-transparent to-transparent"></div>

                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-sable/60 shadow-xl text-sombre animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center font-bold shadow-md">
                      ✓
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-sombre/70 uppercase tracking-wider">Carnet digital d'atelier</p>
                      <p className="text-sm font-display font-bold text-sombre">Atelier 100% Organisé</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Barre de Réassurance */}
      <section className="bg-[#FAFAF8] border-b border-sable/50 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-around gap-4 md:gap-8 text-center md:text-left">
            <div className="flex items-center gap-3 hover:scale-105 transition-transform">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-vertbouton flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm sm:text-base font-bold text-sombre">Pour démarrer gratuitement</span>
            </div>

            <div className="hidden md:block w-px h-6 bg-sable/60"></div>

            <div className="flex items-center gap-3 hover:scale-105 transition-transform">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-vertbouton flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm sm:text-base font-bold text-sombre">Fonctionne même en 3G</span>
            </div>

            <div className="hidden md:block w-px h-6 bg-sable/60"></div>

            <div className="flex items-center gap-3 hover:scale-105 transition-transform">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-vertbouton flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm sm:text-base font-bold text-sombre">Aucune carte bancaire requise</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Aperçu de l'app (Mockups Ordinateur & Téléphone) */}
      <section id="apercu" className="py-16 sm:py-24 bg-white border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge="Aperçu de l'app"
            badgeIcon={<span>▶</span>}
            title="Une plateforme pensée pour ton atelier"
            subtitle="Découvre l'interface d'Ourlette sur ordinateur et téléphone portable."
          />

          <AppMockupPreview />
        </div>
      </section>

      {/* 5. Pourquoi Ourlette */}
      <section className="py-16 sm:py-24 bg-[#FAFAF8] border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge="Pourquoi Ourlette"
            title="Pas un simple carnet. Un vrai outil d'atelier."
            subtitle="Un outil clair, réactif et adapté aux réalités des artisans couturiers."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-8 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-accent/40 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-sombre">
                Carnet de commandes clair
              </h3>
              <p className="text-sm sm:text-base text-sombre/70 font-medium leading-relaxed">
                Chaque commande, son statut. Fini les post-it et les fiches perdues.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-8 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-accent/40 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <Ruler className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-sombre">
                Mesures à portée de main
              </h3>
              <p className="text-sm sm:text-base text-sombre/70 font-medium leading-relaxed">
                Retrouve les mensurations précises de tes clients en un clic depuis ton téléphone.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-8 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-accent/40 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-sombre">
                Vitrine en ligne partageable
              </h3>
              <p className="text-sm sm:text-base text-sombre/70 font-medium leading-relaxed">
                Expose tes réalisations couture avec un lien unique à partager sur WhatsApp et les réseaux sociaux.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-8 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-accent/40 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-sombre">
                Conçu pour l'artisanat
              </h3>
              <p className="text-sm sm:text-base text-sombre/70 font-medium leading-relaxed">
                Un outil simple d'utilisation pour moderniser la gestion de ton atelier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section Confiance & Sécurité */}
      <section className="py-16 sm:py-24 bg-white border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge="Confiance"
            badgeIcon={<Lock className="w-3.5 h-3.5" />}
            title="Tes commandes, tes clients, tes données."
            subtitle="Confidentialité totale. Tes fiches clients et ton carnet restent privés."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-3xl border border-sable/60 p-8 text-center space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-display font-bold text-sombre">
                Confidentialité garantie
              </h3>
              <p className="text-sm text-sombre/70 font-medium leading-relaxed">
                Tes données d'atelier sont strictement réservées à ton usage personnel.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sable/60 p-8 text-center space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-vertbouton flex items-center justify-center mx-auto shadow-xs">
                <Wifi className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-display font-bold text-sombre">
                Optimisé pour le mobile
              </h3>
              <p className="text-sm text-sombre/70 font-medium leading-relaxed">
                Interface rapide et légère, conçue pour réagir rapidement même sur le terrain.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sable/60 p-8 text-center space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-display font-bold text-sombre">
                Prise en main immédiate
              </h3>
              <p className="text-sm text-sombre/70 font-medium leading-relaxed">
                Aucune formation technique requise. Crée ta première commande en moins de 2 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. "4 étapes" — Timeline Farata avec anneau dégradé rotatif derrière les chiffres */}
      <section className="py-16 sm:py-24 bg-[#FAFAF8] border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge="4 étapes"
            badgeIcon={<span>⚡</span>}
            title="De l'inscription à ta première commande"
            subtitle="Simple, rapide, efficace. Ton atelier est organisé en quelques clics."
          />

          <div className="relative">
            {/* Horizontal Line Desktop */}
            <div className="hidden md:block absolute top-12 left-16 right-16 h-1 bg-sable/60 border-t-2 border-dashed border-accent/40 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-4 relative z-10">
              {/* Step 01 */}
              <div className="bg-white rounded-3xl border border-sable/60 p-6 text-center space-y-4 shadow-xs hover:shadow-md transition-all group">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  {/* Farata Style Rotating Background Gradient Ring */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-accent via-gold to-fonce animate-spin duration-10000 opacity-80 group-hover:scale-110 transition-transform blur-xs"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-sombre text-gold font-display font-bold text-2xl flex items-center justify-center shadow-lg border border-gold/40">
                    01
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-sombre">
                  Inscris-toi en 2 min
                </h3>
                <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
                  Crée ton compte atelier et génère ton lien de vitrine instantanément.
                </p>
              </div>

              {/* Step 02 */}
              <div className="bg-white rounded-3xl border border-sable/60 p-6 text-center space-y-4 shadow-xs hover:shadow-md transition-all group">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-gold via-accent to-fonce animate-spin duration-10000 opacity-80 group-hover:scale-110 transition-transform blur-xs"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-sombre text-gold font-display font-bold text-2xl flex items-center justify-center shadow-lg border border-gold/40">
                    02
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-sombre">
                  Fiches & Mesures
                </h3>
                <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
                  Saisis les mensurations de tes clients avec les champs standards ou personnalisés.
                </p>
              </div>

              {/* Step 03 */}
              <div className="bg-white rounded-3xl border border-sable/60 p-6 text-center space-y-4 shadow-xs hover:shadow-md transition-all group">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fonce via-gold to-accent animate-spin duration-10000 opacity-80 group-hover:scale-110 transition-transform blur-xs"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-sombre text-gold font-display font-bold text-2xl flex items-center justify-center shadow-lg border border-gold/40">
                    03
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-sombre">
                  Enregistre la commande
                </h3>
                <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
                  Couture ou retouche, montant, acompte versé et date de livraison prévue.
                </p>
              </div>

              {/* Step 04 */}
              <div className="bg-white rounded-3xl border border-sable/60 p-6 text-center space-y-4 shadow-xs hover:shadow-md transition-all group">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-accent via-fonce to-gold animate-spin duration-10000 opacity-80 group-hover:scale-110 transition-transform blur-xs"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-sombre text-gold font-display font-bold text-2xl flex items-center justify-center shadow-lg border border-gold/40">
                    04
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-sombre">
                  Partage ta vitrine
                </h3>
                <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
                  Publie tes créations et permets à tes clients de te contacter sur WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Full-Bleed Banner CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-sombre via-fonce to-sombre text-white rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden border border-accent/20">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-3 text-center lg:text-left">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Ton atelier mérite d'être organisé.
              </h2>
              <p className="text-base sm:text-lg text-white/80 font-medium max-w-xl">
                Inscription simple en 2 minutes. Lance-toi dès aujourd'hui.
              </p>
            </div>
            
            <div className="shrink-0">
              <Link href="/login">
                <Button variant="gold" size="lg" className="rounded-full px-10 py-4 font-extrabold text-base shadow-xl hover:scale-105 active:scale-95 transition-all">
                  Je me lance →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Section Tarifs (Compliant & Safe) */}
      <section id="tarifs" className="py-16 sm:py-24 bg-white border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge="Tarifs"
            badgeIcon={<span>⭐</span>}
            title="Démarrer votre atelier"
            subtitle="Accédez dès maintenant aux fonctionnalités essentielles de gestion d'atelier."
          />

          <div className="max-w-xl mx-auto bg-white rounded-3xl border-2 border-accent p-8 sm:p-10 shadow-xl space-y-6 relative hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between border-b border-sable/40 pb-4">
              <div>
                <span className="text-xs font-bold uppercase text-accent tracking-wider">Plan Découverte</span>
                <h3 className="text-2xl font-display font-bold text-sombre">Atelier Starter</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-display font-bold text-sombre">0 FCFA</span>
                <span className="text-xs text-sombre/60 block font-semibold">Accès Découverte</span>
              </div>
            </div>

            <ul className="space-y-3.5 text-sm sm:text-base font-medium text-sombre/85">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-vertbouton shrink-0" />
                <span>Carnet de commandes d'atelier</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-vertbouton shrink-0" />
                <span>Fiches mesures par client (standards + sur-mesure)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-vertbouton shrink-0" />
                <span>Vitrine publique partageable sur WhatsApp</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-vertbouton shrink-0" />
                <span>Recherche & filtres des commandes par statut</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-vertbouton shrink-0" />
                <span>Gestion multi-responsables d'atelier</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link href="/login">
                <Button variant="accent" fullWidth size="lg" className="rounded-full font-extrabold shadow-md hover:scale-102 transition-transform">
                  Créer mon compte atelier →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Engagement de Transparence (NO FAKE TESTIMONIALS) */}
      <section className="py-16 sm:py-24 bg-[#FAFAF8] border-b border-sable/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto shadow-xs">
            <Scissors className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
            Conçu main dans la main avec les couturiers
          </h2>
          <p className="text-sm sm:text-base text-sombre/80 font-medium leading-relaxed max-w-2xl mx-auto">
            Ourlette est développé au plus proche du quotidien des ateliers de couture. Nous mettons un point d'honneur à la transparence : aucun avis préfabriqué. Vous pouvez nous soumettre vos retours directement depuis votre espace d'atelier.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="outline" size="md" className="rounded-full border-accent text-accent font-bold">
                Rejoindre les ateliers pionniers →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-white border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge="Foire aux questions"
            title="Des réponses claires à vos questions"
            subtitle="Tout ce que tu dois savoir pour démarrer avec Ourlette."
          />

          <FaqAccordion items={landingFaqItems} defaultOpenId="gratuit" />

          <div className="text-center pt-4">
            <Link href="/faq">
              <Button variant="outline" size="md" className="rounded-full border-accent text-accent font-bold hover:bg-accent/10">
                Voir toutes les questions de la FAQ →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div id="contact" className="hidden"></div>

      {/* 12. Footer */}
      <LandingFooter />
    </div>
  );
}
