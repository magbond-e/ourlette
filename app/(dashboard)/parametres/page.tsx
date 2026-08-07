'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Store, Globe, Check, LogOut, Bell, MessageSquare, Star, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Couturier } from '@/lib/types/database';
import { useAuth } from '@/lib/context/AuthContext';

export default function ParametresPage() {
  const router = useRouter();
  const { user, couturier: authCouturier, refreshProfile, signOut } = useAuth();
  const [couturier, setCouturier] = useState<Couturier | null>(null);

  // Profile Edit State (clean default empty strings)
  const [nom, setNom] = useState('');
  const [nomAtelier, setNomAtelier] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [whatsappContact, setWhatsappContact] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('');
  const [adresseAtelier, setAdresseAtelier] = useState('');
  const [bio, setBio] = useState('');
  const [slug, setSlug] = useState('');
  const [langue, setLangue] = useState('fr');
  const [devise, setDevise] = useState('FCFA');

  // Notifications State
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifRetard, setNotifRetard] = useState(true);
  const [notifRappelLivraison, setNotifRappelLivraison] = useState(true);

  // Feedback / Avis State
  const [feedbackNote, setFeedbackNote] = useState<number>(5);
  const [feedbackTexte, setFeedbackTexte] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const c = (await DataService.getCouturier(user.id)) || authCouturier;
    if (c) {
      setCouturier(c);
      setNom(c.nom && c.nom !== 'Artisan Couturier' ? c.nom : '');
      setNomAtelier(c.nom_atelier && c.nom_atelier !== 'Mon Atelier' ? c.nom_atelier : '');
      setEmail(c.email || user.email || '');
      setTelephone(c.telephone || '');
      setWhatsappContact(c.whatsapp_contact || c.telephone || '');
      setVille(c.ville || '');
      setPays(c.pays || '');
      setAdresseAtelier(c.adresse_atelier || '');
      setBio(c.bio || '');
      setSlug(c.slug_vitrine || '');
      setLangue(c.langue || 'fr');
      setDevise(c.devise || 'FCFA');
      setNotifEmail(c.notifications_email ?? true);
      setNotifRetard(c.notif_retard ?? true);
      setNotifRappelLivraison(c.notif_rappel_livraison ?? true);
    }
    setLoading(false);
  }, [user?.id, user?.email, authCouturier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setSuccessMsg('');

    const slugified = slug ? slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : '';

    const updated = await DataService.updateCouturier(user.id, {
      nom: nom.trim(),
      nom_atelier: nomAtelier.trim(),
      email: email.trim(),
      telephone: telephone.trim(),
      whatsapp_contact: whatsappContact.trim(),
      ville: ville.trim(),
      pays: pays.trim(),
      adresse_atelier: adresseAtelier.trim(),
      bio: bio.trim(),
      ...(slugified ? { slug_vitrine: slugified } : {}),
      langue,
      devise,
      notifications_email: notifEmail,
      notif_retard: notifRetard,
      notif_rappel_livraison: notifRappelLivraison,
    });

    if (updated) {
      setCouturier(updated);
      await refreshProfile();
    }

    setSaving(false);
    setSuccessMsg('Paramètres de l’atelier mis à jour !');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTexte.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackTexte('');
    }, 2000);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-clair pb-24 font-sans">
        <main className="max-w-4xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label="Chargement de vos paramètres d'atelier…" size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clair pb-24 font-sans">
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
              <span>1. Profil Couturier & Contact</span>
            </h3>

            <div className="space-y-4 font-sans">
              <Input
                label="Nom du titulaire du compte (non modifiable)"
                type="text"
                value={nom || 'Artisan Couturier'}
                onChange={() => {}}
                disabled
                helperText="Le nom du titulaire de compte est lié à votre identifiant d'inscription."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Adresse Email (notifications & compte)"
                  type="email"
                  placeholder="ex: atelier@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Numéro Téléphone d'atelier"
                  type="tel"
                  placeholder="ex: +221 77 123 45 67"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
              </div>

              <Input
                label="Numéro WhatsApp (affiché sur la vitrine)"
                type="tel"
                placeholder="ex: +221 77 123 45 67"
                value={whatsappContact}
                onChange={(e) => setWhatsappContact(e.target.value)}
              />
            </div>
          </Card>

          {/* SECTION 2: Atelier & Localisation */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <Store className="w-5 h-5 text-accent" />
              <span>2. Identité de l'Atelier & Vitrine</span>
            </h3>

            <div className="space-y-4 font-sans">
              <Input
                label="Nom de l'atelier de couture"
                type="text"
                placeholder="ex: Atelier Adia Couture"
                value={nomAtelier}
                onChange={(e) => setNomAtelier(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ville"
                  type="text"
                  placeholder="ex: Dakar"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                />
                <Input
                  label="Pays"
                  type="text"
                  placeholder="ex: Sénégal"
                  value={pays}
                  onChange={(e) => setPays(e.target.value)}
                />
              </div>

              <Input
                label="Adresse complète de l'atelier (optionnel)"
                type="text"
                placeholder="ex: Rue 14 x 11, Medina"
                value={adresseAtelier}
                onChange={(e) => setAdresseAtelier(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-sombre">
                  Présentation / Bio de l'atelier
                </label>
                <textarea
                  rows={3}
                  placeholder="ex: Spécialiste tenue traditionnelle africaine, Bazin, Broderies..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3.5 bg-white border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-sans shadow-xs"
                />
              </div>

              <Input
                label="Lien unique de vitrine (Slug)"
                type="text"
                placeholder="ex: atelier-adia"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                helperText={`ourlette.app/${slug}`}
                required
              />
            </div>
          </Card>

          {/* SECTION 3: Notifications & Emails */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <Bell className="w-5 h-5 text-accent" />
              <span>3. Notifications & Alertes par Email / SMS</span>
            </h3>

            <div className="space-y-3 font-sans">
              <label className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-2xl border border-sable/50 cursor-pointer hover:border-accent/30 transition-colors">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-sombre block">
                    Recevoir les notifications par Email
                  </span>
                  <span className="text-[11px] text-sombre/60 font-semibold block mt-0.5">
                    Rappels d'échéances et résumés de commandes
                  </span>
                </div>
                <span className="ios-switch shrink-0">
                  <input
                    type="checkbox"
                    checked={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.checked)}
                  />
                  <span className="ios-slider" />
                </span>
              </label>

              <label className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-2xl border border-sable/50 cursor-pointer hover:border-accent/30 transition-colors">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-sombre block">
                    Alerter lorsqu'une livraison approche à 24h
                  </span>
                  <span className="text-[11px] text-sombre/60 font-semibold block mt-0.5">
                    Notification automatique pour préparer la remise de la tenue
                  </span>
                </div>
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
                <div>
                  <span className="text-xs sm:text-sm font-bold text-sombre block">
                    Afficher l'alerte pour les commandes en retard
                  </span>
                  <span className="text-[11px] text-sombre/60 font-semibold block mt-0.5">
                    Signalement visuel rouge dans le carnet de commandes
                  </span>
                </div>
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

          {/* SECTION 4: Langue & Monnaie */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <Globe className="w-5 h-5 text-accent" />
              <span>4. Langue & Devise de Facturation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-sombre/90">
                  Langue de l'interface
                </label>
                <select
                  value={langue}
                  onChange={(e) => setLangue(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-sable/80 rounded-2xl text-sm sm:text-base text-sombre font-bold focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent min-h-[48px] shadow-xs"
                >
                  <option value="fr">Français (Défaut)</option>
                  <option value="en">English (Anglais)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-sombre/90">
                  Devise Monétaire
                </label>
                <select
                  value={devise}
                  onChange={(e) => setDevise(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-sable/80 rounded-2xl text-sm sm:text-base text-sombre font-bold focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent min-h-[48px] shadow-xs"
                >
                  <option value="FCFA">FCFA (Franc CFA)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GNF">GNF (Franc Guinéen)</option>
                  <option value="MAD">MAD (Dirham Marocain)</option>
                </select>
              </div>
            </div>
          </Card>

          <Button type="submit" variant="accent" fullWidth size="lg" disabled={saving} className="gap-2 shadow-lg shadow-accent/20 font-bold rounded-full">
            <Check className="w-5 h-5" />
            <span>{saving ? 'Enregistrement…' : 'Enregistrer les paramètres →'}</span>
          </Button>
        </form>

        {/* SECTION 5: Donner un Avis */}
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
            <p className="text-xs sm:text-sm text-sombre/70 font-medium">Connecté en tant que {couturier?.nom || 'Couturier'}</p>
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
