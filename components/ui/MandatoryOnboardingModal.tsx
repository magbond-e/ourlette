'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Check, Sparkles, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/context/AuthContext';
import { DataService } from '@/lib/services/dataService';

export const MandatoryOnboardingModal: React.FC = () => {
  const { user, couturier, refreshProfile } = useAuth();

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
      setError("Veuillez renseigner votre nom et prénom.");
      return;
    }
    if (!nomAtelier.trim()) {
      setError("Veuillez renseigner le nom de votre atelier.");
      return;
    }
    if (!telephone.trim()) {
      setError("Veuillez renseigner un numéro de téléphone/WhatsApp valide.");
      return;
    }
    if (!ville.trim() || !pays.trim()) {
      setError("La ville et le pays de votre atelier sont obligatoires.");
      return;
    }
    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité pour continuer.");
      return;
    }

    setSaving(true);
    setError('');

    const nowIso = new Date().toISOString();
    const slugified = nomAtelier.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `atelier-${user.id.substring(0, 6)}`;

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
      slug_vitrine: couturier?.slug_vitrine && couturier.slug_vitrine !== 'mon-atelier' ? couturier.slug_vitrine : slugified,
      cookie_consent_at: nowIso,
      vitrine_active: couturier?.vitrine_active ?? true,
    });

    if (updated) {
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-sombre text-sombre flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-gold space-y-5 my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto shadow-xs border border-accent/20">
            <Store className="w-7 h-7" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-sombre pt-1">
            Bienvenue sur Ourlette !
          </h3>
          <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
            Pour accéder à ton carnet de commandes et à ta vitrine, complète les informations obligatoires de ton atelier.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-accent/10 border border-accent/30 rounded-2xl text-xs text-accent font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-left">
          <Input
            label="Votre Nom & Prénom (Titulaire du compte)"
            type="text"
            placeholder="ex: Adia Sylla"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Nom de votre Atelier de Couture"
            type="text"
            placeholder="ex: Maison Adia Couture"
            value={nomAtelier}
            onChange={(e) => setNomAtelier(e.target.value)}
            required
          />

          <Input
            label="Numéro Téléphone / WhatsApp de l'Atelier"
            type="tel"
            placeholder="ex: +221 77 123 45 67"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            helperText="Affiché sur votre vitrine publique pour recevoir les commandes directes sur WhatsApp."
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ville"
              type="text"
              placeholder="ex: Dakar"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              required
            />

            <Input
              label="Pays"
              type="text"
              placeholder="ex: Sénégal"
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
              J'accepte les{' '}
              <Link href="/cgu" target="_blank" className="font-bold text-accent underline hover:no-underline">
                Conditions Générales d'Utilisation (CGU)
              </Link>{' '}
              et la{' '}
              <Link href="/politique-confidentialite" target="_blank" className="font-bold text-accent underline hover:no-underline">
                Politique de Confidentialité
              </Link>{' '}
              d'Ourlette, ainsi que le stockage des cookies essentiels.
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
              <span>{saving ? 'Enregistrement de votre atelier…' : 'Accéder à mon carnet d’atelier'}</span>
            </Button>
          </div>
        </form>

        <p className="text-[11px] text-sombre/50 font-semibold text-center flex items-center justify-center gap-1 pt-1">
          <Lock className="w-3.5 h-3.5 text-gold" />
          <span>Vos données d'atelier sont strictement confidentielles</span>
        </p>
      </div>
    </div>
  );
};
