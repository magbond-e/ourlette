'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, AlertTriangle, Search, Calendar, User, Scissors, ChevronRight, X, Check, TrendingUp, BarChart2, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { MockStorageService } from '@/lib/services/mockStorage';
import { Commande, StatutCommande } from '@/lib/types/database';
import { formatFCFA, formatDateFR, isCommandeEnRetard, calculSolde } from '@/lib/utils/formatters';

const STATUTS_ORDER: { id: StatutCommande; label: string }[] = [
  { id: 'recue', label: 'Reçue' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'essayage', label: 'Essayage' },
  { id: 'prete', label: 'Prête' },
  { id: 'livree', label: 'Livrée' },
];

function MiniStatusBadge({ statut }: { statut: StatutCommande }) {
  const info = STATUTS_ORDER.find(s => s.id === statut);
  const colorMap: Record<StatutCommande, string> = {
    recue: 'bg-sable/30 text-sombre border-sable/60',
    en_cours: 'bg-accent/15 text-accent border-accent/30',
    essayage: 'bg-amber-500/15 text-amber-900 border-amber-500/30',
    prete: 'bg-vertbouton/15 text-vertbouton border-vertbouton/30',
    livree: 'bg-sombre/10 text-sombre border-sombre/20',
  };
  return (
    <span className={`inline-flex items-center text-xs sm:text-sm font-bold px-3 py-1 rounded-full border ${colorMap[statut] ?? 'bg-sable/30 text-sombre border-sable'}`}>
      {info?.label ?? statut}
    </span>
  );
}

