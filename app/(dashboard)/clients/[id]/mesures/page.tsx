'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Ruler, Plus, Trash2, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Client } from '@/lib/types/database';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';

export default function FormulaireMesuresPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';
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
        setPrisePar(m.prise_par ?? '');

        if (m.champs_personnalises) {
          const list = Object.entries(m.champs_personnalises).map(([label, value]) => ({
            label,
            value: String(value),
          }));
          setCustomFields(list);
        }
      }
    }
    setLoading(false);
  }, [user?.id, clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { label: '', value: '' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...customFields];
    updated[index][field] = val;
    setCustomFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !client?.id) return;

    setSaving(true);
    setSuccessMsg('');

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
    setSuccessMsg(dict.mesures.saveSuccess);
    setTimeout(() => {
      router.push(`/clients/${client.id}`);
    }, 600);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-clair pb-24 font-sans">
        <main className="max-w-4xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label={dict.common.loading} size="lg" />
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-clair pb-24 font-sans">
        <main className="max-w-4xl mx-auto px-4 pt-12 text-center space-y-4">
          <p className="text-base font-bold text-sombre/70">{dict.clients.emptyTitle}</p>
          <Link href="/clients">
            <Button variant="accent">{dict.clients.title}</Button>
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
            <span>{dict.mesures.backButton}</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
            <Ruler className="w-4 h-4" />
            <span>{isEn ? 'Units in cm' : 'Unités en cm'}</span>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
            {dict.mesures.title} : {client.nom}
          </h2>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold">{dict.mesures.subtitle}</p>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-vertbouton/15 border border-vertbouton/40 rounded-xl text-sm text-vertbouton font-extrabold flex items-center gap-2 shadow-xs">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          {/* SECTION 1: Standard Measurements */}
          <Card className="p-4 sm:p-6 space-y-4 rounded-3xl bg-white border-sable/60 shadow-xs">
            <div className="flex items-center justify-between border-b border-sable/40 pb-2.5">
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-accent flex items-center gap-2">
                <Ruler className="w-4 h-4 text-accent" />
                <span>{dict.mesures.standardMeasurementsTitle}</span>
              </h3>
              <span className="text-[11px] text-sombre/50 font-bold">7 {isEn ? 'key measurements' : 'mesures clés'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Input
                label={`${dict.mesures.chest} (cm)`}
                type="number"
                placeholder="ex: 92"
                value={tourPoitrine}
                onChange={(e) => setTourPoitrine(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label={`${dict.mesures.waist} (cm)`}
                type="number"
                placeholder="ex: 74"
                value={tourTaille}
                onChange={(e) => setTourTaille(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label={`${dict.mesures.hips} (cm)`}
                type="number"
                placeholder="ex: 102"
                value={tourHanches}
                onChange={(e) => setTourHanches(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label={`${dict.mesures.shoulders} (cm)`}
                type="number"
                placeholder="ex: 40"
                value={largeurEpaules}
                onChange={(e) => setLargeurEpaules(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label={`${dict.mesures.sleeveLength} (cm)`}
                type="number"
                placeholder="ex: 60"
                value={longueurManche}
                onChange={(e) => setLongueurManche(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label={`${dict.mesures.dressLength} (cm)`}
                type="number"
                placeholder="ex: 140"
                value={longueurRobe}
                onChange={(e) => setLongueurRobe(e.target.value === '' ? '' : Number(e.target.value))}
              />

              <Input
                label={`${dict.mesures.neck} (cm)`}
                type="number"
                placeholder="ex: 38"
                value={tourCou}
                onChange={(e) => setTourCou(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </Card>

          {/* SECTION 2: Custom Measurements */}
          <Card className="p-5 space-y-4 rounded-3xl bg-white border-sable/60 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-accent">
                  {dict.mesures.customMeasurementsTitle}
                </h3>
                <p className="text-xs text-sombre/60 mt-0.5">{dict.mesures.customMeasurementsDesc}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomField}
                className="gap-1.5 text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{dict.mesures.addCustomFieldButton}</span>
              </Button>
            </div>

            {customFields.length > 0 && (
              <div className="space-y-3 pt-2">
                {customFields.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={dict.mesures.customFieldPlaceholder}
                      value={item.label}
                      onChange={(e) => handleCustomFieldChange(idx, 'label', e.target.value)}
                      className="flex-1 p-3 bg-white border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                    <input
                      type="text"
                      placeholder={dict.mesures.customValuePlaceholder}
                      value={item.value}
                      onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                      className="w-24 sm:w-28 p-3 bg-white border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(idx)}
                      className="p-3 text-sombre/40 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                      title={dict.mesures.removeField}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* SECTION 3: Tailor Name */}
          <Card className="p-5 rounded-3xl bg-white border-sable/60 shadow-xs space-y-3">
            <Input
              label={dict.mesures.takenByLabel}
              type="text"
              placeholder={dict.mesures.takenByPlaceholder}
              value={prisePar}
              onChange={(e) => setPrisePar(e.target.value)}
            />
          </Card>

          <Button
            type="submit"
            variant="accent"
            fullWidth
            size="lg"
            disabled={saving}
            className="gap-2 shadow-lg shadow-accent/20 font-bold rounded-full py-4 text-base"
          >
            <Check className="w-5 h-5" />
            <span>{saving ? dict.mesures.saving : dict.mesures.saveMeasurementsButton}</span>
          </Button>
        </form>
      </main>
    </div>
  );
}
