'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Store,
  Plus,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  Check,
  Copy,
  Upload,
  Power,
  Sparkles,
  Smartphone,
  QrCode,
  Share2,
  Eye,
  MapPin,
  Phone,
  Crown,
  Info,
  Layers,
  Palette,
  Camera,
  Scissors,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Realisation, Couturier } from '@/lib/types/database';
import { generateWhatsAppShareLink, formatDateFR } from '@/lib/utils/formatters';
import { canCustomizeSlug, checkRealisationLimit, isProPlan, FREE_PLAN_LIMITS } from '@/lib/utils/planLimits';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';

type VitrineTab = 'identite' | 'galerie' | 'preview' | 'partage';

export default function GererVitrinePage() {
  const { user, couturier: authCouturier, refreshProfile } = useAuth();
  const { createNotification } = useNotifications();
  const [couturier, setCouturier] = useState<Couturier | null>(null);
  const [realisations, setRealisations] = useState<Realisation[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<VitrineTab>('identite');

  // Vitrine status
  const [vitrineActive, setVitrineActive] = useState<boolean>(true);

  // Form Fields
  const [nomAtelier, setNomAtelier] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('');
  const [telephone, setTelephone] = useState('');
  const [slug, setSlug] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bio, setBio] = useState('');

  // Add Realisation Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // UI state
  const [copiedLink, setCopiedLink] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [c, reals] = await Promise.all([
      DataService.getCouturier(user.id),
      DataService.getRealisations(user.id),
    ]);

    const activeC = c || authCouturier;
    if (activeC) {
      setCouturier(activeC);
      setVitrineActive(activeC.vitrine_active ?? true);
      setNomAtelier(activeC.nom_atelier && activeC.nom_atelier !== 'Mon Atelier' ? activeC.nom_atelier : '');
      setVille(activeC.ville || '');
      setPays(activeC.pays || '');
      setTelephone(activeC.telephone || activeC.whatsapp_contact || '');
      setSlug(activeC.slug_vitrine || '');
      setCoverUrl(activeC.cover_url || '');
      setLogoUrl(activeC.logo_url || '');
      setBio(activeC.bio || '');
    }

    setRealisations(reals);
    setLoading(false);
  }, [user?.id, authCouturier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleVitrineActive = async () => {
    if (!user?.id) return;
    setTogglingStatus(true);
    const nextStatus = !vitrineActive;

    const updated = await DataService.updateCouturier(user.id, {
      vitrine_active: nextStatus,
    });

    if (updated) {
      setVitrineActive(updated.vitrine_active ?? nextStatus);
      setCouturier(updated);
      await refreshProfile();
    }
    setTogglingStatus(false);
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const rawFile = e.target.files?.[0];
    if (rawFile) {
      try {
        const { compressImage } = await import('@/lib/utils/imageCompression');
        const compressed = await compressImage(rawFile, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });

        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setter(event.target.result as string);
          }
        };
        reader.readAsDataURL(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setter(event.target.result as string);
          }
        };
        reader.readAsDataURL(rawFile);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);
    setSavedSuccessMsg('');

    const slugified = slug ? slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : '';

    const updated = await DataService.updateCouturier(user.id, {
      nom_atelier: nomAtelier.trim(),
      ville: ville.trim(),
      pays: pays.trim(),
      telephone: telephone.trim(),
      whatsapp_contact: telephone.trim(),
      bio: bio.trim(),
      ...(slugified ? { slug_vitrine: slugified } : {}),
      cover_url: coverUrl.trim() || undefined,
      logo_url: logoUrl.trim() || undefined,
      vitrine_active: vitrineActive,
    });

    if (updated) {
      setCouturier(updated);
      await refreshProfile();
      setSavedSuccessMsg('Vitrine mise à jour avec succès !');
      setTimeout(() => setSavedSuccessMsg(''), 3000);
    }
    setSavingProfile(false);
  };

  const handleAddRealisation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim() || !user?.id) return;
    setUploadingPhoto(true);

    const created = await DataService.addRealisation(user.id, {
      photo_url: photoUrl.trim(),
      description: description.trim() || 'Création sur-mesure de l’atelier',
    });

    if (created) {
      const reals = await DataService.getRealisations(user.id);
      setRealisations(reals);
      setShowAddModal(false);
      setPhotoUrl('');
      setDescription('');

      await createNotification({
        type: 'feature_update',
        category: 'order',
        priority: 'low',
        title: '📸 Photo ajoutée à votre vitrine',
        message: `Votre nouvelle réalisation "${created.description}" est désormais visible sur votre vitrine.`,
        link: '/vitrine/gerer',
      });
    }
    setUploadingPhoto(false);
  };

  const handleDeleteRealisation = async (id: string) => {
    if (!user?.id) return;
    if (!confirm('Supprimer cette photo de votre vitrine ?')) return;
    await DataService.deleteRealisation(user.id, id);
    const reals = await DataService.getRealisations(user.id);
    setRealisations(reals);
  };

  const activeSlug = couturier?.slug_vitrine || slug || 'mon-atelier';
  const publicLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://ourlette.app'}/${activeSlug}`;
  const whatsappShareUrl = generateWhatsAppShareLink(couturier?.nom_atelier || nomAtelier || 'Mon Atelier', activeSlug);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicLink)}&color=2B1215&bgcolor=FAF9F6`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-clair pb-28 font-sans">
        <main className="max-w-5xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label="Chargement du Studio Vitrine…" size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">

        {/* ── 1. Top Studio Header with Status & Quick Preview ────────── */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-sable/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sombre text-gold flex items-center justify-center shadow-sm shrink-0 border border-gold/30">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-sombre">
                  Studio Vitrine
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                  vitrineActive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${vitrineActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {vitrineActive ? 'En ligne' : 'En pause'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-sombre/70 font-semibold mt-0.5">
                Personnalisez votre boutique en ligne et exposez vos créations aux clients.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Status Toggle Button */}
            <button
              type="button"
              onClick={handleToggleVitrineActive}
              disabled={togglingStatus}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs ${
                vitrineActive
                  ? 'bg-[#F7F7F5] text-sombre/80 border-sable/80 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{togglingStatus ? 'Mise à jour…' : vitrineActive ? 'Mettre en pause' : 'Publier la vitrine'}</span>
            </button>

            {/* Public Link Preview CTA */}
            <Link href={`/${activeSlug}`} target="_blank">
              <Button variant="accent" size="sm" className="rounded-full gap-1.5 text-xs sm:text-sm font-bold shadow-md">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Voir en direct</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ── 2. Segmented Navigation Tabs ───────────────────────────── */}
        <div className="flex items-center gap-2 p-1.5 bg-white border border-sable/60 rounded-2xl shadow-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('identite')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'identite'
                ? 'bg-sombre text-white shadow-sm'
                : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>1. Identité & Visuel</span>
          </button>

          <button
            onClick={() => setActiveTab('galerie')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'galerie'
                ? 'bg-sombre text-white shadow-sm'
                : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>2. Galerie & Modèles ({realisations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-sombre text-white shadow-sm'
                : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>3. Aperçu Mobile Live</span>
          </button>

          <button
            onClick={() => setActiveTab('partage')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'partage'
                ? 'bg-sombre text-white shadow-sm'
                : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>4. Partage & QR Code</span>
          </button>
        </div>

        {/* Success Alert */}
        {savedSuccessMsg && (
          <div className="p-4 bg-vertbouton/15 border border-vertbouton/40 rounded-2xl text-sm text-vertbouton font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <Check className="w-5 h-5" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {/* ── TAB 1: IDENTITÉ & VISUEL ──────────────────────────────── */}
        {activeTab === 'identite' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Visual Cover & Logo Customizer */}
            <Card className="p-5 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-6">
              <div className="border-b border-sable/40 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-display font-bold text-sombre">
                    Bannière & Logo de l'Atelier
                  </h3>
                  <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                    Images d’en-tête présentées en haut de votre vitrine publique.
                  </p>
                </div>
              </div>

              {/* Cover Banner Interactive Area */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-sable/80 bg-[#FAFAF8] group">
                {coverUrl ? (
                  <div className="relative h-44 sm:h-56 w-full">
                    <img src={coverUrl} alt="Bannière atelier" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-sombre/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="cursor-pointer bg-white text-sombre font-bold text-xs px-4 py-2 rounded-full shadow-lg hover:bg-gold hover:text-sombre transition-colors flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Remplacer la bannière</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, setCoverUrl)} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={() => setCoverUrl('')}
                        className="bg-rose-600 text-white font-bold text-xs px-3.5 py-2 rounded-full shadow-lg hover:bg-rose-700 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 sm:h-52 flex flex-col items-center justify-center p-6 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-sable/80 flex items-center justify-center text-sombre/40 shadow-xs">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-sombre">Photo de couverture de votre vitrine</p>
                      <p className="text-[11px] text-sombre/50">Format recommandé : 1200 x 400px (JPG, PNG)</p>
                    </div>
                    <label className="cursor-pointer bg-accent hover:bg-fonce text-white font-bold text-xs px-4 py-2 rounded-full shadow-xs inline-flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Ajouter une bannière</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, setCoverUrl)} className="hidden" />
                    </label>
                  </div>
                )}

                {/* Floating Logo Badge overlapping banner */}
                <div className="absolute -bottom-2 left-6 transform translate-y-1/2 flex items-center gap-3">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center group/logo">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-accent/10 flex flex-col items-center justify-center text-accent text-xs font-extrabold">
                        <Scissors className="w-6 h-6" />
                        <span className="text-[9px] mt-0.5">LOGO</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-sombre/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                      <Upload className="w-5 h-5" />
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, setLogoUrl)} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Logo text tip */}
              <div className="pt-6 sm:pt-8 flex items-center justify-between text-xs text-sombre/60">
                <span className="font-semibold">Logo carré recommandé (500 x 500px).</span>
                {logoUrl && (
                  <button type="button" onClick={() => setLogoUrl('')} className="text-rose-600 font-bold hover:underline">
                    Supprimer logo
                  </button>
                )}
              </div>
            </Card>

            {/* Atelier Identity Information */}
            <Card className="p-5 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-4">
              <div className="border-b border-sable/40 pb-3">
                <h3 className="text-sm sm:text-base font-display font-bold text-sombre">
                  Coordonnées & Présentation
                </h3>
                <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                  Informations affichées aux clients pour découvrir votre savoir-faire et vous contacter.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nom officiel de l'atelier de couture"
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
                  label="Numéro WhatsApp de contact client"
                  type="tel"
                  placeholder="ex: +221 77 123 45 67"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  helperText="Les clients qui cliquent sur 'Commander' sur votre vitrine seront redirigés directement vers ce numéro WhatsApp."
                />

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-sombre">
                    Bio & Spécialités de l'atelier
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Présentez votre atelier, vos spécialités (Bazin riche, Robes de mariée, Broderies fines, Prêt-à-porter sur-mesure)..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3.5 bg-white border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-sans shadow-xs"
                  />
                </div>

                {/* Custom URL Slug */}
                <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-sable/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-sombre flex items-center gap-1.5">
                      <span>Lien personnalisé de votre vitrine (Slug)</span>
                      {!canCustomizeSlug(couturier) && (
                        <span className="text-[10px] bg-gold/20 text-sombre px-2 py-0.5 rounded-full font-bold border border-gold/40 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-gold" /> Plan Pro
                        </span>
                      )}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-mono text-sombre/60 font-bold select-none">
                      ourlette.app/
                    </span>
                    <input
                      type="text"
                      placeholder="nom-atelier"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      disabled={!canCustomizeSlug(couturier)}
                      className="flex-1 px-3 py-2 bg-white border border-sable/80 rounded-xl text-xs sm:text-sm font-mono font-bold text-sombre focus:outline-none focus:border-accent disabled:bg-sable/20"
                    />
                  </div>
                  <p className="text-[11px] text-sombre/60 font-semibold">
                    {canCustomizeSlug(couturier)
                      ? "Vos clients accèderont à votre vitrine via cette adresse personnalisée."
                      : "La personnalisation du slug est réservée aux abonnés Pro. Sur le plan gratuit, un lien sécurisé unique est attribué automatiquement."}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  fullWidth
                  disabled={savingProfile}
                  className="rounded-full font-bold shadow-lg shadow-accent/20 text-sm gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingProfile ? 'Enregistrement…' : 'Enregistrer les modifications'}</span>
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* ── TAB 2: GALERIE & MODÈLES ───────────────────────────────── */}
        {activeTab === 'galerie' && (
          <div className="space-y-6">
            {/* Quota Gauge & Header */}
            <Card className="p-5 sm:p-6 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-2">
                    <Camera className="w-5 h-5 text-accent" />
                    <span>Catalogue de Créations ({realisations.length} photos publiées)</span>
                  </h3>
                  <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                    {isProPlan(couturier)
                      ? '👑 Vous bénéficiez d’un nombre illimité de créations exposées sur votre vitrine.'
                      : `Plan Gratuit : ${realisations.length} sur ${FREE_PLAN_LIMITS.maxRealisations} photos autorisées.`}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => {
                    const limitCheck = checkRealisationLimit(couturier, realisations.length);
                    if (!limitCheck.allowed) {
                      alert(limitCheck.message);
                      return;
                    }
                    setShowAddModal(true);
                  }}
                  disabled={!isProPlan(couturier) && realisations.length >= FREE_PLAN_LIMITS.maxRealisations}
                  className="rounded-full font-bold text-xs sm:text-sm gap-1.5 shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter une création</span>
                </Button>
              </div>

              {/* Progress bar on free plan */}
              {!isProPlan(couturier) && (
                <div className="space-y-1.5 pt-1">
                  <div className="h-2 w-full bg-sable/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        realisations.length >= FREE_PLAN_LIMITS.maxRealisations ? 'bg-rose-500' : 'bg-accent'
                      }`}
                      style={{
                        width: `${Math.min(100, (realisations.length / FREE_PLAN_LIMITS.maxRealisations) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Creations Grid */}
            {realisations.length === 0 ? (
              <Card className="p-12 text-center bg-white border-2 border-dashed border-sable/80 rounded-3xl space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-sable/60 flex items-center justify-center mx-auto text-sombre/40">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-sombre">Aucun modèle exposé pour l'instant</h4>
                <p className="text-xs text-sombre/60 max-w-sm mx-auto">
                  Publiez vos plus belles confections pour donner envie aux visiteurs de vous contacter sur WhatsApp !
                </p>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="rounded-full text-xs font-bold gap-1.5 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter ma première photo</span>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {realisations.map((real) => (
                  <div
                    key={real.id}
                    className="group relative bg-white rounded-3xl overflow-hidden border border-sable/70 shadow-xs hover:shadow-lg transition-all flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-[#FAF9F6]">
                      <img
                        src={real.photo_url}
                        alt={real.description || 'Création couture'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      {/* Delete Quick Action Overlay */}
                      <button
                        type="button"
                        onClick={() => handleDeleteRealisation(real.id)}
                        className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-rose-600 text-sombre/70 hover:text-white rounded-full shadow-md backdrop-blur-xs transition-colors"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-sombre line-clamp-2 leading-snug">
                          {real.description || 'Création sur-mesure'}
                        </h4>
                      </div>
                      <div className="pt-2 border-t border-sable/30 flex items-center justify-between text-[11px] text-sombre/50 font-semibold">
                        <span>{formatDateFR(real.date_publication)}</span>
                        <span className="text-accent font-bold">Exposé</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: APERÇU MOBILE LIVE (SMARTPHONE MOCKUP) ─────────── */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <Card className="p-5 sm:p-6 bg-white border border-sable/70 rounded-3xl shadow-xs flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-accent" />
                  <span>Aperçu Interactif Écran Smartphone</span>
                </h3>
                <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                  Visualisez exactement le rendu de votre vitrine telle qu'un client la découvre sur son téléphone.
                </p>
              </div>

              <Link href={`/${activeSlug}`} target="_blank">
                <Button variant="outline" size="sm" className="rounded-full text-xs font-bold gap-1.5 border-accent text-accent">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir dans un onglet</span>
                </Button>
              </Link>
            </Card>

            {/* Smartphone Device Frame */}
            <div className="flex justify-center py-4">
              <div className="w-[340px] sm:w-[380px] bg-sombre rounded-[48px] p-3 shadow-2xl border-4 border-sombre-light ring-1 ring-gold/40">
                {/* Notch & Speaker */}
                <div className="h-5 flex items-center justify-center">
                  <div className="w-24 h-3.5 bg-black rounded-full" />
                </div>

                {/* Inner Mobile Screen Content */}
                <div className="bg-[#FAF9F6] rounded-[36px] overflow-hidden min-h-[580px] max-h-[640px] overflow-y-auto font-sans text-sombre select-none no-scrollbar">
                  {/* Banner */}
                  <div className="relative h-32 w-full bg-sombre">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Bannière" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-sombre to-[#4A151C] flex items-center justify-center text-white/30 text-xs font-bold">
                        Bannière d'atelier
                      </div>
                    )}
                    {/* Logo */}
                    <div className="absolute -bottom-5 left-4 w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Scissors className="w-5 h-5 text-accent" />
                      )}
                    </div>
                  </div>

                  {/* Profile Header */}
                  <div className="pt-7 px-4 space-y-1.5">
                    <h4 className="text-base font-display font-bold text-sombre leading-tight">
                      {nomAtelier || 'Maison Adia Couture'}
                    </h4>
                    {(ville || pays) && (
                      <p className="text-[11px] font-semibold text-sombre/60 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-accent" />
                        <span>{[ville, pays].filter(Boolean).join(', ')}</span>
                      </p>
                    )}
                    {bio && (
                      <p className="text-[11px] text-sombre/80 leading-snug pt-1">
                        {bio}
                      </p>
                    )}

                    {/* WhatsApp CTA */}
                    <div className="pt-2">
                      <button
                        type="button"
                        className="w-full py-2 px-3 bg-[#25D366] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>💬 Commander sur WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  {/* Showcase Gallery */}
                  <div className="p-4 space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-accent">
                      Créations ({realisations.length})
                    </h5>
                    {realisations.length === 0 ? (
                      <div className="p-6 text-center text-xs text-sombre/50 border border-dashed border-sable rounded-2xl">
                        Aucun modèle publié
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {realisations.map((r) => (
                          <div key={r.id} className="rounded-xl overflow-hidden bg-white border border-sable/50 shadow-xs">
                            <img src={r.photo_url} alt="Modèle" className="w-full h-24 object-cover" />
                            <p className="p-1.5 text-[10px] font-bold text-sombre truncate">
                              {r.description || 'Modèle sur-mesure'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: PARTAGE & QR CODE ───────────────────────────────── */}
        {activeTab === 'partage' && (
          <div className="space-y-6">
            {/* Share Link Grand Format */}
            <Card className="p-6 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-4">
              <div className="border-b border-sable/40 pb-3">
                <h3 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-accent" />
                  <span>Partager votre Vitrine Publique</span>
                </h3>
                <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                  Envoyez ce lien à vos clients sur WhatsApp, Instagram, TikTok et vos cartes de visite.
                </p>
              </div>

              {/* URL Box */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#FAF9F6] p-3.5 rounded-2xl border border-sable/80">
                <div className="flex-1 px-4 py-3 bg-white rounded-xl border border-sable/80 shadow-inner font-mono text-xs sm:text-sm font-bold text-sombre truncate select-all">
                  {publicLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 ${
                    copiedLink ? 'bg-emerald-600 text-white' : 'bg-sombre text-white hover:bg-fonce active:scale-95'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4 text-gold" />}
                  <span>{copiedLink ? 'Lien copié !' : 'Copier le lien'}</span>
                </button>
              </div>

              {/* 1-Click WhatsApp Share */}
              <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" className="block pt-1">
                <Button
                  variant="accent"
                  fullWidth
                  size="md"
                  className="rounded-2xl gap-2 bg-[#25D366] hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-sm"
                >
                  <span>💬 Diffuser la vitrine sur WhatsApp en 1 clic</span>
                </Button>
              </a>
            </Card>

            {/* Official Workshop QR Code */}
            <Card className="p-6 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-6">
              <div className="border-b border-sable/40 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-gold" />
                    <span>QR Code Officiel de l’Atelier</span>
                  </h3>
                  <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                    Imprimez ce QR Code pour l’afficher au comptoir ou sur la vitrine physique de votre boutique.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center sm:justify-start">
                <div className="p-4 bg-[#FAF9F6] border-2 border-sable/80 rounded-3xl shadow-sm shrink-0">
                  <img src={qrCodeUrl} alt="QR Code Vitrine" className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl" />
                </div>

                <div className="space-y-3 text-center sm:text-left max-w-sm">
                  <h4 className="text-sm font-bold text-sombre">
                    Scannez pour ouvrir la vitrine
                  </h4>
                  <p className="text-xs text-sombre/70 leading-relaxed font-medium">
                    Vos clients peuvent scanner ce code avec l’appareil photo de leur smartphone pour voir instantanément vos modèles et passer commande.
                  </p>
                  <a
                    href={qrCodeUrl}
                    download={`qrcode-${activeSlug}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="outline" size="sm" className="rounded-full text-xs font-bold gap-1.5 border-sombre text-sombre hover:bg-sombre hover:text-white">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Télécharger l'image QR Code</span>
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── MODAL: AJOUTER UNE RÉALISATION ───────────────────────── */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-sombre/60 backdrop-blur-xs flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 space-y-5 bg-white shadow-2xl border border-sable rounded-3xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-sable/40 pb-3">
                <h3 className="text-base font-display font-bold text-sombre flex items-center gap-2">
                  <Camera className="w-5 h-5 text-accent" />
                  <span>Ajouter une Réalisation</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-sombre/40 hover:text-sombre rounded-full hover:bg-sable/30 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddRealisation} className="space-y-4 font-sans">
                {/* Photo preview or dropzone */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-bold text-sombre">
                    Photo du modèle
                  </label>

                  {photoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-sable/80 h-48 w-full group">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full text-xs font-bold shadow-md hover:bg-rose-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer bg-[#FAF9F6] hover:bg-sable/20 text-accent font-bold text-xs sm:text-sm p-6 rounded-2xl border-2 border-dashed border-sable/80 flex flex-col items-center justify-center gap-2 transition-colors">
                      <Upload className="w-6 h-6 text-accent" />
                      <span>Uploader une photo depuis votre appareil</span>
                      <span className="text-[11px] text-sombre/50 font-normal">JPG, PNG ou WebP compressé automatiquement</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, setPhotoUrl)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <Input
                  label="OU Coller un lien d'image web (URL)"
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />

                <Input
                  label="Description / Nom du modèle"
                  type="text"
                  placeholder="ex: Robe de soirée brodée en soie"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sable/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-full text-xs font-bold"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    size="sm"
                    disabled={!photoUrl || uploadingPhoto}
                    className="rounded-full text-xs font-bold gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{uploadingPhoto ? 'Publication…' : 'Publier sur la vitrine'}</span>
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
