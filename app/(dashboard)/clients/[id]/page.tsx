'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Ruler,
  Scissors,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Client, Commande, Mesure, StatutCommande } from '@/lib/types/database';
import {
  formatFCFA,
  formatDateFR,
  calculSolde,
  isCommandeEnRetard,
  generateWhatsAppContactLink,
} from '@/lib/utils/formatters';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';

const WhatsAppIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.419h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.445 4.43-9.874 9.876-9.874 2.637 0 5.116 1.028 6.98 2.893A9.816 9.816 0 0121.85 12.01c0 5.446-4.431 9.876-9.799 9.876m0-18.067c-6.647 0-12.04 5.394-12.04 12.04 0 2.12.553 4.188 1.605 6.012l-1.706 6.23 6.376-1.672a11.98 11.98 0 005.76 1.472h.005c6.645 0 12.038-5.393 12.038-12.041 0-3.218-1.254-6.242-3.533-8.521a11.942 11.942 0 00-8.505-3.52" />
  </svg>
);

function MiniStatusBadge({ statut, label }: { statut: StatutCommande; label: string }) {
  const colorMap: Record<StatutCommande, string> = {
    recue: 'bg-sable/30 text-sombre border-sable/60',
    en_cours: 'bg-accent/15 text-accent border-accent/30',
    essayage: 'bg-amber-500/15 text-amber-900 border-amber-500/30',
    prete: 'bg-vertbouton/15 text-vertbouton border-vertbouton/30',
    livree: 'bg-sombre/10 text-sombre border-sombre/20',
  };
  return (
    <span
      className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
        colorMap[statut] ?? 'bg-sable/30 text-sombre border-sable/60'
      }`}
    >
      {label}
    </span>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [mesure, setMesure] = useState<Mesure | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Client Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNom, setEditNom] = useState('');
  const [editTelephone, setEditTelephone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Client State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Menu Dropdown
  const [showMenu, setShowMenu] = useState(false);

  const getStatusLabel = (statut: StatutCommande): string => {
    switch (statut) {
      case 'recue':
        return dict.commandes.statusReceived;
      case 'en_cours':
        return dict.commandes.statusInProgress;
      case 'essayage':
        return dict.commandes.statusFitting;
      case 'prete':
        return dict.commandes.statusReady;
      case 'livree':
        return dict.commandes.statusDelivered;
      default:
        return statut;
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
      setEditNom(c.nom || '');
      setEditTelephone(c.telephone || '');
      setEditNotes(c.notes || '');

      // Commandes triées par date décroissante
      const clientCmds = allCmds
        .filter((cmd) => cmd.client_id === clientId)
        .sort((a, b) => new Date(b.date_commande || b.date_livraison_prevue).getTime() - new Date(a.date_commande || a.date_livraison_prevue).getTime());

      setCommandes(clientCmds);
      if (m) setMesure(m);
    }
    setLoading(false);
  }, [user?.id, clientId, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [loadData, authLoading]);

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !client?.id || !editNom.trim()) return;
    setSavingEdit(true);

    const updated = await DataService.updateClient(user.id, client.id, {
      nom: editNom.trim(),
      telephone: editTelephone.trim(),
      notes: editNotes.trim(),
    });

    if (updated) {
      setClient(updated);
      setShowEditModal(false);
    }
    setSavingEdit(false);
  };

  const handleDeleteClient = async () => {
    if (!user?.id || !client?.id) return;
    setDeleting(true);

    const success = await DataService.deleteClient(user.id, client.id);
    if (success) {
      router.push('/clients');
    } else {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-24 font-sans">
        <main className="max-w-2xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label={dict.common.loading} size="lg" />
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-24 font-sans">
        <main className="max-w-2xl mx-auto px-4 pt-12 text-center space-y-4">
          <p className="text-base font-bold text-sombre/70">{dict.clients.emptyTitle}</p>
          <Link href="/clients">
            <Button variant="accent">{dict.clients.title}</Button>
          </Link>
        </main>
      </div>
    );
  }

  // Active orders and total balance due
  const activeOrders = commandes.filter((c) => c.statut !== 'livree');
  const activeCount = activeOrders.length;
  const totalSoldeDu = activeOrders.reduce(
    (acc, c) => acc + calculSolde(c.prix_total, c.acompte),
    0
  );

  // Populated measurements
  const standardMesuresList = mesure
    ? [
        { label: dict.mesures.chest, val: mesure.tour_poitrine },
        { label: dict.mesures.waist, val: mesure.tour_taille },
        { label: dict.mesures.hips, val: mesure.tour_hanches },
        { label: dict.mesures.shoulders, val: mesure.largeur_epaules },
        { label: dict.mesures.sleeveLength, val: mesure.longueur_manche },
        { label: dict.mesures.dressLength, val: mesure.longueur_robe },
        { label: dict.mesures.neck, val: mesure.tour_cou },
      ].filter((item) => item.val != null && !isNaN(Number(item.val)))
    : [];

  const customMesuresList =
    mesure?.champs_personnalises && typeof mesure.champs_personnalises === 'object'
      ? Object.entries(mesure.champs_personnalises).filter(
          ([, v]) => v != null && v !== ''
        )
      : [];

  const hasAnyMeasurements = standardMesuresList.length > 0 || customMesuresList.length > 0;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-5">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sombre/70 hover:text-accent bg-white px-3 py-1.5 rounded-full border border-sable/70 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{dict.clients.title}</span>
          </Link>

          {/* Menu d'actions (3 points) */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full bg-white hover:bg-[#F7F7F5] border border-sable/70 text-sombre transition-colors cursor-pointer shadow-2xs"
              aria-label="Options"
            >
              <MoreVertical className="w-4 h-4 text-sombre/70" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-sable/70 p-1.5 z-30 animate-fade-in-up">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowEditModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-sombre hover:bg-accent/10 hover:text-accent rounded-xl transition-colors cursor-pointer text-left"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Edit Client' : 'Modifier le client'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-accent hover:bg-accent/10 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Delete Client' : 'Supprimer le client'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 1. EN-TÊTE : Nom · Téléphone · 3 Boutons ─────────────────── */}
        <Card className="p-5 space-y-4 bg-white border-sable/70 rounded-3xl shadow-xs">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-sombre leading-tight">
              {client.nom}
            </h1>
            {client.telephone ? (
              <p className="text-xs sm:text-sm text-sombre/70 font-semibold mt-1">
                {client.telephone}
              </p>
            ) : (
              <p className="text-xs text-sombre/40 italic mt-1">
                {isEn ? 'No phone number' : 'Aucun numéro de téléphone'}
              </p>
            )}
          </div>

          {/* Trois boutons d'action : Appeler · WhatsApp · Modifier */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {client.telephone ? (
              <a
                href={`tel:${client.telephone}`}
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold text-sombre bg-[#FAF9F6] hover:bg-[#F2EFE9] border border-sable/70 transition-all min-h-[44px]"
              >
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <span>{isEn ? 'Call' : 'Appeler'}</span>
              </a>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold text-sombre/30 bg-[#FAF9F6] border border-sable/40 min-h-[44px] cursor-not-allowed"
              >
                <Phone className="w-4 h-4 text-sombre/30 shrink-0" />
                <span>{isEn ? 'Call' : 'Appeler'}</span>
              </button>
            )}

            {client.telephone ? (
              <a
                href={generateWhatsAppContactLink(client.telephone, '')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 transition-all min-h-[44px]"
              >
                <WhatsAppIcon className="w-4 h-4 fill-emerald-600 shrink-0" />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold text-sombre/30 bg-[#FAF9F6] border border-sable/40 min-h-[44px] cursor-not-allowed"
              >
                <WhatsAppIcon className="w-4 h-4 fill-sombre/30 shrink-0" />
                <span>WhatsApp</span>
              </button>
            )}

            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold text-sombre bg-[#FAF9F6] hover:bg-[#F2EFE9] border border-sable/70 transition-all min-h-[44px] cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-sombre/60 shrink-0" />
              <span>{isEn ? 'Edit' : 'Modifier'}</span>
            </button>
          </div>
        </Card>

        {/* ── 2. MENSURATIONS (Juste après l'en-tête) ─────────────────────── */}
        <Card className="p-5 space-y-4 bg-white border-sable/70 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between border-b border-sable/40 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-accent shrink-0" />
                <span>{dict.mesures.title}</span>
              </h2>
              {mesure && hasAnyMeasurements && (
                <p className="text-[11px] text-sombre/60 font-semibold mt-0.5">
                  {mesure.prise_par
                    ? isEn
                      ? `Taken by ${mesure.prise_par} on ${formatDateFR(mesure.date_maj, locale)}`
                      : `Prises par ${mesure.prise_par} le ${formatDateFR(mesure.date_maj, locale)}`
                    : isEn
                    ? `Recorded on ${formatDateFR(mesure.date_maj, locale)}`
                    : `Enregistrées le ${formatDateFR(mesure.date_maj, locale)}`}
                </p>
              )}
            </div>

            {hasAnyMeasurements && (
              <Link href={`/clients/${client.id}/mesures`}>
                <button className="text-xs font-bold text-accent hover:underline cursor-pointer">
                  {isEn ? 'Edit measurements' : 'Modifier les mesures'}
                </button>
              </Link>
            )}
          </div>

          {hasAnyMeasurements ? (
            <div className="space-y-3">
              {/* Grille stricte de 2 colonnes */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {standardMesuresList.map((item) => (
                  <div
                    key={item.label}
                    className="p-3 bg-[#FAF9F6] rounded-2xl flex items-center justify-between border border-sable/50"
                  >
                    <span className="text-sombre/70 font-semibold">{item.label}</span>
                    <strong className="font-extrabold text-sombre text-xs">{item.val} cm</strong>
                  </div>
                ))}

                {customMesuresList.map(([k, v]) => (
                  <div
                    key={k}
                    className="p-3 bg-[#FAF9F6] rounded-2xl flex items-center justify-between border border-sable/50 col-span-2"
                  >
                    <span className="text-sombre/70 font-semibold truncate mr-2">{k}</span>
                    <strong className="font-extrabold text-sombre text-xs shrink-0">{String(v)} cm</strong>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <Link href={`/clients/${client.id}/mesures`} className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="rounded-full text-xs font-bold border-sable/80"
                  >
                    {isEn ? 'Edit measurements' : 'Modifier les mesures'}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3">
              <p className="text-xs sm:text-sm text-sombre/60 font-medium">
                {isEn ? 'No measurements recorded.' : 'Aucune mesure enregistrée'}
              </p>
              <Link href={`/clients/${client.id}/mesures`} className="inline-block">
                <Button variant="accent" size="sm" className="rounded-full font-bold px-5">
                  {isEn ? 'Take measurements' : 'Prendre les mesures'}
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* ── 3. COMMANDES : Résumé · Liste · + Nouvelle commande ────────── */}
        <Card className="p-5 space-y-4 bg-white border-sable/70 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between border-b border-sable/40 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-accent shrink-0" />
                <span>{dict.commandes.title}</span>
              </h2>
              {/* Ligne de résumé : « 2 en cours · Solde dû : 15 000 FCFA » */}
              {(activeCount > 0 || totalSoldeDu > 0) && (
                <p className="text-xs font-extrabold text-sombre mt-0.5">
                  <span>
                    {activeCount}{' '}
                    {isEn
                      ? activeCount > 1
                        ? 'active'
                        : 'active'
                      : activeCount > 1
                      ? 'en cours'
                      : 'en cours'}
                  </span>
                  {totalSoldeDu > 0 && (
                    <span className="text-accent ml-1.5">
                      · {dict.commandes.balanceRemaining} : {formatFCFA(totalSoldeDu)}
                    </span>
                  )}
                </p>
              )}
            </div>

            <Link href={`/commandes/nouvelle?clientId=${client.id}`}>
              <Button
                variant="accent"
                size="sm"
                className="rounded-full text-xs font-bold gap-1 px-3.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{dict.commandes.newOrderButton}</span>
              </Button>
            </Link>
          </div>

          {commandes.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-xs sm:text-sm text-sombre/60 font-medium">
                {isEn ? 'No orders for this client' : 'Aucune commande pour ce client'}
              </p>
              <Link href={`/commandes/nouvelle?clientId=${client.id}`} className="inline-block">
                <Button variant="accent" size="sm" className="rounded-full font-bold px-5">
                  {dict.commandes.newOrderButton}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {commandes.map((cmd) => {
                const solde = calculSolde(cmd.prix_total, cmd.acompte);
                const isOverdue = isCommandeEnRetard(cmd.date_livraison_prevue, cmd.statut);

                return (
                  <Link
                    key={cmd.id}
                    href={`/commandes/${cmd.id}`}
                    className={`block p-3.5 rounded-2xl border transition-all hover:border-accent/60 ${
                      isOverdue
                        ? 'bg-accent/5 border-accent/40'
                        : 'bg-[#FAF9F6] border-sable/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="font-bold text-sm text-sombre truncate">
                          {cmd.description}
                        </p>
                        {cmd.tissu && (
                          <p className="text-[11px] text-sombre/60 truncate font-medium">
                            {cmd.tissu}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right space-y-1">
                        <MiniStatusBadge
                          statut={cmd.statut}
                          label={getStatusLabel(cmd.statut)}
                        />
                        <p
                          className={`text-[11px] font-bold ${
                            isOverdue ? 'text-accent' : 'text-sombre/70'
                          }`}
                        >
                          {formatDateFR(cmd.date_livraison_prevue, locale)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-sable/30 text-xs">
                      <span className="text-sombre/60 font-semibold">
                        {formatFCFA(cmd.prix_total)}
                      </span>
                      {solde > 0 ? (
                        <span className="text-accent font-extrabold text-[11px]">
                          {isEn ? 'Due' : 'Solde'} : {formatFCFA(solde)}
                        </span>
                      ) : (
                        <span className="text-vertbouton font-extrabold text-[11px]">
                          {isEn ? 'Paid ✓' : 'Soldé ✓'}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── 4. NOTES : Bloc discret ───────────────────────────────────── */}
        <Card className="p-4 space-y-2 bg-white border-sable/70 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sombre/60">
              {dict.clients.notesLabel}
            </span>
            <button
              onClick={() => setShowEditModal(true)}
              className="text-xs font-bold text-accent hover:underline cursor-pointer"
            >
              {client.notes
                ? isEn
                  ? 'Edit'
                  : 'Modifier'
                : isEn
                ? '+ Add a note'
                : '+ Ajouter une note'}
            </button>
          </div>

          {client.notes ? (
            <p className="text-xs sm:text-sm text-sombre/80 font-medium leading-relaxed bg-[#FAF9F6] p-3 rounded-2xl border border-sable/40">
              {client.notes}
            </p>
          ) : (
            <p className="text-xs text-sombre/40 italic">
              {isEn ? 'No notes recorded.' : 'Aucune note particulière.'}
            </p>
          )}
        </Card>
      </main>

      {/* ── MODAL : Modifier Client ─────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sombre/60 backdrop-blur-xs p-4">
          <Card className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 space-y-4 border border-sable/80 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-sombre">
                {isEn ? 'Edit Client' : 'Modifier le client'}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-sombre/50 hover:text-accent p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <Input
                label={dict.clients.nameLabel}
                type="text"
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
                required
                autoFocus
              />

              <Input
                label={dict.clients.phoneLabel}
                type="tel"
                value={editTelephone}
                onChange={(e) => setEditTelephone(e.target.value)}
              />

              <Input
                label={dict.clients.notesLabel}
                type="text"
                placeholder={isEn ? 'e.g. Prefers loose fit' : 'ex: Préfère coupe ample'}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-full"
                >
                  {dict.common.cancel}
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  disabled={savingEdit}
                  className="rounded-full font-bold px-5"
                >
                  {savingEdit ? dict.common.saving : dict.common.save}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── MODAL : Confirmer Suppression Client ────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sombre/60 backdrop-blur-xs p-4">
          <Card className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-4 border border-sable/80 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            {activeCount > 0 ? (
              <div className="text-center space-y-2">
                <h3 className="text-base font-display font-bold text-sombre">
                  {isEn ? 'Active Orders in Progress' : 'Commandes actives en cours'}
                </h3>
                <p className="text-xs text-sombre/70 font-medium leading-relaxed">
                  {isEn
                    ? `Cannot delete ${client.nom} while they have ${activeCount} active order(s). Deliver or archive them first.`
                    : `Impossible de supprimer ${client.nom} car ce client a ${activeCount} commande(s) active(s). Veuillez d'abord les livrer ou les archiver.`}
                </p>
                <div className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => setShowDeleteModal(false)}
                    className="rounded-full"
                  >
                    {dict.common.close}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <h3 className="text-base font-display font-bold text-sombre">
                  {isEn
                    ? `Delete ${client.nom} and measurements?`
                    : `Supprimer ${client.nom} et ses mesures ?`}
                </h3>
                <p className="text-xs text-sombre/70 font-medium leading-relaxed">
                  {isEn
                    ? 'This action is irreversible. The client profile and associated measurement records will be deleted.'
                    : 'Cette action est irréversible. La fiche du client et ses mesures enregistrées seront définitivement effacées.'}
                </p>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => setShowDeleteModal(false)}
                    className="rounded-full"
                  >
                    {dict.common.cancel}
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    fullWidth
                    disabled={deleting}
                    onClick={handleDeleteClient}
                    className="rounded-full font-bold bg-accent text-white hover:bg-fonce"
                  >
                    {deleting ? dict.common.deleting : dict.common.delete}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
