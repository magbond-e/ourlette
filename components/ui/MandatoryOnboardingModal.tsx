'use client';

import React, { useState, useEffect } from 'react';
import { Store, Check, Lock, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/context/AuthContext';
import { DataService } from '@/lib/services/dataService';
import { useLanguage } from '@/lib/i18n';

interface CountryOption {
  name: string;
  dial: string;
  currency: string;
}

const COUNTRIES: CountryOption[] = [
  { name: 'Bénin', dial: '+229', currency: 'FCFA' },
  { name: 'Côte d’Ivoire', dial: '+225', currency: 'FCFA' },
  { name: 'Sénégal', dial: '+221', currency: 'FCFA' },
  { name: 'Togo', dial: '+228', currency: 'FCFA' },
  { name: 'Cameroun', dial: '+237', currency: 'FCFA' },
  { name: 'Burkina Faso', dial: '+226', currency: 'FCFA' },
  { name: 'Mali', dial: '+223', currency: 'FCFA' },
  { name: 'Guinée', dial: '+224', currency: 'GNF' },
  { name: 'Niger', dial: '+227', currency: 'FCFA' },
  { name: 'Gabon', dial: '+241', currency: 'FCFA' },
  { name: 'Congo', dial: '+242', currency: 'FCFA' },
  { name: 'RDC', dial: '+243', currency: 'USD' },
  { name: 'Ghana', dial: '+233', currency: 'GHS' },
  { name: 'Nigéria', dial: '+234', currency: 'NGN' },
  { name: 'France', dial: '+33', currency: 'EUR' },
  { name: 'Autre', dial: '+', currency: 'FCFA' },
];

export const MandatoryOnboardingModal: React.FC = () => {
  const { user, couturier, refreshProfile } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  const [nom, setNom] = useState('');
  const [nomAtelier, setNomAtelier] = useState('');
  const [indicatif, setIndicatif] = useState('+229');
  const [phoneNumero, setPhoneNumero] = useState('');
  const [pays, setPays] = useState('Bénin');
  const [devise, setDevise] = useState('FCFA');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialisation à partir du profil existant ou de Google
  useEffect(() => {
    if (couturier) {
      if (couturier.nom && couturier.nom !== 'Artisan Couturier') {
        setNom(couturier.nom);
      } else if (user?.user_metadata?.full_name) {
        setNom(user.user_metadata.full_name);
      }

      if (couturier.nom_atelier && couturier.nom_atelier !== 'Mon Atelier') {
        setNomAtelier(couturier.nom_atelier);
      }

      if (couturier.telephone || couturier.whatsapp_contact) {
        const full = (couturier.whatsapp_contact || couturier.telephone || '').trim();
        const matched = COUNTRIES.find((c) => c.dial !== '+' && full.startsWith(c.dial));
        if (matched) {
          setIndicatif(matched.dial);
          setPhoneNumero(full.replace(matched.dial, '').trim());
        } else {
          setPhoneNumero(full);
        }
      }

      if (couturier.pays) {
        setPays(couturier.pays);
        const c = COUNTRIES.find((item) => item.name.toLowerCase() === couturier.pays?.toLowerCase());
        if (c) {
          setIndicatif(c.dial);
          setDevise(c.currency);
        }
      }
    }
  }, [couturier, user]);

  // Si l'utilisateur est déjà complètement onboardé, ne rien afficher
  const isAlreadyOnboarded = Boolean(
    couturier &&
      couturier.nom &&
      couturier.nom !== 'Artisan Couturier' &&
      couturier.nom_atelier &&
      couturier.nom_atelier !== 'Mon Atelier' &&
      (couturier.telephone || couturier.whatsapp_contact) &&
      couturier.pays
  );

  if (!user || isAlreadyOnboarded) return null;

  const handleCountryChange = (countryName: string) => {
    setPays(countryName);
    const found = COUNTRIES.find((c) => c.name === countryName);
    if (found) {
      if (found.dial !== '+') setIndicatif(found.dial);
      setDevise(found.currency);
    }
  };

  // Aperçu dynamique du slug
  const baseSlug = nomAtelier
    ? nomAtelier
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : 'mon-atelier';
  const previewSlug = `atelier-${baseSlug}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError(isEn ? 'Please enter your full name.' : 'Veuillez renseigner ton nom et prénom.');
      return;
    }
    if (!nomAtelier.trim()) {
      setError(isEn ? 'Please enter your workshop name.' : "Veuillez renseigner le nom de l'atelier.");
      return;
    }
    if (!phoneNumero.trim()) {
      setError(
        isEn
          ? 'Please enter your WhatsApp contact number.'
          : 'Veuillez renseigner ton numéro WhatsApp.'
      );
      return;
    }

    setSaving(true);
    setError('');

    const fullPhone = `${indicatif} ${phoneNumero.trim()}`.trim();
    const isPro = couturier?.plan === 'pro';
    const finalSlug = isPro
      ? baseSlug
      : couturier?.slug_vitrine && couturier.slug_vitrine !== 'mon-atelier'
      ? couturier.slug_vitrine
      : `atelier-${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const updated = await DataService.updateCouturier(user.id, {
      nom: nom.trim(),
      nom_atelier: nomAtelier.trim(),
      telephone: fullPhone,
      whatsapp_contact: fullPhone,
      pays: pays.trim(),
      devise: devise,
      slug_vitrine: finalSlug,
    });

    if (updated) {
      await refreshProfile();
    } else {
      setError(
        isEn
          ? 'Error saving workshop details. Please retry.'
          : "Une erreur est survenue lors de l'enregistrement. Réessaie."
      );
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sombre/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gold/40 p-6 sm:p-8 max-w-md w-full space-y-5 my-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto shadow-xs">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-sombre tracking-tight">
            {dict.onboarding.modalTitle}
          </h2>
          <p className="text-xs text-sombre/70 font-medium">
            {isEn
              ? 'Complete these 4 fields once to start managing your atelier.'
              : 'Complète ces 4 informations pour configurer ton atelier.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-accent/10 border border-accent/30 rounded-2xl text-xs text-accent font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* 1. Ton nom */}
          <div>
            <label className="block text-xs font-bold text-sombre mb-1">
              {dict.onboarding.fullNameLabel}
            </label>
            <input
              type="text"
              placeholder={isEn ? 'e.g. Adia Traoré' : 'ex. Adia Traoré'}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 bg-[#FAF9F6] border border-sable/80 rounded-2xl text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-sans"
            />
          </div>

          {/* 2. Nom de l'atelier + Aperçu du lien */}
          <div>
            <label className="block text-xs font-bold text-sombre mb-1">
              {dict.onboarding.workshopNameLabel}
            </label>
            <input
              type="text"
              placeholder={isEn ? 'e.g. Maison Adia Couture' : 'ex. Maison Adia Couture'}
              value={nomAtelier}
              onChange={(e) => setNomAtelier(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#FAF9F6] border border-sable/80 rounded-2xl text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-sans"
            />
            {/* Ligne sous le nom de l'atelier : « Ton lien : ourlette.app/atelier-adia » */}
            <p className="text-[11px] text-accent font-bold mt-1.5 flex items-center gap-1 truncate">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isEn ? 'Your link:' : 'Ton lien :'} ourlette.app/{previewSlug}
              </span>
            </p>
          </div>

          {/* 3. Numéro WhatsApp (avec indicatif présélectionné) */}
          <div>
            <label className="block text-xs font-bold text-sombre mb-1">
              {isEn ? 'WhatsApp Number *' : 'Numéro WhatsApp *'}
            </label>
            <div className="flex gap-2">
              <span className="inline-flex items-center justify-center px-3 py-3 bg-[#FAF9F6] border border-sable/80 rounded-2xl text-xs font-extrabold text-sombre select-none">
                {indicatif}
              </span>
              <input
                type="tel"
                placeholder={isEn ? 'e.g. 97 00 11 22' : 'ex. 97 00 11 22'}
                value={phoneNumero}
                onChange={(e) => setPhoneNumero(e.target.value)}
                required
                className="flex-1 px-4 py-3 bg-[#FAF9F6] border border-sable/80 rounded-2xl text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-sans"
              />
            </div>
          </div>

          {/* 4. Pays (devise déduite et modifiable en 1 tap) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-sombre mb-1">
                {dict.onboarding.countryLabel}
              </label>
              <select
                value={pays}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3 py-3 bg-[#FAF9F6] border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre font-bold focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-sombre mb-1">
                {isEn ? 'Currency' : 'Devise'}
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {['FCFA', 'EUR', 'USD'].map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setDevise(cur)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      devise === cur
                        ? 'bg-sombre text-gold border-gold/60 shadow-xs'
                        : 'bg-[#FAF9F6] text-sombre/70 border-sable/70 hover:bg-white'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="accent"
              fullWidth
              size="lg"
              disabled={saving}
              className="rounded-full font-bold text-sm sm:text-base py-3.5 shadow-xl gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>{saving ? dict.onboarding.saving : dict.onboarding.submitButton}</span>
            </Button>
          </div>
        </form>

        <p className="text-[11px] text-sombre/50 font-semibold text-center flex items-center justify-center gap-1 pt-1">
          <Lock className="w-3.5 h-3.5 text-gold" />
          <span>
            {isEn
              ? 'Your workshop data is strictly private and secured'
              : "Tes données d'atelier sont strictement confidentielles"}
          </span>
        </p>
      </div>
    </div>
  );
};
