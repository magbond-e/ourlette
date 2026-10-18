'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, Phone, ChevronRight, X, User, Ruler } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataService } from '@/lib/services/dataService';
import { useClients, useCommandes } from '@/lib/powersync/hooks';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { formatFCFA, calculSolde } from '@/lib/utils/formatters';

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  const clients = useClients(user?.id);
  const commandes = useCommandes(user?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newTelephone, setNewTelephone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  // Mesures directes à la création
  const [showMesuresSection, setShowMesuresSection] = useState(false);
  const [tourPoitrine, setTourPoitrine] = useState('');
  const [tourTaille, setTourTaille] = useState('');
  const [tourHanches, setTourHanches] = useState('');
  const [largeurEpaules, setLargeurEpaules] = useState('');
  const [longueurManche, setLongueurManche] = useState('');
  const [longueurRobe, setLongueurRobe] = useState('');
  const [tourCou, setTourCou] = useState('');

  // Calcul du solde dû par client
  const soldesByClientId = useMemo(() => {
    const map = new Map<string, number>();
    for (const cmd of commandes) {
      if (cmd.client_id) {
        const solde = calculSolde(cmd.prix_total, cmd.acompte);
        map.set(cmd.client_id, (map.get(cmd.client_id) || 0) + solde);
      }
    }
    return map;
  }, [commandes]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim() || !user?.id) return;

    setSavingClient(true);
    const added = await DataService.addClient(user.id, {
      nom: newNom.trim(),
      telephone: newTelephone.trim(),
      notes: newNotes.trim(),
    });

    const parseDec = (v: string) => {
      if (!v) return undefined;
      const n = parseFloat(v.replace(',', '.').trim());
      return isNaN(n) ? undefined : n;
    };

    const hasAnyMesure =
      tourPoitrine || tourTaille || tourHanches || largeurEpaules || longueurManche || longueurRobe || tourCou;

    if (added?.id && hasAnyMesure) {
      try {
        await DataService.saveMesure(user.id, added.id, {
          tour_poitrine: parseDec(tourPoitrine),
          tour_taille: parseDec(tourTaille),
          tour_hanches: parseDec(tourHanches),
          largeur_epaules: parseDec(largeurEpaules),
          longueur_manche: parseDec(longueurManche),
          longueur_robe: parseDec(longueurRobe),
          tour_cou: parseDec(tourCou),
        });
      } catch (err) {
        console.warn('Erreur sauvegarde mesures client:', err);
      }
    }

    setSavingClient(false);
    setShowAddModal(false);
    setNewNom('');
    setNewTelephone('');
    setNewNotes('');
    setTourPoitrine('');
    setTourTaille('');
    setTourHanches('');
    setLargeurEpaules('');
    setLongueurManche('');
    setLongueurRobe('');
    setTourCou('');
    setShowMesuresSection(false);

    if (added?.id) {
      router.push(`/clients/${added.id}`);
    }
  };

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.telephone && c.telephone.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans text-sombre">
      <main className="max-w-2xl mx-auto px-4 pt-3 space-y-4">

        {/* ── Entête épinglée : Titre + Nouveau client + Recherche ───── */}
        <div className="sticky top-[64px] z-20 bg-[#FAFAF8]/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 space-y-3 border-b border-sable/30 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-display font-bold text-sombre">
                  {dict.clients.title}
                </h1>
                <span className="text-xs font-bold bg-sable/40 text-sombre px-2 py-0.5 rounded-full">
                  {clients.length}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowAddModal(true)}
              className="rounded-full bg-accent hover:bg-accent/90 text-white text-xs font-bold px-4 h-9 flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ {locale === 'fr' ? 'Nouveau client' : 'New client'}</span>
            </Button>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-sombre/40" />
            <input
              type="text"
              placeholder={dict.clients.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-sable/70 rounded-xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-hidden focus:border-fonce shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-sombre/40 hover:text-accent p-0.5"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Modal Nouveau Client ────────────────────────────────────── */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-sombre/60 backdrop-blur-xs flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white p-5 space-y-4 shadow-xl border border-sable rounded-3xl">
              <div className="flex items-center justify-between border-b border-sable/40 pb-2">
                <h3 className="text-sm font-display font-bold text-sombre">
                  {dict.clients.modalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs text-sombre/50 hover:text-sombre font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddClient} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-sombre mb-1">
                    {dict.clients.nameLabel} *
                  </label>
                  <Input
                    required
                    placeholder="Ex : Aïssatou Diop"
                    value={newNom}
                    onChange={(e) => setNewNom(e.target.value)}
                    autoFocus
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-sombre mb-1">
                    {dict.clients.phoneLabel}
                  </label>
                  <Input
                    type="tel"
                    placeholder="Ex : +221 77 000 00 00"
                    value={newTelephone}
                    onChange={(e) => setNewTelephone(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-sombre mb-1">
                    {dict.clients.notesLabel} ({locale === 'fr' ? 'facultatif' : 'optional'})
                  </label>
                  <textarea
                    rows={2}
                    placeholder={dict.clients.notesPlaceholder}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full rounded-xl border border-sable/80 p-2 text-xs bg-white text-sombre focus:border-fonce focus:outline-hidden"
                  />
                </div>

                {/* Section Mesures immédiates */}
                <div className="border border-sable/70 rounded-2xl p-3 bg-[#FAF9F6]">
                  <button
                    type="button"
                    onClick={() => setShowMesuresSection(!showMesuresSection)}
                    className="w-full flex items-center justify-between text-xs font-bold text-fonce cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-accent" />
                      <span>{locale === 'fr' ? 'Saisir les mesures maintenant (facultatif)' : 'Enter measurements now (optional)'}</span>
                    </span>
                    <span className="text-accent text-xs font-bold">{showMesuresSection ? '▲' : '▼'}</span>
                  </button>

                  {showMesuresSection && (
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <div>
                        <label className="block text-[11px] font-bold text-sombre mb-0.5">{dict.mesures.chest}</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={tourPoitrine}
                            onChange={(e) => setTourPoitrine(e.target.value)}
                            className="w-full h-8 px-2.5 pr-8 bg-white border border-sable rounded-xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-sombre/40 font-bold">cm</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-sombre mb-0.5">{dict.mesures.waist}</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={tourTaille}
                            onChange={(e) => setTourTaille(e.target.value)}
                            className="w-full h-8 px-2.5 pr-8 bg-white border border-sable rounded-xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-sombre/40 font-bold">cm</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-sombre mb-0.5">{dict.mesures.hips}</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={tourHanches}
                            onChange={(e) => setTourHanches(e.target.value)}
                            className="w-full h-8 px-2.5 pr-8 bg-white border border-sable rounded-xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-sombre/40 font-bold">cm</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-sombre mb-0.5">{dict.mesures.shoulders}</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={largeurEpaules}
                            onChange={(e) => setLargeurEpaules(e.target.value)}
                            className="w-full h-8 px-2.5 pr-8 bg-white border border-sable rounded-xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-sombre/40 font-bold">cm</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-sombre mb-0.5">{dict.mesures.sleeveLength}</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={longueurManche}
                            onChange={(e) => setLongueurManche(e.target.value)}
                            className="w-full h-8 px-2.5 pr-8 bg-white border border-sable rounded-xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-sombre/40 font-bold">cm</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-sombre mb-0.5">{dict.mesures.dressLength}</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={longueurRobe}
                            onChange={(e) => setLongueurRobe(e.target.value)}
                            className="w-full h-8 px-2.5 pr-8 bg-white border border-sable rounded-xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-sombre/40 font-bold">cm</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-sombre mb-0.5">{dict.mesures.neck}</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={tourCou}
                            onChange={(e) => setTourCou(e.target.value)}
                            className="w-full h-8 px-2.5 pr-8 bg-white border border-sable rounded-xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-sombre/40 font-bold">cm</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-sable/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl h-9 text-xs px-3 border-sable text-sombre/70"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingClient}
                    className="rounded-xl h-9 text-xs px-4 bg-accent hover:bg-accent/90 text-white font-bold"
                  >
                    {savingClient
                      ? (locale === 'fr' ? 'Enregistrement…' : 'Saving…')
                      : (locale === 'fr' ? 'Enregistrer le client' : 'Save client')}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* ── Liste des clients ───────────────────────────────────────── */}
        {filteredClients.length === 0 ? (
          <Card className="py-12 px-4 text-center space-y-3 bg-white border border-dashed border-sable rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-sable/20 text-sombre/50 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-sombre">
                {searchQuery
                  ? (locale === 'fr' ? `Aucun client trouvé pour « ${searchQuery} »` : `No client found for "${searchQuery}"`)
                  : (locale === 'fr' ? 'Aucun client enregistré' : 'No clients yet')}
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="rounded-full bg-accent hover:bg-accent/90 text-white text-xs font-bold px-4 h-9 shadow-xs"
            >
              + {locale === 'fr' ? 'Ajouter un client' : 'Add client'}
            </Button>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredClients.map((client) => {
              const soldeDu = soldesByClientId.get(client.id) || 0;

              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block group"
                >
                  <Card className="p-3.5 sm:p-4 rounded-2xl bg-white border border-sable/60 shadow-2xs hover:border-fonce transition-all active:scale-[0.99] flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-sm sm:text-base text-sombre truncate group-hover:text-fonce">
                          {client.nom}
                        </h2>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs">
                        {client.telephone ? (
                          <span className="text-sombre/70 font-semibold flex items-center gap-1">
                            <Phone className="w-3 h-3 text-sombre/50 shrink-0" />
                            <span>{client.telephone}</span>
                          </span>
                        ) : (
                          <span className="text-sombre/40 italic text-[11px]">
                            {locale === 'fr' ? 'Aucun téléphone' : 'No phone'}
                          </span>
                        )}

                        {/* Mention solde dû si > 0 */}
                        {soldeDu > 0 && (
                          <span className="font-bold text-vertbouton text-xs bg-vertbouton/10 px-2 py-0.5 rounded-md">
                            {locale === 'fr' ? 'Solde dû' : 'Balance due'} : {formatFCFA(soldeDu)} FCFA
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-sombre/40 group-hover:text-fonce transition-colors shrink-0" />
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
