'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Phone, Ruler, Calendar, Scissors, ChevronRight, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { MockStorageService } from '@/lib/services/mockStorage';
import { Client, Commande, Mesure, StatutCommande } from '@/lib/types/database';
import { formatFCFA, formatDateFR, calculSolde, isCommandeEnRetard } from '@/lib/utils/formatters';

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
    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border ${colorMap[statut] ?? 'bg-sable/30 text-sombre'}`}>
      {info?.label ?? statut}
    </span>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [mesure, setMesure] = useState<Mesure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = MockStorageService.getClientById(clientId);
    if (c) {
      setClient(c);
      const cmds = MockStorageService.getCommandes().filter((cmd) => cmd.client_id === clientId);
      setCommandes(cmds);
      const m = MockStorageService.getMesureByClientId(clientId);
      if (m) setMesure(m);
    }
    setLoading(false);
  }, [clientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-24 font-sans">
        <main className="max-w-4xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label="Chargement de la fiche client…" size="lg" />
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-24 font-sans">
        <main className="max-w-4xl mx-auto px-4 pt-12 text-center space-y-4">
          <p className="text-base font-bold text-sombre/70">Client non trouvé.</p>
          <Link href="/clients">
            <Button variant="accent">Retour aux clients</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 font-sans">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sombre/70 hover:text-accent bg-white px-3.5 py-1.5 rounded-full border border-sable/70 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tous les clients</span>
          </Link>
          <Link href={`/clients/${client.id}/mesures`}>
            <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm font-bold rounded-2xl">
              <Ruler className="w-4 h-4 text-accent" />
              <span>{mesure ? 'Modifier mesures' : '+ Prendre mesures'}</span>
            </Button>
          </Link>
        </div>

        {/* Client Profile Header */}
        <Card className="p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-accent block">
                Fiche Client
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre leading-tight">{client.nom}</h2>
              {client.telephone && (
                <a
                  href={`tel:${client.telephone}`}
                  className="text-sm sm:text-base font-bold text-accent hover:underline inline-flex items-center gap-2 pt-1"
                >
                  <Phone className="w-4 h-4" />
                  <span>{client.telephone}</span>
                </a>
              )}
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs text-sombre/60 block font-semibold">Inscrit le</span>
              <span className="text-xs sm:text-sm font-bold text-sombre">{formatDateFR(client.date_creation)}</span>
            </div>
          </div>

          {client.notes && (
            <div className="p-3.5 bg-[#FAFAF8] rounded-2xl text-xs sm:text-sm text-sombre/80 border border-sable/50 font-medium">
              <strong className="text-sombre font-bold">Notes / Préférences :</strong> {client.notes}
            </div>
          )}
        </Card>

        {/* Measurements Snapshot */}
        <Card className="p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sable/40 pb-3">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
              <Ruler className="w-5 h-5 text-accent" />
              <span>Fiche Mesures</span>
            </h3>
            {mesure && (
              <span className="text-xs text-sombre/60 font-semibold">
                Mis à jour le {formatDateFR(mesure.date_maj)} {mesure.prise_par ? `par ${mesure.prise_par}` : ''}
              </span>
            )}
          </div>

          {mesure ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              {[
                { label: 'Poitrine', val: mesure.tour_poitrine },
                { label: 'Taille', val: mesure.tour_taille },
                { label: 'Hanches', val: mesure.tour_hanches },
                { label: 'Manche', val: mesure.longueur_manche },
                { label: 'Longueur Robe/Boubou', val: mesure.longueur_robe },
                { label: 'Cou', val: mesure.tour_cou },
                { label: 'Épaules', val: mesure.largeur_epaules },
              ].map(
                (item) =>
                  item.val != null && (
                    <div key={item.label} className="p-3 bg-[#FAFAF8] rounded-2xl flex justify-between items-center border border-sable/50">
                      <span className="text-sombre/70 font-semibold">{item.label} :</span>
                      <strong className="font-bold text-sombre">{item.val} cm</strong>
                    </div>
                  )
              )}

              {mesure.champs_personnalises &&
                Object.entries(mesure.champs_personnalises).map(([k, v]) => (
                  <div key={k} className="p-3 bg-accent/10 rounded-2xl flex justify-between items-center border border-accent/20 col-span-2 sm:col-span-3">
                    <span className="text-accent font-semibold">{k} :</span>
                    <strong className="font-bold text-accent">{v} cm</strong>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs sm:text-sm text-sombre/60 space-y-3">
              <p className="font-medium">Aucune mesure enregistrée pour ce client.</p>
              <Link href={`/clients/${client.id}/mesures`}>
                <Button variant="accent" size="sm" className="rounded-full">
                  + Saisir les mesures
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Order History (Polished & Structured Card Layout) */}
        <Card className="p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
          <div className="border-b border-sable/40 pb-3 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
              <Scissors className="w-5 h-5 text-accent" />
              <span>Historique des Commandes ({commandes.length})</span>
            </h3>
            <Link href="/commandes/nouvelle">
              <span className="text-xs font-bold text-accent hover:underline">+ Nouvelle</span>
            </Link>
          </div>

          {commandes.length === 0 ? (
            <p className="text-xs sm:text-sm text-sombre/60 text-center py-6 font-medium">Aucune commande enregistrée pour ce client.</p>
          ) : (
            <div className="space-y-3">
              {commandes.map((cmd) => {
                const resteDû = calculSolde(cmd.prix_total, cmd.acompte);
                const isOverdue = isCommandeEnRetard(cmd.date_livraison_prevue, cmd.statut);
                return (
                  <div key={cmd.id} className="p-4 bg-[#FAFAF8] rounded-2xl space-y-3 text-xs sm:text-sm border border-sable/60 hover:border-accent/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-base text-sombre">{cmd.description}</span>
                          <MiniStatusBadge statut={cmd.statut} />
                        </div>
                        {cmd.tissu && (
                          <p className="text-xs text-sombre/70 font-medium mt-0.5">
                            <strong className="text-sombre font-bold">Tissu :</strong> {cmd.tissu}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs font-bold text-sombre/60 block">Livr. prévue</span>
                        <span className={`text-xs font-bold ${isOverdue ? 'text-accent' : 'text-sombre'}`}>
                          {formatDateFR(cmd.date_livraison_prevue)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-sable/40 text-xs">
                      <div>
                        <span className="text-sombre/60 font-semibold">Prix : </span>
                        <strong className="text-sombre font-bold">{formatFCFA(cmd.prix_total)}</strong>
                        <span className="mx-2 text-sable">•</span>
                        <span className="text-sombre/60 font-semibold">Reste dû : </span>
                        <strong className={`font-extrabold ${resteDû > 0 ? 'text-accent' : 'text-vertbouton'}`}>
                          {resteDû > 0 ? formatFCFA(resteDû) : 'Soldé ✓'}
                        </strong>
                      </div>

                      <Link
                        href={`/commandes/${cmd.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline bg-accent/10 px-3 py-1 rounded-full border border-accent/20"
                      >
                        <span>Détails</span>
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
