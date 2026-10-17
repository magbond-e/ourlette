'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, UserPlus, Scissors, Check, Sparkles, Ruler } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Client, TypeCommande, Mesure } from '@/lib/types/database';
import { calculSolde, formatFCFA } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';
import { checkCommandeLimit, SHOW_ACCOUNT_PLANS } from '@/lib/utils/planLimits';
import { useLanguage } from '@/lib/i18n';

function NouvelleCommandeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClientId = searchParams?.get('clientId') || '';

  const { user, couturier, loading: authLoading } = useAuth();
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

  // Client Measurements State
  const [clientMesure, setClientMesure] = useState<Mesure | null>(null);
  const [showMesuresForm, setShowMesuresForm] = useState<boolean>(false);
  const [mesuresModified, setMesuresModified] = useState<boolean>(false);

  const [tourPoitrine, setTourPoitrine] = useState<number | ''>('');
  const [tourTaille, setTourTaille] = useState<number | ''>('');
  const [tourHanches, setTourHanches] = useState<number | ''>('');
  const [longueurManche, setLongueurManche] = useState<number | ''>('');
  const [longueurRobe, setLongueurRobe] = useState<number | ''>('');
  const [tourCou, setTourCou] = useState<number | ''>('');
  const [largeurEpaules, setLargeurEpaules] = useState<number | ''>('');

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
      if (authLoading || !user?.id) return;
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

      // Support du pré-sélectionnement par URL (?clientId=...)
      if (queryClientId && list.some((c) => c.id === queryClientId)) {
        setSelectedClientId(queryClientId);
      } else if (list.length > 0) {
        setSelectedClientId(list[0].id);
      }
    }
    init();
  }, [user?.id, couturier, authLoading, queryClientId]);

  // Chargement des mesures lorsque le client sélectionné change
  const loadClientMesures = useCallback(async (cId: string) => {
    if (!user?.id || !cId) {
      setClientMesure(null);
      return;
    }
    const m = await DataService.getMesureByClientId(user.id, cId);
    if (m) {
      setClientMesure(m);
      setTourPoitrine(m.tour_poitrine ?? '');
      setTourTaille(m.tour_taille ?? '');
      setTourHanches(m.tour_hanches ?? '');
      setLongueurManche(m.longueur_manche ?? '');
      setLongueurRobe(m.longueur_robe ?? '');
      setTourCou(m.tour_cou ?? '');
      setLargeurEpaules(m.largeur_epaules ?? '');
    } else {
      setClientMesure(null);
      setTourPoitrine('');
      setTourTaille('');
      setTourHanches('');
      setLongueurManche('');
      setLongueurRobe('');
      setTourCou('');
      setLargeurEpaules('');
    }
    setMesuresModified(false);
  }, [user?.id]);

  useEffect(() => {
    if (selectedClientId) {
      loadClientMesures(selectedClientId);
    }
  }, [selectedClientId, loadClientMesures]);

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
      setShowMesuresForm(true); // Ouvrir automatiquement la prise de mesure pour ce nouveau client
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

    // 1. Enregistrer ou mettre à jour les mesures si saisies/modifiées
    if (
      mesuresModified ||
      tourPoitrine !== '' ||
      tourTaille !== '' ||
      tourHanches !== '' ||
      longueurManche !== '' ||
      longueurRobe !== '' ||
      largeurEpaules !== '' ||
      tourCou !== ''
    ) {
      try {
        await DataService.saveMesure(user.id, selectedClientId, {
          tour_poitrine: tourPoitrine === '' ? null : Number(tourPoitrine),
          tour_taille: tourTaille === '' ? null : Number(tourTaille),
          tour_hanches: tourHanches === '' ? null : Number(tourHanches),
          longueur_manche: longueurManche === '' ? null : Number(longueurManche),
          longueur_robe: longueurRobe === '' ? null : Number(longueurRobe),
          tour_cou: tourCou === '' ? null : Number(tourCou),
          largeur_epaules: largeurEpaules === '' ? null : Number(largeurEpaules),
          prise_par: responsable.trim() || (couturier?.nom || ''),
        });
      } catch (err) {
        console.warn('Erreur enregistrement mesures sur commande:', err);
      }
    }

    // 2. Enregistrer la commande
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
  const selectedClientObj = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="min-h-screen bg-clair pb-24 font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/commandes"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sombre/70 hover:text-accent bg-white px-3.5 py-1.5 rounded-full border border-sable/70 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{dict.nouvelleCommande.backButton}</span>
          </Link>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
            {dict.commandes.newOrderButton}
          </span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
            {dict.nouvelleCommande.title}
          </h2>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold mt-1">
            {dict.commandes.subtitle}
          </p>
        </div>

        {/* Free Plan Threshold Warning */}
        {limitReached && SHOW_ACCOUNT_PLANS && (
          <Card className="bg-gradient-to-br from-sombre via-fonce to-[#3B1117] text-white border border-gold/40 shadow-xl p-5 sm:p-6 space-y-3.5 rounded-3xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gold/20 text-gold flex items-center justify-center shrink-0 border border-gold/40">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  {dict.nouvelleCommande.limitBlockedTitle}
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
          <Card className="space-y-4 p-5 sm:p-6 rounded-3xl bg-white border-sable/60 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">
                {dict.nouvelleCommande.clientSectionTitle}
              </label>
              {!showNewClientForm && (
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-accent hover:underline cursor-pointer"
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
                  placeholder={isEn ? 'e.g. +229 01 40 87 28 36' : 'ex: +229 01 40 87 28 36'}
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
                className="w-full px-4 py-3 bg-white border border-sable/80 rounded-2xl text-sm sm:text-base text-sombre font-bold focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent min-h-[48px] shadow-xs cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.telephone ? `(${c.telephone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </Card>

          {/* SECTION 1.5: Fiche Mesures du Client (Directive 6 point 1) */}
          {selectedClientId && (
            <Card className="space-y-4 p-5 sm:p-6 rounded-3xl bg-white border-sable/60 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-sable/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Ruler className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">
                      {isEn ? 'Client Measurements' : 'Fiche Mesures du Client'}
                    </h3>
                    <p className="text-[11px] text-sombre/60 font-semibold">
                      {selectedClientObj ? selectedClientObj.nom : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMesuresForm(!showMesuresForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sable/80 text-xs font-bold text-sombre bg-[#FAFAF8] hover:bg-white transition-all cursor-pointer shadow-2xs"
                >
                  <Ruler className="w-3.5 h-3.5 text-accent" />
                  <span>
                    {showMesuresForm
                      ? (isEn ? 'Collapse' : 'Masquer')
                      : clientMesure
                      ? (isEn ? 'Edit measurements' : 'Modifier les mesures')
                      : (isEn ? '+ Take measurements' : '+ Saisir les mesures')}
                  </span>
                </button>
              </div>

              {/* Aperçu rapide si replié */}
              {!showMesuresForm && (
                clientMesure ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { label: dict.mesures.chest, val: tourPoitrine },
                      { label: dict.mesures.waist, val: tourTaille },
                      { label: dict.mesures.hips, val: tourHanches },
                      { label: dict.mesures.sleeveLength, val: longueurManche },
                    ].map(
                      (item) =>
                        item.val !== '' &&
                        item.val != null && (
                          <div key={item.label} className="p-2.5 bg-[#FAFAF8] rounded-xl flex justify-between items-center border border-sable/40">
                            <span className="text-sombre/60 text-[10px] font-semibold">{item.label}</span>
                            <strong className="font-bold text-sombre text-xs">{item.val} cm</strong>
                          </div>
                        )
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 bg-[#FAFAF8] rounded-2xl border border-dashed border-sable/70 text-xs">
                    <span className="text-sombre/60 font-semibold italic">
                      {isEn ? 'No measurements recorded for this client yet.' : 'Aucune mesure enregistrée pour ce client.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMesuresForm(true)}
                      className="text-xs font-extrabold text-accent hover:underline cursor-pointer"
                    >
                      + {isEn ? 'Take now' : 'Prendre maintenant'}
                    </button>
                  </div>
                )
              )}

              {/* Formulaire complet de mesures */}
              {showMesuresForm && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Input
                      label={`${dict.mesures.chest} (cm)`}
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="ex: 92"
                      value={tourPoitrine}
                      onChange={(e) => {
                        setTourPoitrine(e.target.value === '' ? '' : Number(e.target.value));
                        setMesuresModified(true);
                      }}
                    />
                    <Input
                      label={`${dict.mesures.waist} (cm)`}
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="ex: 74"
                      value={tourTaille}
                      onChange={(e) => {
                        setTourTaille(e.target.value === '' ? '' : Number(e.target.value));
                        setMesuresModified(true);
                      }}
                    />
                    <Input
                      label={`${dict.mesures.hips} (cm)`}
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="ex: 102"
                      value={tourHanches}
                      onChange={(e) => {
                        setTourHanches(e.target.value === '' ? '' : Number(e.target.value));
                        setMesuresModified(true);
                      }}
                    />
                    <Input
                      label={`${dict.mesures.shoulders} (cm)`}
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="ex: 40"
                      value={largeurEpaules}
                      onChange={(e) => {
                        setLargeurEpaules(e.target.value === '' ? '' : Number(e.target.value));
                        setMesuresModified(true);
                      }}
                    />
                    <Input
                      label={`${dict.mesures.sleeveLength} (cm)`}
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="ex: 60"
                      value={longueurManche}
                      onChange={(e) => {
                        setLongueurManche(e.target.value === '' ? '' : Number(e.target.value));
                        setMesuresModified(true);
                      }}
                    />
                    <Input
                      label={`${dict.mesures.dressLength} (cm)`}
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="ex: 140"
                      value={longueurRobe}
                      onChange={(e) => {
                        setLongueurRobe(e.target.value === '' ? '' : Number(e.target.value));
                        setMesuresModified(true);
                      }}
                    />
                    <Input
                      label={`${dict.mesures.neck} (cm)`}
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="ex: 38"
                      value={tourCou}
                      onChange={(e) => {
                        setTourCou(e.target.value === '' ? '' : Number(e.target.value));
                        setMesuresModified(true);
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-sombre/50 italic font-medium">
                    {isEn
                      ? '💡 Measurements entered here will be saved to the client profile upon order validation.'
                      : '💡 Les mesures saisies ici seront automatiquement enregistrées dans la fiche du client lors de la validation.'}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* SECTION 2: Type de commande */}
          <Card className="space-y-4 p-5 sm:p-6 rounded-3xl bg-white border-sable/60 shadow-xs">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">
              {dict.nouvelleCommande.orderDetailsTitle}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTypeCommande('couture_complete')}
                className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-2 border-2 transition-all min-h-[70px] cursor-pointer ${
                  typeCommande === 'couture_complete'
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
                className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-2 border-2 transition-all min-h-[70px] cursor-pointer ${
                  typeCommande === 'retouche'
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
          <Card className="space-y-4 p-5 sm:p-6 rounded-3xl bg-white border-sable/60 shadow-xs">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">
              {dict.nouvelleCommande.pricingTitle}
            </label>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={dict.nouvelleCommande.priceLabel}
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="ex: 50000"
                value={prixTotal}
                onChange={(e) => setPrixTotal(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />

              <Input
                label={dict.nouvelleCommande.depositLabel}
                type="number"
                step="any"
                inputMode="decimal"
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
          <Card className="space-y-4 p-5 sm:p-6 rounded-3xl bg-white border-sable/60 shadow-xs">
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

          <Button type="submit" variant="accent" fullWidth size="lg" disabled={loading || limitReached} className="gap-2 shadow-lg shadow-accent/20 cursor-pointer">
            <Check className="w-5 h-5" />
            <span>{loading ? dict.nouvelleCommande.submitting : dict.nouvelleCommande.submitButton}</span>
          </Button>
        </form>
      </main>
    </div>
  );
}

export default function NouvelleCommandePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-clair flex items-center justify-center"><ThreadSpoolLoader size="lg" /></div>}>
      <NouvelleCommandeContent />
    </Suspense>
  );
}
