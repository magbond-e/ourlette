'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  KeyRound,
  LogOut,
  Crown,
  Sparkles,
  Globe,
  Bell,
  Download,
  Trash2,
  Info,
  Check,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Couturier } from '@/lib/types/database';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage, Locale } from '@/lib/i18n';
import { isProPlan, FREE_PLAN_LIMITS, PRO_PLAN_PRICE } from '@/lib/utils/planLimits';
import { formatFCFA, OURLETTE_SUPPORT_WHATSAPP_URL } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';

export default function ParametresPage() {
  const router = useRouter();
  const { user, couturier: authCouturier, refreshProfile, signOut } = useAuth();
  const { dict, locale, setLocale } = useLanguage();
  const isEn = locale === 'en';

  const [couturier, setCouturier] = useState<Couturier | null>(null);
  const [activeCommandesCount, setActiveCommandesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Notifications State (3 switches only)
  const [notifRappel, setNotifRappel] = useState(true);
  const [notifRetard, setNotifRetard] = useState(true);
  const [notifNouveautes, setNotifNouveautes] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Export State
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [c, cmds] = await Promise.all([
      DataService.getCouturier(user.id) || authCouturier,
      DataService.getCommandes(user.id),
    ]);

    const activeCount = cmds.filter((cmd) => cmd.statut !== 'livree').length;
    setActiveCommandesCount(activeCount);

    if (c) {
      setCouturier(c);
      setNotifRappel(c.notif_rappel_livraison ?? true);
      setNotifRetard(c.notif_retard ?? true);
      setNotifNouveautes(c.notif_nouveautes ?? true);
    }
    setLoading(false);
  }, [user?.id, authCouturier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleNotif = async (key: 'notif_rappel_livraison' | 'notif_retard' | 'notif_nouveautes', val: boolean) => {
    if (!user?.id) return;
    setSavingNotifs(true);
    if (key === 'notif_rappel_livraison') setNotifRappel(val);
    if (key === 'notif_retard') setNotifRetard(val);
    if (key === 'notif_nouveautes') setNotifNouveautes(val);

    await DataService.updateCouturier(user.id, {
      [key]: val,
    });
    setSavingNotifs(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordError(isEn ? 'Password must be at least 8 characters.' : 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setPasswordError(isEn ? 'Internet connection required to change password.' : 'Connexion internet requise pour modifier votre mot de passe.');
      return;
    }

    setChangingPassword(true);
    setPasswordError('');
    setPasswordMsg('');

    const supabase = createClient();
    if (!supabase) {
      setPasswordError('Erreur client Supabase.');
      setChangingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMsg(isEn ? 'Password updated successfully!' : 'Mot de passe modifié avec succès !');
      setTimeout(() => {
        setShowPasswordModal(false);
        setNewPassword('');
        setPasswordMsg('');
      }, 1500);
    }
    setChangingPassword(false);
  };

  const handleExportData = async () => {
    if (!user?.id) return;
    setExporting(true);

    try {
      const [c, clients, cmds, reals] = await Promise.all([
        DataService.getCouturier(user.id),
        DataService.getClients(user.id),
        DataService.getCommandes(user.id),
        DataService.getRealisations(user.id),
      ]);

      // Enrich clients with measurements
      const clientsWithMesures = await Promise.all(
        clients.map(async (client) => {
          const m = await DataService.getMesureByClientId(user.id, client.id);
          return {
            ...client,
            mesures: m || null,
          };
        })
      );

      const exportPayload = {
        date_export: new Date().toISOString(),
        couturier: c,
        clients: clientsWithMesures,
        commandes: cmds,
        realisations: reals,
      };

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ourlette_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur export:', err);
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteInputText.trim() !== 'SUPPRIMER') {
      setDeleteError(isEn ? 'Please type SUPPRIMER exactly.' : 'Veuillez saisir exactement SUPPRIMER.');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setDeleteError(
        isEn
          ? 'Internet connection required to delete your account.'
          : 'Connexion internet requise pour supprimer votre compte.'
      );
      return;
    }

    setDeletingAccount(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Erreur serveur lors de la suppression.');
      }

      await DataService.purgeLocalUserStore(user?.id);
      await signOut();
      router.push('/login');
    } catch (err: any) {
      setDeleteError(err?.message || 'Erreur lors de la suppression.');
      setDeletingAccount(false);
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

  const isPro = isProPlan(couturier);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
      <main className="max-w-xl mx-auto px-4 pt-4 space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
            {dict.parametres.title}
          </h1>
          <p className="text-xs text-sombre/70 font-semibold">
            {isEn ? 'Manage your account and preferences.' : 'Gère ton compte et tes préférences.'}
          </p>
        </div>

        {/* ── 1. SECTION COMPTE : Email · Changer mot de passe · Déconnexion */}
        <Card className="p-5 space-y-4 bg-white border-sable/70 rounded-3xl shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <User className="w-4 h-4 text-accent" />
            <span>{isEn ? 'Account' : 'Compte'}</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-sombre/60 mb-1">
                {dict.parametres.emailLabel}
              </label>
              <div className="px-3.5 py-2.5 bg-[#FAF9F6] border border-sable/70 rounded-2xl text-xs sm:text-sm font-bold text-sombre select-all">
                {user?.email || couturier?.email || '—'}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordModal(true)}
                className="rounded-full text-xs font-bold gap-1.5 border-sable/80"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isEn ? 'Change password' : 'Changer le mot de passe'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{dict.parametres.logoutButton}</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* ── 2. SECTION ABONNEMENT : Plan actuel · Utilisation · Passer Pro */}
        <Card className="p-5 space-y-4 bg-white border-sable/70 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-accent" />
              <span>{isEn ? 'Subscription' : 'Abonnement'}</span>
            </h2>
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                isPro
                  ? 'bg-gold/20 text-sombre border border-gold/40'
                  : 'bg-sombre/10 text-sombre border border-sable/60'
              }`}
            >
              {isPro ? 'Plan Pro' : 'Plan Gratuit'}
            </span>
          </div>

          <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-sable/50 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-sombre/70">
                {isEn ? 'Active orders limit' : 'Commandes actives'}
              </span>
              <strong className="font-bold text-sombre">
                {activeCommandesCount} / {isPro ? '∞' : FREE_PLAN_LIMITS.maxActiveCommandes}
              </strong>
            </div>

            {/* Barre de progression si plan gratuit */}
            {!isPro && (
              <div className="w-full h-2 bg-sable/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    activeCommandesCount >= FREE_PLAN_LIMITS.maxActiveCommandes
                      ? 'bg-accent'
                      : 'bg-vertbouton'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (activeCommandesCount / FREE_PLAN_LIMITS.maxActiveCommandes) * 100
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>

          {!isPro ? (
            <Link href="/pro" className="block pt-1">
              <Button
                variant="gold"
                fullWidth
                size="md"
                className="rounded-full font-bold text-xs sm:text-sm py-3 shadow-md gap-2"
              >
                <Sparkles className="w-4 h-4 text-sombre" />
                <span>
                  {isEn
                    ? `Upgrade to Pro (${formatFCFA(PRO_PLAN_PRICE)} / mo)`
                    : `Passer Pro (${formatFCFA(PRO_PLAN_PRICE)} / mois)`}
                </span>
              </Button>
            </Link>
          ) : (
            <p className="text-xs text-emerald-800 font-bold bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
              ✓ {isEn ? 'Unlimited orders and photos active.' : 'Commandes et photos illimitées actives.'}
            </p>
          )}
        </Card>

        {/* ── 3. SECTION LANGUE : Français / English ──────────────────────── */}
        <Card className="p-5 space-y-3 bg-white border-sable/70 rounded-3xl shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-accent" />
            <span>{isEn ? 'Language' : 'Langue'}</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setLocale('fr')}
              className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border transition-all ${
                locale === 'fr'
                  ? 'bg-sombre text-white border-sombre shadow-xs'
                  : 'bg-[#FAF9F6] text-sombre/70 border-sable/70 hover:bg-white'
              }`}
            >
              Français
            </button>

            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border transition-all ${
                locale === 'en'
                  ? 'bg-sombre text-white border-sombre shadow-xs'
                  : 'bg-[#FAF9F6] text-sombre/70 border-sable/70 hover:bg-white'
              }`}
            >
              English
            </button>
          </div>
        </Card>

        {/* ── 4. SECTION NOTIFICATIONS : 3 Interrupteurs ───────────────────── */}
        <Card className="p-5 space-y-4 bg-white border-sable/70 rounded-3xl shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-accent" />
            <span>{dict.parametres.notificationsTitle}</span>
          </h2>

          <div className="space-y-3 text-xs divide-y divide-sable/40">
            {/* Rappels de livraison */}
            <div className="flex items-center justify-between pt-2">
              <span className="font-bold text-sombre">
                {isEn ? 'Delivery reminders (J-2)' : 'Rappels de livraison (J-2)'}
              </span>
              <input
                type="checkbox"
                checked={notifRappel}
                onChange={(e) => handleToggleNotif('notif_rappel_livraison', e.target.checked)}
                className="w-4 h-4 text-accent border-sable rounded focus:ring-accent accent-accent cursor-pointer"
              />
            </div>

            {/* Alertes de retards */}
            <div className="flex items-center justify-between pt-3">
              <span className="font-bold text-sombre">
                {isEn ? 'Overdue order alerts' : 'Alertes de retard'}
              </span>
              <input
                type="checkbox"
                checked={notifRetard}
                onChange={(e) => handleToggleNotif('notif_retard', e.target.checked)}
                className="w-4 h-4 text-accent border-sable rounded focus:ring-accent accent-accent cursor-pointer"
              />
            </div>

            {/* Nouveautés Ourlette */}
            <div className="flex items-center justify-between pt-3">
              <span className="font-bold text-sombre">
                {isEn ? 'Ourlette updates' : "Nouveautés d'Ourlette"}
              </span>
              <input
                type="checkbox"
                checked={notifNouveautes}
                onChange={(e) => handleToggleNotif('notif_nouveautes', e.target.checked)}
                className="w-4 h-4 text-accent border-sable rounded focus:ring-accent accent-accent cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* ── 5. SECTION MES DONNÉES : Exporter · Supprimer mon compte ───── */}
        <Card className="p-5 space-y-4 bg-white border-sable/70 rounded-3xl shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Download className="w-4 h-4 text-accent" />
            <span>{isEn ? 'My Data' : 'Mes données'}</span>
          </h2>

          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={handleExportData}
              disabled={exporting}
              className="rounded-full text-xs font-bold gap-2 border-sable/80"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {exporting
                  ? isEn
                    ? 'Exporting…'
                    : 'Exportation…'
                  : isEn
                  ? 'Export my data (JSON)'
                  : 'Exporter mes données (JSON)'}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => {
                setDeleteInputText('');
                setDeleteError('');
                setShowDeleteModal(true);
              }}
              className="rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isEn ? 'Delete my account' : 'Supprimer mon compte'}</span>
            </Button>
          </div>
        </Card>

        {/* ── 6. SECTION À PROPOS : Version · CGU · Confidentialité · Support */}
        <Card className="p-5 space-y-3 bg-white border-sable/70 rounded-3xl shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Info className="w-4 h-4 text-accent" />
            <span>{isEn ? 'About' : 'À propos'}</span>
          </h2>

          <div className="space-y-2 text-xs font-semibold text-sombre/80">
            <div className="flex items-center justify-between py-1 border-b border-sable/30">
              <span className="text-sombre/60">{isEn ? 'Version' : 'Version'}</span>
              <strong className="text-sombre">1.2.0 (2026)</strong>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-sable/30">
              <Link href="/cgu" className="hover:text-accent flex items-center gap-1">
                <span>{isEn ? 'Terms of Service' : 'Conditions Générales d’Utilisation'}</span>
                <ExternalLink className="w-3 h-3 text-sombre/40" />
              </Link>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-sable/30">
              <Link href="/politique-confidentialite" className="hover:text-accent flex items-center gap-1">
                <span>{isEn ? 'Privacy Policy' : 'Politique de confidentialité'}</span>
                <ExternalLink className="w-3 h-3 text-sombre/40" />
              </Link>
            </div>

            <div className="pt-2">
              <a
                href={OURLETTE_SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-2 rounded-2xl w-full justify-center"
              >
                <span>{isEn ? 'Contact Support on WhatsApp' : 'Contacter le support WhatsApp'}</span>
              </a>
            </div>
          </div>
        </Card>
      </main>

      {/* ── MODAL : Changer Mot de passe ─────────────────────────────────── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sombre/60 backdrop-blur-xs p-4">
          <Card className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-4 border border-sable/80 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-sombre">
                {isEn ? 'Change password' : 'Changer le mot de passe'}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-sombre/50 hover:text-sombre p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                {passwordError}
              </div>
            )}

            {passwordMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                {passwordMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label={isEn ? 'New password (min 8 chars)' : 'Nouveau mot de passe (8 car. min)'}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />

              <div className="flex gap-2 justify-end pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-full"
                >
                  {dict.common.cancel}
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  disabled={changingPassword}
                  className="rounded-full font-bold px-4"
                >
                  {changingPassword ? dict.common.saving : dict.common.save}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── MODAL : Confirmer Suppression Compte (« SUPPRIMER ») ───────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sombre/60 backdrop-blur-xs p-4">
          <Card className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-4 border border-sable/80 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-display font-bold text-sombre">
                {isEn ? 'Delete your account?' : 'Supprimer définitivement ton compte ?'}
              </h3>
              <p className="text-xs text-sombre/70 font-medium leading-relaxed">
                {isEn
                  ? 'All your clients, measurement sheets, orders, and workshop settings will be deleted forever. Type SUPPRIMER below to confirm:'
                  : 'Toutes tes fiches clients, mesures, commandes et données d’atelier seront définitivement effacées. Saisis SUPPRIMER ci-dessous pour confirmer :'}
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                {deleteError}
              </div>
            )}

            <div className="space-y-4 pt-1">
              <Input
                label={isEn ? 'Type SUPPRIMER' : 'Saisir SUPPRIMER'}
                type="text"
                placeholder="SUPPRIMER"
                value={deleteInputText}
                onChange={(e) => setDeleteInputText(e.target.value)}
                autoFocus
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-full"
                >
                  {dict.common.cancel}
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  disabled={deletingAccount || deleteInputText.trim() !== 'SUPPRIMER'}
                  onClick={handleDeleteAccount}
                  className="rounded-full font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {deletingAccount ? dict.common.deleting : isEn ? 'Delete' : 'Supprimer'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
