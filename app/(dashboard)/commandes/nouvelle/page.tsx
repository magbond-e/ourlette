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
import { checkCommandeLimit, SHOW_ACCOUNT_PLANS } from '@/lib/utils/planLimits';
import { useLanguage } from '@/lib/i18n';

export default function NouvelleCommandePage() {
  const router = useRouter();
  const { user, couturier } = useAuth();
  const { createNotification } = useNotifications();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

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
      }

      setClients(list);
      if (list.length > 0) {
        setSelectedClientId(list[0].id);
      }
    }
    init();
  }, [user?.id, couturier]);

  const handleCreateClientOnTheFly = async () => {
    if (!newClientNom.trim() || !user?.id) return;
    const added = await DataService.addClient(user.id, {
      nom: newClientNom.trim(),
      telephone: newClientTelephone.trim(),
    });
    if (added) {
      setClients((prev) => [added, ...prev]);
      setSelectedClientId(added.id);
      setShowNewClientForm(false);
      setNewClientNom('');
      setNewClientTelephone('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!selectedClientId) {
      setError(isEn ? 'Please choose or create a client.' : 'Veuillez sélectionner ou créer un client.');
      return;
    }

    if (!description.trim()) {
      setError(dict.nouvelleCommande.validationError);
      return;
    }

    if (!prixTotal || Number(prixTotal) <= 0) {
      setError(isEn ? 'Please specify a valid total price.' : 'Veuillez spécifier un prix total valide.');
      return;
    }

    if (!dateLivraison) {
      setError(isEn ? 'Please choose a promised delivery date.' : 'Veuillez spécifier une date de livraison promise.');
      return;
    }

    setLoading(true);
    setError('');

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
        title: isEn ? '✨ New order logged' : '✨ Nouvelle commande enregistrée',
        message: isEn
          ? `Order "${newCmd.description}" saved for ${clientObj?.nom || 'client'} (${formatFCFA(newCmd.prix_total)}).`
          : `Commande "${newCmd.description}" enregistrée pour ${clientObj?.nom || 'un client'} (${formatFCFA(newCmd.prix_total)}).`,
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
            <span>{dict.common.cancel}</span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-sombre">{dict.nouvelleCommande.title}</h2>
          <div className="w-16" />
        </div>

        {SHOW_ACCOUNT_PLANS && limitReached && (
          <Card className="p-6 bg-gradient-to-br from-sombre to-[#3D1A1E] text-white border-2 border-gold shadow-xl rounded-3xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold flex items-center justify-center shrink-0 border border-gold/40">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gold">
                  {dict.nouvelleCommande.limitBlockedTitle} ({activeCommandesCount}/10)
                </span>
                <h3 className="text-xl font-display font-bold text-white">
                  {dict.nouvelleCommande.upgradeButton}
                </h3>
                <p className="text-xs sm:text-sm text-clair/80 font-medium leading-relaxed">
                  {dict.nouvelleCommande.limitBlockedDesc}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-white/10">
              <Link href="/parametres" className="w-full sm:w-auto">
                <Button variant="gold" size="md" className="w-full sm:w-auto rounded-full font-bold text-xs sm:text-sm shadow-md">
                  {dict.landing.proPlanCta}
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
                {dict.nouvelleCommande.clientSectionTitle}
              </label>
              {!showNewClientForm && (
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-accent hover:underline"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{dict.nouvelleCommande.orAddNewClient}</span>
                </button>
              )}
            </div>

            {showNewClientForm ? (
              <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-sable/80 space-y-4">
                <p className="text-xs sm:text-sm font-bold text-sombre">{isEn ? 'Create client profile' : 'Créer un client à la volée'}</p>
                <Input
                  label={dict.nouvelleCommande.newClientNameLabel}
                  type="text"
                  placeholder={isEn ? 'e.g. Mariama Sow' : 'ex: Mariama Sow'}
                  value={newClientNom}
                  onChange={(e) => setNewClientNom(e.target.value)}
                  autoFocus
                />
                <Input
                  label={dict.nouvelleCommande.newClientPhoneLabel}
                  type="tel"
                  placeholder={isEn ? 'e.g. +229 77 123 45 67' : 'ex: +229 77 123 45 67'}
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
                    {dict.common.cancel}
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    onClick={handleCreateClientOnTheFly}
                  >
                    {dict.clients.saveClientButton}
                  </Button>
                </div>
              </div>
            ) : clients.length === 0 ? (
              <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-dashed border-sable/80 text-center space-y-2">
                <p className="text-xs sm:text-sm text-sombre/70 font-semibold">{dict.clients.emptyTitle}</p>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => setShowNewClientForm(true)}
                  className="rounded-full"
                >
                  + {dict.clients.createFirstClient}
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
              {dict.nouvelleCommande.orderDetailsTitle}
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
                <span>{dict.nouvelleCommande.typeComplete}</span>
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
                <span>{dict.nouvelleCommande.typeAlteration}</span>
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <Input
                label={dict.nouvelleCommande.descriptionLabel}
                type="text"
                placeholder={dict.nouvelleCommande.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              <Input
                label={`${dict.nouvelleCommande.fabricLabel} (${dict.common.optional})`}
                type="text"
                placeholder={dict.nouvelleCommande.fabricPlaceholder}
                value={tissu}
                onChange={(e) => setTissu(e.target.value)}
              />
            </div>
          </Card>

          {/* SECTION 3: Prix & Acompte */}
          <Card className="space-y-4 p-5 sm:p-6 rounded-3xl">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">
              {dict.nouvelleCommande.pricingTitle}
            </label>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={dict.nouvelleCommande.priceLabel}
                type="number"
                placeholder="ex: 50000"
                value={prixTotal}
                onChange={(e) => setPrixTotal(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />

              <Input
                label={dict.nouvelleCommande.depositLabel}
                type="number"
                placeholder="ex: 25000"
                value={acompte}
                onChange={(e) => setAcompte(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="p-4 bg-[#FAFAF8] rounded-2xl flex items-center justify-between text-xs sm:text-sm border border-sable/60">
              <span className="font-bold text-sombre">{dict.nouvelleCommande.balanceLabel} :</span>
              <span className={`font-extrabold text-sm sm:text-base ${currentSolde > 0 ? 'text-accent' : 'text-vertbouton'}`}>
                {formatFCFA(currentSolde)}
              </span>
            </div>
          </Card>

          {/* SECTION 4: Livraison & Responsable */}
          <Card className="space-y-4 p-5 sm:p-6 rounded-3xl">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">
              {dict.nouvelleCommande.planningTitle}
            </label>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={dict.nouvelleCommande.deliveryDateLabel}
                type="date"
                value={dateLivraison}
                onChange={(e) => setDateLivraison(e.target.value)}
                required
              />

              <Input
                label={dict.nouvelleCommande.assignedToLabel}
                type="text"
                placeholder={dict.nouvelleCommande.assignedToPlaceholder}
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
              />
            </div>
          </Card>

          <Button type="submit" variant="accent" fullWidth size="lg" disabled={loading || limitReached} className="gap-2 shadow-lg shadow-accent/20">
            <Check className="w-5 h-5" />
            <span>{loading ? dict.nouvelleCommande.submitting : dict.nouvelleCommande.submitButton}</span>
          </Button>
        </form>
      </main>
    </div>
  );
}
