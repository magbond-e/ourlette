'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Phone, Ruler, Scissors, ChevronRight, MessageCircle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Client, Commande, Mesure, StatutCommande } from '@/lib/types/database';
import { formatFCFA, formatDateFR, calculSolde, isCommandeEnRetard, generateWhatsAppContactLink } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';

function MiniStatusBadge({ statut, label }: { statut: StatutCommande; label: string }) {
  const colorMap: Record<StatutCommande, string> = {
    recue: 'bg-sable/30 text-sombre border-sable/60',
    en_cours: 'bg-accent/15 text-accent border-accent/30',
    essayage: 'bg-amber-500/15 text-amber-900 border-amber-500/30',
    prete: 'bg-vertbouton/15 text-vertbouton border-vertbouton/30',
    livree: 'bg-sombre/10 text-sombre border-sombre/20',
  };
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border ${colorMap[statut] ?? 'bg-sable/30 text-sombre'}`}>
      {label}
    </span>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [mesure, setMesure] = useState<Mesure | null>(null);
  const [loading, setLoading] = useState(true);

  const getStatusLabel = (statut: StatutCommande): string => {
    switch (statut) {
      case 'recue': return dict.commandes.statusReceived;
      case 'en_cours': return dict.commandes.statusInProgress;
      case 'essayage': return dict.commandes.statusFitting;
      case 'prete': return dict.commandes.statusReady;
      case 'livree': return dict.commandes.statusDelivered;
      default: return statut;
    }
  };

  const loadData = useCallback(async () => {
    if (authLoading) return;
    if (!user?.id || !clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [c, allCmds, m] = await Promise.all([
      DataService.getClientById(user.id, clientId),
      DataService.getCommandes(user.id),
      DataService.getMesureByClientId(user.id, clientId),
    ]);

    if (c) {
      setClient(c);
      setCommandes(allCmds.filter((cmd) => cmd.client_id === clientId));
      if (m) setMesure(m);
    }
    setLoading(false);
  }, [user?.id, clientId, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [loadData, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-clair pb-24 font-sans">
        <main className="max-w-4xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label={dict.common.loading} size="lg" />
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-clair pb-24 font-sans">
        <main className="max-w-4xl mx-auto px-4 pt-12 text-center space-y-4">
          <p className="text-base font-bold text-sombre/70">{dict.clients.emptyTitle}</p>
          <Link href="/clients">
            <Button variant="accent">{dict.clients.title}</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clair pb-24 font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sombre/70 hover:text-accent bg-white px-3.5 py-1.5 rounded-full border border-sable/70 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{dict.clients.title}</span>
          </Link>
          <Link href={`/clients/${client.id}/mesures`}>
            <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm font-bold rounded-2xl">
              <Ruler className="w-4 h-4 text-accent" />
              <span>{mesure ? (isEn ? 'Edit measurements' : 'Modifier mesures') : (isEn ? '+ Take measurements' : '+ Prendre mesures')}</span>
            </Button>
          </Link>
        </div>

        {/* Client Profile Header */}
        <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-sombre text-gold font-display font-black text-xl flex items-center justify-center shrink-0 border border-gold/30 shadow-xs">
                {client.nom ? client.nom.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-accent block">
                  {isEn ? 'Client Profile' : 'Fiche Client'}
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-sombre leading-tight truncate">
                  {client.nom}
                </h2>
                <span className="text-[11px] text-sombre/60 block font-semibold mt-0.5">
                  {isEn ? 'Registered on' : 'Inscrit le'} {formatDateFR(client.date_creation, locale)}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons on Mobile */}
            <div className="flex items-center flex-wrap gap-2 pt-1 sm:pt-0">
              {client.telephone && (
                <>
                  <a
                    href={`tel:${client.telephone}`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-sombre bg-[#F7F7F5] hover:bg-white border border-sable/70 transition-all min-h-[40px] shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>{isEn ? 'Call' : 'Appeler'}</span>
                  </a>

                  <a
                    href={generateWhatsAppContactLink(client.telephone, '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/70 transition-all min-h-[40px] shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                </>
              )}

              <Link
                href={`/commandes/nouvelle?clientId=${client.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white bg-accent hover:bg-accent/90 transition-all min-h-[40px] shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? 'New Order' : 'Nouvelle Commande'}</span>
              </Link>
            </div>
          </div>

          {client.notes && (
            <div className="p-3.5 bg-[#FAFAF8] rounded-2xl text-xs sm:text-sm text-sombre/80 border border-sable/50 font-medium">
              <strong className="text-sombre font-bold">{dict.clients.notesLabel} :</strong> {client.notes}
            </div>
          )}
        </Card>

        {/* Measurements Snapshot */}
        <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sable/40 pb-3">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
              <Ruler className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span>{dict.mesures.title}</span>
            </h3>
            {mesure && (
              <span className="text-[11px] sm:text-xs text-sombre/60 font-semibold">
                {dict.mesures.lastUpdated} : {formatDateFR(mesure.date_maj, locale)} {mesure.prise_par ? `• ${mesure.prise_par}` : ''}
              </span>
            )}
          </div>

          {mesure ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs sm:text-sm">
              {[
                { label: dict.mesures.chest, val: mesure.tour_poitrine },
                { label: dict.mesures.waist, val: mesure.tour_taille },
                { label: dict.mesures.hips, val: mesure.tour_hanches },
                { label: dict.mesures.sleeveLength, val: mesure.longueur_manche },
                { label: dict.mesures.dressLength, val: mesure.longueur_robe },
                { label: dict.mesures.neck, val: mesure.tour_cou },
                { label: dict.mesures.shoulders, val: mesure.largeur_epaules },
              ].map(
                (item) =>
                  item.val != null && (
                    <div key={item.label} className="p-2.5 sm:p-3 bg-[#FAFAF8] rounded-2xl flex justify-between items-center border border-sable/50">
                      <span className="text-sombre/70 font-semibold text-[11px] sm:text-xs">{item.label} :</span>
                      <strong className="font-bold text-sombre text-xs sm:text-sm ml-1">{item.val} cm</strong>
                    </div>
                  )
              )}

              {mesure.champs_personnalises &&
                Object.entries(mesure.champs_personnalises).map(([k, v]) => (
                  <div key={k} className="p-2.5 sm:p-3 bg-accent/10 rounded-2xl flex justify-between items-center border border-accent/20 col-span-2 sm:col-span-3">
                    <span className="text-accent font-semibold text-xs">{k} :</span>
                    <strong className="font-bold text-accent text-xs sm:text-sm">{v} cm</strong>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs sm:text-sm text-sombre/60 space-y-3">
              <p className="font-medium">{isEn ? 'No measurements recorded for this client.' : 'Aucune mesure enregistrée pour ce client.'}</p>
              <Link href={`/clients/${client.id}/mesures`}>
                <Button variant="accent" size="sm" className="rounded-full">
                  + {isEn ? 'Enter measurements' : 'Saisir les mesures'}
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Order History */}
        <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
          <div className="border-b border-sable/40 pb-3 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
              <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span>{isEn ? `Order History (${commandes.length})` : `Historique des Commandes (${commandes.length})`}</span>
            </h3>
            <Link href={`/commandes/nouvelle?clientId=${client.id}`}>
              <span className="text-xs font-bold text-accent hover:underline">+ {dict.commandes.newOrderButton}</span>
            </Link>
          </div>

          {commandes.length === 0 ? (
            <p className="text-xs sm:text-sm text-sombre/60 text-center py-6 font-medium">
              {isEn ? 'No orders recorded for this client yet.' : 'Aucune commande enregistrée pour ce client.'}
            </p>
          ) : (
            <div className="space-y-3">
              {commandes.map((cmd) => {
                const resteDu = calculSolde(cmd.prix_total, cmd.acompte);
                const isOverdue = isCommandeEnRetard(cmd.date_livraison_prevue, cmd.statut);
                return (
                  <div key={cmd.id} className="p-4 bg-[#FAFAF8] rounded-2xl space-y-3 text-xs sm:text-sm border border-sable/60 hover:border-accent/40 transition-colors">
                    {/* Header: Title + Status + Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-sm sm:text-base text-sombre">{cmd.description}</span>
                          <MiniStatusBadge statut={cmd.statut} label={getStatusLabel(cmd.statut)} />
                        </div>
                        {cmd.tissu && (
                          <p className="text-[11px] sm:text-xs text-sombre/70 font-medium mt-0.5">
                            <strong className="text-sombre font-bold">{dict.commandes.fabric} :</strong> {cmd.tissu}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[10px] sm:text-xs font-bold text-sombre/60 block">{dict.commandes.promisedFor}</span>
                        <span className={`text-[11px] sm:text-xs font-bold ${isOverdue ? 'text-accent' : 'text-sombre'}`}>
                          {formatDateFR(cmd.date_livraison_prevue, locale)}
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary & Action */}
                    <div className="pt-2 border-t border-sable/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="grid grid-cols-2 gap-2 text-xs w-full sm:w-auto">
                        <div className="p-2 bg-white rounded-xl border border-sable/40">
                          <span className="text-[10px] text-sombre/60 block font-semibold">{dict.commandes.totalPrice}</span>
                          <strong className="text-xs sm:text-sm font-bold text-sombre">{formatFCFA(cmd.prix_total)}</strong>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-sable/40">
                          <span className="text-[10px] text-sombre/60 block font-semibold">{dict.commandes.balanceRemaining}</span>
                          <strong className={`text-xs sm:text-sm font-extrabold ${resteDu > 0 ? 'text-accent' : 'text-vertbouton'}`}>
                            {resteDu > 0 ? formatFCFA(resteDu) : (isEn ? 'Paid ✓' : 'Soldé ✓')}
                          </strong>
                        </div>
                      </div>

                      <Link
                        href={`/commandes/${cmd.id}`}
                        className="inline-flex items-center justify-center gap-1 text-xs font-bold text-accent hover:text-white bg-accent/10 hover:bg-accent px-3.5 py-2 rounded-xl border border-accent/20 transition-all min-h-[38px] w-full sm:w-auto"
                      >
                        <span>{dict.commandes.viewDetails}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
