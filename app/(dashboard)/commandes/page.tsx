'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, AlertTriangle, Search, Calendar, User, Scissors, ChevronRight, X, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataService } from '@/lib/services/dataService';
import { useCommandes } from '@/lib/powersync/hooks';
import { Commande, StatutCommande } from '@/lib/types/database';
import { formatFCFA, formatDateFR, isCommandeEnRetard, calculSolde } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';
import { useLanguage } from '@/lib/i18n';

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
    <span className={`inline-flex items-center text-xs sm:text-sm font-bold px-3 py-1 rounded-full border ${colorMap[statut] ?? 'bg-sable/30 text-sombre border-sable'}`}>
      {label}
    </span>
  );
}

function StatusStepper({
  currentStatus,
  onChangeRequest,
  statuts,
}: {
  currentStatus: StatutCommande;
  onChangeRequest: (newStatus: StatutCommande) => void;
  statuts: { id: StatutCommande; label: string }[];
}) {
  const currentIdx = statuts.findIndex(s => s.id === currentStatus);

  return (
    <div className="w-full py-2">
      <div className="relative flex items-center justify-between">
        <div aria-hidden="true" className="absolute left-4 right-4 top-4 -z-0 border-b-2 border-dashed border-sable/70" />
        {statuts.map((step, idx) => {
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
              title={`${step.label}`}
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
  statuts,
  onConfirm,
  onCancel,
}: {
  commande: Commande;
  newStatus: StatutCommande;
  statuts: { id: StatutCommande; label: string }[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';
  const newInfo = statuts.find(s => s.id === newStatus);
  const currentInfo = statuts.find(s => s.id === commande.statut);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-sombre/60 backdrop-blur-xs px-4 pb-6 sm:pb-0">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-fade-in-up border border-sable">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sombre/50">{dict.commandes.statusChangeTitle}</p>
            <h3 className="text-xl font-display font-bold text-sombre mt-0.5 truncate">{commande.client_nom}</h3>
          </div>
          <button onClick={onCancel} className="text-sombre/40 hover:text-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-[#FAFAF8] rounded-2xl p-4 border border-sable/50">
          <div className="text-center flex-1">
            <p className="text-xs text-sombre/50 font-bold uppercase mb-1">{isEn ? 'Current' : 'Actuel'}</p>
            <MiniStatusBadge statut={commande.statut} label={currentInfo?.label || commande.statut} />
          </div>
          <div className="text-accent font-bold text-lg">→</div>
          <div className="text-center flex-1">
            <p className="text-xs text-sombre/50 font-bold uppercase mb-1">{isEn ? 'New' : 'Nouveau'}</p>
            <MiniStatusBadge statut={newStatus} label={newInfo?.label || newStatus} />
          </div>
        </div>

        <p className="text-sm text-sombre/80 font-medium leading-relaxed">
          {dict.commandes.statusChangeDesc} (<strong>{currentInfo?.label}</strong> → <strong>{newInfo?.label}</strong>)
        </p>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" fullWidth onClick={onCancel}>
            {dict.common.cancel}
          </Button>
          <Button type="button" variant="accent" size="md" fullWidth onClick={onConfirm} className="gap-2">
            <Check className="w-4 h-4" />
            {dict.commandes.confirmStatusChange}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CommandesPage() {
  const { user, couturier } = useAuth();
  const { createNotification } = useNotifications();
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

  const [filterStatut, setFilterStatut] = useState<string>('toutes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingChange, setPendingChange] = useState<{ cmd: Commande; newStatus: StatutCommande } | null>(null);

  const handleStatusChangeRequest = (cmd: Commande, newStatus: StatutCommande) => {
    if (newStatus === cmd.statut) return;
    setPendingChange({ cmd, newStatus });
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingChange || !user?.id) return;
    const { cmd, newStatus } = pendingChange;
    const statusLabel = statutsOrder.find((s) => s.id === newStatus)?.label || newStatus;

    await DataService.updateCommande(user.id, cmd.id, { statut: newStatus });

    if (newStatus === 'livree') {
      await DataService.syncOrderAlerts(user.id, couturier);
    }

    if (newStatus === 'prete' || newStatus === 'livree') {
      await createNotification({
        type: 'order_status',
        category: 'order',
        priority: 'high',
        title: newStatus === 'livree' ? (isEn ? '🎉 Order Delivered' : '🎉 Commande livrée') : (isEn ? '✨ Order Ready' : '✨ Commande prête'),
        message: isEn
          ? `Order for ${cmd.client_nom || 'client'} ("${cmd.description}") is now marked as "${statusLabel}".`
          : `La commande pour ${cmd.client_nom || 'le client'} ("${cmd.description}") est désormais marquée "${statusLabel}".`,
        link: `/commandes/${cmd.id}`,
        orderId: cmd.id,
        metadata: { orderId: cmd.id, oldStatus: cmd.statut, newStatus },
      });
    }

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
    { id: 'toutes', label: dict.commandes.tabAll, count: commandes.length },
    ...(overdueCount > 0 ? [{ id: 'retard', label: isEn ? 'Overdue' : 'En retard', count: overdueCount }] : []),
    ...statutsOrder.map(s => ({
      id: s.id,
      label: s.label,
      count: commandes.filter(c => c.statut === s.id).length,
    })),
  ];

  return (
    <div className="min-h-screen bg-clair pb-24 font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 space-y-4">
        {/* Sticky Pinned Header: Stats + Search + Filters */}
        <div className="sticky top-[64px] z-20 bg-clair/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 space-y-3 border-b border-sable/40 shadow-xs">
          {/* Summary Stats Cards with Fixed Dimensions for Multilingual Stability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="bg-white p-4 border border-sable/70 shadow-xs rounded-2xl min-h-[86px] sm:min-h-[92px] flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-sombre/70 uppercase tracking-wider truncate">
                  {dict.commandes.statsActive}
                </span>
                {overdueCount > 0 && (
                  <button
                    onClick={() => setFilterStatut('retard')}
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-accent text-white px-2.5 py-0.5 rounded-full shadow-xs hover:bg-fonce transition-colors shrink-0"
                    title={dict.commandes.overdueNotice}
                  >
                    <AlertTriangle className="w-3 h-3 text-gold shrink-0" />
                    <span>{overdueCount} {isEn ? 'overdue' : 'retard'}</span>
                  </button>
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl sm:text-3xl font-display font-bold text-sombre leading-none">
                  {totalActives}
                </span>
                <span className="text-[11px] font-semibold text-sombre/50">
                  {commandes.length} {isEn ? 'total' : 'au total'}
                </span>
              </div>
            </Card>

            <Card className="bg-white p-4 border border-sable/70 shadow-xs rounded-2xl min-h-[86px] sm:min-h-[92px] flex flex-col justify-between transition-all">
              <span className="text-xs font-bold text-sombre/70 uppercase tracking-wider truncate">
                {dict.commandes.balanceRemaining}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span
                  className="text-xl sm:text-2xl font-display font-bold text-vertbouton leading-none truncate"
                  title={formatFCFA(montantTotalAEncaisser)}
                >
                  {formatFCFA(montantTotalAEncaisser)}
                </span>
                <span className="text-[11px] font-bold text-sombre/50 uppercase">FCFA</span>
              </div>
            </Card>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-sombre/40" />
            <input
              type="text"
              placeholder={dict.commandes.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-white border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-sans shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-sombre/40 hover:text-accent p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
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
                        ? 'bg-accent text-white border-accent shadow-xs'
                        : 'bg-sombre text-white border-sombre shadow-xs'
                      : isRetard
                      ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20'
                      : 'bg-white text-sombre/70 border-sable/80 hover:border-accent hover:text-sombre'
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

        {/* Orders Grid (Scrollable) */}
        {filteredCommandes.length === 0 ? (
          <Card className="py-14 text-center space-y-3 bg-white/80 border-dashed border-2 border-sable/80 rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-clair text-accent flex items-center justify-center mx-auto">
              <Scissors className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-display font-bold text-sombre">{dict.commandes.emptyTitle}</h3>
              <p className="text-xs sm:text-sm text-sombre/70 font-medium font-sans">
                {searchQuery || filterStatut !== 'toutes'
                  ? (isEn ? 'Try adjusting your search query or status filter.' : 'Essayez de modifier votre recherche ou vos filtres.')
                  : dict.commandes.emptyDesc}
              </p>
            </div>
            {filterStatut !== 'toutes' || searchQuery ? (
              <button
                onClick={() => { setFilterStatut('toutes'); setSearchQuery(''); }}
                className="inline-block pt-2 text-xs sm:text-sm font-bold text-accent underline hover:no-underline"
              >
                {isEn ? 'Reset filters' : 'Réinitialiser les filtres'}
              </button>
            ) : (
              <Link href="/commandes/nouvelle" className="inline-block pt-2">
                <Button variant="accent" size="md">{dict.commandes.createFirstOrder}</Button>
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
                  className={`relative space-y-4 transition-all p-5 rounded-2xl animate-slide-up min-h-[280px] flex flex-col justify-between ${
                    isOverdue ? 'border-2 border-accent bg-accent/5 shadow-md' : 'border border-sable/70 bg-white shadow-xs'
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
                          <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${cmd.type_commande === 'couture_complete'
                            ? 'bg-accent/10 text-accent border-accent/20'
                            : 'bg-sable/30 text-sombre border-sable/50'
                            }`}>
                            {cmd.type_commande === 'couture_complete'
                              ? (isEn ? 'Bespoke tailoring' : 'Couture complète')
                              : (isEn ? 'Alteration' : 'Retouche')}
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
                      <div className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1 rounded-xl ${isOverdue ? 'bg-accent text-white animate-pulse' : 'bg-[#FAFAF8] text-sombre border border-sable/70'
                        }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDateFR(cmd.date_livraison_prevue, locale)}</span>
                      </div>
                      {isOverdue && <p className="text-xs font-bold text-accent uppercase mt-1">⚠️ {dict.commandes.overdueNotice}</p>}
                    </div>
                  </div>

                  <div className="bg-[#FAFAF8] p-4 rounded-2xl text-sm sm:text-base text-sombre space-y-1 font-sans border border-sable/50">
                    <p className="font-medium break-words leading-relaxed">{cmd.description}</p>
                    {cmd.tissu && (
                      <p className="text-xs sm:text-sm text-sombre/70 font-semibold truncate pt-0.5">
                        <strong className="text-sombre font-bold">{dict.commandes.fabric} :</strong> {cmd.tissu}
                      </p>
                    )}
                  </div>

                  <StatusStepper
                    currentStatus={cmd.statut}
                    statuts={statutsOrder}
                    onChangeRequest={(newStatus) => handleStatusChangeRequest(cmd, newStatus)}
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-sable/40">
                    <span className="text-xs sm:text-sm font-bold text-sombre/70 font-sans">
                      {dict.commandes.balanceRemaining} : <span className="text-vertbouton font-extrabold text-sm sm:text-base">{formatFCFA(resteAPayer)}</span>
                    </span>
                    <Link
                      href={`/commandes/${cmd.id}`}
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-accent hover:underline bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20 hover:bg-accent hover:text-white transition-all"
                    >
                      <span>{dict.commandes.viewDetails}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Floating CTA Button (Mobile only) */}
        <div className="fixed bottom-20 right-4 md:hidden z-30">
          <Link href="/commandes/nouvelle">
            <Button
              variant="accent"
              size="lg"
              className="rounded-full shadow-xl shadow-accent/40 gap-2 px-5 py-3.5 text-xs font-extrabold bg-accent text-white hover:bg-fonce active:scale-95 border-2 border-white"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Confirmation Modal */}
        {pendingChange && (
          <ConfirmStatusModal
            commande={pendingChange.cmd}
            newStatus={pendingChange.newStatus}
            statuts={statutsOrder}
            onConfirm={handleConfirmStatusChange}
            onCancel={() => setPendingChange(null)}
          />
        )}
      </main>
    </div>
  );
}