function StatusStepper({ currentStatus, onChangeRequest }: {
  currentStatus: StatutCommande;
  onChangeRequest: (newStatus: StatutCommande) => void;
}) {
  const currentIdx = STATUTS_ORDER.findIndex(s => s.id === currentStatus);

  return (
    <div className="w-full py-2">
      <div className="relative flex items-center justify-between">
        <div aria-hidden="true" className="absolute left-4 right-4 top-4 -z-0 border-b-2 border-dashed border-sable/70" />
        {STATUTS_ORDER.map((step, idx) => {
          const isReached = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          let dotClass = 'bg-white border-2 border-sable text-sombre/50';
          if (isCurrent) dotClass = 'bg-accent text-white ring-4 ring-accent/20 scale-110 shadow-md';
          else if (isReached) dotClass = 'bg-sombre text-white shadow-xs';
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onChangeRequest(step.id)}
              disabled={isCurrent}
              className={`group flex flex-col items-center z-10 transition-all duration-200 ${isCurrent ? 'cursor-default' : 'cursor-pointer hover:scale-110 focus:outline-none'}`}
              title={`Marquer comme ${step.label}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${dotClass}`}>
                {isReached ? '✓' : idx + 1}
              </div>
              <span className={`text-xs mt-1.5 font-bold ${isCurrent ? 'text-accent font-extrabold' : isReached ? 'text-sombre' : 'text-sombre/50'}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConfirmStatusModal({
  commande,
  newStatus,
  onConfirm,
  onCancel,
}: {
  commande: Commande;
  newStatus: StatutCommande;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const newInfo = STATUTS_ORDER.find(s => s.id === newStatus);
  const currentInfo = STATUTS_ORDER.find(s => s.id === commande.statut);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-sombre/60 backdrop-blur-xs px-4 pb-6 sm:pb-0">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-fade-in-up border border-sable">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sombre/50">Changer le statut</p>
            <h3 className="text-xl font-display font-bold text-sombre mt-0.5 truncate">{commande.client_nom}</h3>
          </div>
          <button onClick={onCancel} className="text-sombre/40 hover:text-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-[#FAFAF8] rounded-2xl p-4 border border-sable/50">
          <div className="text-center flex-1">
            <p className="text-xs text-sombre/50 font-bold uppercase mb-1">Actuel</p>
            <MiniStatusBadge statut={commande.statut} />
          </div>
          <div className="text-accent font-bold text-lg">→</div>
          <div className="text-center flex-1">
            <p className="text-xs text-sombre/50 font-bold uppercase mb-1">Nouveau</p>
            <MiniStatusBadge statut={newStatus} />
          </div>
        </div>

        <p className="text-sm text-sombre/80 font-medium leading-relaxed">
          Passer la commande de <strong>{currentInfo?.label}</strong> à <strong>{newInfo?.label}</strong> ?
        </p>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" fullWidth onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" variant="accent" size="md" fullWidth onClick={onConfirm} className="gap-2">
            <Check className="w-4 h-4" />
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CommandesPage() {
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [filterStatut, setFilterStatut] = useState<string>('toutes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ cmd: Commande; newStatus: StatutCommande } | null>(null);

  const loadCommandes = useCallback(() => {
    setCommandes(MockStorageService.getCommandes());
  }, []);

  useEffect(() => {
    setMounted(true);
    loadCommandes();
  }, [loadCommandes]);

  const handleStatusChangeRequest = (cmd: Commande, newStatus: StatutCommande) => {
    if (newStatus === cmd.statut) return;
    setPendingChange({ cmd, newStatus });
  };

  const handleConfirmStatusChange = () => {
    if (!pendingChange) return;
    MockStorageService.updateCommande(pendingChange.cmd.id, { statut: pendingChange.newStatus });
    loadCommandes();
    setPendingChange(null);
  };

  const overdueCount = commandes.filter(c => isCommandeEnRetard(c.date_livraison_prevue, c.statut)).length;
  const totalActives = commandes.filter(c => c.statut !== 'livree').length;
  const montantTotalAEncaisser = commandes
    .filter(c => c.statut !== 'livree')
    .reduce((acc, c) => acc + calculSolde(c.prix_total, c.acompte), 0);

  const filteredCommandes = commandes.filter(cmd => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const matchSearch =
        (cmd.client_nom || '').toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        (cmd.tissu || '').toLowerCase().includes(q) ||
        (cmd.responsable || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    if (filterStatut === 'toutes') return true;
    if (filterStatut === 'retard') return isCommandeEnRetard(cmd.date_livraison_prevue, cmd.statut);
    return cmd.statut === filterStatut;
  });

  const filterTabs = [
    { id: 'toutes', label: `Toutes`, count: commandes.length },
    ...(overdueCount > 0 ? [{ id: 'retard', label: `En retard`, count: overdueCount }] : []),
    ...STATUTS_ORDER.map(s => ({
      id: s.id,
      label: s.label,
      count: commandes.filter(c => c.statut === s.id).length,
    })),
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-sans">
      <main className="max-w-4xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label="Chargement de votre carnet d'atelier…" size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 font-sans">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Desktop & Mobile Balanced Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="bg-white p-4 sm:p-5 border border-sable/60 shadow-xs min-w-0 rounded-3xl">
            <p className="text-xs sm:text-sm font-bold text-sombre/70 uppercase tracking-wider truncate">
              Commandes actives
            </p>
            <div className="flex items-center justify-between mt-2 min-w-0">
              <span className="text-2xl sm:text-3xl font-display font-bold text-sombre">{totalActives}</span>
              {overdueCount > 0 && (
                <button
                  onClick={() => setFilterStatut('retard')}
                  className="inline-flex items-center gap-1 text-xs font-bold bg-accent text-white px-2.5 py-1 rounded-full shadow-xs hover:bg-fonce transition-colors"
                  title="Filtrer les commandes en retard"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-gold" />
                  <span className="truncate">{overdueCount} retard</span>
                </button>
              )}
            </div>
          </Card>

          <Card className="bg-white p-4 sm:p-5 border border-sable/60 shadow-xs min-w-0 rounded-3xl">
            <p className="text-xs sm:text-sm font-bold text-sombre/70 uppercase tracking-wider truncate">
              Montant à encaisser
            </p>
            <span
              className="text-lg sm:text-2xl font-display font-bold text-vertbouton mt-2 block truncate"
              title={formatFCFA(montantTotalAEncaisser)}
            >
              {formatFCFA(montantTotalAEncaisser)}
            </span>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-4 text-sombre/40" />
          <input
            type="text"
            placeholder="Rechercher par client, modèle, tissu, responsable…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-sable/80 rounded-2xl text-sm sm:text-base text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-sans shadow-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-4 text-sombre/40 hover:text-accent">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          {filterTabs.map(tab => {
            const isActive = filterStatut === tab.id;
            const isRetard = tab.id === 'retard';
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatut(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap border transition-all shrink-0 ${
                  isActive
                    ? isRetard
                      ? 'bg-accent text-white border-accent shadow-md'
                      : 'bg-sombre text-white border-sombre shadow-md'
                    : isRetard
                    ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20'
                    : 'bg-white text-sombre/70 border-sable/80 hover:border-accent hover:text-sombre'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-sombre/10 text-sombre/80'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Results Count */}
        {(filterStatut !== 'toutes' || searchQuery) && (
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold font-sans pl-0.5">
            {filteredCommandes.length} résultat{filteredCommandes.length !== 1 ? 's' : ''} affiché{filteredCommandes.length !== 1 ? 's' : ''}
            {filterStatut !== 'toutes' && (
              <button onClick={() => setFilterStatut('toutes')} className="ml-2 text-accent underline font-bold hover:no-underline">
                Tout afficher
              </button>
            )}
          </p>
        )}

        {/* Orders Grid */}
        {filteredCommandes.length === 0 ? (
          <Card className="py-14 text-center space-y-3 bg-white/80 border-dashed border-2 border-sable/80 rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-clair text-accent flex items-center justify-center mx-auto">
              <Scissors className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-display font-bold text-sombre">Aucune commande trouvée</h3>
              <p className="text-xs sm:text-sm text-sombre/70 font-medium font-sans">
                {searchQuery || filterStatut !== 'toutes'
                  ? 'Essayez de modifier votre recherche ou vos filtres.'
                  : "Créez votre première commande d'atelier ci-dessous."}
              </p>
            </div>
            {filterStatut !== 'toutes' || searchQuery ? (
              <button
                onClick={() => { setFilterStatut('toutes'); setSearchQuery(''); }}
                className="inline-block pt-2 text-xs sm:text-sm font-bold text-accent underline hover:no-underline"
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <Link href="/commandes/nouvelle" className="inline-block pt-2">
                <Button variant="accent" size="md">+ Créer une commande</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCommandes.map(cmd => {
              const isOverdue = isCommandeEnRetard(cmd.date_livraison_prevue, cmd.statut);
              const resteAPayer = calculSolde(cmd.prix_total, cmd.acompte);

              return (
                <Card
                  key={cmd.id}
                  className={`relative space-y-4 transition-all p-5 rounded-3xl animate-slide-up ${
                    isOverdue ? 'border-2 border-accent bg-accent/5 shadow-md' : 'border border-sable/60 bg-white shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="min-w-0 flex-1 space-y-1">
                        <Link
                          href={`/clients/${cmd.client_id}`}
                          className="font-display font-bold text-xl sm:text-2xl text-sombre hover:text-accent block truncate"
                        >
                          {cmd.client_nom}
                        </Link>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                            cmd.type_commande === 'couture_complete'
                              ? 'bg-accent/10 text-accent border-accent/20'
                              : 'bg-sable/30 text-sombre border-sable/50'
                          }`}>
                            {cmd.type_commande === 'couture_complete' ? 'Couture complète' : 'Retouche'}
                          </span>
                          {cmd.responsable && (
                            <span className="text-xs text-sombre/70 flex items-center gap-1 font-bold">
                              <User className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span className="truncate">{cmd.responsable}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1 rounded-xl ${
                        isOverdue ? 'bg-accent text-white animate-pulse' : 'bg-[#FAFAF8] text-sombre border border-sable/70'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDateFR(cmd.date_livraison_prevue)}</span>
                      </div>
                      {isOverdue && <p className="text-xs font-bold text-accent uppercase mt-1">⚠️ Retard</p>}
                    </div>
                  </div>

                  <div className="bg-[#FAFAF8] p-4 rounded-2xl text-sm sm:text-base text-sombre space-y-1 font-sans border border-sable/50">
                    <p className="font-medium break-words leading-relaxed">{cmd.description}</p>
                    {cmd.tissu && (
                      <p className="text-xs sm:text-sm text-sombre/70 font-semibold truncate pt-0.5">
                        <strong className="text-sombre font-bold">Tissu :</strong> {cmd.tissu}
                      </p>
                    )}
                  </div>

                  <StatusStepper
                    currentStatus={cmd.statut}
                    onChangeRequest={(newStatus) => handleStatusChangeRequest(cmd, newStatus)}
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-sable/40">
                    <span className="text-xs sm:text-sm font-bold text-sombre/70 font-sans">
                      Reste à payer : <span className="text-vertbouton font-extrabold text-sm sm:text-base">{formatFCFA(resteAPayer)}</span>
                    </span>
                    <Link
                      href={`/commandes/${cmd.id}`}
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-accent hover:underline bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20 hover:bg-accent hover:text-white transition-all"
                    >
                      <span>Détails & règlement</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

        )}

        {/* Future Financial Statistics Section (Option Premium à venir) */}
        <Card className="p-6 bg-gradient-to-br from-sombre via-fonce to-sombre text-white rounded-3xl border border-gold/30 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-gold" />
              <h3 className="font-display font-bold text-lg text-white">Statistiques & Suivi Financier</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-gold/20 text-gold px-3 py-1 rounded-full border border-gold/40">
              <Lock className="w-3 h-3" /> Option Premium à venir
            </span>
          </div>

          <p className="text-xs sm:text-sm text-white/80 font-medium leading-relaxed">
            Prochainement : Suivez l'historique financier de votre atelier, vos revenus hebdomadaires et mensuels, ainsi que l'évolution de vos encaissements.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 opacity-60 pointer-events-none">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-white/70 block">Chiffre cette semaine</span>
              <span className="text-base font-bold text-gold">450 000 FCFA</span>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-white/70 block">Commandes livrées/mois</span>
              <span className="text-base font-bold text-emerald-400">28 tenues</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/10 p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-white/70 block">Panier moyen atelier</span>
              <span className="text-base font-bold text-white">35 000 FCFA</span>
            </div>
          </div>
        </Card>
      </main>

      {/* Floating CTA Button (Mobile only, hidden on PC/desktop) */}
      <div className="fixed bottom-20 right-4 md:hidden z-30">
        <Link href="/commandes/nouvelle">
          <Button
            variant="accent"
            size="lg"
            className="rounded-full shadow-xl shadow-accent/40 gap-2 px-5 py-3.5 text-xs font-extrabold bg-accent text-white hover:bg-fonce active:scale-95 border-2 border-white"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle commande</span>
          </Button>
        </Link>
      </div>

      {/* Confirmation Modal */}
      {pendingChange && (
        <ConfirmStatusModal
          commande={pendingChange.cmd}
          newStatus={pendingChange.newStatus}
          onConfirm={handleConfirmStatusChange}
          onCancel={() => setPendingChange(null)}
        />
      )}
    </div>
  );
}
