'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Ruler, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Client } from '@/lib/types/database';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';

const COMMON_CUSTOM_SUGGESTIONS = [
  'Tour de cuisse',
  'Longueur pantalon',
  'Tour de bras',
  'Écart poitrine',
  'Tour de cheville',
  'Tour de poignet',
];

function MesureField({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-sombre">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder || '0'}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-11 px-3 pr-9 bg-[#FAFAF8] border rounded-2xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce transition-colors ${
            error ? 'border-rose-400 bg-rose-50/50' : 'border-sable/80'
          }`}
        />
        <span className="absolute right-3 top-3 text-[11px] font-bold text-sombre/40 pointer-events-none">
          cm
        </span>
      </div>
      {error && <p className="text-[10px] font-bold text-rose-600">{error}</p>}
    </div>
  );
}

function FormulaireMesuresContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const { user, couturier, loading: authLoading } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);

  // Standard measurement fields (string to allow decimal comma during typing)
  const [tourPoitrine, setTourPoitrine] = useState<string>('');
  const [tourTaille, setTourTaille] = useState<string>('');
  const [tourHanches, setTourHanches] = useState<string>('');
  const [largeurEpaules, setLargeurEpaules] = useState<string>('');
  const [longueurManche, setLongueurManche] = useState<string>('');
  const [longueurRobe, setLongueurRobe] = useState<string>('');
  const [tourCou, setTourCou] = useState<string>('');

  // Custom fields
  const [customFields, setCustomFields] = useState<{ label: string; value: string }[]>([]);
  const [prisePar, setPrisePar] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (authLoading) return;
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
        setTourPoitrine(m.tour_poitrine != null ? String(m.tour_poitrine) : '');
        setTourTaille(m.tour_taille != null ? String(m.tour_taille) : '');
        setTourHanches(m.tour_hanches != null ? String(m.tour_hanches) : '');
        setLargeurEpaules(m.largeur_epaules != null ? String(m.largeur_epaules) : '');
        setLongueurManche(m.longueur_manche != null ? String(m.longueur_manche) : '');
        setLongueurRobe(m.longueur_robe != null ? String(m.longueur_robe) : '');
        setTourCou(m.tour_cou != null ? String(m.tour_cou) : '');
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
  }, [user?.id, clientId, authLoading, couturier?.nom]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [loadData, authLoading]);

  // Parse decimal with comma support
  const parseMeasure = (val: string): { num: number | null; error?: string } => {
    if (!val || !val.trim()) return { num: null };
    const cleaned = val.replace(',', '.').trim();
    const num = parseFloat(cleaned);
    if (isNaN(num)) {
      return { num: null, error: isEn ? 'Invalid number' : 'Nombre invalide' };
    }
    if (num < 1 || num > 300) {
      return { num: null, error: isEn ? 'Must be between 1 and 300 cm' : 'Doit être compris entre 1 et 300 cm' };
    }
    return { num };
  };

  const handleAddCustomField = (prefillLabel?: string) => {
    setCustomFields([...customFields, { label: prefillLabel || '', value: '' }]);
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

    setValidationError(null);

    // Validate standard fields (1 to 300 cm, empty allowed)
    const fieldsToValidate = [
      { name: dict.mesures.chest, res: parseMeasure(tourPoitrine) },
      { name: dict.mesures.waist, res: parseMeasure(tourTaille) },
      { name: dict.mesures.hips, res: parseMeasure(tourHanches) },
      { name: dict.mesures.shoulders, res: parseMeasure(largeurEpaules) },
      { name: dict.mesures.sleeveLength, res: parseMeasure(longueurManche) },
      { name: dict.mesures.dressLength, res: parseMeasure(longueurRobe) },
      { name: dict.mesures.neck, res: parseMeasure(tourCou) },
    ];

    for (const f of fieldsToValidate) {
      if (f.res.error) {
        setValidationError(`${f.name} : ${f.res.error}`);
        return;
      }
    }

    setSaving(true);

    const customDict: Record<string, number | string> = {};
    customFields.forEach((item) => {
      if (item.label.trim()) {
        const parsed = parseMeasure(item.value);
        customDict[item.label.trim()] = parsed.num != null ? parsed.num : item.value.trim();
      }
    });

    await DataService.saveMesure(user.id, client.id, {
      tour_poitrine: parseMeasure(tourPoitrine).num,
      tour_taille: parseMeasure(tourTaille).num,
      tour_hanches: parseMeasure(tourHanches).num,
      largeur_epaules: parseMeasure(largeurEpaules).num,
      longueur_manche: parseMeasure(longueurManche).num,
      longueur_robe: parseMeasure(longueurRobe).num,
      tour_cou: parseMeasure(tourCou).num,
      champs_personnalises: customDict,
      prise_par: prisePar.trim() || undefined,
    });

    setSaving(false);
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.push(`/clients/${client.id}`);
    }
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

  if (!client) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
        <main className="max-w-xl mx-auto px-4 pt-12 text-center space-y-4">
          <p className="text-sm font-bold text-sombre/70">{dict.clients.emptyTitle}</p>
          <Link href="/clients">
            <Button className="rounded-full bg-accent text-white px-5">{dict.clients.title}</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans text-sombre">
      <main className="max-w-xl mx-auto px-4 pt-3 space-y-4">

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link
            href={returnUrl || `/clients/${client.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sombre/70 hover:text-fonce bg-white px-3 py-1.5 rounded-full border border-sable/70 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === 'fr' ? 'Retour' : 'Back'}</span>
          </Link>

          <span className="text-[11px] font-bold text-fonce bg-sable/30 px-3 py-1 rounded-full">
            {locale === 'fr' ? 'Fiche Mesures' : 'Measurements'}
          </span>
        </div>

        {/* ── Titre ───────────────────────────────────────────────────── */}
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-xl font-display font-bold text-sombre">
            {locale === 'fr' ? 'Mensurations' : 'Measurements'} : {client.nom}
          </h1>
          <p className="text-xs text-sombre/60">
            {locale === 'fr' ? 'Champs en centimètres. La virgule est acceptée.' : 'Units in cm. Commas accepted.'}
          </p>
        </div>

        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 1. Mensurations Standards (Ordre d'usage) ──────────────── */}
          <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-sable/30 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-fonce flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                <span>{locale === 'fr' ? 'Mensurations standards' : 'Standard measurements'}</span>
              </h2>
              <span className="text-[11px] text-sombre/50">1 – 300 cm</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MesureField
                label={dict.mesures.chest}
                value={tourPoitrine}
                onChange={setTourPoitrine}
                placeholder="92"
              />
              <MesureField
                label={dict.mesures.waist}
                value={tourTaille}
                onChange={setTourTaille}
                placeholder="74"
              />
              <MesureField
                label={dict.mesures.hips}
                value={tourHanches}
                onChange={setTourHanches}
                placeholder="102"
              />
              <MesureField
                label={dict.mesures.shoulders}
                value={largeurEpaules}
                onChange={setLargeurEpaules}
                placeholder="40"
              />
              <MesureField
                label={dict.mesures.sleeveLength}
                value={longueurManche}
                onChange={setLongueurManche}
                placeholder="60"
              />
              <MesureField
                label={dict.mesures.dressLength}
                value={longueurRobe}
                onChange={setLongueurRobe}
                placeholder="140"
              />
              <div className="col-span-2 sm:col-span-1">
                <MesureField
                  label={dict.mesures.neck}
                  value={tourCou}
                  onChange={setTourCou}
                  placeholder="38"
                />
              </div>
            </div>
          </Card>

          {/* ── 2. Mesures Personnalisées ─────────────────────────────── */}
          <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-fonce">
                  {locale === 'fr' ? 'Mesures personnalisées' : 'Custom measurements'}
                </h2>
                <p className="text-[11px] text-sombre/60">
                  {locale === 'fr' ? 'Pour coupes spécifiques (cuisse, cheville…)' : 'For specific garments'}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddCustomField()}
                className="rounded-xl h-8 text-xs px-3 border-sable text-sombre/80 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{locale === 'fr' ? 'Ajouter' : 'Add'}</span>
              </Button>
            </div>

            {/* Suggestions de mesures personnalisées rapides */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_CUSTOM_SUGGESTIONS.map((sug) => {
                const alreadyAdded = customFields.some((c) => c.label.toLowerCase() === sug.toLowerCase());
                if (alreadyAdded) return null;
                return (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddCustomField(sug)}
                    className="text-[11px] font-semibold text-fonce bg-sable/30 hover:bg-sable/50 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    + {sug}
                  </button>
                );
              })}
            </div>

            {/* Liste des champs personnalisés */}
            {customFields.length > 0 && (
              <div className="space-y-2 pt-2">
                {customFields.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nom de la mesure (ex: Tour cuisse)"
                      value={item.label}
                      onChange={(e) => handleCustomFieldChange(idx, 'label', e.target.value)}
                      className="flex-1 h-10 px-3 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce"
                    />
                    <div className="relative w-24 shrink-0">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={item.value}
                        onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                        className="w-full h-10 px-2.5 pr-7 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs font-semibold text-sombre focus:outline-hidden focus:border-fonce"
                      />
                      <span className="absolute right-2 top-2.5 text-[10px] font-bold text-sombre/40 pointer-events-none">
                        cm
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(idx)}
                      className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center shrink-0 transition-colors"
                      aria-label="Supprimer la mesure libre"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── 3. Pris par ────────────────────────────────────────────── */}
          <Card className="p-4 sm:p-5 rounded-3xl bg-white border border-sable/60 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-sombre">
              {locale === 'fr' ? 'Mesures prises par' : 'Measurements taken by'}
            </label>
            <Input
              type="text"
              placeholder="Ex : Maître Adia"
              value={prisePar}
              onChange={(e) => setPrisePar(e.target.value)}
              className="rounded-2xl h-11 text-xs"
            />
          </Card>

          {/* ── Bouton Enregistrer ────────────────────────────────────── */}
          <Button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl h-12 bg-accent hover:bg-fonce text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>
              {saving
                ? (locale === 'fr' ? 'Enregistrement des mesures…' : 'Saving measurements…')
                : (locale === 'fr' ? 'Enregistrer les mesures' : 'Save measurements')}
            </span>
          </Button>

        </form>
      </main>
    </div>
  );
}

export default function FormulaireMesuresPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
          <ThreadSpoolLoader size="lg" />
        </div>
      }
    >
      <FormulaireMesuresContent />
    </Suspense>
  );
}
