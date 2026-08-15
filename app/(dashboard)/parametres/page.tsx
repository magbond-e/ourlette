'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Store,
  Globe,
  Check,
  LogOut,
  Bell,
  MessageSquare,
  Star,
  Send,
  Sparkles,
  Crown,
  Zap,
  Shield,
  CreditCard,
  Phone,
  MapPin,
  Mail,
  Sliders,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Couturier } from '@/lib/types/database';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';
import { isProPlan, FREE_PLAN_LIMITS } from '@/lib/utils/planLimits';

type SettingsTab = 'profil' | 'atelier' | 'abonnement' | 'notifications' | 'preferences' | 'avis';

export default function ParametresPage() {
  const router = useRouter();
  const { user, couturier: authCouturier, refreshProfile, signOut } = useAuth();
  const { triggerTestNotification, refreshNotifications } = useNotifications();
  const [couturier, setCouturier] = useState<Couturier | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('profil');

  // Stats for Subscription Plan Gauges
  const [activeCommandesCount, setActiveCommandesCount] = useState<number>(0);
  const [realisationsCount, setRealisationsCount] = useState<number>(0);
  const [updatingPlan, setUpdatingPlan] = useState<boolean>(false);

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
    const [c, cmds, reals] = await Promise.all([
      DataService.getCouturier(user.id) || authCouturier,
      DataService.getCommandes(user.id),
      DataService.getRealisations(user.id),
    ]);

    const activeCount = cmds.filter((cmd) => cmd.statut !== 'livree').length;
    setActiveCommandesCount(activeCount);
    setRealisationsCount(reals.length);

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

  const handleTogglePlan = async () => {
    if (!user?.id) return;
    setUpdatingPlan(true);
    const targetPlan = isProPlan(couturier) ? 'free' : 'pro';
    const updated = await DataService.updateCouturier(user.id, { plan: targetPlan });
    if (updated) {
      setCouturier(updated);
      await refreshProfile();
      setSuccessMsg(
        targetPlan === 'pro'
          ? '🎉 Félicitations ! Votre atelier est désormais sur le Plan Pro (Commandes et vitrine illimitées).'
          : 'Votre atelier est repassé sur le Plan Gratuit (Limité à 10 commandes et 8 photos).'
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    }
    setUpdatingPlan(false);
  };

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
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTexte.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackTexte('');
    }, 2500);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-clair pb-24 font-sans">
        <main className="max-w-5xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label="Chargement de vos paramètres…" size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">

        {/* ── 1. Top Settings Header ───────────────────────────────────── */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-sable/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sombre text-gold flex items-center justify-center shadow-sm shrink-0 border border-gold/30">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-sombre">
                  Paramètres de l'Atelier
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${isProPlan(couturier)
                  ? 'bg-gold/15 text-sombre border-gold/40'
                  : 'bg-sable/30 text-sombre/80 border-sable/60'
                  }`}>
                  {isProPlan(couturier) ? '👑 Plan Pro' : '⚡ Plan Gratuit'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-sombre/70 font-semibold mt-0.5">
                Gérez vos coordonnées, préférences, abonnements et alertes d'atelier.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-full gap-1.5 text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* ── 2. Segmented Navigation Tabs ───────────────────────────── */}
        <div className="flex items-center gap-2 p-1.5 bg-white border border-sable/60 rounded-2xl shadow-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profil')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'profil'
              ? 'bg-sombre text-white shadow-sm'
              : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
              }`}
          >
            <User className="w-4 h-4" />
            <span>Profil Artisan</span>
          </button>

          <button
            onClick={() => setActiveTab('atelier')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'atelier'
              ? 'bg-sombre text-white shadow-sm'
              : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
              }`}
          >
            <Store className="w-4 h-4" />
            <span>Atelier & Adresse</span>
          </button>

          <button
            onClick={() => setActiveTab('abonnement')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'abonnement'
              ? 'bg-sombre text-white shadow-sm'
              : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
              }`}
          >
            <Crown className="w-4 h-4 text-gold" />
            <span>Abonnement & Formule</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'notifications'
              ? 'bg-sombre text-white shadow-sm'
              : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
              }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alertes & Notifs</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'preferences'
              ? 'bg-sombre text-white shadow-sm'
              : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
              }`}
          >
            <Globe className="w-4 h-4" />
            <span>Devise & Langue</span>
          </button>

          <button
            onClick={() => setActiveTab('avis')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'avis'
              ? 'bg-sombre text-white shadow-sm'
              : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Avis & Aide</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 bg-vertbouton/15 border border-vertbouton/40 rounded-2xl text-sm text-vertbouton font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <Check className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── TAB 1: PROFIL ARTISAN ─────────────────────────────────── */}
        {activeTab === 'profil' && (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="p-6 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-5">
              <div className="border-b border-sable/40 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-2">
                    <User className="w-5 h-5 text-accent" />
                    <span>Identité du Couturier</span>
                  </h3>
                  <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                    Vos informations personnelles pour la gestion de votre compte Ourlette.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nom complet du couturier"
                  type="text"
                  placeholder="ex: Adama Traoré"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />

                <Input
                  label="Adresse Email de connexion"
                  type="email"
                  placeholder="ex: contact@couture.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  helperText="Utilisée pour recevoir les notifications et réinitialiser votre mot de passe."
                  required
                />

                <Input
                  label="Numéro de téléphone direct"
                  type="tel"
                  placeholder="ex: +221 77 123 45 67"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-sable/40">
                <Button
                  type="submit"
                  variant="accent"
                  size="md"
                  disabled={saving}
                  className="rounded-full font-bold shadow-md text-xs sm:text-sm gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Enregistrement…' : 'Sauvegarder mon profil'}</span>
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* ── TAB 2: ATELIER & COORDONNÉES ──────────────────────────── */}
        {activeTab === 'atelier' && (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="p-6 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-5">
              <div className="border-b border-sable/40 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-2">
                    <Store className="w-5 h-5 text-accent" />
                    <span>Informations & Localisation de l'Atelier</span>
                  </h3>
                  <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                    Coordonnées professionnelles et adresse de réception de votre clientèle.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nom commercial de l'atelier"
                  type="text"
                  placeholder="ex: Maison Adia Couture"
                  value={nomAtelier}
                  onChange={(e) => setNomAtelier(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  helperText="Indication utile pour les clients qui viennent pour des essayages ou dépôts de tissus."
                />

                <Input
                  label="Numéro WhatsApp commercial"
                  type="tel"
                  placeholder="ex: +221 77 123 45 67"
                  value={whatsappContact}
                  onChange={(e) => setWhatsappContact(e.target.value)}
                  helperText="Numéro pour recevoir les commandes et messages clients de la vitrine."
                />

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-sombre">
                    Bio & Histoire de l'atelier
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Présentez votre atelier, vos spécialités et vos valeurs..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3.5 bg-white border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-sans shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-sable/40">
                <Button
                  type="submit"
                  variant="accent"
                  size="md"
                  disabled={saving}
                  className="rounded-full font-bold shadow-md text-xs sm:text-sm gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Enregistrement…' : 'Enregistrer les coordonnées'}</span>
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* ── TAB 3: ABONNEMENT & FORMULE ───────────────────────────── */}
        {activeTab === 'abonnement' && (
          <div className="space-y-6">
            {/* Prestige Plan Card */}
            <Card className={`p-6 sm:p-8 rounded-3xl border-2 shadow-lg transition-all ${isProPlan(couturier)
              ? 'bg-gradient-to-br from-sombre via-[#3D1A1E] to-sombre text-white border-gold'
              : 'bg-white text-sombre border-sable/80'
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-sable/40 pb-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0 ${isProPlan(couturier) ? 'bg-gold/20 text-gold border border-gold/40' : 'bg-accent/10 text-accent'
                    }`}>
                    {isProPlan(couturier) ? <Crown className="w-7 h-7" /> : <Zap className="w-7 h-7" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-xl sm:text-2xl font-display font-bold">
                        {isProPlan(couturier) ? 'Formule Pro Atelier' : 'Formule Gratuite (Starter)'}
                      </h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-extrabold border ${isProPlan(couturier)
                        ? 'bg-gold text-sombre border-gold shadow-sm'
                        : 'bg-sable/40 text-sombre border-sable/80'
                        }`}>
                        {isProPlan(couturier) ? '👑 Illimité' : '⚡ Starter'}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm font-semibold mt-1 max-w-xl ${isProPlan(couturier) ? 'text-clair/80' : 'text-sombre/70'}`}>
                      {isProPlan(couturier)
                        ? 'Votre atelier bénéficie de toutes les fonctionnalités illimitées : commandes, photos vitrine, lien personnalisé.'
                        : 'Idéal pour démarrer votre atelier (limite à 10 commandes simultanées et 8 photos vitrine).'}
                    </p>
                  </div>
                </div>

                {isProPlan(couturier) ? (
                  <Button
                    type="button"
                    onClick={handleTogglePlan}
                    disabled={updatingPlan}
                    variant="outline"
                    size="lg"
                    className="rounded-full font-extrabold text-xs sm:text-sm shadow-md gap-2 shrink-0 border-white/30 text-white hover:bg-white/10"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{updatingPlan ? 'Mise à jour…' : 'Passer au Plan Gratuit'}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => router.push('/pro')}
                    variant="gold"
                    size="lg"
                    className="rounded-full font-extrabold text-xs sm:text-sm shadow-md gap-2 shrink-0 bg-gold text-sombre hover:bg-gold/90"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Activer le Plan Pro (1 999 F)</span>
                  </Button>
                )}
              </div>

              {/* Usage Quota Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                {/* Commandes Gauge */}
                <div className={`p-4 rounded-2xl border ${isProPlan(couturier) ? 'bg-white/5 border-white/10' : 'bg-[#FAF9F6] border-sable/60'}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className={isProPlan(couturier) ? 'text-white/80' : 'text-sombre/70'}>Commandes en cours actives</span>
                    <span className="font-extrabold">
                      {activeCommandesCount} {isProPlan(couturier) ? '/ ∞' : `/ ${FREE_PLAN_LIMITS.maxActiveCommandes}`}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isProPlan(couturier) ? 'bg-gold' : activeCommandesCount >= FREE_PLAN_LIMITS.maxActiveCommandes ? 'bg-rose-500' : 'bg-accent'
                        }`}
                      style={{
                        width: isProPlan(couturier)
                          ? '100%'
                          : `${Math.min(100, (activeCommandesCount / FREE_PLAN_LIMITS.maxActiveCommandes) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Vitrine Photos Gauge */}
                <div className={`p-4 rounded-2xl border ${isProPlan(couturier) ? 'bg-white/5 border-white/10' : 'bg-[#FAF9F6] border-sable/60'}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className={isProPlan(couturier) ? 'text-white/80' : 'text-sombre/70'}>Photos exposées sur vitrine</span>
                    <span className="font-extrabold">
                      {realisationsCount} {isProPlan(couturier) ? '/ ∞' : `/ ${FREE_PLAN_LIMITS.maxRealisations}`}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isProPlan(couturier) ? 'bg-gold' : realisationsCount >= FREE_PLAN_LIMITS.maxRealisations ? 'bg-rose-500' : 'bg-accent'
                        }`}
                      style={{
                        width: isProPlan(couturier)
                          ? '100%'
                          : `${Math.min(100, (realisationsCount / FREE_PLAN_LIMITS.maxRealisations) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Pro Features Table */}
            <Card className="p-6 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-accent border-b border-sable/40 pb-2">
                Comparatif des fonctionnalités
              </h4>
              <div className="divide-y divide-sable/30 text-xs sm:text-sm font-semibold">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-sombre">Commandes simultanées</span>
                  <span className="font-extrabold text-accent">{isProPlan(couturier) ? 'Illimitées' : '10 max'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-sombre">Photos de réalisations vitrine</span>
                  <span className="font-extrabold text-accent">{isProPlan(couturier) ? 'Illimitées' : '8 max'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-sombre">Lien de vitrine personnalisable (Slug)</span>
                  <span className="font-extrabold text-vertbouton">{isProPlan(couturier) ? '✓ Inclus' : '🔒 Option Pro'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-sombre">Support prioritaire & sauvegarde continue</span>
                  <span className="font-extrabold text-vertbouton">✓ Inclus pour tous</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 4: NOTIFICATIONS & ALERTES ─────────────────────────── */}
        {activeTab === 'notifications' && (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="p-6 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-5">
              <div className="border-b border-sable/40 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-2">
                    <Bell className="w-5 h-5 text-accent" />
                    <span>Préférences des Alertes & Notifications</span>
                  </h3>
                  <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                    Configurez quand et comment vous souhaitez être alerté des échéances et commandes.
                  </p>
                </div>
              </div>

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
                      Alerte de retard de commande
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

                {/* Test Notifications Live Button */}
                <div className="pt-2 border-t border-sable/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FAF9F6] p-4 rounded-2xl border border-sable/60">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-sombre">Tester le flux de notifications</h4>
                    <p className="text-[11px] text-sombre/60 font-semibold">
                      Déclenche un test réel persistant en base de données avec toast et carillon audio.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={triggerTestNotification}
                    className="rounded-full text-xs font-bold gap-1.5 border-accent text-accent hover:bg-accent hover:text-white shrink-0"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Envoyer une notif test</span>
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t border-sable/40">
                <Button
                  type="submit"
                  variant="accent"
                  size="md"
                  disabled={saving}
                  className="rounded-full font-bold shadow-md text-xs sm:text-sm gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Enregistrement…' : 'Enregistrer les alertes'}</span>
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* ── TAB 5: DEVISE & LANGUE ─────────────────────────────────── */}
        {activeTab === 'preferences' && (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="p-6 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-5">
              <div className="border-b border-sable/40 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-2">
                    <Globe className="w-5 h-5 text-accent" />
                    <span>Préférences Régionales & Devise</span>
                  </h3>
                  <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                    Définissez la monnaie de vos commandes et la langue de votre interface.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-bold text-sombre">
                    Devise de facturation
                  </label>
                  <select
                    value={devise}
                    onChange={(e) => setDevise(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-sable/80 rounded-2xl text-sm font-bold text-sombre focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent shadow-xs"
                  >
                    <option value="FCFA">FCFA (Franc CFA — Afrique de l'Ouest & Centrale)</option>
                    <option value="EUR">EUR (€ — Euro)</option>
                    <option value="USD">USD ($ — Dollar US)</option>
                    <option value="GNF">GNF (Franc Guinéen)</option>
                    <option value="MAD">MAD (Dirham Marocain)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-bold text-sombre">
                    Langue d'affichage
                  </label>
                  <select
                    value={langue}
                    onChange={(e) => setLangue(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-sable/80 rounded-2xl text-sm font-bold text-sombre focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent shadow-xs"
                  >
                    <option value="fr">Français (Défaut)</option>
                    <option value="en">English (Anglais)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-sable/40">
                <Button
                  type="submit"
                  variant="accent"
                  size="md"
                  disabled={saving}
                  className="rounded-full font-bold shadow-md text-xs sm:text-sm gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Enregistrement…' : 'Sauvegarder les préférences'}</span>
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* ── TAB 6: AVIS & AIDE ─────────────────────────────────────── */}
        {activeTab === 'avis' && (
          <div className="space-y-6">
            <Card className="p-6 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-5">
              <div className="border-b border-sable/40 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-accent" />
                    <span>Votre Avis & Suggestions sur Ourlette</span>
                  </h3>
                  <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                    Vos retours façonnent directement les prochaines fonctionnalités pour les couturiers.
                  </p>
                </div>
              </div>

              {feedbackSent ? (
                <div className="p-5 bg-emerald-50 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 border border-emerald-300">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Merci pour votre témoignage ! Votre avis aide toute la communauté des artisans couturiers.</span>
                </div>
              ) : (
                <form onSubmit={handleSendFeedback} className="space-y-4 font-sans">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-sombre block">Votre note globale :</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackNote(star)}
                          className="p-1 text-gold hover:scale-125 transition-transform"
                        >
                          <Star className={`w-6 h-6 ${star <= feedbackNote ? 'fill-gold text-gold' : 'text-sable'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Racontez votre expérience avec Ourlette, ce que vous aimez ou les fonctionnalités que vous aimeriez voir..."
                    value={feedbackTexte}
                    onChange={(e) => setFeedbackTexte(e.target.value)}
                    className="w-full p-4 bg-[#FAFAF8] border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-sans shadow-xs"
                    required
                  />

                  <Button type="submit" variant="accent" size="md" className="gap-2 rounded-full font-bold shadow-md">
                    <Send className="w-4 h-4" />
                    <span>Envoyer mon avis</span>
                  </Button>
                </form>
              )}
            </Card>

            {/* Assistance & WhatsApp Help Desk */}
            <Card className="p-6 bg-[#FAF9F6] border border-sable/70 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white border border-sable/80 flex items-center justify-center text-accent shadow-xs shrink-0">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-sombre">Besoin d'aide ou d'assistance ?</h4>
                  <p className="text-xs text-sombre/70 font-semibold">Notre équipe accompagne tous les artisans couturiers 7j/7.</p>
                </div>
              </div>

              <a
                href="https://wa.me/2290140872836?text=Bonjour%20Ourlette,%20j'ai%20une%20question%20concernant%20mon%20atelier."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="rounded-full text-xs font-bold gap-1.5 border-sombre text-sombre hover:bg-sombre hover:text-white">
                  <span>💬 Contacter le Support WhatsApp</span>
                </Button>
              </a>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
