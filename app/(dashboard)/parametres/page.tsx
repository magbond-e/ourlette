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
import { useNotifications } from '@/lib/context/NotificationContext';

export default function ParametresPage() {
  const router = useRouter();
  const { user, couturier: authCouturier, refreshProfile, signOut } = useAuth();
  const { addDemoNotification, refreshNotifications } = useNotifications();
  const [couturier, setCouturier] = useState<Couturier | null>(null);

  // Profile Edit State
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
  const [notifNouveautes, setNotifNouveautes] = useState(true);

  // Feedback State
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
      setNotifNouveautes(c.notif_nouveautes ?? true);
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
      notif_nouveautes: notifNouveautes,
    });

    if (updated) {
      setCouturier(updated);
      await refreshProfile();
      await refreshNotifications();
    }

    setSaving(false);
    setSuccessMsg('Paramètres enregistrés avec succès !');
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
          <ThreadSpoolLoader label="Chargement de vos paramètres…" size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clair pb-24 font-sans">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Paramètres de l’Atelier</h2>
          <p className="text-xs sm:text-sm text-sombre/70 font-semibold">Gérez vos coordonnées, les informations de votre atelier et vos préférences</p>
        </div>

        {successMsg && (
          <div className="p-4 bg-vertbouton/15 border border-vertbouton/40 rounded-2xl text-sm text-vertbouton font-bold flex items-center gap-2 shadow-xs">
            <Check className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* SECTION 1: Profil & Coordonnées */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <User className="w-5 h-5 text-accent" />
              <span>Profil & Coordonnées</span>
            </h3>

            <div className="space-y-4 font-sans">
              <Input
                label="Nom du titulaire"
                type="text"
                value={nom || 'Artisan Couturier'}
                onChange={() => {}}
                disabled
                helperText="Identifiant du titulaire de compte (non modifiable)."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Adresse Email"
                  type="email"
                  placeholder="ex: atelier@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Téléphone de l'atelier"
                  type="tel"
                  placeholder="ex: +221 77 000 00 00"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
              </div>

              <Input
                label="Numéro WhatsApp (Vitrine)"
                type="tel"
                placeholder="ex: +221 77 000 00 00"
                value={whatsappContact}
                onChange={(e) => setWhatsappContact(e.target.value)}
                helperText="Numéro affiché sur votre vitrine pour recevoir les demandes clients directes."
              />
            </div>
          </Card>

          {/* SECTION 2: Identité de l'Atelier */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <Store className="w-5 h-5 text-accent" />
              <span>Identité de l'Atelier</span>
            </h3>

            <div className="space-y-4 font-sans">
              <Input
                label="Nom de l'atelier"
                type="text"
                placeholder="ex: Maison Adia Couture"
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
                label="Adresse physique de l'atelier"
                type="text"
                placeholder="ex: Rue 14 x 11, Médina, Dakar"
                value={adresseAtelier}
                onChange={(e) => setAdresseAtelier(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-sombre">
                  Présentation / Bio de l'atelier
                </label>
                <textarea
                  rows={3}
                  placeholder="Présentez votre atelier, vos spécialités et votre savoir-faire en quelques lignes..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3.5 bg-white border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-sans shadow-xs"
                />
              </div>

              <Input
                label="Lien de votre vitrine (Slug)"
                type="text"
                placeholder="ex: atelier-adia"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                helperText={`ourlette.app/${slug}`}
                required
              />
            </div>
          </Card>

          {/* SECTION 3: Notifications & Alertes */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <Bell className="w-5 h-5 text-accent" />
              <span>Notifications & Alertes</span>
            </h3>

            <div className="space-y-3 font-sans">
              <label className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-2xl border border-sable/50 cursor-pointer hover:border-accent/30 transition-colors">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-sombre block">
                    Notifications par email
                  </span>
                  <span className="text-[11px] text-sombre/60 font-semibold block mt-0.5">
                    Recevoir les résumés et alertes importantes par email
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
                    Rappel de livraison (24h avant)
                  </span>
                  <span className="text-[11px] text-sombre/60 font-semibold block mt-0.5">
                    Alerte automatique la veille de la date de livraison prévue
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
                    Alerte de retard
                  </span>
                  <span className="text-[11px] text-sombre/60 font-semibold block mt-0.5">
                    Signaler visuellement les commandes ayant dépassé leur date d'échéance
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

              <label className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-2xl border border-sable/50 cursor-pointer hover:border-accent/30 transition-colors">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-sombre block">
                    Nouveautés & Mises à jour
                  </span>
                  <span className="text-[11px] text-sombre/60 font-semibold block mt-0.5">
                    Recevoir les annonces des nouvelles fonctionnalités de l'application
                  </span>
                </div>
                <span className="ios-switch shrink-0">
                  <input
                    type="checkbox"
                    checked={notifNouveautes}
                    onChange={(e) => setNotifNouveautes(e.target.checked)}
                  />
                  <span className="ios-slider" />
                </span>
              </label>
            </div>
          </Card>

          {/* SECTION 4: Préférences d'affichage */}
          <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
              <Globe className="w-5 h-5 text-accent" />
              <span>Préférences d'affichage</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-sombre/90">
                  Langue d'affichage
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
                  Devise de facturation
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
            <span>{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</span>
          </Button>
        </form>

        {/* SECTION 5: Votre avis */}
        <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 rounded-3xl shadow-xs">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
            <MessageSquare className="w-5 h-5 text-accent" />
            <span>Votre avis sur Ourlette</span>
          </h3>

          <p className="text-xs sm:text-sm text-sombre/70 font-medium leading-relaxed font-sans">
            Partagez votre expérience ou vos suggestions pour nous aider à améliorer l'application pour tous les artisans couturiers.
          </p>

          {feedbackSent ? (
            <div className="p-4 bg-emerald-100 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-emerald-300">
              <Check className="w-5 h-5" />
              <span>Merci pour votre témoignage ! Votre retour aide toute la communauté des couturiers.</span>
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

        {/* SECTION 6: Session & Déconnexion */}
        <Card className="p-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-dashed border-2 border-sable/80 bg-white rounded-3xl">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-sombre">Compte & Déconnexion</h4>
            <p className="text-xs sm:text-sm text-sombre/70 font-medium">Connecté : {couturier?.nom || 'Artisan Couturier'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-accent border-accent hover:bg-accent hover:text-white rounded-full">
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </Button>
        </Card>
      </main>
    </div>
  );
}
