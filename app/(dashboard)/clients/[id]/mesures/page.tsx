'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Ruler, Plus, Trash2, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BasteLine } from '@/components/ui/BasteLine';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Client } from '@/lib/types/database';
import { useAuth } from '@/lib/context/AuthContext';

export default function FormulaireMesuresPage() {
  const params = useParams();
  const router = useRouter();
  const { user, couturier } = useAuth();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);

  // Standard measurement fields (numeric cm)
  const [tourPoitrine, setTourPoitrine] = useState<number | ''>('');
  const [tourTaille, setTourTaille] = useState<number | ''>('');
  const [tourHanches, setTourHanches] = useState<number | ''>('');
  const [longueurManche, setLongueurManche] = useState<number | ''>('');
  const [longueurRobe, setLongueurRobe] = useState<number | ''>('');
  const [tourCou, setTourCou] = useState<number | ''>('');
  const [largeurEpaules, setLargeurEpaules] = useState<number | ''>('');

  // Custom fields
  const [customFields, setCustomFields] = useState<{ label: string; value: string }[]>([]);
  const [prisePar, setPrisePar] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = useCallback(async () => {
    if (!user?.id || !clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const c = await DataService.getClientById(user.id, clientId);
    if (c) {
      setClient(c);
      const m = await DataService.getMesureByClientId(user.id, clientId);
      if (m) {
        setTourPoitrine(m.tour_poitrine ?? '');
        setTourTaille(m.tour_taille ?? '');
        setTourHanches(m.tour_hanches ?? '');
        setLongueurManche(m.longueur_manche ?? '');
        setLongueurRobe(m.longueur_robe ?? '');
        setTourCou(m.tour_cou ?? '');
        setLargeurEpaules(m.largeur_epaules ?? '');
        setPrisePar(m.prise_par || couturier?.nom || '');

        if (m.champs_personnalises) {
          const list = Object.entries(m.champs_personnalises).map(([label, value]) => ({
            label,
            value: String(value),
          }));
          setCustomFields(list);
        }
      } else if (couturier?.nom) {
        setPrisePar(couturier.nom);
      }
    }
    setLoading(false);
  }, [user?.id, clientId, couturier?.nom]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { label: '', value: '' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (index: number, key: 'label' | 'value', val: string) => {
    const updated = [...customFields];
    updated[index][key] = val;
    setCustomFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !user?.id) return;

    setSaving(true);

    const customDict: Record<string, number | string> = {};
    customFields.forEach((item) => {
      if (item.label.trim()) {
        const numVal = Number(item.value);
        customDict[item.label.trim()] = isNaN(numVal) || item.value === '' ? item.value : numVal;
      }
    });

    await DataService.saveMesure(user.id, client.id, {
      tour_poitrine: tourPoitrine === '' ? null : Number(tourPoitrine),
      tour_taille: tourTaille === '' ? null : Number(tourTaille),
      tour_hanches: tourHanches === '' ? null : Number(tourHanches),
      longueur_manche: longueurManche === '' ? null : Number(longueurManche),
      longueur_robe: longueurRobe === '' ? null : Number(longueurRobe),
      tour_cou: tourCou === '' ? null : Number(tourCou),
      largeur_epaules: largeurEpaules === '' ? null : Number(largeurEpaules),
      champs_personnalises: customDict,
      prise_par: prisePar.trim(),
    });

    setSaving(false);
    setSuccessMsg('Mesures enregistrées avec succès !');
    setTimeout(() => {
      router.push(`/clients/${client.id}`);
    }, 600);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-clair pb-24 font-sans">
        <main className="max-w-4xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label="Chargement du formulaire de mesures…" size="lg" />
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-clair pb-24 font-sans">
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
    <div className="min-h-screen bg-clair pb-24 font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* Back Link & Unit */}
        <div className="flex items-center justify-between">
          <Link
            href={`/clients/${client.id}`}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-sombre hover:text-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour fiche client</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
            <Ruler className="w-4 h-4" />
            <span>Unités en cm</span>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Fiche Mesures : {client.nom}</h2>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold">Saisie et mise à jour rapide des mensurations sur-mesure</p>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-vertbouton/15 border border-vertbouton/40 rounded-xl text-sm text-vertbouton font-extrabold flex items-center gap-2 shadow-xs">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          {/* SECTION 1: Standard Measurements */}
          <Card className="p-5 space-y-4 rounded-3xl bg-white border-sable/60 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-accent">
              1. Mensurations Standards (cm)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tour de Poitrine (cm)"
                type="number"
                placeholder="ex: 92"
                value={tourPoitrine}
                onChange={(e) => setTourPoitrine(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label="Tour de Taille (cm)"
                type="number"
                placeholder="ex: 74"
                value={tourTaille}
                onChange={(e) => setTourTaille(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label="Tour de Hanches (cm)"
                type="number"
                placeholder="ex: 102"
                value={tourHanches}
                onChange={(e) => setTourHanches(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label="Longueur Manche (cm)"
                type="number"
                placeholder="ex: 60"
                value={longueurManche}
                onChange={(e) => setLongueurManche(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label="Longueur Robe/Boubou"
                type="number"
                placeholder="ex: 140"
                value={longueurRobe}
                onChange={(e) => setLongueurRobe(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label="Tour de Cou (cm)"
                type="number"
                placeholder="ex: 38"
                value={tourCou}
                onChange={(e) => setTourCou(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label="Largeur Épaules (cm)"
                type="number"
                placeholder="ex: 40"
                value={largeurEpaules}
                onChange={(e) => setLargeurEpaules(e.target.value === '' ? '' : Number(e.target.value))}
                className="col-span-2 sm:col-span-1"
              />
            </div>
          </Card>

          {/* SECTION 2: Custom Measurements */}
          <Card className="p-5 space-y-3 bg-white border-sable/60 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-accent">
                2. Champs Sur-Mesure / Personnalisés
              </h3>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ajouter un champ</span>
              </button>
            </div>

            {customFields.length === 0 ? (
              <p className="text-xs text-sombre/60 italic py-1">
                Aucun champ personnalisé (ex: Tour de poignet, Hauteur taille-sol, Longueur pantalon).
              </p>
            ) : (
              <div className="space-y-2">
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Intitulé (ex: Tour poignet)"
                      type="text"
                      value={field.label}
                      onChange={(e) => handleCustomFieldChange(idx, 'label', e.target.value)}
                    />
                    <Input
                      placeholder="Valeur (cm)"
                      type="text"
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(idx)}
                      className="text-accent p-2 hover:bg-accent/10 rounded-full"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* SECTION 3: Traçabilité Atelier */}
          <Card className="p-5 space-y-2 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-accent">
              3. Traçabilité Prise de Mesure
            </h3>
            <Input
              label="Mesures prises par"
              type="text"
              placeholder="Nom de la personne ayant pris les mesures"
              value={prisePar}
              onChange={(e) => setPrisePar(e.target.value)}
            />
          </Card>

          <BasteLine color="accent" />

          <Button type="submit" variant="accent" fullWidth size="lg" disabled={saving} className="gap-2 shadow-md rounded-full font-bold">
            <Check className="w-5 h-5" />
            <span>{saving ? 'Enregistrement…' : 'Enregistrer les mesures →'}</span>
          </Button>
        </form>
      </main>
    </div>
  );
}
