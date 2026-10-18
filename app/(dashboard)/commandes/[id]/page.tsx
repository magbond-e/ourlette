'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Calendar,
  Ruler,
  User,
  DollarSign,
  Share2,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  MessageCircle,
  FileText,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusStepper } from '@/components/ui/StatusStepper';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Commande, StatutCommande, Client } from '@/lib/types/database';
import { formatFCFA, formatDateFR, isCommandeEnRetard, calculSolde } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';
import { useLanguage } from '@/lib/i18n';

export default function CommandeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, couturier } = useAuth();
  const { createNotification } = useNotifications();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';
  const cmdId = params.id as string;

  const [commande, setCommande] = useState<Commande | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Versement State
  const [newVersementMontant, setNewVersementMontant] = useState<string>('');
  const [newVersementNote, setNewVersementNote] = useState<string>('');
  const [showAddVersement, setShowAddVersement] = useState(false);

  // Undo Status Toast
  const [undoToast, setUndoToast] = useState<{
    previousStatus: StatutCommande;
    newStatus: StatutCommande;
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Edit Order Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editTissu, setEditTissu] = useState('');
  const [editDateLivraison, setEditDateLivraison] = useState('');
  const [editPrixTotal, setEditPrixTotal] = useState<string>('');
  const [editResponsable, setEditResponsable] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete State
  const [deleting, setDeleting] = useState(false);

  const loadCommande = useCallback(async () => {
    if (!user?.id || !cmdId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const found = await DataService.getCommandeById(user.id, cmdId);
    if (found) {
      setCommande(found);
      const c = await DataService.getClientById(user.id, found.client_id);
      if (c) setClient(c);

      // Pre-fill edit modal
      setEditDescription(found.description || '');
      setEditTissu(found.tissu || '');
      setEditDateLivraison(found.date_livraison_prevue ? found.date_livraison_prevue.split('T')[0] : '');
      setEditPrixTotal(found.prix_total ? String(found.prix_total) : '');
      setEditResponsable(found.responsable || '');
      setEditNotes(found.notes || '');
    }
    setLoading(false);
  }, [user?.id, cmdId]);

  useEffect(() => {
    loadCommande();
  }, [loadCommande]);

  // Status Change with 5s Undo Toast
  const handleStatusChange = async (newStatut: StatutCommande) => {
    if (!commande || !user?.id || newStatut === commande.statut) return;
    const oldStatus = commande.statut;

    // Mise à jour immédiate
    const updated = await DataService.updateCommande(user.id, commande.id, { statut: newStatut });
    if (updated) {
      setCommande(updated);

      if (newStatut === 'livree') {
        await DataService.syncOrderAlerts(user.id, couturier);
      }

      if (newStatut === 'prete' || newStatut === 'livree') {
        await createNotification({
          type: 'order_status',
          category: 'order',
          priority: 'high',
          title: newStatut === 'livree' ? (isEn ? '🎉 Order Delivered' : '🎉 Commande livrée') : (isEn ? '✨ Order Ready' : '✨ Commande prête'),
          message: isEn
            ? `Order for ${commande.client_nom || 'client'} is now marked as "${newStatut}".`
            : `La commande pour ${commande.client_nom || 'le client'} est désormais marquée "${newStatut}".`,
          link: `/commandes/${commande.id}`,
          orderId: commande.id,
          metadata: { orderId: commande.id, oldStatus, newStatus: newStatut },
        });
      }

      // Show Undo Toast for 5 seconds
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      setUndoToast({ previousStatus: oldStatus, newStatus: newStatut });
      undoTimeoutRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 5000);
    }
  };

  const handleUndoStatus = async () => {
    if (!undoToast || !commande || !user?.id) return;
    const targetStatus = undoToast.previousStatus;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast(null);

    const updated = await DataService.updateCommande(user.id, commande.id, { statut: targetStatus });
    if (updated) {
      setCommande(updated);
    }
  };

  // Add Payment
  const handleAddVersement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newVersementMontant.replace(',', '.'));
    if (!commande || !user?.id || isNaN(amount) || amount <= 0) return;

    const newVersement = {
      id: `vers-${Date.now()}`,
      montant: amount,
      date: new Date().toISOString(),
      note: newVersementNote.trim() || undefined,
    };

    const currentVersements = commande.versements || [];
    const updatedVersements = [newVersement, ...currentVersements];
    const newTotalAcompte = (Number(commande.acompte) || 0) + amount;

    const updated = await DataService.updateCommande(user.id, commande.id, {
      acompte: newTotalAcompte,
      versements: updatedVersements,
    });

    if (updated) {
      setCommande(updated);
      setNewVersementMontant('');
      setNewVersementNote('');
      setShowAddVersement(false);

      await createNotification({
        type: 'payment_received',
        category: 'payment',
        priority: 'medium',
        title: isEn ? '💵 Payment Recorded' : '💵 Versement encaissé',
        message: isEn
          ? `Payment of ${formatFCFA(amount)} recorded for ${commande.client_nom}.`
          : `Versement de ${formatFCFA(amount)} enregistré pour ${commande.client_nom}.`,
        link: `/commandes/${commande.id}`,
        orderId: commande.id,
        metadata: { orderId: commande.id, amount },
      });
    }
  };

  // Edit Order
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commande || !user?.id) return;

    setSavingEdit(true);
    const parsedPrice = editPrixTotal ? parseFloat(editPrixTotal.replace(',', '.')) : 0;

    const updated = await DataService.updateCommande(user.id, commande.id, {
      description: editDescription.trim(),
      tissu: editTissu.trim() || undefined,
      date_livraison_prevue: editDateLivraison,
      prix_total: isNaN(parsedPrice) ? 0 : parsedPrice,
      responsable: editResponsable.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });

    if (updated) {
      setCommande(updated);
      setShowEditModal(false);
    }
    setSavingEdit(false);
  };

  // Delete Order
  const handleDeleteCommande = async () => {
    if (!commande || !user?.id) return;
    const confirmPrompt = isEn
      ? `Delete order "${commande.description}" for ${commande.client_nom} permanently?`
      : `Supprimer définitivement la commande "${commande.description}" pour ${commande.client_nom} ?`;
    if (!confirm(confirmPrompt)) return;

    setDeleting(true);
    await DataService.deleteCommande(user.id, commande.id);
    router.push('/commandes');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
        <main className="max-w-xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label={dict.common.loading} size="lg" />
        </main>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
        <main className="max-w-xl mx-auto px-4 pt-12 text-center space-y-3">
          <p className="text-sm font-semibold text-sombre/70">{dict.commandes.emptyTitle}</p>
          <Link href="/commandes" className="inline-block mt-4">
            <Button className="rounded-full bg-accent text-white px-5">{dict.commandes.title}</Button>
          </Link>
        </main>
      </div>
    );
  }

  const isOverdue = isCommandeEnRetard(commande.date_livraison_prevue, commande.statut);
  const soldeRestant = calculSolde(commande.prix_total, commande.acompte);
  const versementsList = commande.versements || [
    ...(commande.acompte > 0 ? [{ id: 'vers-0', montant: commande.acompte, date: commande.date_commande || new Date().toISOString(), note: isEn ? 'Initial Deposit' : 'Acompte versé' }] : []),
  ];

  // WhatsApp Message Builders
  const clientPhone = client?.telephone || commande.client_telephone || '';
  const cleanPhone = clientPhone.replace(/[^0-9]/g, '');

  const msgOrderReady = isEn
    ? `Hello ${commande.client_nom || ''}, your order "${commande.description}" is ready at the workshop! You can come pick it up.`
    : `Bonjour ${commande.client_nom || ''}, votre commande "${commande.description}" est prête à l'atelier ! Vous pouvez passer la récupérer.`;

  const msgReminderBalance = isEn
    ? `Hello ${commande.client_nom || ''}, regarding your order "${commande.description}", there is a remaining balance of ${formatFCFA(soldeRestant)} FCFA. Thank you!`
    : `Bonjour ${commande.client_nom || ''}, concernant votre commande "${commande.description}", il reste un solde de ${formatFCFA(soldeRestant)} FCFA. Merci !`;

  const waReadyUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgOrderReady)}`;
  const waReminderUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgReminderBalance)}`;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans text-sombre">
      <main className="max-w-xl mx-auto px-4 pt-3 space-y-4">

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link
            href="/commandes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sombre/70 hover:text-fonce bg-white px-3 py-1.5 rounded-full border border-sable/70 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === 'fr' ? 'Commandes' : 'Orders'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-sombre/70 hover:text-fonce bg-white px-3 py-1.5 rounded-full border border-sable/70 shadow-2xs cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{locale === 'fr' ? 'Modifier' : 'Edit'}</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteCommande}
              disabled={deleting}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200 shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{locale === 'fr' ? 'Supprimer' : 'Delete'}</span>
            </button>
          </div>
        </div>

        {/* ── Toast Annuler (5 secondes après changement de statut) ────── */}
        {undoToast && (
          <div className="p-3 bg-sombre text-white rounded-2xl flex items-center justify-between shadow-lg border border-gold/30 animate-fade-in text-xs font-medium">
            <span>
              {locale === 'fr' ? 'Statut mis à jour' : 'Status updated'} ({undoToast.newStatus})
            </span>
            <button
              type="button"
              onClick={handleUndoStatus}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gold/20 hover:bg-gold/30 text-gold rounded-full font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{locale === 'fr' ? 'Annuler' : 'Undo'}</span>
            </button>
          </div>
        )}

        {/* ── 1. En-tête : Nom du client (lien vers fiche) & Type ──────── */}
        <Card className={`p-4 sm:p-5 rounded-3xl bg-white space-y-3 ${isOverdue ? 'border-2 border-accent/40 bg-accent/5' : 'border border-sable/60 shadow-2xs'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/clients/${commande.client_id}`}
                className="text-lg sm:text-xl font-display font-bold text-sombre hover:text-fonce hover:underline block truncate"
              >
                {commande.client_nom} →
              </Link>
              {clientPhone && (
                <a
                  href={`tel:${clientPhone}`}
                  className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-bold mt-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>{clientPhone}</span>
                </a>
              )}
            </div>

            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shrink-0 ${
              commande.type_commande === 'couture_complete'
                ? 'bg-accent/10 text-accent border-accent/20'
                : 'bg-sable/30 text-sombre border-sable/60'
            }`}>
              {commande.type_commande === 'couture_complete'
                ? (locale === 'fr' ? 'Couture complète' : 'Bespoke tailoring')
                : (locale === 'fr' ? 'Retouche' : 'Alteration')}
            </span>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Link href={`/clients/${commande.client_id}/mesures`} className="w-full">
              <Button
                variant="outline"
                className="w-full gap-2 text-xs font-bold border-sable/70 rounded-2xl h-10 hover:bg-sable/20"
              >
                <Ruler className="w-3.5 h-3.5 text-accent" />
                <span>{locale === 'fr' ? 'Consulter les mensurations' : 'View measurements'}</span>
              </Button>
            </Link>
          </div>
        </Card>

        {/* ── 2. Barre de statut (5 étapes) ──────────────────────────── */}
        <Card className="p-4 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-fonce">
              {locale === 'fr' ? 'Statut de confection' : 'Order Status'}
            </h3>
            <span className="text-[11px] text-sombre/50">
              {locale === 'fr' ? 'Touchez pour avancer' : 'Tap step to advance'}
            </span>
          </div>
          <StatusStepper
            currentStatus={commande.statut}
            onStatusChange={handleStatusChange}
          />
        </Card>

        {/* ── Actions WhatsApp intelligentes (selon statut & solde) ───── */}
        <div className="space-y-2">
          {/* Action 1 : Prévenir le client que c'est prêt */}
          {commande.statut === 'prete' && clientPhone && (
            <a
              href={waReadyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{locale === 'fr' ? 'Prévenir le client sur WhatsApp' : 'Notify client on WhatsApp'}</span>
            </a>
          )}

          {/* Action 2 : Relancer le solde si dû et commande prête ou livrée */}
          {soldeRestant > 0 && (commande.statut === 'prete' || commande.statut === 'livree') && clientPhone && (
            <a
              href={waReminderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-2xl bg-sombre hover:bg-fonce text-gold text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <DollarSign className="w-4 h-4 text-gold" />
              <span>{locale === 'fr' ? `Relancer le solde (${formatFCFA(soldeRestant)} FCFA)` : `Remind balance (${formatFCFA(soldeRestant)} FCFA)`}</span>
            </a>
          )}
        </div>

        {/* ── 3. Détails du modèle & Confection ───────────────────────── */}
        <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-fonce">
            {locale === 'fr' ? 'Détails de confection' : 'Garment Details'}
          </h3>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[11px] text-sombre/60 block font-medium">{locale === 'fr' ? 'Modèle / Description' : 'Description'} :</span>
              <p className="font-bold text-sombre text-sm leading-relaxed">{commande.description}</p>
            </div>

            {commande.tissu && (
              <div>
                <span className="text-[11px] text-sombre/60 block font-medium">{locale === 'fr' ? 'Tissu fourni' : 'Fabric'} :</span>
                <p className="font-semibold text-sombre">{commande.tissu}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-sable/30">
              {commande.date_commande && (
                <div>
                  <span className="text-[11px] text-sombre/60 block font-medium">{locale === 'fr' ? 'Date de réception' : 'Order date'} :</span>
                  <p className="font-semibold text-sombre">{formatDateFR(commande.date_commande, locale)}</p>
                </div>
              )}
              <div>
                <span className="text-[11px] text-sombre/60 block font-medium">{locale === 'fr' ? 'Livraison promise' : 'Promised delivery'} :</span>
                <p className={`font-bold ${isOverdue ? 'text-accent' : 'text-sombre'}`}>
                  {formatDateFR(commande.date_livraison_prevue, locale)}
                  {isOverdue && <span className="block text-[10px] text-accent font-extrabold uppercase">⚠️ {locale === 'fr' ? 'En retard' : 'Overdue'}</span>}
                </p>
              </div>
            </div>

            {commande.responsable && (
              <div className="pt-1 text-xs text-sombre/70 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-fonce shrink-0" />
                <span>{locale === 'fr' ? 'Responsable' : 'Assigned tailor'} : <strong>{commande.responsable}</strong></span>
              </div>
            )}

            {commande.notes && (
              <div className="pt-2 border-t border-sable/30">
                <span className="text-[11px] text-sombre/60 block font-medium">{locale === 'fr' ? 'Notes particulières' : 'Notes'} :</span>
                <p className="font-medium text-sombre italic">{commande.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* ── 4. Argent : Prix total, versé, solde & versements ───────── */}
        <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-fonce">
              {locale === 'fr' ? 'Finances & Versements' : 'Pricing & Payments'}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddVersement(!showAddVersement)}
              className="text-xs font-bold text-accent hover:underline bg-accent/10 px-3 py-1 rounded-full border border-accent/20 cursor-pointer"
            >
              {showAddVersement ? (locale === 'fr' ? 'Fermer' : 'Close') : `+ ${locale === 'fr' ? 'Ajouter un versement' : 'Add payment'}`}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-[#FAFAF8] rounded-2xl border border-sable/60">
              <span className="text-[10px] text-sombre/70 font-semibold block uppercase">{locale === 'fr' ? 'Total' : 'Total'}</span>
              <span className="text-xs sm:text-sm font-bold text-sombre">{formatFCFA(commande.prix_total)}</span>
            </div>

            <div className="p-2.5 bg-vertbouton/15 rounded-2xl border border-vertbouton/30">
              <span className="text-[10px] text-vertbouton font-semibold block uppercase">{locale === 'fr' ? 'Versé' : 'Paid'}</span>
              <span className="text-xs sm:text-sm font-bold text-vertbouton">{formatFCFA(commande.acompte)}</span>
            </div>

            <div className={`p-2.5 rounded-2xl border ${soldeRestant > 0 ? 'bg-accent/10 border-accent/30' : 'bg-vertbouton/20 border-vertbouton/40'}`}>
              <span className="text-[10px] font-semibold block uppercase text-sombre/70">{locale === 'fr' ? 'Solde' : 'Balance'}</span>
              <span className={`text-xs sm:text-sm font-bold ${soldeRestant > 0 ? 'text-accent' : 'text-vertbouton'}`}>
                {soldeRestant > 0 ? formatFCFA(soldeRestant) : (isEn ? 'Paid ✓' : 'Soldé ✓')}
              </span>
            </div>
          </div>

          {/* Formulaire ajout versement */}
          {showAddVersement && (
            <form onSubmit={handleAddVersement} className="p-3 bg-[#FAFAF8] rounded-2xl border border-sable/80 space-y-3">
              <h4 className="text-xs font-bold text-sombre">{locale === 'fr' ? 'Enregistrer un nouveau versement' : 'Record new payment'}</h4>
              <Input
                label={locale === 'fr' ? 'Montant versé (FCFA)' : 'Amount (FCFA)'}
                type="text"
                inputMode="decimal"
                placeholder="Ex : 15 000"
                value={newVersementMontant}
                onChange={(e) => setNewVersementMontant(e.target.value)}
                required
                autoFocus
                className="h-10 text-xs rounded-xl"
              />
              <Input
                label={locale === 'fr' ? 'Note ou mode de paiement (facultatif)' : 'Note (optional)'}
                type="text"
                placeholder="Ex : Espèces à l'atelier, Wave, etc."
                value={newVersementNote}
                onChange={(e) => setNewVersementNote(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddVersement(false)}
                  className="rounded-xl h-9 text-xs px-3 border-sable text-sombre/70"
                >
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl h-9 text-xs px-4 bg-accent hover:bg-accent/90 text-white font-bold"
                >
                  {locale === 'fr' ? 'Valider le versement' : 'Record payment'}
                </Button>
              </div>
            </form>
          )}

          {/* Historique des versements */}
          <div className="space-y-2 border-t border-sable/30 pt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sombre/70 block">
              {locale === 'fr' ? `Historique des versements (${versementsList.length})` : `Payment History (${versementsList.length})`}
            </span>

            {versementsList.length === 0 ? (
              <p className="text-xs text-sombre/60 italic">{locale === 'fr' ? 'Aucun versement enregistré.' : 'No payment recorded.'}</p>
            ) : (
              <div className="space-y-1.5">
                {versementsList.map((vers, idx) => (
                  <div key={vers.id || idx} className="flex items-center justify-between p-2.5 bg-[#FAFAF8] rounded-xl text-xs border border-sable/40">
                    <div>
                      <span className="font-bold text-sombre">
                        {formatFCFA(vers.montant)} FCFA
                      </span>
                      {vers.note && <p className="text-[11px] text-sombre/60 italic">{vers.note}</p>}
                    </div>
                    <span className="text-[10px] text-sombre/60 font-semibold">{formatDateFR(vers.date, locale)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── Modal de modification de la commande ───────────────────── */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-sombre/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto border border-sable">
              <div className="flex items-center justify-between border-b border-sable/40 pb-2">
                <h3 className="text-sm font-display font-bold text-sombre">
                  {locale === 'fr' ? 'Modifier la commande' : 'Edit order'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-xs text-sombre/50 hover:text-sombre"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-sombre mb-1">
                    {locale === 'fr' ? 'Description / Modèle' : 'Description'} *
                  </label>
                  <Input
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                {commande.type_commande === 'couture_complete' && (
                  <div>
                    <label className="block font-bold text-sombre mb-1">
                      {locale === 'fr' ? 'Tissu fourni' : 'Fabric'}
                    </label>
                    <Input
                      value={editTissu}
                      onChange={(e) => setEditTissu(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-sombre mb-1">
                      {locale === 'fr' ? 'Livraison promise' : 'Delivery date'} *
                    </label>
                    <Input
                      type="date"
                      required
                      value={editDateLivraison}
                      onChange={(e) => setEditDateLivraison(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-sombre mb-1">
                      {locale === 'fr' ? 'Prix total (FCFA)' : 'Total price (FCFA)'}
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={editPrixTotal}
                      onChange={(e) => setEditPrixTotal(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-sombre mb-1">
                    {locale === 'fr' ? 'Responsable couture' : 'Assigned tailor'}
                  </label>
                  <Input
                    value={editResponsable}
                    onChange={(e) => setEditResponsable(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-sombre mb-1">
                    {locale === 'fr' ? 'Notes particulières' : 'Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full rounded-xl border border-sable/80 p-2 text-xs bg-white text-sombre focus:border-fonce focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-sable/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-xl h-9 text-xs px-3 border-sable text-sombre/70"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingEdit}
                    className="rounded-xl h-9 text-xs px-4 bg-accent hover:bg-accent/90 text-white font-bold"
                  >
                    {savingEdit ? (locale === 'fr' ? 'Enregistrement…' : 'Saving…') : (locale === 'fr' ? 'Enregistrer' : 'Save')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
