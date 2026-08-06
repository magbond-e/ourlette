'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, User, Store, Globe, Check, LogOut, Bell, MessageSquare, Star, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { MockStorageService } from '@/lib/services/mockStorage';
import { Couturier } from '@/lib/types/database';

export default function ParametresPage() {
  const router = useRouter();
  const [couturier, setCouturier] = useState<Couturier>(MockStorageService.getCouturier());

  const [nom, setNom] = useState('');
  const [nomAtelier, setNomAtelier] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('');
  const [slug, setSlug] = useState('');
  const [langue, setLangue] = useState('fr');

  // Notifications State
  const [notifRetard, setNotifRetard] = useState(true);
  const [notifRappelLivraison, setNotifRappelLivraison] = useState(true);

  // Feedback / Avis State
  const [feedbackNote, setFeedbackNote] = useState<number>(5);
  const [feedbackTexte, setFeedbackTexte] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = MockStorageService.getCouturier();
    setCouturier(c);
    setNom(c.nom);
    setNomAtelier(c.nom_atelier);
    setEmail(c.email || '');
    setTelephone(c.telephone || '');
    setVille(c.ville || '');
    setPays(c.pays || '');
    setSlug(c.slug_vitrine);
    setLangue(c.langue || 'fr');
    setLoading(false);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    const updated = MockStorageService.updateCouturier({
      nom: nom.trim(),
      nom_atelier: nomAtelier.trim(),
      email: email.trim(),
      telephone: telephone.trim(),
      ville: ville.trim(),
      pays: pays.trim(),
      slug_vitrine: slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
      langue,
    });

    setCouturier(updated);
    setTimeout(() => {
      setSaving(false);
      setSuccessMsg('Paramètres de l’atelier mis à jour !');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 300);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTexte.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackTexte('');
    }, 2000);
  };

  const handleLogout = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
      <main className="max-w-4xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label="Chargement de vos paramètres d'atelier…" size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 font-sans">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Paramètres d’Atelier</h2>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold">Configuration de votre profil, notifications et préférences</p>
        </div>

        {successMsg && (
          <div className="p-4 bg-vertbouton/15 border border-vertbouton/40 rounded-2xl text-sm text-vertbouton font-bold flex items-center gap-2 shadow-xs">
            <Check className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* SECTION 1: Profil Couturier */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <User className="w-5 h-5 text-accent" />
              <span>1. Profil Couturier</span>
            </h3>

            <div className="space-y-4 font-sans">
              <Input
                label="Nom complet du couturier"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />

              <Input
                label="Adresse Email"
                type="email"
                placeholder="ex: atelier@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Numéro Téléphone (WhatsApp)"
                type="tel"
                placeholder="ex: +221 77 123 45 67"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />
            </div>
          </Card>

          {/* SECTION 2: Atelier & Vitrine */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <Store className="w-5 h-5 text-accent" />
              <span>2. Identité de l'Atelier & Vitrine</span>
            </h3>

            <div className="space-y-4 font-sans">
              <Input
                label="Nom de l'atelier de couture"
                type="text"
                value={nomAtelier}
                onChange={(e) => setNomAtelier(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ville"
                  type="text"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                />
                <Input
                  label="Pays"
                  type="text"
                  value={pays}
                  onChange={(e) => setPays(e.target.value)}
                />
              </div>

              <Input
                label="Lien unique de vitrine (Slug)"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                helperText={`ourlette.app/${slug}`}
                required
              />
            </div>
          </Card>

          {/* SECTION 3: Notifications & Rappels */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <Bell className="w-5 h-5 text-accent" />
              <span>3. Notifications & Alertes de Livraison</span>
            </h3>

            <div className="space-y-3 font-sans">
              <label className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-2xl border border-sable/50 cursor-pointer hover:border-accent/30 transition-colors">
                <span className="text-xs sm:text-sm font-bold text-sombre pr-4">
                  Alerter lorsqu'une livraison approche à 24h
                </span>
                <span className="ios-switch shrink-0">
                  <input
                    type="checkbox"
                    checked={notifRappelLivraison}
                    onChange={(e) => setNotifRappelLivraison(e.target.checked)}
                  />
                  <span className="ios-slider" />
                </span>
              </label>

              <label className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-2xl border border-sable/50 cursor-pointer hover:border-accent/30 transition-colors">
                <span className="text-xs sm:text-sm font-bold text-sombre pr-4">
                  Afficher le badge rouge d'alerte pour les commandes en retard
                </span>
                <span className="ios-switch shrink-0">
                  <input
                    type="checkbox"
                    checked={notifRetard}
                    onChange={(e) => setNotifRetard(e.target.checked)}
                  />
                  <span className="ios-slider" />
                </span>
              </label>
            </div>
          </Card>

          {/* SECTION 4: Langue & Préférences */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <Globe className="w-5 h-5 text-accent" />
              <span>4. Langue & Préférences</span>
            </h3>

            <div className="space-y-2 font-sans">
              <label className="block text-xs sm:text-sm font-bold text-sombre/90">
                Langue de l'interface
              </label>
              <select
                value={langue}
                onChange={(e) => setLangue(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-sable/80 rounded-2xl text-sm sm:text-base text-sombre font-bold focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent min-h-[48px] shadow-xs"
              >
                <option value="fr">Français (Défaut)</option>
                <option value="en">English (Bientôt disponible)</option>
              </select>
            </div>
          </Card>

          <Button type="submit" variant="accent" fullWidth size="lg" disabled={saving} className="gap-2 shadow-lg shadow-accent/20 font-bold rounded-full">
            <Check className="w-5 h-5" />
            <span>{saving ? 'Enregistrement…' : 'Enregistrer les paramètres →'}</span>
          </Button>
        </form>

        {/* SECTION 5: Donner un Avis / Témoigner sur le logiciel */}
        <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
            <MessageSquare className="w-5 h-5 text-accent" />
            <span>Donner un avis / Témoigner sur Ourlette</span>
          </h3>

          <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed font-sans">
            Votre expérience en atelier compte énormément pour nous. Laissez-nous votre avis ou vos suggestions d'amélioration.
          </p>

          {feedbackSent ? (
            <div className="p-4 bg-emerald-100 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-emerald-300">
              <Check className="w-5 h-5" />
              <span>Merci pour votre témoignage ! Votre avis aide la communauté des artisans couturiers.</span>
            </div>
          ) : (
            <form onSubmit={handleSendFeedback} className="space-y-3 font-sans">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sombre">Votre note :</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackNote(star)}
                    className="p-1 text-gold hover:scale-125 transition-transform"
                  >
                    <Star className={`w-5 h-5 ${star <= feedbackNote ? 'fill-gold text-gold' : 'text-sable'}`} />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="Racontez votre expérience avec Ourlette dans votre atelier…"
                value={feedbackTexte}
                onChange={(e) => setFeedbackTexte(e.target.value)}
                className="w-full p-3.5 bg-[#FAFAF8] border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-sans"
              />

              <Button type="submit" variant="accent" size="sm" className="gap-2 rounded-full font-bold">
                <Send className="w-4 h-4" />
                <span>Envoyer mon avis</span>
              </Button>
            </form>
          )}
        </Card>

        {/* Logout Section */}
        <Card className="p-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-dashed border-2 border-sable/80 bg-white rounded-3xl">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-sombre">Session d'atelier</h4>
            <p className="text-xs sm:text-sm text-sombre/70 font-medium">Connecté en tant que {couturier.nom}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-accent border-accent hover:bg-accent hover:text-white rounded-full">
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </Button>
        </Card>
      </main>
    </div>
  );
}
