'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Calendar, Ruler, CheckCircle2, User, Scissors, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatusStepper } from '@/components/ui/StatusStepper';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { MockStorageService } from '@/lib/services/mockStorage';
import { Commande, StatutCommande, Client } from '@/lib/types/database';
import { formatFCFA, formatDateFR, isCommandeEnRetard, calculSolde } from '@/lib/utils/formatters';

export default function CommandeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cmdId = params.id as string;

  // ALL HOOKS MUST BE DECLARED AT THE VERY TOP BEFORE ANY CONDITIONAL RETURN
  const [commande, setCommande] = useState<Commande | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [acompteInput, setAcompteInput] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [newVersementMontant, setNewVersementMontant] = useState<number | ''>('');
  const [newVersementNote, setNewVersementNote] = useState<string>('');
  const [showAddVersement, setShowAddVersement] = useState(false);

  useEffect(() => {
    const found = MockStorageService.getCommandeById(cmdId);
    if (found) {
      setCommande(found);
      setAcompteInput(found.acompte);
      const c = MockStorageService.getClientById(found.client_id);
      if (c) setClient(c);
    }
    setLoading(false);
  }, [cmdId]);

  const handleStatusChange = (newStatut: StatutCommande) => {
    if (!commande) return;
    const updated = MockStorageService.updateCommande(commande.id, { statut: newStatut });
    if (updated) setCommande({ ...commande, statut: newStatut });
  };

  const handleAddVersement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commande) return;
    const amount = Number(newVersementMontant);
    if (!amount || amount <= 0) return;

    const updated = MockStorageService.addVersement(commande.id, amount, newVersementNote.trim() || undefined);
    if (updated) {
      setCommande(updated);
      setNewVersementMontant('');
      setNewVersementNote('');
      setShowAddVersement(false);
    }
  };

  // CONDITIONAL RENDERS AFTER ALL HOOKS
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <main className="max-w-xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label="Chargement de la commande…" size="lg" />
        </main>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-20 font-sans">
        <main className="max-w-xl mx-auto px-4 pt-12 text-center space-y-3">
          <p className="text-sm font-semibold text-sombre/70">Commande non trouvée.</p>
          <Link href="/commandes" className="inline-block mt-4">
            <Button variant="accent">Retour aux commandes</Button>
          </Link>
        </main>
      </div>
    );
  }

  const isOverdue = isCommandeEnRetard(commande.date_livraison_prevue, commande.statut);
  const soldeRestant = calculSolde(commande.prix_total, commande.acompte);
  const versementsList = commande.versements || [
    ...(commande.acompte > 0 ? [{ id: 'vers-0', montant: commande.acompte, date: commande.date_commande, note: 'Acompte versé' }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 font-sans">

      <main className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/commandes"
            className="inline-flex items-center gap-1 text-xs font-bold text-sombre/70 hover:text-accent font-sans bg-white px-3 py-1.5 rounded-full border border-sable/70 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Toutes les commandes</span>
          </Link>
          <Badge statut={commande.statut} />
        </div>

        {/* Client Header Card */}
        <Card className={`p-5 space-y-3 rounded-3xl ${isOverdue ? 'border-2 border-accent bg-accent/5' : 'border-sable/60 bg-white shadow-xs'}`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent">Client</span>
              <h2 className="text-xl font-display font-black text-sombre">{commande.client_nom}</h2>
              {commande.client_telephone && (
                <a
                  href={`tel:${commande.client_telephone}`}
                  className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-bold mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{commande.client_telephone}</span>
                </a>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sombre/60">Livraison prévue</span>
              <div
                className={`text-xs font-bold px-2.5 py-1 rounded-xl mt-0.5 ${
                  isOverdue ? 'bg-accent text-white animate-pulse' : 'bg-[#FAFAF8] text-sombre border border-sable'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                {formatDateFR(commande.date_livraison_prevue)}
              </div>
              {isOverdue && (
                <p className="text-[10px] font-black text-accent uppercase mt-1">⚠️ Date dépassée</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Link href={`/clients/${commande.client_id}/mesures`} className="w-full">
              <Button variant="outline" size="sm" fullWidth className="gap-1.5 text-xs font-bold border-sable rounded-2xl">
                <Ruler className="w-4 h-4 text-accent" />
                <span>Voir la fiche mesures de ce client</span>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Status Stepper */}
        <Card className="p-4 space-y-2 bg-white border-sable/60 rounded-3xl shadow-xs">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent">
            Progression de la tenue (Tap pour changer)
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
              Détails du Modèle
            </h3>
            <span className="text-xs font-extrabold text-sombre bg-[#FAFAF8] px-2.5 py-0.5 rounded-full border border-sable">
              {commande.type_commande === 'couture_complete' ? 'Couture complète' : 'Retouche'}
            </span>
          </div>

          <div className="space-y-2 text-sm font-sans">
            <div>
              <span className="text-xs text-sombre/60 block font-medium">Description :</span>
              <p className="font-bold text-sombre">{commande.description}</p>
            </div>

            {commande.tissu && (
              <div>
                <span className="text-xs text-sombre/60 block font-medium">Tissu associé :</span>
                <p className="font-semibold text-sombre/90 italic">{commande.tissu}</p>
              </div>
            )}

            {commande.responsable && (
              <div className="pt-1 text-xs text-sombre/70 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                <span>Pris par / Responsable : <strong>{commande.responsable}</strong></span>
              </div>
            )}
          </div>
        </Card>

        {/* Financial Breakdown & Installments */}
        <Card className="p-5 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>Règlement & Versements</span>
            </h3>
            <button
              onClick={() => setShowAddVersement(!showAddVersement)}
              className="text-xs font-extrabold text-accent hover:underline bg-accent/10 px-3 py-1 rounded-full border border-accent/20"
            >
              {showAddVersement ? 'Fermer' : '+ Versement'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-[#FAFAF8] rounded-2xl border border-sable/60">
              <span className="text-[10px] text-sombre/70 font-semibold block uppercase">Prix Total</span>
              <span className="text-xs sm:text-sm font-black text-sombre">{formatFCFA(commande.prix_total)}</span>
            </div>

            <div className="p-2.5 bg-vertbouton/15 rounded-2xl border border-vertbouton/40">
              <span className="text-[10px] text-vertbouton-dark font-semibold block uppercase">Total Versé</span>
              <span className="text-xs sm:text-sm font-black text-vertbouton-dark">{formatFCFA(commande.acompte)}</span>
            </div>

            <div
              className={`p-2.5 rounded-2xl border ${
                soldeRestant > 0 ? 'bg-accent/15 border-accent/40' : 'bg-vertbouton/20 border-vertbouton'
              }`}
            >
              <span className="text-[10px] font-semibold block uppercase text-sombre/70">Reste dû</span>
              <span className={`text-xs sm:text-sm font-black ${soldeRestant > 0 ? 'text-accent' : 'text-vertbouton-dark'}`}>
                {soldeRestant > 0 ? formatFCFA(soldeRestant) : 'Soldé ✓'}
              </span>
            </div>
          </div>

          {showAddVersement && (
            <form onSubmit={handleAddVersement} className="p-4 bg-[#FAFAF8] rounded-2xl border border-sable/60 space-y-3 font-sans">
              <h4 className="text-xs font-extrabold text-sombre">Saisir un nouveau versement</h4>
              <Input
                label="Montant reçu (FCFA)"
                type="number"
                placeholder="ex: 15000"
                value={newVersementMontant}
                onChange={(e) => setNewVersementMontant(e.target.value === '' ? '' : Number(e.target.value))}
                required
                autoFocus
              />
              <Input
                label="Mode de paiement / Note (optionnel)"
                type="text"
                placeholder="ex: Espèces, Wave, Orange Money..."
                value={newVersementNote}
                onChange={(e) => setNewVersementNote(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddVersement(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="accent" size="sm">
                  Enregistrer
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2 border-t border-sable/40 pt-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sombre/70 block">
              Historique des versements ({versementsList.length})
            </span>

            {versementsList.length === 0 ? (
              <p className="text-xs text-sombre/60 italic">Aucun versement enregistré.</p>
            ) : (
              <div className="space-y-1.5">
                {versementsList.map((vers, idx) => (
                  <div key={vers.id || idx} className="flex items-center justify-between p-2.5 bg-[#FAFAF8] rounded-xl text-xs border border-sable/40">
                    <div>
                      <span className="font-extrabold text-sombre">Versement #{idx + 1} : {formatFCFA(vers.montant)}</span>
                      {vers.note && <p className="text-[11px] text-sombre/60 italic">{vers.note}</p>}
                    </div>
                    <span className="text-[10px] text-sombre/60 font-semibold">{formatDateFR(vers.date)}</span>
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
