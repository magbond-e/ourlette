'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Phone, Calendar, Ruler, User, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
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
  const { user, couturier } = useAuth();
  const { createNotification } = useNotifications();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';
  const cmdId = params.id as string;

  const [commande, setCommande] = useState<Commande | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [newVersementMontant, setNewVersementMontant] = useState<number | ''>('');
  const [newVersementNote, setNewVersementNote] = useState<string>('');
  const [showAddVersement, setShowAddVersement] = useState(false);

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
    }
    setLoading(false);
  }, [user?.id, cmdId]);

  useEffect(() => {
    loadCommande();
  }, [loadCommande]);

  const handleStatusChange = async (newStatut: StatutCommande) => {
    if (!commande || !user?.id) return;
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
          title: newStatut === 'livree' ? (isEn ? '🎉 Garment Delivered' : '🎉 Commande livrée') : (isEn ? '✨ Garment Ready' : '✨ Commande prête'),
          message: isEn
            ? `Order for ${commande.client_nom || 'client'} is now marked as "${newStatut}".`
            : `La commande pour ${commande.client_nom || 'le client'} est désormais marquée "${newStatut}".`,
          link: `/commandes/${commande.id}`,
          orderId: commande.id,
          metadata: { orderId: commande.id, oldStatus: commande.statut, newStatus: newStatut },
        });
      }
    }
  };

  const handleAddVersement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commande || !user?.id || !newVersementMontant || Number(newVersementMontant) <= 0) return;

    const amount = Number(newVersementMontant);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-clair">
        <main className="max-w-xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label={dict.common.loading} size="lg" />
        </main>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="min-h-screen bg-clair pb-20 font-sans">
        <main className="max-w-xl mx-auto px-4 pt-12 text-center space-y-3">
          <p className="text-sm font-semibold text-sombre/70">{dict.commandes.emptyTitle}</p>
          <Link href="/commandes" className="inline-block mt-4">
            <Button variant="accent">{dict.commandes.title}</Button>
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

  return (
    <div className="min-h-screen bg-clair pb-24 font-sans">
      <main className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/commandes"
            className="inline-flex items-center gap-1 text-xs font-bold text-sombre/70 hover:text-accent font-sans bg-white px-3 py-1.5 rounded-full border border-sable/70 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{dict.detailCommande.backButton}</span>
          </Link>
          <Badge statut={commande.statut} />
        </div>

        {/* Client Header Card */}
        <Card className={`p-5 space-y-3 rounded-3xl ${isOverdue ? 'border-2 border-accent bg-accent/5' : 'border-sable/60 bg-white shadow-xs'}`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent">{isEn ? 'Client' : 'Client'}</span>
              <h2 className="text-xl font-display font-black text-sombre">{commande.client_nom}</h2>
              {(client?.telephone || commande.client_telephone) && (
                <a
                  href={`tel:${client?.telephone || commande.client_telephone}`}
                  className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-bold mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{client?.telephone || commande.client_telephone}</span>
                </a>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sombre/60">{dict.detailCommande.deliveryDate}</span>
              <div
                className={`text-xs font-bold px-2.5 py-1 rounded-xl mt-0.5 ${
                  isOverdue ? 'bg-accent text-white animate-pulse' : 'bg-[#FAFAF8] text-sombre border border-sable'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                {formatDateFR(commande.date_livraison_prevue, locale)}
              </div>
              {isOverdue && (
                <p className="text-[10px] font-black text-accent uppercase mt-1">⚠️ {dict.commandes.overdueNotice}</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Link href={`/clients/${commande.client_id}/mesures`} className="w-full">
              <Button variant="outline" size="sm" fullWidth className="gap-1.5 text-xs font-bold border-sable rounded-2xl">
                <Ruler className="w-4 h-4 text-accent" />
                <span>{dict.detailCommande.viewMeasurements}</span>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Status Stepper */}
        <Card className="p-4 space-y-2 bg-white border-sable/60 rounded-3xl shadow-xs">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent">
            {dict.detailCommande.statusStepperTitle}
          </h3>
          <StatusStepper
            currentStatus={commande.statut}
            onStatusChange={handleStatusChange}
          />
        </Card>

        {/* Model Details */}
        <Card className="p-4 space-y-3 bg-white border-sable/60 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between border-b border-sable/40 pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent">
              {dict.detailCommande.specsTitle}
            </h3>
            <span className="text-xs font-extrabold text-sombre bg-[#FAFAF8] px-2.5 py-0.5 rounded-full border border-sable">
              {commande.type_commande === 'couture_complete'
                ? (isEn ? 'Bespoke tailoring' : 'Couture complète')
                : (isEn ? 'Alteration' : 'Retouche')}
            </span>
          </div>

          <div className="space-y-2 text-sm font-sans">
            <div>
              <span className="text-xs text-sombre/60 block font-medium">{dict.nouvelleCommande.descriptionLabel} :</span>
              <p className="font-bold text-sombre">{commande.description}</p>
            </div>

            {commande.tissu && (
              <div>
                <span className="text-xs text-sombre/60 block font-medium">{dict.detailCommande.fabric} :</span>
                <p className="font-semibold text-sombre/90 italic">{commande.tissu}</p>
              </div>
            )}

            {commande.responsable && (
              <div className="pt-1 text-xs text-sombre/70 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                <span>{dict.detailCommande.assignedTo} : <strong>{commande.responsable}</strong></span>
              </div>
            )}
          </div>
        </Card>

        {/* Financial Breakdown & Installments */}
        <Card className="p-5 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{dict.detailCommande.financeCardTitle}</span>
            </h3>
            <button
              onClick={() => setShowAddVersement(!showAddVersement)}
              className="text-xs font-extrabold text-accent hover:underline bg-accent/10 px-3 py-1 rounded-full border border-accent/20"
            >
              {showAddVersement ? dict.common.close : `+ ${dict.detailCommande.addPaymentButton}`}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-[#FAFAF8] rounded-2xl border border-sable/60">
              <span className="text-[10px] text-sombre/70 font-semibold block uppercase">{dict.detailCommande.total}</span>
              <span className="text-xs sm:text-sm font-black text-sombre">{formatFCFA(commande.prix_total)}</span>
            </div>

            <div className="p-2.5 bg-vertbouton/15 rounded-2xl border border-vertbouton/40">
              <span className="text-[10px] text-vertbouton-dark font-semibold block uppercase">{dict.detailCommande.advancePaid}</span>
              <span className="text-xs sm:text-sm font-black text-vertbouton-dark">{formatFCFA(commande.acompte)}</span>
            </div>

            <div
              className={`p-2.5 rounded-2xl border ${
                soldeRestant > 0 ? 'bg-accent/15 border-accent/40' : 'bg-vertbouton/20 border-vertbouton'
              }`}
            >
              <span className="text-[10px] font-semibold block uppercase text-sombre/70">{dict.detailCommande.remainingToPay}</span>
              <span className={`text-xs sm:text-sm font-black ${soldeRestant > 0 ? 'text-accent' : 'text-vertbouton-dark'}`}>
                {soldeRestant > 0 ? formatFCFA(soldeRestant) : (isEn ? 'Paid ✓' : 'Soldé ✓')}
              </span>
            </div>
          </div>

          {showAddVersement && (
            <form onSubmit={handleAddVersement} className="p-4 bg-[#FAFAF8] rounded-2xl border border-sable/60 space-y-3 font-sans">
              <h4 className="text-xs font-extrabold text-sombre">{dict.detailCommande.addPaymentModalTitle}</h4>
              <Input
                label={dict.detailCommande.paymentAmountLabel}
                type="number"
                placeholder="ex: 15000"
                value={newVersementMontant}
                onChange={(e) => setNewVersementMontant(e.target.value === '' ? '' : Number(e.target.value))}
                required
                autoFocus
              />
              <Input
                label={dict.detailCommande.paymentNoteLabel}
                type="text"
                placeholder={dict.detailCommande.paymentNotePlaceholder}
                value={newVersementNote}
                onChange={(e) => setNewVersementNote(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddVersement(false)}>
                  {dict.common.cancel}
                </Button>
                <Button type="submit" variant="accent" size="sm">
                  {dict.detailCommande.recordPaymentButton}
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2 border-t border-sable/40 pt-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sombre/70 block">
              {isEn ? `Installments History (${versementsList.length})` : `Historique des versements (${versementsList.length})`}
            </span>

            {versementsList.length === 0 ? (
              <p className="text-xs text-sombre/60 italic">{isEn ? 'No payment recorded.' : 'Aucun versement enregistré.'}</p>
            ) : (
              <div className="space-y-1.5">
                {versementsList.map((vers, idx) => (
                  <div key={vers.id || idx} className="flex items-center justify-between p-2.5 bg-[#FAFAF8] rounded-xl text-xs border border-sable/40">
                    <div>
                      <span className="font-extrabold text-sombre">
                        {isEn ? `Payment #${idx + 1}` : `Versement #${idx + 1}`} : {formatFCFA(vers.montant)}
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
      </main>
    </div>
  );
}
