'use client';

import React, { useState, useEffect } from 'react';
import { Store, Check, Sparkles, User, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/context/AuthContext';
import { DataService } from '@/lib/services/dataService';

export const MandatoryOnboardingModal: React.FC = () => {
  const { user, couturier, refreshProfile } = useAuth();
  const [show, setShow] = useState(false);

  const [nom, setNom] = useState('');
  const [nomAtelier, setNomAtelier] = useState('');
  const [telephone, setTelephone] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !couturier) {
      setShow(false);
      return;
    }

    // Check if essential workshop info is incomplete
    const isMissingNomAtelier = !couturier.nom_atelier || couturier.nom_atelier.trim() === 'Mon Atelier';
    const isMissingPhone = !couturier.telephone && !couturier.whatsapp_contact;
    const isMissingVille = !couturier.ville || couturier.ville.trim() === '';
    const isMissingPays = !couturier.pays || couturier.pays.trim() === '';

    if (isMissingNomAtelier || isMissingPhone || isMissingVille || isMissingPays) {
      setShow(true);
      setNom(couturier.nom && couturier.nom !== 'Artisan Couturier' ? couturier.nom : '');
      setNomAtelier(couturier.nom_atelier && couturier.nom_atelier !== 'Mon Atelier' ? couturier.nom_atelier : '');
      setTelephone(couturier.telephone || couturier.whatsapp_contact || '');
      setVille(couturier.ville || '');
      setPays(couturier.pays || '');
    } else {
      setShow(false);
    }
  }, [user, couturier]);

  if (!show || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomAtelier.trim()) {
      setError("Veuillez renseigner le nom de votre atelier.");
      return;
    }
    if (!telephone.trim()) {
      setError("Veuillez renseigner un numéro de téléphone/WhatsApp.");
      return;
    }
    if (!ville.trim() || !pays.trim()) {
      setError("La ville et le pays sont obligatoires.");
      return;
    }

    setSaving(true);
    setError('');

    const slugified = nomAtelier.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `atelier-${user.id.substring(0, 6)}`;

    await DataService.updateCouturier(user.id, {
      nom: nom.trim() || 'Artisan Couturier',
      nom_atelier: nomAtelier.trim(),
      telephone: telephone.trim(),
      whatsapp_contact: telephone.trim(),
      ville: ville.trim(),
      pays: pays.trim(),
      slug_vitrine: couturier?.slug_vitrine || slugified,
    });

    await refreshProfile();
    setSaving(false);
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-sombre/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-gold space-y-5 animate-slide-up">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto shadow-xs">
            <Store className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Finalisation du profil d'atelier</span>
          </span>
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
            Bienvenue sur Ourlette !
          </h3>
          <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed">
            Pour accéder à ton carnet de commandes et à ta vitrine, complète les informations essentielles de ton atelier.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-accent/10 border border-accent/30 rounded-2xl text-xs text-accent font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-left">
          <Input
            label="Votre nom complet (titulaire de compte)"
            type="text"
            placeholder="ex: Adia Diop"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            disabled={Boolean(couturier?.nom && couturier.nom !== 'Artisan Couturier')}
            required
            autoFocus={!nom}
          />

          <Input
            label="Nom de votre atelier de couture"
            type="text"
            placeholder="ex: Atelier Adia Couture"
            value={nomAtelier}
            onChange={(e) => setNomAtelier(e.target.value)}
            required
          />

          <Input
            label="Numéro de Téléphone (WhatsApp d'atelier)"
            type="tel"
            placeholder="ex: +221 77 123 45 67"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
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

          <div className="pt-2">
            <Button
              type="submit"
              variant="accent"
              fullWidth
              size="lg"
              disabled={saving}
              className="rounded-full font-extrabold shadow-xl py-4 gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <Check className="w-5 h-5" />
              <span>{saving ? 'Enregistrement…' : 'Accéder à mon carnet d’atelier →'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
