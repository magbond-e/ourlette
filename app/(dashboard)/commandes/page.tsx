'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, AlertTriangle, Search, X, Calendar, Scissors, ChevronRight, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCommandes } from '@/lib/powersync/hooks';
import { Commande, StatutCommande } from '@/lib/types/database';
import { formatFCFA, isCommandeEnRetard, calculSolde } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { isProPlan, FREE_PLAN_LIMITS } from '@/lib/utils/planLimits';

function MiniStatusBadge({
  statut,
  label,
}: {
  statut: StatutCommande;
  label: string;
}) {
  const colorMap: Record<StatutCommande, string> = {
    recue: 'bg-sable/30 text-sombre border-sable/60',
    en_cours: 'bg-accent/15 text-accent border-accent/30',
    essayage: 'bg-amber-500/15 text-amber-900 border-amber-500/30',
    prete: 'bg-vertbouton/15 text-vertbouton border-vertbouton/30',
    livree: 'bg-sombre/10 text-sombre border-sombre/20',
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${colorMap[statut] ?? 'bg-sable/30 text-sombre border-sable'}`}>
      {label}
    </span>
  );
}

function formatRelativeDeliveryDate(dateStr: string, locale: string = 'fr'): { text: string; isOverdue: boolean } {
  if (!dateStr) return { text: '', isOverdue: false };
  const target = new Date(dateStr);
  const now = new Date();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((targetDay - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      text: locale === 'en' ? `Overdue by ${overdueDays}d` : `En retard de ${overdueDays} j`,
      isOverdue: true,
    };
  }
  if (diffDays === 0) {
    return {
      text: locale === 'en' ? 'Today' : "Aujourd'hui",
      isOverdue: false,
    };
  }
  if (diffDays === 1) {
    return {
      text: locale === 'en' ? 'Tomorrow' : 'Demain',
      isOverdue: false,
    };
  }
  return {
    text: locale === 'en' ? `In ${diffDays}d` : `Dans ${diffDays} j`,
    isOverdue: false,
  };
}

export default function CommandesPage() {
  const { user, couturier } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  const statutsOrder: { id: StatutCommande; label: string }[] = [
    { id: 'recue', label: dict.commandes.statusReceived },
    { id: 'en_cours', label: dict.commandes.statusInProgress },
    { id: 'essayage', label: dict.commandes.statusFitting },
    { id: 'prete', label: dict.commandes.statusReady },
    { id: 'livree', label: dict.commandes.statusDelivered },
  ];

  const commandes = useCommandes(user?.id);

  // Par défaut : filtre sur les commandes actives
  const [filterStatut, setFilterStatut] = useState<string>('actives');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isPro = couturier ? isProPlan(couturier) : false;

  // Calculs synthétiques
  const overdueCount = useMemo(() => {
    return commandes.filter((c) => isCommandeEnRetard(c.date_livraison_prevue, c.statut)).length;
  }, [commandes]);

  const totalActives = useMemo(() => {
    return commandes.filter((c) => c.statut !== 'livree').length;
  }, [commandes]);

  const montantTotalAEncaisser = useMemo(() => {
    return commandes
      .filter((c) => c.statut !== 'livree')
      .reduce((acc, c) => acc + calculSolde(c.prix_total, c.acompte), 0);
  }, [commandes]);

  // Filtrage et Tri par date de livraison la plus proche
  const filteredCommandes = useMemo(() => {
    return commandes
      .filter((cmd) => {
        const q = searchQuery.trim().toLowerCase();
        if (q) {
          const matchSearch =
            (cmd.client_nom || '').toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q) ||
            (cmd.tissu || '').toLowerCase().includes(q) ||
            (cmd.responsable || '').toLowerCase().includes(q);
          if (!matchSearch) return false;
        }

        if (filterStatut === 'actives') return cmd.statut !== 'livree';
        if (filterStatut === 'toutes') return true;
        if (filterStatut === 'retard') return isCommandeEnRetard(cmd.date_livraison_prevue, cmd.statut);
        return cmd.statut === filterStatut;
      })
      .sort((a, b) => {
        const timeA = a.date_livraison_prevue ? new Date(a.date_livraison_prevue).getTime() : Infinity;
        const timeB = b.date_livraison_prevue ? new Date(b.date_livraison_prevue).getTime() : Infinity;
        return timeA - timeB;
      });
  }, [commandes, searchQuery, filterStatut]);

  const filterTabs = [
    { id: 'actives', label: isEn ? 'Active' : 'Actives', count: totalActives },
    ...(overdueCount > 0 ? [{ id: 'retard', label: isEn ? 'Overdue' : 'En retard', count: overdueCount }] : []),
    ...statutsOrder.map((s) => ({
      id: s.id,
      label: s.label,
      count: commandes.filter((c) => c.statut === s.id).length,
    })),
    { id: 'toutes', label: dict.commandes.tabAll, count: commandes.length },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 space-y-4">

        {/* ── Entête épinglée : Synthèse + Recherche + Filtres ──────── */}
        <div className="sticky top-[64px] z-20 bg-[#FAFAF8]/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 space-y-3 border-b border-sable/30 shadow-xs">
          
          {/* Synthèse : 2 cartes (Commandes actives & Solde à encaisser) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Carte Commandes actives */}
            <Card className="bg-white p-3.5 sm:p-4 border border-sable/60 shadow-2xs rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] sm:text-xs font-bold text-sombre/70 uppercase tracking-wider truncate">
                  {dict.commandes.statsActive}
                </span>
                {/* Indicateur N en retard affiché UNIQUEMENT si N > 0 */}
                {overdueCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterStatut('retard')}
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-accent text-white px-2 py-0.5 rounded-full shadow-2xs hover:bg-fonce transition-colors shrink-0"
                    title={dict.commandes.overdueNotice}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-gold shrink-0" />
                    <span>{overdueCount}</span>
                  </button>
                )}
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-display font-bold text-sombre leading-none">
                  {totalActives}
                </span>
                {/* Compteur discret 8/10 uniquement si >= 80% de la limite gratuite */}
                {!isPro && totalActives >= Math.floor(FREE_PLAN_LIMITS.maxActiveCommandes * 0.8) && (
                  <Link
                    href="/pro"
                    className="text-[10px] font-extrabold text-accent hover:underline flex items-center gap-0.5 bg-accent/10 px-1.5 py-0.5 rounded-md"
                  >
                    <Lock className="w-2.5 h-2.5 shrink-0" />
                    <span>{totalActives}/{FREE_PLAN_LIMITS.maxActiveCommandes}</span>
                  </Link>
                )}
              </div>
            </Card>

            {/* Carte Solde à encaisser */}
            <Card className="bg-white p-3.5 sm:p-4 border border-sable/60 shadow-2xs rounded-2xl flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-sombre/70 uppercase tracking-wider truncate">
                {dict.commandes.balanceRemaining}
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span
                  className="text-lg sm:text-2xl font-display font-bold text-vertbouton leading-none truncate max-w-full"
                  title={formatFCFA(montantTotalAEncaisser)}
                >
                  {formatFCFA(montantTotalAEncaisser)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-sombre/50 uppercase shrink-0 ml-1">FCFA</span>
              </div>
            </Card>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-sombre/40" />
            <input
              type="text"
              placeholder={dict.commandes.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-sable/70 rounded-xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-hidden focus:ring-1 focus:ring-fonce focus:border-fonce font-sans shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-sombre/40 hover:text-accent p-0.5"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtres de statut */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {filterTabs.map((tab) => {
              const isActive = filterStatut === tab.id;
              const isRetard = tab.id === 'retard';
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatut(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? isRetard
                        ? 'bg-accent text-white border-accent shadow-2xs'
                        : 'bg-sombre text-white border-sombre shadow-2xs'
                      : isRetard
                      ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20'
                      : 'bg-white text-sombre/70 border-sable/70 hover:border-sombre hover:text-sombre'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-sombre/10 text-sombre/80'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Liste des commandes ─────────────────────────────────────── */}
        {filteredCommandes.length === 0 ? (
          <Card className="py-12 px-4 text-center space-y-3 bg-white border-dashed border border-sable rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-sable/20 text-sombre/50 flex items-center justify-center mx-auto">
              <Scissors className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-display font-bold text-sombre">
                {searchQuery
                  ? (locale === 'fr' ? `Aucune commande pour « ${searchQuery} »` : `No orders for "${searchQuery}"`)
                  : (locale === 'fr' ? 'Aucune commande. Crée la première.' : 'No orders yet. Create the first one.')}
              </h3>
            </div>
            {searchQuery || filterStatut !== 'actives' ? (
              <button
                type="button"
                onClick={() => {
                  setFilterStatut('actives');
                  setSearchQuery('');
                }}
                className="inline-block text-xs font-bold text-fonce hover:underline cursor-pointer"
              >
                {isEn ? 'Reset filters' : 'Réinitialiser les filtres'}
              </button>
            ) : (
              <Link href="/commandes/nouvelle" className="inline-block pt-1">
                <Button className="rounded-full bg-accent hover:bg-accent/90 text-white text-xs font-bold px-4 h-9 shadow-xs">
                  {dict.commandes.createFirstOrder}
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCommandes.map((cmd) => {
              const isOverdue = isCommandeEnRetard(cmd.date_livraison_prevue, cmd.statut);
              const resteAPayer = calculSolde(cmd.prix_total, cmd.acompte);
              const relativeDelivery = formatRelativeDeliveryDate(cmd.date_livraison_prevue, locale);
              const statusInfo = statutsOrder.find((s) => s.id === cmd.statut);

              return (
                <Link
                  key={cmd.id}
                  href={`/commandes/${cmd.id}`}
                  className="block group"
                >
                  <Card
                    className={`p-4 rounded-2xl border transition-all hover:shadow-xs active:scale-[0.99] bg-white ${
                      isOverdue
                        ? 'border-accent/40 bg-accent/5'
                        : 'border-sable/60'
                    }`}
                  >
                    {/* Ligne 1 : Nom du client (gras) & Badge de statut */}
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-bold text-sm sm:text-base text-sombre truncate group-hover:text-fonce">
                        {cmd.client_nom || (locale === 'fr' ? 'Client' : 'Client')}
                      </h2>
                      <MiniStatusBadge
                        statut={cmd.statut}
                        label={statusInfo?.label || cmd.statut}
                      />
                    </div>

                    {/* Ligne 2 : Description (1 seule ligne) */}
                    <p className="text-xs text-sombre/70 font-medium truncate mt-1">
                      {cmd.description}
                    </p>

                    {/* Ligne 3 : Date relative & Solde restant si > 0 */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-sable/30 text-xs">
                      <div className={`flex items-center gap-1.5 font-semibold ${
                        relativeDelivery.isOverdue
                          ? 'text-accent font-bold'
                          : 'text-sombre/70'
                      }`}>
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{relativeDelivery.text}</span>
                      </div>

                      {resteAPayer > 0 ? (
                        <div className="text-xs font-bold text-vertbouton">
                          {formatFCFA(resteAPayer)} <span className="text-[10px] text-sombre/60 font-semibold uppercase">dû</span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-bold text-sombre/40">
                          {locale === 'fr' ? 'Soldé' : 'Paid'}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Bouton flottant + Nouvelle commande (mobile) ────────────── */}
        <div className="fixed bottom-20 right-4 sm:hidden z-30">
          <Link href="/commandes/nouvelle">
            <Button
              className="rounded-full shadow-lg shadow-sombre/20 w-14 h-14 p-0 bg-accent hover:bg-fonce text-white flex items-center justify-center border-2 border-white"
              aria-label="Nouvelle commande"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </Link>
        </div>

      </main>
    </div>
  );
}
