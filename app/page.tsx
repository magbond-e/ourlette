'use client';

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
  Check,
  Zap,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { AppMockupPreview } from '@/components/landing/AppMockupPreview';
import { FaqAccordion } from '@/components/landing/FaqAccordion';
import { SectionHeader } from '@/components/landing/SectionHeader';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/i18n';
import { SHOW_ACCOUNT_PLANS } from '@/lib/utils/planLimits';

export default function LandingPage() {
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  const landingFaqItems = isEn
    ? [
        {
          id: 'free',
          question: 'How can I try Ourlette for free?',
          answer:
            'You can set up your workshop account in 2 minutes without a credit card. The Free Starter Plan includes up to 10 active orders, 8 showcase gallery photos, and full client measurement sheets. You can upgrade to Pro (1,999 FCFA/month) at any time.',
        },
        {
          id: 'card',
          question: 'Do I need a credit card to sign up?',
          answer:
            'No. Registration requires no payment information. You start immediately for free with the Starter Plan.',
        },
        {
          id: 'pro-pricing',
          question: 'How much is Ourlette Pro and what does it include?',
          answer:
            'The Pro Plan costs just 1,999 FCFA / month. It unlocks unlimited active orders, unlimited showcase gallery photos, a custom atelier web link (e.g., ourlette.app/your-brand), and priority support.',
        },
        {
          id: 'offline-signal',
          question: 'Does Ourlette work with weak Internet or offline?',
          answer:
            'Yes. Ourlette is mobile-first and works completely offline for your orders and measurements, automatically synchronizing whenever your network signal returns.',
        },
        {
          id: 'client-contact',
          question: 'How do clients contact me from my showcase?',
          answer:
            'Via a direct WhatsApp or phone call button on your public showcase, without needing them to download any app.',
        },
      ]
    : [
        {
          id: 'gratuit',
          question: 'Comment puis-je essayer Ourlette gratuitement ?',
          answer:
            "Tu peux créer ton compte en 2 minutes sans aucune carte bancaire. Le Plan Gratuit inclut jusqu'à 10 commandes actives, 8 photos de vitrine et toutes les fiches mesures. Tu peux passer au Plan Pro (1 999 FCFA/mois) à tout moment pour débloquer l'illimité.",
        },
        {
          id: 'carte',
          question: "Ai-je besoin d'une carte bancaire pour m'inscrire ?",
          answer:
            "Non. L'inscription ne demande aucune information de paiement. Tu commences gratuitement dès ton inscription avec le Plan Starter.",
        },
        {
          id: 'pro-tarifs',
          question: 'Combien coûte le Plan Pro et que comprend-il ?',
          answer:
            'Le Plan Pro est à seulement 1 999 FCFA / mois. Il débloque un nombre illimité de commandes actives, des photos illimitées sur ta vitrine publique, la personnalisation du lien de ton atelier (ex: ourlette.app/ma-maison-couture) et un suivi complet.',
        },
        {
          id: '3g',
          question: 'Ourlette fonctionne-t-il avec une connexion internet faible ou hors-ligne ?',
          answer:
            'Oui. Ourlette est conçu mobile-first et prend en charge le fonctionnement hors ligne pour tes commandes et mesures, avec synchronisation automatique au retour du réseau.',
        },
        {
          id: 'contact-clients',
          question: 'Comment mes clients me contactent-ils depuis ma vitrine ?',
          answer:
            "Via un bouton de contact direct sur WhatsApp ou appel téléphonique, sans qu'ils n'aient besoin de télécharger d'application.",
        },
      ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans selection:bg-accent selection:text-white">
      {/* 1. Header Navigation Sticky */}
      <LandingHeader activeTab={isEn ? 'home' : 'accueil'} />

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
                <Scissors className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>{dict.landing.badge}</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                {dict.landing.heroTitlePart1} <br className="hidden sm:inline" />
                {dict.landing.heroTitlePart2} <span className="text-gold title-highlight font-normal">Ourlette.</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-white/85 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {dict.landing.heroSubtitle}
              </p>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-full font-extrabold px-8 py-4 shadow-xl text-base hover:scale-105 active:scale-95 transition-all">
                    {dict.landing.startFree}
                  </Button>
                </Link>
                <Link href="#apercu" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full border-white/30 text-white hover:bg-white/10 text-base font-bold transition-all">
                    {dict.landing.seeHowItWorks}
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-white/60 font-semibold pt-1 flex items-center justify-center lg:justify-start gap-1.5">
                <Zap className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>{dict.landing.ctaBannerHint}</span>
              </p>
            </div>

            {/* Hero Right Visual */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-none aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-gold/40 hover:border-gold transition-colors group">
                <Image
                  src="/images/hero_couturier.png"
                  alt="Haute Couture Fashion Workshop"
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
                      <p className="text-[11px] font-bold text-sombre/70 uppercase tracking-wider">{dict.mockup.tabOrders}</p>
                      <p className="text-sm font-display font-bold text-sombre">{isEn ? '100% Organized Workshop' : 'Atelier 100% Organisé'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Reassurance Bar */}
      <section className="bg-[#FAFAF8] border-b border-sable/50 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-around gap-4 md:gap-8 text-center md:text-left">
            <div className="flex items-center gap-3 hover:scale-105 transition-transform">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-vertbouton flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm sm:text-base font-bold text-sombre">
                {isEn ? 'Start 100% for free' : 'Pour démarrer gratuitement'}
              </span>
            </div>

            <div className="hidden md:block w-px h-6 bg-sable/60"></div>

            <div className="flex items-center gap-3 hover:scale-105 transition-transform">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-vertbouton flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm sm:text-base font-bold text-sombre">
                {isEn ? 'Works seamlessly offline (3G)' : 'Fonctionne même en 3G / Hors ligne'}
              </span>
            </div>

            <div className="hidden md:block w-px h-6 bg-sable/60"></div>

            <div className="flex items-center gap-3 hover:scale-105 transition-transform">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-vertbouton flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm sm:text-base font-bold text-sombre">
                {isEn ? 'No credit card required' : 'Aucune carte bancaire requise'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. App Mockup Preview */}
      <section id="apercu" className="py-16 sm:py-24 bg-white border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge={isEn ? 'App Preview' : "Aperçu de l'app"}
            badgeIcon={<span>▶</span>}
            title={dict.landing.previewTitle}
            subtitle={dict.landing.previewSubtitle}
          />

          <AppMockupPreview />
        </div>
      </section>

      {/* 5. Key Features Grid */}
      <section className="py-16 sm:py-24 bg-[#FAFAF8] border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge={isEn ? 'Why Ourlette' : 'Pourquoi Ourlette'}
            title={dict.landing.solutionTitle}
            subtitle={dict.landing.solutionSubtitle}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-8 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-accent/40 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-sombre">
                {dict.landing.carnetFeatureTitle}
              </h3>
              <p className="text-sm sm:text-base text-sombre/70 font-medium leading-relaxed">
                {dict.landing.carnetFeatureDesc}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-8 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-accent/40 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <Ruler className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-sombre">
                {dict.landing.mesuresFeatureTitle}
              </h3>
              <p className="text-sm sm:text-base text-sombre/70 font-medium leading-relaxed">
                {dict.landing.mesuresFeatureDesc}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-8 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-accent/40 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-sombre">
                {dict.landing.vitrineFeatureTitle}
              </h3>
              <p className="text-sm sm:text-base text-sombre/70 font-medium leading-relaxed">
                {dict.landing.vitrineFeatureDesc}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sable/60 p-6 sm:p-8 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 hover:border-accent/40 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <Wifi className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-sombre">
                {dict.landing.offlineFeatureTitle}
              </h3>
              <p className="text-sm sm:text-base text-sombre/70 font-medium leading-relaxed">
                {dict.landing.offlineFeatureDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Trust & Privacy */}
      <section className="py-16 sm:py-24 bg-white border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge={isEn ? 'Trust & Privacy' : 'Confiance'}
            badgeIcon={<Lock className="w-3.5 h-3.5" />}
            title={isEn ? 'Your garments, your clients, your private data.' : 'Tes commandes, tes clients, tes données.'}
            subtitle={isEn ? 'Total privacy. Your client measurements and order book remain strictly yours.' : 'Confidentialité totale. Tes fiches clients et ton carnet restent privés.'}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-3xl border border-sable/60 p-8 text-center space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-display font-bold text-sombre">
                {isEn ? 'Guaranteed Privacy' : 'Confidentialité garantie'}
              </h3>
              <p className="text-sm text-sombre/70 font-medium leading-relaxed">
                {isEn ? 'Your workshop data is strictly reserved for your own professional use.' : 'Tes données d’atelier sont strictement réservées à ton usage personnel.'}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sable/60 p-8 text-center space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-vertbouton flex items-center justify-center mx-auto shadow-xs">
                <Wifi className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-display font-bold text-sombre">
                {isEn ? 'Mobile-First Design' : 'Optimisé pour le mobile'}
              </h3>
              <p className="text-sm text-sombre/70 font-medium leading-relaxed">
                {isEn ? 'Fast, ultra-light interface built for quick actions right in the workshop.' : 'Interface rapide et légère, conçue pour réagir rapidement même sur le terrain.'}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-sable/60 p-8 text-center space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-display font-bold text-sombre">
                {isEn ? 'Instant Setup' : 'Prise en main immédiate'}
              </h3>
              <p className="text-sm text-sombre/70 font-medium leading-relaxed">
                {isEn ? 'Zero training required. Log your first bespoke order in under 2 minutes.' : 'Aucune formation technique requise. Crée ta première commande en moins de 2 minutes.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 4 Steps Timeline */}
      <section className="py-16 sm:py-24 bg-[#FAFAF8] border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge={isEn ? '4 Steps' : '4 étapes'}
            badgeIcon={<span>⚡</span>}
            title={dict.howItWorks.title}
            subtitle={dict.howItWorks.subtitle}
          />

          <div className="relative">
            <div className="hidden md:block absolute top-12 left-16 right-16 h-1 bg-sable/60 border-t-2 border-dashed border-accent/40 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-4 relative z-10">
              <div className="bg-white rounded-3xl border border-sable/60 p-6 text-center space-y-4 shadow-xs hover:shadow-md transition-all group">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-accent via-gold to-fonce animate-spin duration-10000 opacity-80 group-hover:scale-110 transition-transform blur-xs"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-sombre text-gold font-display font-bold text-2xl flex items-center justify-center shadow-lg border border-gold/40">
                    01
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-sombre">
                  {dict.howItWorks.step1Title}
                </h3>
                <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
                  {dict.howItWorks.step1Desc}
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-sable/60 p-6 text-center space-y-4 shadow-xs hover:shadow-md transition-all group">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-gold via-accent to-fonce animate-spin duration-10000 opacity-80 group-hover:scale-110 transition-transform blur-xs"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-sombre text-gold font-display font-bold text-2xl flex items-center justify-center shadow-lg border border-gold/40">
                    02
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-sombre">
                  {dict.howItWorks.step2Title}
                </h3>
                <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
                  {dict.howItWorks.step2Desc}
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-sable/60 p-6 text-center space-y-4 shadow-xs hover:shadow-md transition-all group">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fonce via-gold to-accent animate-spin duration-10000 opacity-80 group-hover:scale-110 transition-transform blur-xs"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-sombre text-gold font-display font-bold text-2xl flex items-center justify-center shadow-lg border border-gold/40">
                    03
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-sombre">
                  {dict.howItWorks.step3Title}
                </h3>
                <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
                  {dict.howItWorks.step3Desc}
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-sable/60 p-6 text-center space-y-4 shadow-xs hover:shadow-md transition-all group">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-accent via-fonce to-gold animate-spin duration-10000 opacity-80 group-hover:scale-110 transition-transform blur-xs"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-sombre text-gold font-display font-bold text-2xl flex items-center justify-center shadow-lg border border-gold/40">
                    04
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-sombre">
                  {dict.howItWorks.step4Title}
                </h3>
                <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
                  {dict.howItWorks.step4Desc}
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
                {dict.landing.ctaBannerTitle}
              </h2>
              <p className="text-base sm:text-lg text-white/80 font-medium max-w-xl">
                {dict.landing.ctaBannerSubtitle}
              </p>
            </div>

            <div className="shrink-0">
              <Link href="/login">
                <Button variant="gold" size="lg" className="rounded-full px-10 py-4 font-extrabold text-base shadow-xl hover:scale-105 active:scale-95 transition-all">
                  {dict.landing.ctaBannerButton}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Pricing Section */}
      {SHOW_ACCOUNT_PLANS && (
        <section id="tarifs" className="py-16 sm:py-24 bg-white border-b border-sable/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <SectionHeader
              badge={dict.nav.pricing}
              badgeIcon={<span>⭐</span>}
              title={dict.landing.pricingTitle}
              subtitle={dict.landing.pricingSubtitle}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
              {/* Free Plan */}
              <div className="bg-[#FAFAF8] rounded-3xl border border-sable/80 p-8 sm:p-10 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-sable/40 pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase text-sombre/60 tracking-wider">{dict.landing.freePlanBadge}</span>
                      <h3 className="text-2xl font-display font-bold text-sombre">{dict.landing.freePlanTitle}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl sm:text-4xl font-display font-bold text-sombre">{dict.landing.freePlanPrice}</span>
                      <span className="text-xs text-sombre/60 block font-semibold">{isEn ? 'Free lifetime access' : 'Accès gratuit à vie'}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 text-sm sm:text-base font-medium text-sombre/85">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-vertbouton shrink-0" />
                      <span>{dict.landing.freePlanFeature1}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-vertbouton shrink-0" />
                      <span>{dict.landing.freePlanFeature2}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-vertbouton shrink-0" />
                      <span>{dict.landing.freePlanFeature3}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-vertbouton shrink-0" />
                      <span>{dict.landing.freePlanFeature4}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-vertbouton shrink-0" />
                      <span>{dict.landing.freePlanFeature5}</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <Link href="/login">
                    <Button variant="outline" fullWidth size="lg" className="rounded-full font-bold border-accent text-accent hover:bg-accent/10">
                      {dict.landing.freePlanCta}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="bg-white rounded-3xl border-2 border-accent p-8 sm:p-10 shadow-2xl space-y-6 flex flex-col justify-between relative hover:shadow-2xl transition-all scale-102">
                <div className="absolute -top-3.5 right-8 bg-accent text-white text-xs font-extrabold px-4 py-1 rounded-full shadow-md tracking-wide">
                  {isEn ? 'POPULAR & UNLIMITED' : 'POPULAIRE & ILLIMITÉ'}
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-sable/40 pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase text-accent tracking-wider">{dict.landing.proPlanBadge}</span>
                      <h3 className="text-2xl font-display font-bold text-sombre">{dict.landing.proPlanTitle}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl sm:text-4xl font-display font-bold text-accent">{dict.landing.proPlanPrice}</span>
                      <span className="text-xs text-sombre/60 block font-semibold">{dict.landing.proPlanPeriod}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 text-sm sm:text-base font-medium text-sombre/85">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                      <span>{dict.landing.proPlanFeature1}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                      <span>{dict.landing.proPlanFeature2}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                      <span>{dict.landing.proPlanFeature3}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                      <span>{dict.landing.proPlanFeature4}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                      <span>{dict.landing.proPlanFeature5}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                      <span>{dict.landing.proPlanFeature6}</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <Link href="/signup">
                    <Button variant="accent" fullWidth size="lg" className="rounded-full font-extrabold shadow-lg hover:scale-102 transition-transform">
                      {dict.landing.proPlanCta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 10. Genuine Artisan Craft Trust */}
      <section className="py-16 sm:py-24 bg-[#FAFAF8] border-b border-sable/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto shadow-xs">
            <Scissors className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
            {isEn ? 'Crafted Hand in Hand with Master Tailors' : 'Conçu main dans la main avec les couturiers'}
          </h2>
          <p className="text-sm sm:text-base text-sombre/80 font-medium leading-relaxed max-w-2xl mx-auto">
            {isEn
              ? 'Ourlette is built specifically around the day-to-day realities of fashion workshops. We maintain absolute transparency: no fake reviews. You can submit suggestions directly from your workshop settings.'
              : 'Ourlette est développé au plus proche du quotidien des ateliers de couture. Nous mettons un point d’honneur à la transparence : aucun avis préfabriqué. Vous pouvez nous soumettre vos retours directement depuis votre espace d’atelier.'}
          </p>
          <div className="pt-2">
            <Link href="/signup">
              <Button variant="outline" size="md" className="rounded-full border-accent text-accent font-bold">
                {isEn ? 'Join Pioneer Ateliers →' : 'Rejoindre les ateliers pionniers →'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-white border-b border-sable/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge={dict.nav.faq}
            title={dict.landing.faqTitle}
            subtitle={dict.landing.faqSubtitle}
          />

          <FaqAccordion items={landingFaqItems} defaultOpenId={isEn ? 'free' : 'gratuit'} />

          <div className="text-center pt-4">
            <Link href="/faq">
              <Button variant="outline" size="md" className="rounded-full border-accent text-accent font-bold hover:bg-accent/10">
                {dict.landing.seeAllFaq}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 12. Final CTA Banner */}
      <section className="py-14 sm:py-20 bg-sombre text-white border-b border-gold/30 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-white leading-tight">
            {isEn ? 'Say goodbye to notebooks. Welcome Ourlette.' : 'Fini le cahier. Place à Ourlette.'}
          </h2>
          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto font-medium">
            {isEn
              ? 'Open your free atelier in 2 minutes. No credit card required.'
              : 'Ouvrez votre atelier gratuit en 2 minutes. Sans carte bancaire.'}
          </p>
          <div className="pt-2">
            <Link href="/signup">
              <Button
                variant="accent"
                size="lg"
                className="rounded-full font-extrabold px-8 py-4 shadow-xl text-sm sm:text-base hover:scale-105 active:scale-95 transition-all"
              >
                {dict.landing.startFree}
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
