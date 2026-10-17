'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Check, Sparkles, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/context/AuthContext';
import { DataService } from '@/lib/services/dataService';
import { useLanguage } from '@/lib/i18n';

export const MandatoryOnboardingModal: React.FC = () => {
  const { user, couturier, refreshProfile } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  const [nom, setNom] = useState('');
  const [nomAtelier, setNomAtelier] = useState('');
  const [telephone, setTelephone] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (couturier) {
      setNom(couturier.nom && couturier.nom !== 'Artisan Couturier' ? couturier.nom : '');
      setNomAtelier(couturier.nom_atelier && couturier.nom_atelier !== 'Mon Atelier' ? couturier.nom_atelier : '');
      setTelephone(couturier.telephone || couturier.whatsapp_contact || '');
      setVille(couturier.ville || '');
      setPays(couturier.pays || '');
    }
  }, [couturier]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError(isEn ? 'Please enter your full name.' : 'Veuillez renseigner votre nom et prénom.');
      return;
    }
    if (!nomAtelier.trim()) {
      setError(isEn ? 'Please enter your workshop name.' : 'Veuillez renseigner le nom de votre atelier.');
      return;
    }
    if (!telephone.trim()) {
      setError(isEn ? 'Please enter a valid phone or WhatsApp number.' : 'Veuillez renseigner un numéro de téléphone/WhatsApp valide.');
      return;
    }
    if (!ville.trim() || !pays.trim()) {
      setError(isEn ? 'City and country are required.' : 'La ville et le pays de votre atelier sont obligatoires.');
      return;
    }
    if (!acceptTerms) {
      setError(isEn ? 'You must accept the terms to continue.' : "Vous devez accepter les conditions d'utilisation et la politique de confidentialité pour continuer.");
      return;
    }

    setSaving(true);
    setError('');

    const nowIso = new Date().toISOString();
    const isPro = couturier?.plan === 'pro';
    const customSlug = nomAtelier.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const randomSlug = `atelier-${Math.random().toString(36).substring(2, 8)}`;
    const finalSlug = isPro
      ? (couturier?.slug_vitrine && couturier.slug_vitrine !== 'mon-atelier' ? couturier.slug_vitrine : customSlug)
      : (couturier?.slug_vitrine && couturier.slug_vitrine !== 'mon-atelier' ? couturier.slug_vitrine : randomSlug);

    // Save cookie consent in local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ourlette_cookie_consent', nowIso);
    }

    const updated = await DataService.updateCouturier(user.id, {
      nom: nom.trim(),
      nom_atelier: nomAtelier.trim(),
      telephone: telephone.trim(),
      whatsapp_contact: telephone.trim(),
      ville: ville.trim(),
      pays: pays.trim(),
      cookie_consent_at: nowIso,
      slug_vitrine: finalSlug,
    });

    if (updated) {
      await refreshProfile();
    } else {
      setError(isEn ? 'Error updating workshop. Please try again.' : 'Une erreur est survenue lors de l’enregistrement. Veuillez réessayer.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sombre/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gold/40 p-6 sm:p-8 max-w-lg w-full space-y-5 my-8 animate-fade-in-up">
        {/* Top Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-sombre tracking-tight">
            {dict.onboarding.modalTitle}
          </h2>
          <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
            {dict.onboarding.welcomeMsg}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-accent/10 border border-accent/30 rounded-2xl text-xs sm:text-sm text-accent font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label={dict.onboarding.fullNameLabel}
            type="text"
            placeholder={isEn ? 'e.g. Adia Traoré' : 'ex: Adia Traoré'}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            autoFocus
          />

          <Input
            label={dict.onboarding.workshopNameLabel}
            type="text"
            placeholder={isEn ? 'e.g. Maison Adia Couture' : 'ex: Maison Adia Couture'}
            value={nomAtelier}
            onChange={(e) => setNomAtelier(e.target.value)}
            required
          />

          <Input
            label={dict.onboarding.phoneLabel}
            type="tel"
            placeholder={isEn ? 'e.g. +221 77 123 45 67' : 'ex: +221 77 123 45 67'}
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            helperText={isEn ? 'Displayed on your public showcase to receive WhatsApp orders.' : 'Affiché sur votre vitrine publique pour recevoir les commandes directes sur WhatsApp.'}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={dict.onboarding.cityLabel}
              type="text"
              placeholder={isEn ? 'e.g. Dakar' : 'ex: Dakar'}
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              required
            />

            <Input
              label={dict.onboarding.countryLabel}
              type="text"
              placeholder={isEn ? 'e.g. Senegal' : 'ex: Sénégal'}
              value={pays}
              onChange={(e) => setPays(e.target.value)}
              required
            />
          </div>

          {/* Terms & Cookies Agreement Checkbox */}
          <label className="flex items-start gap-3 p-3.5 bg-[#FAFAF8] rounded-2xl border border-sable/80 cursor-pointer hover:border-accent/40 transition-colors">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-accent border-sable rounded focus:ring-accent accent-accent shrink-0"
              required
            />
            <span className="text-xs text-sombre/80 font-medium leading-tight">
              {isEn ? (
                <>
                  I accept the{' '}
                  <Link href="/cgu" target="_blank" className="font-bold text-accent underline hover:no-underline">
                    Terms of Service (CGU)
                  </Link>{' '}
                  and the{' '}
                  <Link href="/politique-confidentialite" target="_blank" className="font-bold text-accent underline hover:no-underline">
                    Privacy Policy
                  </Link>{' '}
                  of Ourlette, as well as essential cookie storage.
                </>
              ) : (
                <>
                  J&apos;accepte les{' '}
                  <Link href="/cgu" target="_blank" className="font-bold text-accent underline hover:no-underline">
                    Conditions Générales d&apos;Utilisation (CGU)
                  </Link>{' '}
                  et la{' '}
                  <Link href="/politique-confidentialite" target="_blank" className="font-bold text-accent underline hover:no-underline">
                    Politique de Confidentialité
                  </Link>{' '}
                  d&apos;Ourlette, ainsi que le stockage des cookies essentiels.
                </>
              )}
            </span>
          </label>

          <div className="pt-2">
            <Button
              type="submit"
              variant="accent"
              fullWidth
              size="lg"
              disabled={saving}
              className="rounded-full font-extrabold text-base py-4 shadow-xl gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <Check className="w-5 h-5" />
              <span>{saving ? dict.onboarding.saving : dict.onboarding.submitButton}</span>
            </Button>
          </div>
        </form>

        <p className="text-[11px] text-sombre/50 font-semibold text-center flex items-center justify-center gap-1 pt-1">
          <Lock className="w-3.5 h-3.5 text-gold" />
          <span>{isEn ? 'Your atelier records are strictly private and confidential' : "Vos données d'atelier sont strictement confidentielles"}</span>
        </p>
      </div>
    </div>
  );
};
