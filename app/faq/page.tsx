'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, HelpCircle, Sparkles } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FaqAccordion } from '@/components/landing/FaqAccordion';
import { Button } from '@/components/ui/Button';

const allFaqItems = [
  {
    id: "gratuit",
    category: "Gratuité & Tarifs",
    question: "Ourlette est-il vraiment gratuit ?",
    answer:
      "Oui. Le Plan Starter est 100 % gratuit et sans engagement. Il comprend le carnet de commandes (jusqu'à 10 commandes actives simultanées), toutes les fiches mesures, la recherche, le suivi des encaissements et la vitrine publique sur WhatsApp (jusqu'à 8 photos).",
  },
  {
    id: "plan-pro",
    category: "Gratuité & Tarifs",
    question: "Combien coûte le Plan Pro et que débloque-t-il ?",
    answer:
      "Le Plan Pro est proposé à 1 999 FCFA / mois. Il débloque un nombre illimité de commandes actives, des photos illimitées dans la vitrine publique, la personnalisation du lien de votre atelier (ex: ourlette.app/ma-maison-couture) et l'accès aux jauges de suivi d'abonnement.",
  },
  {
    id: "carte",
    category: "Gratuité & Tarifs",
    question: "Ai-je besoin d'une carte bancaire pour m'inscrire ?",
    answer: "Non. L'inscription est totalement gratuite et ne demande aucune information de paiement.",
  },
  {
    id: "notifications",
    category: "Fonctionnalités Atelier",
    question: "Comment fonctionnent les notifications d'atelier ?",
    answer:
      "Une icône de cloche dans l'en-tête de votre espace atelier vous alerte en temps réel des commandes en retard de livraison, des rappels d'essayage et des nouveautés de la plateforme.",
  },
  {
    id: "3g",
    category: "Technique & Données",
    question: "Ourlette fonctionne-t-il avec une connexion internet faible ou hors-ligne ?",
    answer:
      "Oui. Ourlette est conçu mobile-first et supporte le mode hors-ligne pour la consultation et la saisie des commandes et mesures. Vos modifications sont synchronisées dès le retour de la connexion réseau.",
  },
  {
    id: "multi",
    category: "Fonctionnalités Atelier",
    question: "Puis-je utiliser Ourlette si nous sommes plusieurs dans l'atelier ?",
    answer:
      "Oui. Chaque commande et chaque fiche mesures intègre un champ \"responsable\" en texte libre, pour savoir qui gère quelle tenue sans avoir besoin de créer un compte séparé.",
  },
  {
    id: "retouche",
    category: "Fonctionnalités Atelier",
    question: "Est-ce que je peux distinguer une retouche d'une couture complète ?",
    answer:
      "Oui. Chaque commande précise s'il s'agit d'une couture complète ou d'une retouche d'une tenue existante. Les deux types ont une sélection visuelle claire et les informations demandées s'adaptent à chaque cas.",
  },
  {
    id: "recherche",
    category: "Fonctionnalités Atelier",
    question: "Comment je retrouve une commande rapidement ?",
    answer:
      "Depuis le tableau de bord, une barre de recherche te permet de chercher par nom de client, description du modèle, tissu ou responsable. Tu peux aussi filtrer tes commandes par statut (Reçue, En cours, En retard, Prête, Livrée) en un tap.",
  },
  {
    id: "encaissements",
    category: "Fonctionnalités Atelier",
    question: "Comment je suis mes encaissements ?",
    answer:
      "Le tableau de bord affiche en permanence le total des soldes à encaisser (commandes non entièrement payées). Sur chaque commande, l'acompte versé est enregistré et le solde restant est calculé automatiquement.",
  },
  {
    id: "donnees",
    category: "Technique & Données",
    question: "Mes données sont-elles revendues à des tiers ?",
    answer:
      "Non. Vos données restent strictement confidentielles et réservées à votre propre gestion d'atelier.",
  },
  {
    id: "pays",
    category: "Technique & Données",
    question: "Ourlette est-il disponible dans mon pays ?",
    answer:
      "Ourlette s'adresse aux couturiers du monde entier. L'interface est en français pour le moment.",
  },
  {
    id: "vitrine-contact",
    category: "Vitrine & WhatsApp",
    question: "Comment mes clients peuvent-ils me contacter depuis ma vitrine ?",
    answer:
      "Via un bouton de contact direct sur WhatsApp ou appel téléphonique, sans que vos clients n'aient besoin de télécharger d'application ni de créer de compte.",
  },
  {
    id: "competences",
    category: "Technique & Données",
    question: "Ai-je besoin de compétences techniques pour utiliser Ourlette ?",
    answer:
      "Non. L'outil est pensé pour être utilisable sans formation, en quelques clics, depuis un téléphone.",
  },
  {
    id: "ordinateur",
    category: "Technique & Données",
    question: "Puis-je utiliser Ourlette sur ordinateur, ou seulement sur téléphone ?",
    answer:
      "Ourlette est pensé mobile-first — l'expérience est optimisée pour le téléphone avec une navigation en bas d'écran — mais l'app reste parfaitement utilisable sur ordinateur via un navigateur.",
  },
  {
    id: "logo-banniere",
    category: "Vitrine & WhatsApp",
    question: "Puis-je ajouter un logo et une photo de couverture à ma vitrine ?",
    answer:
      "Oui. Dans l'onglet Vitrine, tu peux uploader une photo de couverture (bannière) et un logo de ton atelier directement depuis ton téléphone.",
  },
];

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');

  const categories = ['Toutes', 'Gratuité & Tarifs', 'Fonctionnalités Atelier', 'Vitrine & WhatsApp', 'Technique & Données'];

  const filteredItems = allFaqItems.filter((item) => {
    const matchesCategory = selectedCategory === 'Toutes' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans selection:bg-accent selection:text-white">
      <LandingHeader activeTab="faq" />

      {/* Header Visual */}
      <section className="relative bg-sombre text-white py-16 sm:py-20 border-b border-accent/20 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/images/secondary_header_bg.png"
            alt="Atelier couture FAQ"
            fill
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-sombre via-sombre/80 to-transparent"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs sm:text-sm font-bold text-gold">
            <HelpCircle className="w-4 h-4" />
            <span>Foire aux Questions Complète</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Toutes les réponses à vos questions
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-2xl mx-auto font-medium">
            Trouvez instantanément l'information qu'il vous faut pour utiliser Ourlette au quotidien.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 flex-1">
        {/* Search Input Bar */}
        <div className="relative max-w-xl mx-auto">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-sombre/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une question (ex: gratuit, carte, mesures, vitrine...)"
            className="w-full bg-white border border-sable/80 rounded-full pl-12 pr-4 py-3 text-sm sm:text-base text-sombre shadow-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${selectedCategory === cat
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-white text-sombre/70 hover:text-accent border border-sable/60'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        {filteredItems.length > 0 ? (
          <FaqAccordion items={filteredItems} defaultOpenId="gratuit" />
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-sable/60 p-8 space-y-3">
            <p className="text-base font-bold text-sombre">Aucune question ne correspond à votre recherche.</p>
            <p className="text-xs text-sombre/70">Essayez avec d'autres mots-clés ou réinitialisez les filtres.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Toutes');
              }}
              className="text-accent font-bold text-sm hover:underline"
            >
              Réinitialiser la recherche
            </button>
          </div>
        )}

        {/* Bottom Contact CTA */}
        <div className="bg-white rounded-3xl border border-sable/60 p-8 text-center space-y-4 shadow-xs">
          <h3 className="text-xl font-display font-bold text-sombre">Une question sans réponse ?</h3>
          <p className="text-sm text-sombre/70 font-medium">
            Notre équipe est disponible pour répondre directement aux questions de votre atelier.
          </p>
          <div>
            <a href="mailto:ourlette.app@gmail.com">
              <Button variant="accent" size="md" className="rounded-full px-6 font-bold shadow-md">
                Nous contacter par email
              </Button>
            </a>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
