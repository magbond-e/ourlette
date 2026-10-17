'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  ShieldCheck,
  CreditCard,
  Phone,
  MapPin,
  Mail,
  Sliders,
  ChevronRight,
  ExternalLink,
  Smartphone,
  Lock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { NotificationService } from '@/lib/services/notificationService';
import { Couturier } from '@/lib/types/database';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';
import { useLanguage, Locale } from '@/lib/i18n';
import { isProPlan, FREE_PLAN_LIMITS, PRO_PLAN_PRICE, SHOW_ACCOUNT_PLANS } from '@/lib/utils/planLimits';
import { formatFCFA, OURLETTE_SUPPORT_WHATSAPP_URL, OURLETTE_SUPPORT_PHONE } from '@/lib/utils/formatters';

type SettingsTab = 'profil' | 'atelier' | 'abonnement' | 'notifications' | 'preferences' | 'avis';

export default function ParametresPage() {
  const router = useRouter();
  const { user, couturier: authCouturier, refreshProfile, signOut } = useAuth();
  const { triggerTestNotification, refreshNotifications } = useNotifications();
  const { dict, locale, setLocale } = useLanguage();
  const isEn = locale === 'en';
  const [couturier, setCouturier] = useState<Couturier | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('profil');

  // Stats for Subscription Plan Gauges
  const [activeCommandesCount, setActiveCommandesCount] = useState<number>(0);
  const [realisationsCount, setRealisationsCount] = useState<number>(0);
  const [processingSasPay, setProcessingSasPay] = useState<boolean>(false);

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
  const [notifPaiements, setNotifPaiements] = useState(true);
  const [timezone, setTimezone] = useState('Africa/Porto-Novo');

  // Feedback State
  const [feedbackNote, setFeedbackNote] = useState<number>(5);
  const [feedbackTexte, setFeedbackTexte] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Initial loaded data snapshot to detect unsaved changes
  const [initialData, setInitialData] = useState<any>(null);

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
      let pRetard = c.notif_retard ?? true;
      let pRappel = c.notif_rappel_livraison ?? true;
      let pEmail = c.notifications_email ?? true;
      let pNouveautes = c.notif_nouveautes ?? true;
      let pPaiements = true;

      if (user?.id) {
        try {
          const prefs = await NotificationService.getPreferences(user.id);
          if (prefs) {
            pRetard = prefs.order?.in_app ?? pRetard;
            pRappel = prefs.order?.in_app ?? pRappel;
            pPaiements = prefs.payment?.in_app ?? true;
            pEmail = prefs.order?.email || prefs.account?.email || pEmail;
            pNouveautes = prefs.system?.in_app ?? pNouveautes;
          }
        } catch {
          // Utiliser les réglages du profil
        }
      }

      const initial = {
        nom: c.nom && c.nom !== 'Artisan Couturier' ? c.nom : '',
        nomAtelier: c.nom_atelier && c.nom_atelier !== 'Mon Atelier' ? c.nom_atelier : '',
        email: c.email || user.email || '',
        telephone: c.telephone || '',
        whatsappContact: c.whatsapp_contact || c.telephone || '',
        ville: c.ville || '',
        pays: c.pays || '',
        adresseAtelier: c.adresse_atelier || '',
        bio: c.bio || '',
        slug: c.slug_vitrine || '',
        langue: c.langue || 'fr',
        devise: c.devise || 'FCFA',
        notifEmail: pEmail,
        notifRetard: pRetard,
        notifRappelLivraison: pRappel,
        notifNouveautes: pNouveautes,
        notifPaiements: pPaiements,
        timezone: c.timezone || 'Africa/Porto-Novo',
      };

      setNom(initial.nom);
      setNomAtelier(initial.nomAtelier);
      setEmail(initial.email);
      setTelephone(initial.telephone);
      setWhatsappContact(initial.whatsappContact);
      setVille(initial.ville);
      setPays(initial.pays);
      setAdresseAtelier(initial.adresseAtelier);
      setBio(initial.bio);
      setSlug(initial.slug);
      setLangue(initial.langue);
      setDevise(initial.devise);
      setNotifEmail(initial.notifEmail);
      setNotifRetard(initial.notifRetard);
      setNotifRappelLivraison(initial.notifRappelLivraison);
      setNotifNouveautes(initial.notifNouveautes);
      setNotifPaiements(initial.notifPaiements);
      setTimezone(initial.timezone);

      setInitialData(initial);
    }
    setLoading(false);
  }, [user?.id, user?.email, authCouturier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check for unsaved changes in current tab
  const hasUnsavedChanges = useMemo(() => {
    if (!initialData) return false;
    if (activeTab === 'profil') {
      return nom !== initialData.nom || telephone !== initialData.telephone || email !== initialData.email;
    }
    if (activeTab === 'atelier') {
      return (
        nomAtelier !== initialData.nomAtelier ||
        whatsappContact !== initialData.whatsappContact ||
        ville !== initialData.ville ||
        pays !== initialData.pays ||
        adresseAtelier !== initialData.adresseAtelier ||
        bio !== initialData.bio ||
        slug !== initialData.slug
      );
    }
    if (activeTab === 'notifications') {
      return (
        notifEmail !== initialData.notifEmail ||
        notifRetard !== initialData.notifRetard ||
        notifRappelLivraison !== initialData.notifRappelLivraison ||
        notifNouveautes !== initialData.notifNouveautes ||
        notifPaiements !== initialData.notifPaiements
      );
    }
    if (activeTab === 'preferences') {
      return (
        devise !== initialData.devise ||
        langue !== initialData.langue ||
        timezone !== initialData.timezone
      );
    }
    return false;
  }, [
    initialData,
    activeTab,
    nom,
    telephone,
    email,
    nomAtelier,
    whatsappContact,
    ville,
    pays,
    adresseAtelier,
    bio,
    slug,
    notifEmail,
    notifRetard,
    notifRappelLivraison,
    notifNouveautes,
    notifPaiements,
    devise,
    langue,
    timezone,
  ]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // 1. Sauvegarde Profil
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      await DataService.updateCouturier(user.id, {
        nom: nom.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
      });
      await refreshProfile();
      setInitialData((prev: any) => ({ ...prev, nom, telephone, email }));
      showNotification(locale === 'fr' ? 'Profil artisan mis à jour avec succès' : 'Craftsman profile updated successfully');
    } catch {
      showNotification(locale === 'fr' ? 'Erreur lors de la sauvegarde du profil' : 'Error saving craftsman profile', true);
    } finally {
      setSaving(false);
    }
  };

  // 2. Sauvegarde Atelier
  const handleSaveAtelier = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      await DataService.updateCouturier(user.id, {
        nom_atelier: nomAtelier.trim(),
        whatsapp_contact: whatsappContact.trim(),
        ville: ville.trim(),
        pays: pays.trim(),
        adresse_atelier: adresseAtelier.trim(),
        bio: bio.trim(),
        slug_vitrine: slug.trim() || undefined,
      });
      await refreshProfile();
      setInitialData((prev: any) => ({
        ...prev,
        nomAtelier,
        whatsappContact,
        ville,
        pays,
        adresseAtelier,
        bio,
        slug,
      }));
      showNotification(locale === 'fr' ? 'Coordonnées de l’atelier enregistrées' : 'Workshop details saved successfully');
    } catch {
      showNotification(locale === 'fr' ? 'Erreur lors de la sauvegarde de l’atelier' : 'Error saving workshop details', true);
    } finally {
      setSaving(false);
    }
  };

  // 3. Sauvegarde Notifications
  const handleSaveNotifications = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // 1. Sauvegarde rétro-compatible sur couturiers
      await DataService.updateCouturier(user.id, {
        notifications_email: notifEmail,
        notif_retard: notifRetard,
        notif_rappel_livraison: notifRappelLivraison,
        notif_nouveautes: notifNouveautes,
      });

      // 2. Sauvegarde granulaire dans la table notification_preferences
      await Promise.all([
        NotificationService.updatePreference(user.id, 'order', notifRetard || notifRappelLivraison, notifEmail),
        NotificationService.updatePreference(user.id, 'payment', notifPaiements, notifEmail),
        NotificationService.updatePreference(user.id, 'client', true, false),
        NotificationService.updatePreference(user.id, 'system', notifNouveautes, notifEmail),
        NotificationService.updatePreference(user.id, 'account', true, notifEmail),
      ]);

      await refreshProfile();
      await refreshNotifications();
      setInitialData((prev: any) => ({
        ...prev,
        notifEmail,
        notifRetard,
        notifRappelLivraison,
        notifNouveautes,
        notifPaiements,
      }));
      showNotification(locale === 'fr' ? 'Préférences de notifications enregistrées' : 'Notification preferences saved successfully');
    } catch {
      showNotification(locale === 'fr' ? 'Erreur de sauvegarde des alertes' : 'Error saving notification preferences', true);
    } finally {
      setSaving(false);
    }
  };

  // 4. Sauvegarde Préférences (Devise / Langue / Fuseau horaire)
  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      await DataService.updateCouturier(user.id, {
        langue,
        devise,
        timezone,
      });
      if (langue === 'fr' || langue === 'en') {
        setLocale(langue as Locale);
      }
      await refreshProfile();
      setInitialData((prev: any) => ({ ...prev, langue, devise, timezone }));
      showNotification(locale === 'fr' ? 'Préférences régionales appliquées' : 'Regional preferences applied successfully');
    } catch {
      showNotification(locale === 'fr' ? 'Erreur de sauvegarde des préférences' : 'Error saving regional preferences', true);
    } finally {
      setSaving(false);
    }
  };

  // Déclencher paiement SasPay direct
  const handleUpgradeSasPay = async () => {
    if (!user?.id) return;
    setProcessingSasPay(true);
    try {
      const response = await fetch('/api/pro/saspay/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'checkout',
          country: pays || couturier?.pays || 'BJ',
          currency: 'XOF',
          phone: whatsappContact || telephone,
        }),
      });
      const data = await response.json();
      if (response.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        router.push('/pro');
      }
    } catch (e) {
      router.push('/pro');
    } finally {
      setProcessingSasPay(false);
    }
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

  const isPro = isProPlan(couturier);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] pb-24 font-sans">
        <main className="max-w-5xl mx-auto px-4 pt-16">
          <ThreadSpoolLoader label={dict.common.loading} size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-32 font-sans selection:bg-gold/30">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* Mobile Segmented 5-Tab Bar (< lg) */}
        <div className="sticky top-[64px] z-20 bg-[#F7F7F5]/95 backdrop-blur-md pt-1 pb-2 lg:hidden">
          <div className="grid grid-cols-5 p-1 bg-white border border-sable/70 rounded-2xl shadow-xs gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('profil')}
              className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'profil'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'text-sombre/70 hover:bg-black/5 hover:text-sombre'
              }`}
            >
              <User className="w-4 h-4 mb-0.5 shrink-0" />
              <span className="truncate max-w-full">{locale === 'en' ? 'Profile' : 'Profil'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('atelier')}
              className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'atelier'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'text-sombre/70 hover:bg-black/5 hover:text-sombre'
              }`}
            >
              <Store className="w-4 h-4 mb-0.5 shrink-0" />
              <span className="truncate max-w-full">{locale === 'en' ? 'Workshop' : 'Atelier'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'notifications'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'text-sombre/70 hover:bg-black/5 hover:text-sombre'
              }`}
            >
              <Bell className="w-4 h-4 mb-0.5 shrink-0" />
              <span className="truncate max-w-full">{locale === 'en' ? 'Alerts' : 'Alertes'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'preferences'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'text-sombre/70 hover:bg-black/5 hover:text-sombre'
              }`}
            >
              <Globe className="w-4 h-4 mb-0.5 shrink-0" />
              <span className="truncate max-w-full">{locale === 'en' ? 'Options' : 'Général'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('avis')}
              className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'avis'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'text-sombre/70 hover:bg-black/5 hover:text-sombre'
              }`}
            >
              <Star className="w-4 h-4 mb-0.5 shrink-0" />
              <span className="truncate max-w-full">{locale === 'en' ? 'Support' : 'Support'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout (Sidebar Left, Active Content Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ── Left Sidebar (4 cols on Desktop) ────────────────────── */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-[76px]">
            {/* Atelier Card */}
            <div className="bg-white p-5 rounded-2xl border border-sable/70 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-sombre to-[#42171D] text-white flex items-center justify-center font-display font-black text-lg shadow-sm shrink-0 border border-gold/30">
                  {nom ? nom.charAt(0).toUpperCase() : 'O'}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-bold text-sombre truncate">
                    {nomAtelier || (locale === 'fr' ? 'Mon Atelier' : 'My Workshop')}
                  </h1>
                  <p className="text-xs text-sombre/60 font-semibold truncate mt-0.5">
                    {nom || (locale === 'fr' ? 'Artisan Couturier' : 'Tailor')}
                  </p>
                </div>
                {couturier?.slug_vitrine && (
                  <Link
                    href={`/${couturier.slug_vitrine}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-[#F8F8F6] text-sombre/70 hover:text-accent hover:bg-black/5 transition-colors border border-sable/60 shrink-0"
                    title={locale === 'fr' ? 'Voir ma vitrine en ligne' : 'View showcase'}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Desktop Vertical Menu */}
            <div className="hidden lg:block bg-white p-2 rounded-2xl border border-sable/70 shadow-xs space-y-1">
              <button
                onClick={() => setActiveTab('profil')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'profil'
                    ? 'bg-sombre text-white shadow-xs'
                    : 'text-sombre/70 hover:bg-black/5 hover:text-sombre'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{dict.parametres.tabProfile}</span>
              </button>

              <button
                onClick={() => setActiveTab('atelier')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'atelier'
                    ? 'bg-sombre text-white shadow-xs'
                    : 'text-sombre/70 hover:bg-black/5 hover:text-sombre'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>{dict.parametres.tabWorkshop}</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-sombre text-white shadow-xs'
                    : 'text-sombre/70 hover:bg-black/5 hover:text-sombre'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>{dict.parametres.tabNotifications}</span>
              </button>

              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'preferences'
                    ? 'bg-sombre text-white shadow-xs'
                    : 'text-sombre/70 hover:bg-black/5 hover:text-sombre'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>{dict.parametres.tabPreferences}</span>
              </button>

              <button
                onClick={() => setActiveTab('avis')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'avis'
                    ? 'bg-sombre text-white shadow-xs'
                    : 'text-sombre/70 hover:bg-black/5 hover:text-sombre'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>{dict.parametres.tabFeedback}</span>
              </button>

              <div className="pt-2 border-t border-sable/40 mt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{dict.parametres.logoutButton}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Content Area (8 cols on Desktop) ──────────────── */}
          <div className="lg:col-span-8 space-y-4">
            {/* Feedback Banner Toast */}
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
                <span>{errorMsg}</span>
              </div>
            )}

        {/* ── TAB 1: PROFIL ARTISAN ─────────────────────────────────── */}
        {activeTab === 'profil' && (
          <Card className="p-5 sm:p-6 bg-white border border-black/5 rounded-3xl shadow-xs space-y-5">
            <div className="border-b border-black/5 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-accent">
                {dict.parametres.profileTitle}
              </h2>
              <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                {locale === 'fr'
                  ? 'Vos informations personnelles visibles sur vos fiches clients et reçus.'
                  : 'Your personal craftsman details shown on client sheets and receipts.'}
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label={dict.parametres.fullNameLabel}
                name="nom"
                placeholder={locale === 'fr' ? 'Ex : Koffi Mensah' : 'Ex: John Doe'}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />

              <Input
                label={dict.parametres.phoneLabel}
                name="telephone"
                type="tel"
                placeholder="+229 97 00 00 00"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />

              <Input
                label={dict.parametres.emailLabel}
                name="email"
                type="email"
                placeholder="couturier@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  fullWidth
                  disabled={saving}
                  className="rounded-2xl font-bold py-3.5 shadow-sm text-xs sm:text-sm gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? dict.common.saving : dict.parametres.saveProfileBtn}</span>
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── TAB 2: ATELIER & COORDONNÉES ──────────────────────────── */}
        {activeTab === 'atelier' && (
          <Card className="p-5 sm:p-6 bg-white border border-black/5 rounded-3xl shadow-xs space-y-5">
            <div className="border-b border-black/5 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-accent">
                {dict.parametres.workshopTitle}
              </h2>
              <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                {locale === 'fr'
                  ? 'Ces coordonnées sont présentées à vos clients sur votre vitrine web publique.'
                  : 'These details are presented to potential clients on your public web showcase.'}
              </p>
            </div>

            <form onSubmit={handleSaveAtelier} className="space-y-4">
              <Input
                label={dict.parametres.workshopNameLabel}
                name="nom_atelier"
                placeholder={locale === 'fr' ? 'Ex : Atelier Élégance Cotonou' : 'Ex: Elegance Fashion Atelier'}
                value={nomAtelier}
                onChange={(e) => setNomAtelier(e.target.value)}
                required
              />

              <Input
                label={locale === 'fr' ? 'Numéro WhatsApp Business' : 'WhatsApp Business Number'}
                name="whatsapp"
                type="tel"
                placeholder={locale === 'fr' ? '+229 97 00 00 00 (commandes directes)' : '+229 97 00 00 00 (direct orders)'}
                value={whatsappContact}
                onChange={(e) => setWhatsappContact(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={dict.parametres.cityLabel}
                  name="ville"
                  placeholder={locale === 'fr' ? 'Ex : Cotonou' : 'Ex: Accra'}
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                />
                <Input
                  label={dict.parametres.countryLabel}
                  name="pays"
                  placeholder={locale === 'fr' ? 'Ex : Bénin' : 'Ex: Ghana'}
                  value={pays}
                  onChange={(e) => setPays(e.target.value)}
                />
              </div>

              <Input
                label={dict.parametres.addressLabel}
                name="adresse"
                placeholder={locale === 'fr' ? 'Quartier, rue, repère...' : 'District, street, landmark...'}
                value={adresseAtelier}
                onChange={(e) => setAdresseAtelier(e.target.value)}
              />

              {/* Slug Vitrine */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-sombre uppercase tracking-wider block">
                  {locale === 'fr' ? 'Identifiant personnalisé (Lien de vitrine)' : 'Signature Web Address (Showcase link)'}
                </label>
                <div className="flex rounded-2xl border border-sable/80 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-accent/20">
                  <span className="inline-flex items-center px-3.5 bg-[#FAF9F6] text-sombre/50 text-xs font-bold border-r border-sable/60">
                    ourlette.app/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '-')
                          .replace(/-+/g, '-')
                      )
                    }
                    placeholder="my-atelier"
                    className="flex-1 px-3 py-2.5 text-xs sm:text-sm font-bold text-sombre focus:outline-none"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-sombre uppercase tracking-wider block">
                  {dict.parametres.bioLabel}
                </label>
                <textarea
                  rows={3}
                  placeholder={locale === 'fr' ? 'Spécialités : broderies, tenues de mariage, prêt-à-porter traditionnel...' : 'Specialties: luxury embroidery, wedding outfits, bespoke couture...'}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3.5 bg-white border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 font-sans shadow-2xs"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  fullWidth
                  disabled={saving}
                  className="rounded-2xl font-bold py-3.5 shadow-sm text-xs sm:text-sm gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? dict.common.saving : dict.parametres.saveWorkshopBtn}</span>
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── TAB 3: ABONNEMENT & PAIEMENT SASPAY ─────────────────────── */}
        {SHOW_ACCOUNT_PLANS && activeTab === 'abonnement' && (
          <div className="space-y-5">
            {/* Prestige Plan Card */}
            <div
              className={`p-6 rounded-3xl border shadow-lg transition-all ${
                isPro
                  ? 'bg-gradient-to-br from-[#1F0D10] via-[#2F1318] to-sombre text-white border-gold/40'
                  : 'bg-white text-sombre border-gold/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-white/10 pb-5">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0 ${
                      isPro
                        ? 'bg-gold/20 text-gold border border-gold/40'
                        : 'bg-accent/10 text-accent border border-accent/20'
                    }`}
                  >
                    {isPro ? <Crown className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-display font-bold">
                        {isPro ? dict.parametres.proPlanName : dict.parametres.freePlanName}
                      </h3>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          isPro
                            ? 'bg-gold text-sombre shadow-xs'
                            : 'bg-black/10 text-sombre'
                        }`}
                      >
                        {isPro ? `👑 ${dict.parametres.unlimited}` : '⚡ 10 max'}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-semibold mt-0.5 ${
                        isPro ? 'text-clair/80' : 'text-sombre/70'
                      }`}
                    >
                      {isPro ? dict.parametres.proPlanDesc : dict.parametres.freePlanDesc}
                    </p>
                  </div>
                </div>

                {isPro ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-gold/20 text-gold border border-gold/40">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    <span>{dict.parametres.proActiveBadge}</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={handleUpgradeSasPay}
                    disabled={processingSasPay}
                    variant="gold"
                    size="md"
                    className="rounded-2xl font-black text-xs sm:text-sm shadow-md gap-2 bg-gold text-sombre hover:bg-gold/90 shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-sombre" />
                    <span>
                      {processingSasPay ? dict.pro.processing : dict.parametres.upgradeProBtn}
                    </span>
                  </Button>
                )}
              </div>

              {/* Usage Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
                {/* Commandes Gauge */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isPro ? 'bg-white/5 border-white/10' : 'bg-[#FAF9F6] border-black/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className={isPro ? 'text-white/80' : 'text-sombre/70'}>
                      {dict.parametres.activeOrdersGauge}
                    </span>
                    <span className="font-mono font-black">
                      {activeCommandesCount} {isPro ? '/ ∞' : `/ ${FREE_PLAN_LIMITS.maxActiveCommandes}`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPro
                          ? 'bg-gold'
                          : activeCommandesCount >= FREE_PLAN_LIMITS.maxActiveCommandes
                          ? 'bg-rose-500'
                          : 'bg-accent'
                      }`}
                      style={{
                        width: isPro
                          ? '100%'
                          : `${Math.min(100, (activeCommandesCount / FREE_PLAN_LIMITS.maxActiveCommandes) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Vitrine Gauge */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isPro ? 'bg-white/5 border-white/10' : 'bg-[#FAF9F6] border-black/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className={isPro ? 'text-white/80' : 'text-sombre/70'}>
                      {dict.parametres.galleryPhotosGauge}
                    </span>
                    <span className="font-mono font-black">
                      {realisationsCount} {isPro ? '/ ∞' : `/ ${FREE_PLAN_LIMITS.maxRealisations}`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPro
                          ? 'bg-gold'
                          : realisationsCount >= FREE_PLAN_LIMITS.maxRealisations
                          ? 'bg-rose-500'
                          : 'bg-accent'
                      }`}
                      style={{
                        width: isPro
                          ? '100%'
                          : `${Math.min(100, (realisationsCount / FREE_PLAN_LIMITS.maxRealisations) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Security Section (SasPay Multi-Network) */}
            <Card className="p-5 bg-white border border-black/5 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sombre">
                    {dict.pro.saspayGuarantee}
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-sombre/60">
                  {formatFCFA(PRO_PLAN_PRICE)} {dict.pro.perMonth}
                </span>
              </div>

              <p className="text-xs text-sombre/70 font-medium">
                {dict.pro.mobileMoneyNotice}
              </p>

              {!isPro && (
                <Button
                  onClick={() => router.push('/pro')}
                  variant="accent"
                  fullWidth
                  className="rounded-2xl font-bold py-3.5 gap-2 text-xs sm:text-sm shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{locale === 'fr' ? 'Voir tous les avantages du Plan Pro' : 'Explore all Pro Plan features'}</span>
                </Button>
              )}
            </Card>
          </div>
        )}

        {/* ── TAB 4: ALERTES & NOTIFICATIONS (iOS Style Toggles) ──────── */}
        {activeTab === 'notifications' && (
          <Card className="p-5 sm:p-6 bg-white border border-black/5 rounded-3xl shadow-xs space-y-6">
            <div className="border-b border-black/5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-accent">
                  {dict.parametres.notificationsTitle}
                </h2>
                <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                  {dict.parametres.notificationsDesc}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerTestNotification}
                className="rounded-xl text-xs font-bold gap-1.5 self-start sm:self-auto border-sable/80 hover:bg-[#FAF9F6] text-sombre"
              >
                <Bell className="w-3.5 h-3.5 text-accent" />
                <span>Tester une notification</span>
              </Button>
            </div>

            <div className="divide-y divide-black/5 space-y-1">
              {/* Toggle 1 : Commandes en retard */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-sombre">
                    {dict.parametres.notifOverdueTitle}
                  </p>
                  <p className="text-[11px] text-sombre/60 font-medium">
                    {dict.parametres.notifOverdueDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifRetard(!notifRetard)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifRetard ? 'bg-accent' : 'bg-black/15'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      notifRetard ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2 : Échéances proches & Essayages */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-sombre">
                    {dict.parametres.notifFittingTitle}
                  </p>
                  <p className="text-[11px] text-sombre/60 font-medium">
                    {dict.parametres.notifFittingDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifRappelLivraison(!notifRappelLivraison)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifRappelLivraison ? 'bg-accent' : 'bg-black/15'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      notifRappelLivraison ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3 : Paiements & Versements */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-sombre">
                    {locale === 'fr' ? 'Versements & Paiements reçus' : 'Payments & deposits logged'}
                  </p>
                  <p className="text-[11px] text-sombre/60 font-medium">
                    {locale === 'fr' ? 'Alerte in-app dès qu’un acompte ou versement est enregistré sur une commande' : 'In-app alert when a deposit or payment is recorded'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifPaiements(!notifPaiements)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifPaiements ? 'bg-accent' : 'bg-black/15'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      notifPaiements ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 4 : Alertes par email */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-sombre">
                    {dict.parametres.notifEmailTitle}
                  </p>
                  <p className="text-[11px] text-sombre/60 font-medium">
                    {dict.parametres.notifEmailDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifEmail(!notifEmail)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifEmail ? 'bg-accent' : 'bg-black/15'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      notifEmail ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleSaveNotifications}
                variant="accent"
                fullWidth
                disabled={saving}
                className="rounded-2xl font-bold py-3.5 shadow-sm text-xs sm:text-sm gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? dict.common.saving : dict.parametres.saveNotifBtn}</span>
              </Button>
            </div>
          </Card>
        )}

        {/* ── TAB 5: PRÉFÉRENCES (Devise / Région / Fuseau horaire) ─────── */}
        {activeTab === 'preferences' && (
          <Card className="p-5 sm:p-6 bg-white border border-black/5 rounded-3xl shadow-xs space-y-5">
            <div className="border-b border-black/5 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-accent">
                {dict.parametres.preferencesTitle}
              </h2>
              <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                {dict.parametres.preferencesDesc}
              </p>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-sombre uppercase tracking-wider block">
                  {dict.parametres.currencyLabel}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['FCFA', 'EUR', 'USD'].map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setDevise(cur)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                        devise === cur
                          ? 'bg-sombre text-white border-sombre shadow-xs'
                          : 'bg-[#FAF9F6] text-sombre/80 border-black/5 hover:border-black/20'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-sombre uppercase tracking-wider block">
                  {dict.parametres.languageLabel}
                </label>
                <select
                  value={langue}
                  onChange={(e) => {
                    const newL = e.target.value as Locale;
                    setLangue(newL);
                    setLocale(newL);
                  }}
                  className="w-full p-3.5 bg-white border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="fr">Français (French)</option>
                  <option value="en">English (Anglais)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-sombre uppercase tracking-wider block">
                  {locale === 'fr' ? 'Fuseau horaire de l’atelier' : 'Workshop Timezone'}
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-3.5 bg-white border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="Africa/Porto-Novo">Bénin (Porto-Novo / Cotonou) — GMT+1</option>
                  <option value="Africa/Lagos">Nigeria (Lagos) — GMT+1</option>
                  <option value="Africa/Douala">Cameroun (Douala / Yaoundé) — GMT+1</option>
                  <option value="Africa/Libreville">Gabon (Libreville) — GMT+1</option>
                  <option value="Africa/Brazzaville">Congo (Brazzaville) — GMT+1</option>
                  <option value="Africa/Kinshasa">RDC (Kinshasa) — GMT+1</option>
                  <option value="Africa/Abidjan">Côte d'Ivoire (Abidjan) — GMT+0</option>
                  <option value="Africa/Dakar">Sénégal (Dakar) — GMT+0</option>
                  <option value="Africa/Lome">Togo (Lomé) — GMT+0</option>
                  <option value="Africa/Ouagadougou">Burkina Faso (Ouagadougou) — GMT+0</option>
                  <option value="Africa/Bamako">Mali (Bamako) — GMT+0</option>
                  <option value="Africa/Conakry">Guinée (Conakry) — GMT+0</option>
                  <option value="Africa/Niamey">Niger (Niamey) — GMT+1</option>
                  <option value="Africa/Ndjamena">Tchad (N'Djamena) — GMT+1</option>
                  <option value="Europe/Paris">France (Paris) — GMT+1 / GMT+2</option>
                  <option value="America/Montreal">Canada (Montréal) — GMT-5</option>
                  <option value="America/New_York">USA (New York) — GMT-5</option>
                </select>
                <p className="text-[11px] text-sombre/60 font-medium">
                  {locale === 'fr' ? 'Permet d’ajuster avec précision les alertes de commandes et de retards selon l’heure locale de votre atelier.' : 'Used to accurately trigger delivery and overdue alerts based on your local workshop time.'}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  fullWidth
                  disabled={saving}
                  className="rounded-2xl font-bold py-3.5 shadow-sm text-xs sm:text-sm gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? dict.common.saving : dict.parametres.savePreferencesBtn}</span>
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── TAB 6: SUPPORT & AVIS ─────────────────────────────────── */}
        {activeTab === 'avis' && (
          <Card className="p-5 sm:p-6 bg-white border border-black/5 rounded-3xl shadow-xs space-y-5">
            <div className="border-b border-black/5 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-accent">
                {dict.parametres.feedbackTitle}
              </h2>
              <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                {dict.parametres.feedbackDesc}
              </p>
            </div>

            {feedbackSent ? (
              <div className="p-6 bg-emerald-50 text-emerald-800 rounded-3xl border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-xl">
                  ❤️
                </div>
                <h3 className="font-bold text-sm">{dict.parametres.feedbackSuccessTitle}</h3>
                <p className="text-xs text-emerald-700">
                  {dict.parametres.feedbackSuccessDesc}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sombre uppercase tracking-wider block">
                    {dict.parametres.ratingLabel}
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackNote(star)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                          feedbackNote >= star
                            ? 'bg-amber-400 text-white shadow-xs'
                            : 'bg-black/5 text-sombre/30 hover:bg-black/10'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-sombre uppercase tracking-wider block">
                    {locale === 'fr' ? 'Vos remarques ou suggestions' : 'Your comments or suggestions'}
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackTexte}
                    onChange={(e) => setFeedbackTexte(e.target.value)}
                    placeholder={dict.parametres.feedbackPlaceholder}
                    required
                    className="w-full p-3.5 bg-white border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 font-sans shadow-2xs"
                  />
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  fullWidth
                  className="rounded-2xl font-bold py-3.5 shadow-sm text-xs sm:text-sm gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{dict.parametres.sendFeedbackBtn}</span>
                </Button>
              </form>
            )}

            {/* Support WhatsApp Link */}
            <div className="pt-3 border-t border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-sombre/70 font-semibold">
              <div className="space-y-0.5">
                <span>{locale === 'fr' ? 'Besoin d’aide technique directe ?' : 'Need direct technical assistance?'}</span>
                <span className="text-[11px] text-sombre/50 block font-mono font-bold">{OURLETTE_SUPPORT_PHONE}</span>
              </div>
              <a
                href={OURLETTE_SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/70 px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-2xs"
              >
                <span>{locale === 'fr' ? 'Support WhatsApp 7j/7' : '7-Day WhatsApp Support'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>
        )}
          </div>
        </div>

        {/* ── Mobile Déconnexion (< lg) ───────────────────────────── */}
        <div className="pt-2 text-center lg:hidden">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{dict.parametres.logoutButton}</span>
          </button>
        </div>
      </main>

      {/* ── Floating Mobile Bottom Action Bar (Thumb-Friendly) ───────── */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-sombre/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-white/90 truncate">
              {locale === 'fr' ? 'Modifications non enregistrées' : 'Unsaved changes'}
            </span>
            <Button
              size="sm"
              variant="gold"
              disabled={saving}
              onClick={() => {
                if (activeTab === 'profil') handleSaveProfile();
                else if (activeTab === 'atelier') handleSaveAtelier();
                else if (activeTab === 'notifications') handleSaveNotifications();
                else if (activeTab === 'preferences') handleSavePreferences();
              }}
              className="rounded-xl px-4 py-2 font-black text-xs text-sombre shadow-md shrink-0"
            >
              {saving ? dict.common.saving : dict.common.save}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
