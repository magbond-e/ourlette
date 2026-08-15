'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Scissors, Check, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataService } from '@/lib/services/dataService';
import { Client, TypeCommande } from '@/lib/types/database';
import { calculSolde, formatFCFA } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';
import { checkCommandeLimit, FREE_PLAN_LIMITS } from '@/lib/utils/planLimits';

export default function NouvelleCommandePage() {
  const router = useRouter();
  const { user, couturier } = useAuth();
  const { createNotification } = useNotifications();
  const [clients, setClients] = useState<Client[]>([]);
  const [activeCommandesCount, setActiveCommandesCount] = useState<number>(0);
  const [limitReached, setLimitReached] = useState<boolean>(false);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientNom, setNewClientNom] = useState('');
  const [newClientTelephone, setNewClientTelephone] = useState('');

  const [typeCommande, setTypeCommande] = useState<TypeCommande>('couture_complete');
  const [description, setDescription] = useState('');
  const [tissu, setTissu] = useState('');
  const [prixTotal, setPrixTotal] = useState<number | ''>('');
  const [acompte, setAcompte] = useState<number | ''>('');
  const [dateLivraison, setDateLivraison] = useState('');
  const [responsable, setResponsable] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (couturier?.nom) {
      setResponsable(couturier.nom);
    }
  }, [couturier]);

  useEffect(() => {
    async function init() {
      if (!user?.id) return;
      const [list, cmds] = await Promise.all([
        DataService.getClients(user.id),
        DataService.getCommandes(user.id),
      ]);

      const activeCount = cmds.filter((c) => c.statut !== 'livree').length;
      setActiveCommandesCount(activeCount);

      const limitCheck = checkCommandeLimit(couturier, activeCount);
      if (!limitCheck.allowed) {
        setLimitReached(true);
        setError(limitCheck.message || '');
      }

      setClients(list);
      if (list.length > 0) {
        setSelectedClientId(list[0].id);
      }
    }
    init();

    // Default delivery date: 7 days from today
    const in7days = new Date();
    in7days.setDate(in7days.getDate() + 7);
    setDateLivraison(in7days.toISOString().split('T')[0]);
  }, [user?.id, couturier]);

  const handleCreateClientOnTheFly = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newClientNom.trim() || !user?.id) return;

    const created = await DataService.addClient(user.id, {
      nom: newClientNom.trim(),
      telephone: newClientTelephone.trim(),
    });

    const updatedList = await DataService.getClients(user.id);
    setClients(updatedList);
    if (created) {
      setSelectedClientId(created.id);
      await createNotification({
        type: 'client_created',
        category: 'client',
        priority: 'low',
        title: '👤 Nouveau client ajouté',
        message: `${created.nom} a été ajouté avec succès à votre liste de clients.`,
        link: `/clients?id=${created.id}`,
        metadata: { clientId: created.id },
      });
    }
    setShowNewClientForm(false);
    setNewClientNom('');
    setNewClientTelephone('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      setError('Veuillez sélectionner ou créer un client.');
      return;
    }
    if (!description.trim()) {
      setError('Veuillez décrire le modèle ou la retouche.');
      return;
    }
    if (!prixTotal || Number(prixTotal) <= 0) {
      setError('Le prix total doit être renseigné.');
      return;
    }
    if (!dateLivraison) {
      setError('La date de livraison prévue est obligatoire.');
      return;
    }
    if (!user?.id) return;

    setLoading(true);

    const clientObj = clients.find((c) => c.id === selectedClientId);

    const newCmd = await DataService.addCommande(user.id, {
      client_id: selectedClientId,
      type_commande: typeCommande,
      description: description.trim(),
      tissu: tissu.trim(),
      responsable: responsable.trim(),
      prix_total: Number(prixTotal),
      acompte: Number(acompte) || 0,
      date_livraison_prevue: dateLivraison,
    });

    if (newCmd && newCmd.id) {
      await createNotification({
        type: 'order_created',
        category: 'order',
        priority: 'medium',
        title: '✨ Nouvelle commande enregistrée',
        message: `Commande "${newCmd.description}" enregistrée pour ${clientObj?.nom || 'un client'} (${formatFCFA(newCmd.prix_total)}).`,
        link: `/commandes/${newCmd.id}`,
        orderId: newCmd.id,
        metadata: { orderId: newCmd.id, clientId: selectedClientId },
      });
    }

    setLoading(false);
    if (newCmd && newCmd.id) {
      router.push(`/commandes/${newCmd.id}`);
    } else {
      router.push('/commandes');
    }
  };

  const currentSolde = calculSolde(Number(prixTotal) || 0, Number(acompte) || 0);

  return (
    <div className="min-h-screen bg-clair pb-24 font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/commandes"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sombre/70 hover:text-accent transition-colors bg-white px-3 py-1.5 rounded-full border border-sable/70 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Annuler</span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-sombre">Nouvelle Commande</h2>
          <div className="w-16" />
        </div>

        {limitReached && (
          <Card className="p-6 bg-gradient-to-br from-sombre to-[#3D1A1E] text-white border-2 border-gold shadow-xl rounded-3xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold flex items-center justify-center shrink-0 border border-gold/40">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gold">Limite Plan Gratuit Atteinte (10/10)</span>
                <h3 className="text-xl font-display font-bold text-white">
                  Débloquez les commandes illimitées avec le Plan Pro
                </h3>
                <p className="text-xs sm:text-sm text-clair/80 font-medium leading-relaxed">
                  Votre atelier a <strong>{activeCommandesCount} commandes en cours</strong> sur le Plan Gratuit. Pour ajouter de nouvelles commandes sans contrainte, basculez vers la formule Pro.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-white/10">
              <Link href="/parametres" className="w-full sm:w-auto">
                <Button variant="gold" size="md" className="w-full sm:w-auto rounded-full font-bold text-xs sm:text-sm shadow-md">
                  Activer le Plan Pro →
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {error && !limitReached && (
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-2xl text-xs sm:text-sm text-accent font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SECTION 1: Client Selection */}
          <Card className="space-y-4 p-5 sm:p-6 rounded-3xl">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">
                1. Client
              </label>
              {!showNewClientForm && (
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-accent hover:underline"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nouveau Client</span>
                </button>
              )}
            </div>

            {showNewClientForm ? (
              <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-sable/80 space-y-4">
                <p className="text-xs sm:text-sm font-bold text-sombre">Créer un client à la volée</p>
                <Input
                  label="Nom du client"
                  type="text"
                  placeholder="ex: Mariama Sow"
                  value={newClientNom}
                  onChange={(e) => setNewClientNom(e.target.value)}
                  autoFocus
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  placeholder="ex: +229 77 123 45 67"
                  value={newClientTelephone}
                  onChange={(e) => setNewClientTelephone(e.target.value)}
                />
                <div className="flex items-center justify-end gap-3 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewClientForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    onClick={handleCreateClientOnTheFly}
                  >
                    Enregistrer client
                  </Button>
                </div>
              </div>
            ) : clients.length === 0 ? (
              <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-dashed border-sable/80 text-center space-y-2">
                <p className="text-xs sm:text-sm text-sombre/70 font-semibold">Aucun client enregistré.</p>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => setShowNewClientForm(true)}
                  className="rounded-full"
                >
                  + Créer le premier client
                </Button>
              </div>
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-sable/80 rounded-2xl text-sm sm:text-base text-sombre font-bold focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent min-h-[48px] shadow-xs"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.telephone ? `(${c.telephone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </Card>

          {/* SECTION 2: Type de commande */}
          <Card className="space-y-4 p-5 sm:p-6 rounded-3xl">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">
              2. Type de Commande
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTypeCommande('couture_complete')}
                className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-2 border-2 transition-all min-h-[70px] ${typeCommande === 'couture_complete'
                  ? 'bg-accent text-white border-accent shadow-md'
                  : 'bg-white text-sombre border-sable/80 hover:border-accent'
                  }`}
              >
                <Scissors className="w-5 h-5 text-current" />
                <span>Couture Complète</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeCommande('retouche')}
                className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-2 border-2 transition-all min-h-[70px] ${typeCommande === 'retouche'
                  ? 'bg-sombre text-white border-sombre shadow-md'
                  : 'bg-white text-sombre border-sable/80 hover:border-accent'
                  }`}
              >
                <Sparkles className="w-5 h-5 text-current" />
                <span>Retouche Tenue</span>
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <Input
                label={typeCommande === 'couture_complete' ? 'Description du modèle' : 'Description de la retouche'}
                type="text"
                placeholder={
                  typeCommande === 'couture_complete'
                    ? 'ex: Robe de mariée 3 pièces brodée avec col montant'
                    : 'ex: Ourlet pantalon + reprise de taille 2cm'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              <Input
                label="Tissu (optionnel)"
                type="text"
                placeholder="ex: Bazin riche bleu nuit fourni par la cliente"
                value={tissu}
                onChange={(e) => setTissu(e.target.value)}
              />
            </div>
          </Card>

          {/* SECTION 3: Prix & Acompte */}
          <Card className="space-y-4 p-5 sm:p-6 rounded-3xl">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">
              3. Tarifs & Règlement
            </label>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prix Total (FCFA)"
                type="number"
                placeholder="ex: 50000"
                value={prixTotal}
                onChange={(e) => setPrixTotal(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />

              <Input
                label="Acompte versé (FCFA)"
                type="number"
                placeholder="ex: 25000"
                value={acompte}
                onChange={(e) => setAcompte(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="p-4 bg-[#FAFAF8] rounded-2xl flex items-center justify-between text-xs sm:text-sm border border-sable/60">
              <span className="font-bold text-sombre">Solde restant à livraison :</span>
              <span className={`font-extrabold text-sm sm:text-base ${currentSolde > 0 ? 'text-accent' : 'text-vertbouton'}`}>
                {formatFCFA(currentSolde)}
              </span>
            </div>
          </Card>

          {/* SECTION 4: Livraison & Responsable */}
          <Card className="space-y-4 p-5 sm:p-6 rounded-3xl">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">
              4. Date & Traçabilité Atelier
            </label>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Livraison Prévue"
                type="date"
                value={dateLivraison}
                onChange={(e) => setDateLivraison(e.target.value)}
                required
              />

              <Input
                label="Pris par / Responsable"
                type="text"
                placeholder="Nom du couturier"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
              />
            </div>
          </Card>

          <Button type="submit" variant="accent" fullWidth size="lg" disabled={loading || limitReached} className="gap-2 shadow-lg shadow-accent/20">
            <Check className="w-5 h-5" />
            <span>{loading ? 'Création en cours…' : 'Valider la commande'}</span>
          </Button>
        </form>
      </main>
    </div>
  );
}
