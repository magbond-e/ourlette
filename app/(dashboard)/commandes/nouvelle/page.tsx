'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, UserPlus, Scissors, Check, Sparkles, Ruler, Search, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Client, TypeCommande, Mesure } from '@/lib/types/database';
import { calculSolde, formatFCFA, formatDateFR } from '@/lib/utils/formatters';
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

  // Client Selection State & Search
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState<string>('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientNom, setNewClientNom] = useState('');
  const [newClientTelephone, setNewClientTelephone] = useState('');

  // Client Measurements State
  const [clientMesure, setClientMesure] = useState<Mesure | null>(null);
  const [showMesuresAccordion, setShowMesuresAccordion] = useState<boolean>(false);
  const [mesuresModified, setMesuresModified] = useState<boolean>(false);

  const [tourPoitrine, setTourPoitrine] = useState<string>('');
  const [tourTaille, setTourTaille] = useState<string>('');
  const [tourHanches, setTourHanches] = useState<string>('');
  const [largeurEpaules, setLargeurEpaules] = useState<string>('');
  const [longueurManche, setLongueurManche] = useState<string>('');
  const [longueurRobe, setLongueurRobe] = useState<string>('');
  const [tourCou, setTourCou] = useState<string>('');

  // Order Details
  const [typeCommande, setTypeCommande] = useState<TypeCommande>('couture_complete');
  const [description, setDescription] = useState('');
  const [tissu, setTissu] = useState('');
  const [prixTotal, setPrixTotal] = useState<string>('');
  const [acompte, setAcompte] = useState<string>('');
  const [dateLivraison, setDateLivraison] = useState('');
  const [responsable, setResponsable] = useState('');

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

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
      setShowMesuresAccordion(true);
      return;
    }
    const m = await DataService.getMesureByClientId(user.id, cId);
    if (m) {
      setClientMesure(m);
      setTourPoitrine(m.tour_poitrine != null ? String(m.tour_poitrine) : '');
      setTourTaille(m.tour_taille != null ? String(m.tour_taille) : '');
      setTourHanches(m.tour_hanches != null ? String(m.tour_hanches) : '');
      setLargeurEpaules(m.largeur_epaules != null ? String(m.largeur_epaules) : '');
      setLongueurManche(m.longueur_manche != null ? String(m.longueur_manche) : '');
      setLongueurRobe(m.longueur_robe != null ? String(m.longueur_robe) : '');
      setTourCou(m.tour_cou != null ? String(m.tour_cou) : '');
      // Replié par défaut si le client a déjà des mesures
      setShowMesuresAccordion(false);
    } else {
      setClientMesure(null);
      setTourPoitrine('');
      setTourTaille('');
      setTourHanches('');
      setLargeurEpaules('');
      setLongueurManche('');
      setLongueurRobe('');
      setTourCou('');
      // Ouvert s'il n'en a pas
      setShowMesuresAccordion(true);
    }
    setMesuresModified(false);
  }, [user?.id]);

  useEffect(() => {
    if (selectedClientId) {
      loadClientMesures(selectedClientId);
    }
  }, [selectedClientId, loadClientMesures]);

  // Clients filtrés par recherche
  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.telephone && c.telephone.toLowerCase().includes(q))
    );
  }, [clients, clientSearch]);

  const selectedClientObj = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

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
      setShowMesuresAccordion(true); // Ouvert pour le nouveau client sans mesures
      setNewClientNom('');
      setNewClientTelephone('');
    }
  };

  // Parsing des nombres avec support virgule
  const parseDecimal = (val: string): number | null => {
    if (!val || !val.trim()) return null;
    const cleaned = val.replace(',', '.').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const numPrixTotal = parseDecimal(prixTotal) ?? 0;
  const numAcompte = parseDecimal(acompte) ?? 0;
  const currentSolde = calculSolde(numPrixTotal, numAcompte);

  // Erreurs de validation
  const acompteExceedsPrice = numPrixTotal > 0 && numAcompte > numPrixTotal;

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);
  const isPastDeliveryDate = dateLivraison && dateLivraison < todayStr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!selectedClientId) {
      setGeneralError(isEn ? 'Please choose or create a client.' : 'Veuillez sélectionner ou créer un client.');
      return;
    }

    if (!description.trim()) {
      setGeneralError(isEn ? 'Please describe the garment or alteration.' : 'Veuillez décrire le modèle ou la retouche.');
      return;
    }

    if (!dateLivraison) {
      setGeneralError(isEn ? 'Please choose a delivery date.' : 'Veuillez indiquer la date de livraison promise.');
      return;
    }

    if (acompteExceedsPrice) {
      setGeneralError(isEn ? 'Deposit cannot be greater than total price.' : 'L’acompte ne peut pas être supérieur au prix total.');
      return;
    }

    setLoading(true);
    setGeneralError('');

    // 1. Sauvegarde des mesures si modifiées ou renseignées
    if (
      mesuresModified ||
      tourPoitrine ||
      tourTaille ||
      tourHanches ||
      largeurEpaules ||
      longueurManche ||
      longueurRobe ||
      tourCou
    ) {
      try {
        await DataService.saveMesure(user.id, selectedClientId, {
          tour_poitrine: parseDecimal(tourPoitrine),
          tour_taille: parseDecimal(tourTaille),
          tour_hanches: parseDecimal(tourHanches),
          largeur_epaules: parseDecimal(largeurEpaules),
          longueur_manche: parseDecimal(longueurManche),
          longueur_robe: parseDecimal(longueurRobe),
          tour_cou: parseDecimal(tourCou),
          prise_par: responsable.trim() || couturier?.nom || '',
        });
      } catch (err) {
        console.warn('Erreur sauvegarde mesures:', err);
      }
    }

    // 2. Création de la commande
    const newCmd = await DataService.addCommande(user.id, {
      client_id: selectedClientId,
      type_commande: typeCommande,
      description: description.trim(),
      tissu: typeCommande === 'couture_complete' ? tissu.trim() : undefined,
      responsable: responsable.trim() || undefined,
      prix_total: numPrixTotal,
      acompte: numAcompte,
      date_livraison_prevue: dateLivraison,
    });

    if (newCmd && newCmd.id) {
      await createNotification({
        type: 'order_created',
        category: 'order',
        priority: 'medium',
        title: isEn ? '✨ New order logged' : '✨ Nouvelle commande enregistrée',
        message: isEn
          ? `Order "${newCmd.description}" saved for ${selectedClientObj?.nom || 'client'}.`
          : `Commande "${newCmd.description}" enregistrée pour ${selectedClientObj?.nom || 'un client'}.`,
        link: `/commandes/${newCmd.id}`,
        orderId: newCmd.id,
        metadata: { orderId: newCmd.id, clientId: selectedClientId },
      });
      router.push(`/commandes/${newCmd.id}`);
    } else {
      setLoading(false);
      router.push('/commandes');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-32 font-sans text-sombre">
      <main className="max-w-2xl mx-auto px-4 pt-3 space-y-4">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/commandes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sombre/70 hover:text-fonce bg-white px-3 py-1.5 rounded-full border border-sable/70 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{dict.nouvelleCommande.backButton}</span>
          </Link>
          <span className="text-[11px] font-bold text-fonce bg-sable/30 px-3 py-1 rounded-full">
            {locale === 'fr' ? 'Nouvelle commande' : 'New order'}
          </span>
        </div>

        {/* Bloc d'avertissement limite */}
        {limitReached && SHOW_ACCOUNT_PLANS && (
          <Card className="bg-sombre text-white border border-gold/40 shadow-sm p-4 space-y-3 rounded-3xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-display font-bold text-gold">
                  {dict.nouvelleCommande.limitBlockedTitle}
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  {dict.nouvelleCommande.limitBlockedDesc}
                </p>
              </div>
            </div>
            <div className="pt-1 flex justify-end">
              <Link href="/pro">
                <Button className="rounded-full bg-gold text-sombre hover:bg-gold/90 font-bold text-xs h-9 px-4">
                  {locale === 'fr' ? 'Passer en Pro' : 'Upgrade to Pro'}
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {generalError && !limitReached && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ── 1. SECTION : CLIENT ───────────────────────────────────── */}
          <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-fonce">
                1. {locale === 'fr' ? 'Client' : 'Client'} *
              </label>
              {!showNewClientForm && (
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ {locale === 'fr' ? 'Nouveau client' : 'New client'}</span>
                </button>
              )}
            </div>

            {showNewClientForm ? (
              <div className="p-3 bg-[#FAFAF8] rounded-2xl border border-sable/80 space-y-3">
                <p className="text-xs font-bold text-sombre">
                  {locale === 'fr' ? 'Créer un nouveau client' : 'Create new client'}
                </p>
                <Input
                  label={dict.nouvelleCommande.newClientNameLabel}
                  type="text"
                  placeholder="Ex : Mariama Sow"
                  value={newClientNom}
                  onChange={(e) => setNewClientNom(e.target.value)}
                  autoFocus
                  className="h-10 text-xs rounded-xl"
                />
                <Input
                  label={dict.nouvelleCommande.newClientPhoneLabel}
                  type="tel"
                  placeholder="Ex : +229 97 00 00 00"
                  value={newClientTelephone}
                  onChange={(e) => setNewClientTelephone(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewClientForm(false)}
                    className="rounded-xl h-9 text-xs px-3 border-sable text-sombre/70"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateClientOnTheFly}
                    className="rounded-xl h-9 text-xs px-4 bg-accent hover:bg-accent/90 text-white font-bold"
                  >
                    {locale === 'fr' ? 'Enregistrer le client' : 'Save client'}
                  </Button>
                </div>
              </div>
            ) : clients.length === 0 ? (
              <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-dashed border-sable text-center space-y-2">
                <p className="text-xs text-sombre/70 font-semibold">
                  {locale === 'fr' ? 'Aucun client enregistré' : 'No clients found'}
                </p>
                <Button
                  type="button"
                  onClick={() => setShowNewClientForm(true)}
                  className="rounded-full bg-sombre text-white text-xs font-bold h-9 px-4"
                >
                  + {locale === 'fr' ? 'Ajouter un premier client' : 'Add first client'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Sélecteur de client avec recherche rapide intégrée */}
                <div className="relative">
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre font-bold focus:outline-hidden focus:border-fonce shadow-2xs cursor-pointer"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} {c.telephone ? `(${c.telephone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClientObj && (
                  <p className="text-[11px] text-sombre/60 pl-1">
                    {selectedClientObj.telephone ? `📞 ${selectedClientObj.telephone}` : (locale === 'fr' ? 'Aucun numéro' : 'No phone')}
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* ── 2. SECTION : MESURES (Accordéon) ──────────────────────── */}
          {selectedClientId && (typeCommande === 'couture_complete' || showMesuresAccordion) && (
            <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-3">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowMesuresAccordion(!showMesuresAccordion)}
              >
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-fonce" />
                  <span className="text-xs font-bold uppercase tracking-wider text-fonce">
                    2. {locale === 'fr' ? 'Mesures du client' : 'Measurements'}
                  </span>
                  {clientMesure && !showMesuresAccordion && (
                    <span className="text-[11px] text-vertbouton font-semibold bg-vertbouton/10 px-2 py-0.5 rounded-full">
                      {clientMesure.date_maj ? `Du ${formatDateFR(clientMesure.date_maj, locale)}` : 'Renseignées'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-sombre/70">
                  <span>{showMesuresAccordion ? (locale === 'fr' ? 'Replier' : 'Collapse') : (locale === 'fr' ? 'Modifier' : 'Edit')}</span>
                  {showMesuresAccordion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Contenu de l'accordéon */}
              {showMesuresAccordion ? (
                <div className="pt-2 space-y-3 border-t border-sable/30">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { label: dict.mesures.chest, val: tourPoitrine, setter: setTourPoitrine, placeholder: '92' },
                      { label: dict.mesures.waist, val: tourTaille, setter: setTourTaille, placeholder: '74' },
                      { label: dict.mesures.hips, val: tourHanches, setter: setTourHanches, placeholder: '102' },
                      { label: dict.mesures.shoulders, val: largeurEpaules, setter: setLargeurEpaules, placeholder: '40' },
                      { label: dict.mesures.sleeveLength, val: longueurManche, setter: setLongueurManche, placeholder: '60' },
                      { label: dict.mesures.dressLength, val: longueurRobe, setter: setLongueurRobe, placeholder: '140' },
                      { label: dict.mesures.neck, val: tourCou, setter: setTourCou, placeholder: '38' },
                    ].map((m) => (
                      <div key={m.label} className="space-y-1">
                        <label className="block text-[11px] font-bold text-sombre/80 truncate">
                          {m.label}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={m.val}
                            placeholder={m.placeholder}
                            onChange={(e) => {
                              m.setter(e.target.value);
                              setMesuresModified(true);
                            }}
                            className="w-full h-10 px-2.5 pr-7 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce"
                          />
                          <span className="absolute right-2 top-2.5 text-[10px] font-bold text-sombre/40">
                            cm
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-sombre/50 italic">
                    {locale === 'fr'
                      ? 'Les modifications de mesures seront enregistrées sur la fiche du client.'
                      : 'Changes will be saved directly to the client’s profile.'}
                  </p>
                </div>
              ) : (
                /* Résumé compact quand replié */
                clientMesure && (
                  <div className="flex items-center gap-3 overflow-x-auto py-1 text-xs text-sombre/70 font-semibold no-scrollbar">
                    {tourPoitrine && <span>Poitrine : <strong>{tourPoitrine} cm</strong></span>}
                    {tourTaille && <span>Taille : <strong>{tourTaille} cm</strong></span>}
                    {tourHanches && <span>Bassin : <strong>{tourHanches} cm</strong></span>}
                    {longueurRobe && <span>Longueur : <strong>{longueurRobe} cm</strong></span>}
                  </div>
                )
              )}
            </Card>
          )}

          {/* ── 3. SECTION : TYPE DE COMMANDE ─────────────────────────── */}
          <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-fonce">
              3. {locale === 'fr' ? 'Type de prestation' : 'Order Type'} *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTypeCommande('couture_complete')}
                className={`p-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-2 transition-all h-12 cursor-pointer ${
                  typeCommande === 'couture_complete'
                    ? 'bg-accent text-white border-accent shadow-2xs'
                    : 'bg-white text-sombre border-sable/70 hover:border-sombre'
                }`}
              >
                <Scissors className="w-4 h-4 shrink-0" />
                <span>{locale === 'fr' ? 'Couture complète' : 'Bespoke tailoring'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeCommande('retouche')}
                className={`p-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-2 transition-all h-12 cursor-pointer ${
                  typeCommande === 'retouche'
                    ? 'bg-sombre text-white border-sombre shadow-2xs'
                    : 'bg-white text-sombre border-sable/70 hover:border-sombre'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{locale === 'fr' ? 'Retouche' : 'Alteration'}</span>
              </button>
            </div>
          </Card>

          {/* ── 4. SECTION : DÉTAILS ───────────────────────────────────── */}
          <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-fonce">
              4. {locale === 'fr' ? 'Détails du modèle' : 'Details'} *
            </label>

            <div>
              <label className="block text-xs font-bold text-sombre mb-1">
                {typeCommande === 'couture_complete'
                  ? (locale === 'fr' ? 'Quel modèle ?' : 'What design / garment?')
                  : (locale === 'fr' ? 'Quelle retouche ?' : 'What alteration?')} *
              </label>
              <Input
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  typeCommande === 'couture_complete'
                    ? (locale === 'fr' ? 'Ex : Robe sirène avec manches ballon' : 'Ex: Mermaid dress with puff sleeves')
                    : (locale === 'fr' ? 'Ex : Reprendre la taille de 4 cm et ourlet' : 'Ex: Take in waist by 4cm and hem')
                }
                className="rounded-2xl h-11 text-xs"
              />
            </div>

            {/* Tissu : Affiché UNIQUEMENT pour une couture complète */}
            {typeCommande === 'couture_complete' && (
              <div>
                <label className="block text-xs font-bold text-sombre mb-1">
                  {locale === 'fr' ? 'Tissu fourni' : 'Fabric'} ({locale === 'fr' ? 'facultatif' : 'optional'})
                </label>
                <Input
                  value={tissu}
                  onChange={(e) => setTissu(e.target.value)}
                  placeholder="Ex : Wax Hollandais 3 pagnes, Bazin riche bleu ciel"
                  className="rounded-2xl h-11 text-xs"
                />
              </div>
            )}
          </Card>

          {/* ── 5. SECTION : ARGENT ────────────────────────────────────── */}
          <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-fonce">
                5. {locale === 'fr' ? 'Montant & Acompte' : 'Pricing'}
              </label>
              <span className="text-[10px] text-sombre/50 italic">
                {locale === 'fr' ? 'Prix facultatif à la création' : 'Price optional initially'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-sombre mb-1">
                  {locale === 'fr' ? 'Prix total' : 'Total price'} (FCFA)
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={prixTotal}
                  onChange={(e) => setPrixTotal(e.target.value)}
                  placeholder="Ex : 25 000"
                  className="rounded-2xl h-11 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sombre mb-1">
                  {locale === 'fr' ? 'Acompte versé' : 'Deposit paid'} (FCFA)
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={acompte}
                  onChange={(e) => setAcompte(e.target.value)}
                  placeholder="Ex : 10 000"
                  className="rounded-2xl h-11 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Erreur sous le champ acompte si supérieur au prix */}
            {acompteExceedsPrice && (
              <p className="text-xs font-bold text-rose-600">
                ⚠️ {locale === 'fr' ? 'L’acompte ne peut pas dépasser le prix total.' : 'Deposit cannot exceed total price.'}
              </p>
            )}

            {/* Solde calculé en direct */}
            <div className="p-3 bg-[#FAFAF8] rounded-2xl flex items-center justify-between text-xs border border-sable/50">
              <span className="font-bold text-sombre">
                {locale === 'fr' ? 'Solde restant dû' : 'Remaining balance'} :
              </span>
              <span className={`font-extrabold text-sm ${currentSolde > 0 ? 'text-vertbouton' : 'text-sombre/60'}`}>
                {formatFCFA(currentSolde)} <span className="text-[10px] uppercase">FCFA</span>
              </span>
            </div>
          </Card>

          {/* ── 6. SECTION : LIVRAISON ─────────────────────────────────── */}
          <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-fonce">
              6. {locale === 'fr' ? 'Date de livraison' : 'Delivery date'} *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-sombre mb-1">
                  {locale === 'fr' ? 'Livraison promise pour le' : 'Promised delivery date'} *
                </label>
                <Input
                  type="date"
                  required
                  value={dateLivraison}
                  onChange={(e) => setDateLivraison(e.target.value)}
                  className="rounded-2xl h-11 text-xs font-semibold"
                />
                {/* Avertissement non bloquant si date passée */}
                {isPastDeliveryDate && (
                  <p className="text-[11px] font-bold text-amber-700 mt-1">
                    ⚠️ {locale === 'fr' ? 'Cette date de livraison est antérieure à aujourd’hui.' : 'This date is in the past.'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-sombre mb-1">
                  {locale === 'fr' ? 'Responsable couture' : 'Assigned tailor'}
                </label>
                <Input
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  placeholder="Ex : Maître Adia"
                  className="rounded-2xl h-11 text-xs"
                />
              </div>
            </div>
          </Card>

          {/* ── Barre d'action fixée en bas ──────────────────────────── */}
          <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-sable/50 p-4 z-30 shadow-lg">
            <div className="max-w-2xl mx-auto">
              <Button
                type="submit"
                disabled={loading || limitReached}
                className="w-full rounded-2xl h-12 bg-accent hover:bg-fonce text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>
                  {loading
                    ? (locale === 'fr' ? 'Enregistrement de la commande…' : 'Saving order…')
                    : (locale === 'fr' ? 'Enregistrer la commande' : 'Save order')}
                </span>
              </Button>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}

export default function NouvelleCommandePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
          <ThreadSpoolLoader size="lg" />
        </div>
      }
    >
      <NouvelleCommandeContent />
    </Suspense>
  );
}
