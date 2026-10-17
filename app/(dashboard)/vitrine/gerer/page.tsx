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
import { canCustomizeSlug, checkRealisationLimit, isProPlan, FREE_PLAN_LIMITS, SHOW_ACCOUNT_PLANS } from '@/lib/utils/planLimits';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/context/NotificationContext';
import { useLanguage } from '@/lib/i18n';

type VitrineTab = 'identite' | 'galerie' | 'preview' | 'partage';

export default function GererVitrinePage() {
  const { user, couturier: authCouturier, refreshProfile } = useAuth();
  const { createNotification } = useNotifications();
  const { dict, locale } = useLanguage();
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

  const isValidSecureImageUrl = (urlStr: string): boolean => {
    if (!urlStr) return true;
    if (urlStr.startsWith('data:image/')) {
      return !urlStr.startsWith('data:image/svg');
    }
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'https:') return false;
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('169.254.')
      ) {
        return false;
      }
      if (parsed.pathname.toLowerCase().endsWith('.svg')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Refus strict des SVG et formats non autorisés (Invariant 8)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const isSvg = rawFile.type.includes('svg') || rawFile.name.toLowerCase().endsWith('.svg');
    if (isSvg || !allowedTypes.includes(rawFile.type)) {
      alert('Format non autorisé. Seules les images JPG, PNG et WebP sont acceptées (SVG interdit).');
      e.target.value = '';
      return;
    }

    // Limite de taille max (5 Mo)
    if (rawFile.size > 5 * 1024 * 1024) {
      alert('La taille du fichier dépasse la limite maximale autorisée (5 Mo).');
      e.target.value = '';
      return;
    }

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
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de l’optimisation de l’image.');
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (coverUrl && !isValidSecureImageUrl(coverUrl)) {
      alert('L’URL de la bannière doit être une URL HTTPS sécurisée vers une image (SVG interdit).');
      return;
    }
    if (logoUrl && !isValidSecureImageUrl(logoUrl)) {
      alert('L’URL du logo doit être une URL HTTPS sécurisée vers une image (SVG interdit).');
      return;
    }

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

    if (!isValidSecureImageUrl(photoUrl.trim())) {
      alert('L’URL de l’image doit être une adresse HTTPS sécurisée valide (formats JPG, PNG, WebP uniquement).');
      return;
    }

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
          <ThreadSpoolLoader label={locale === 'fr' ? 'Chargement du Studio Vitrine…' : 'Loading Showcase Studio…'} size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 space-y-5">
        {/* ── 1. Compact Sticky Studio Header ─────────────────────────── */}
        <div className="sticky top-[64px] z-20 bg-[#FAFAF8]/95 backdrop-blur-md pt-2 pb-2.5 -mx-4 px-4 sm:-mx-6 sm:px-6 space-y-2.5 border-b border-sable/30 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-sable/70 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sombre text-gold flex items-center justify-center shadow-xs shrink-0 border border-gold/30">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-display font-bold text-sombre truncate">
                    {dict.vitrine.title}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                    vitrineActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${vitrineActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {vitrineActive ? dict.vitrine.statusActive : dict.vitrine.statusInactive}
                  </span>
                </div>
                <p className="text-xs text-sombre/60 font-semibold truncate hidden sm:block">
                  {dict.vitrine.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleVitrineActive}
                disabled={togglingStatus}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs cursor-pointer ${
                  vitrineActive
                    ? 'bg-[#F7F7F5] text-sombre/80 border-sable/80 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                    : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {togglingStatus
                    ? (locale === 'fr' ? 'Mise à jour…' : 'Updating…')
                    : vitrineActive
                    ? (locale === 'fr' ? 'Mettre en pause' : 'Pause showcase')
                    : (locale === 'fr' ? 'Publier la vitrine' : 'Publish showcase')}
                </span>
              </button>

              <Link href={`/${activeSlug}`} target="_blank">
                <Button variant="accent" size="sm" className="rounded-full gap-1.5 text-xs font-bold shadow-xs px-3.5 py-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{dict.vitrine.previewLiveButton}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Segmented Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-sable/60 rounded-xl shadow-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('identite')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'identite'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>1. {dict.vitrine.tabIdentity}</span>
            </button>

            <button
              onClick={() => setActiveTab('galerie')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'galerie'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>2. {dict.vitrine.tabGallery} ({realisations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>3. {dict.vitrine.tabPreview}</span>
            </button>

            <button
              onClick={() => setActiveTab('partage')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'partage'
                  ? 'bg-sombre text-white shadow-xs'
                  : 'text-sombre/70 hover:text-sombre hover:bg-[#F7F7F5]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>4. {dict.vitrine.tabShare}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {savedSuccessMsg && (
          <div className="p-3.5 bg-vertbouton/15 border border-vertbouton/40 rounded-2xl text-xs sm:text-sm text-vertbouton font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {/* ── TAB 1: IDENTITÉ & VISUEL ──────────────────────────────── */}
        {activeTab === 'identite' && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Visual Cover & Logo Customizer (Separate cards to fix clipping) */}
            <Card className="p-5 sm:p-6 bg-white border border-sable/70 rounded-2xl shadow-xs space-y-5">
              <div className="border-b border-sable/40 pb-2.5">
                <h3 className="text-sm sm:text-base font-display font-bold text-sombre">
                  {locale === 'fr' ? 'Bannière de Couverture & Logo' : 'Cover Banner & Workshop Logo'}
                </h3>
                <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                  {locale === 'fr'
                    ? 'Images de marque présentées en haut de votre vitrine publique pour vos clients.'
                    : 'Branding images displayed at the top of your public showcase.'}
                </p>
              </div>

              {/* 1. Cover Banner Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sombre">
                  <span>{locale === 'fr' ? '1. Photo de Couverture (Bannière)' : '1. Showcase Cover Photo'}</span>
                  <span className="text-sombre/50 text-[11px] font-normal">
                    {locale === 'fr' ? 'Recommandé : 1200 × 400px' : 'Recommended: 1200 × 400px'}
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-sable/80 bg-[#FAFAF8] group min-h-[160px] sm:min-h-[190px]">
                  {coverUrl ? (
                    <div className="relative h-44 sm:h-52 w-full">
                      <img src={coverUrl} alt="Bannière atelier" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-sombre/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="cursor-pointer bg-white text-sombre font-bold text-xs px-4 py-2 rounded-full shadow-lg hover:bg-gold hover:text-sombre transition-colors flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{locale === 'fr' ? 'Remplacer' : 'Replace'}</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageFileChange(e, setCoverUrl)} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => setCoverUrl('')}
                          className="bg-rose-600 text-white font-bold text-xs px-3.5 py-2 rounded-full shadow-lg hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          {dict.common.delete}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 sm:h-48 flex flex-col items-center justify-center p-5 text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-sable/80 flex items-center justify-center text-sombre/40 shadow-xs">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-sombre">
                          {locale === 'fr' ? 'Aucune bannière définie' : 'No cover banner yet'}
                        </p>
                        <p className="text-[11px] text-sombre/50">
                          {locale === 'fr' ? 'Format recommandé : 1200 x 400px (JPG, PNG)' : 'Recommended: 1200 x 400px (JPG, PNG)'}
                        </p>
                      </div>
                      <label className="cursor-pointer bg-accent hover:bg-fonce text-white font-bold text-xs px-4 py-2 rounded-full shadow-xs inline-flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{locale === 'fr' ? 'Ajouter une bannière' : 'Upload banner'}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageFileChange(e, setCoverUrl)} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Distinct Square Logo Section (Fixes clipping 100%) */}
              <div className="space-y-2 pt-2 border-t border-sable/30">
                <div className="flex items-center justify-between text-xs font-bold text-sombre">
                  <span>{locale === 'fr' ? '2. Logo de l’Atelier' : '2. Workshop Logo'}</span>
                  <span className="text-sombre/50 text-[11px] font-normal">
                    {locale === 'fr' ? 'Format carré : 500 × 500px' : 'Square format: 500 × 500px'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-[#FAFAF8] border border-sable/60">
                  {/* Square Logo Box */}
                  <div className="relative w-24 h-24 rounded-2xl bg-white border-2 border-sable/80 shadow-xs overflow-hidden flex items-center justify-center shrink-0 group/logo">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-accent/10 flex flex-col items-center justify-center text-accent text-xs font-extrabold">
                        <Scissors className="w-7 h-7" />
                        <span className="text-[10px] mt-1 font-bold">LOGO</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-sombre/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                      <Upload className="w-5 h-5" />
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageFileChange(e, setLogoUrl)} className="hidden" />
                    </label>
                  </div>

                  {/* Logo Actions and Tips */}
                  <div className="flex-1 space-y-2">
                    <p className="text-xs sm:text-sm font-bold text-sombre">
                      {logoUrl
                        ? (locale === 'fr' ? 'Logo configuré pour votre vitrine' : 'Logo configured for your showcase')
                        : (locale === 'fr' ? 'Ajoutez le logo ou emblème de votre atelier' : 'Add your workshop logo or badge')}
                    </p>
                    <p className="text-xs text-sombre/60">
                      {locale === 'fr'
                        ? 'Ce logo apparaît dans l’en-tête de votre vitrine publique et sur les fiches de vos clients.'
                        : 'This logo appears on your public showcase and on client receipts.'}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <label className="cursor-pointer bg-sombre hover:bg-black text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-xs inline-flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{logoUrl ? (locale === 'fr' ? 'Changer logo' : 'Change logo') : (locale === 'fr' ? 'Choisir un logo' : 'Select logo')}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageFileChange(e, setLogoUrl)} className="hidden" />
                      </label>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-xs text-rose-600 font-bold hover:underline px-2.5 py-1 rounded-full cursor-pointer"
                        >
                          {locale === 'fr' ? 'Supprimer' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Atelier Identity Information */}
            <Card className="p-5 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-4">
              <div className="border-b border-sable/40 pb-3">
                <h3 className="text-sm sm:text-base font-display font-bold text-sombre">
                  {locale === 'fr' ? 'Coordonnées & Présentation' : 'Contact & Workshop Bio'}
                </h3>
                <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                  {locale === 'fr'
                    ? 'Informations affichées aux clients pour découvrir votre savoir-faire et vous contacter.'
                    : 'Details shown to clients to discover your expertise and contact you.'}
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label={dict.vitrine.workshopName}
                  type="text"
                  placeholder="ex: Maison Adia Couture"
                  value={nomAtelier}
                  onChange={(e) => setNomAtelier(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={dict.vitrine.city}
                    type="text"
                    placeholder="ex: Dakar"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                  />
                  <Input
                    label={dict.vitrine.country}
                    type="text"
                    placeholder="ex: Sénégal"
                    value={pays}
                    onChange={(e) => setPays(e.target.value)}
                  />
                </div>

                <Input
                  label={dict.vitrine.phoneWhatsApp}
                  type="tel"
                  placeholder="ex: +221 77 123 45 67"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  helperText={
                    locale === 'fr'
                      ? "Les clients qui cliquent sur 'Commander' sur votre vitrine seront redirigés directement vers ce numéro WhatsApp."
                      : "Clients clicking 'Order' on your showcase will be directly connected to this WhatsApp number."
                  }
                />

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-sombre">
                    {dict.vitrine.bioDescription}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={dict.vitrine.bioPlaceholder}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3.5 bg-white border border-sable/80 rounded-2xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent font-sans shadow-xs"
                  />
                </div>

                {/* Custom URL Slug */}
                <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-sable/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-sombre flex items-center gap-1.5">
                      <span>{dict.vitrine.slugLabel}</span>
                      {!canCustomizeSlug(couturier) && (
                        <span className="text-[10px] bg-gold/20 text-sombre px-2 py-0.5 rounded-full font-bold border border-gold/40 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-gold" /> Plan Pro
                        </span>
                      )}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-mono text-sombre/60 font-bold select-none">
                      {dict.vitrine.slugPrefix}
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
                      ? (locale === 'fr'
                          ? "Vos clients accèderont à votre vitrine via cette adresse personnalisée."
                          : "Your clients will access your showcase via this personalized signature URL.")
                      : (locale === 'fr'
                          ? "La personnalisation du slug est réservée aux abonnés Pro. Sur le plan gratuit, un lien sécurisé unique est attribué automatiquement."
                          : "Custom slug is reserved for Pro subscribers. A secure unique link is automatically assigned on the free plan.")}
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
                  <span>{savingProfile ? dict.common.saving : dict.vitrine.saveIdentityButton}</span>
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
                    <span>{dict.vitrine.galleryTitle} ({realisations.length} {dict.vitrine.galleryCount})</span>
                  </h3>
                  <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                    {SHOW_ACCOUNT_PLANS ? (
                      isProPlan(couturier)
                        ? (locale === 'fr'
                            ? '👑 Vous bénéficiez d’un nombre illimité de créations exposées sur votre vitrine.'
                            : '👑 You enjoy unlimited creations displayed on your public showcase.')
                        : (locale === 'fr'
                            ? `Plan Gratuit : ${realisations.length} sur ${FREE_PLAN_LIMITS.maxRealisations} photos autorisées.`
                            : `Free Plan: ${realisations.length} of ${FREE_PLAN_LIMITS.maxRealisations} photos allowed.`)
                    ) : (
                      locale === 'fr'
                        ? 'Exposez vos plus belles créations sur votre vitrine publique.'
                        : 'Showcase your finest bespoke creations on your public storefront.'
                    )}
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
                  disabled={SHOW_ACCOUNT_PLANS && !isProPlan(couturier) && realisations.length >= FREE_PLAN_LIMITS.maxRealisations}
                  className="rounded-full font-bold text-xs sm:text-sm gap-1.5 shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{dict.vitrine.addPhotoButton}</span>
                </Button>
              </div>

              {/* Progress bar on free plan */}
              {SHOW_ACCOUNT_PLANS && !isProPlan(couturier) && (
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
                <h4 className="text-sm sm:text-base font-bold text-sombre">
                  {locale === 'fr' ? 'Aucun modèle exposé pour l’instant' : 'No creations published yet'}
                </h4>
                <p className="text-xs text-sombre/60 max-w-sm mx-auto">
                  {locale === 'fr'
                    ? 'Publiez vos plus belles confections pour donner envie aux visiteurs de vous contacter sur WhatsApp !'
                    : 'Publish your finest tailored garments so visitors can order directly on WhatsApp!'}
                </p>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="rounded-full text-xs font-bold gap-1.5 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{locale === 'fr' ? 'Ajouter ma première photo' : 'Add first photo'}</span>
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
                        title={dict.common.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-sombre line-clamp-2 leading-snug">
                          {real.description || (locale === 'fr' ? 'Création sur-mesure' : 'Custom Tailored Creation')}
                        </h4>
                      </div>
                      <div className="pt-2 border-t border-sable/30 flex items-center justify-between text-[11px] text-sombre/50 font-semibold">
                        <span>{formatDateFR(real.date_publication, locale)}</span>
                        <span className="text-accent font-bold">
                          {locale === 'fr' ? 'Exposé' : 'Public'}
                        </span>
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
                  <span>{locale === 'fr' ? 'Aperçu Interactif Écran Smartphone' : 'Interactive Mobile Preview'}</span>
                </h3>
                <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                  {locale === 'fr'
                    ? 'Visualisez exactement le rendu de votre vitrine telle qu’un client la découvre sur son téléphone.'
                    : 'Preview exactly how potential clients see your atelier on their smartphones.'}
                </p>
              </div>

              <Link href={`/${activeSlug}`} target="_blank">
                <Button variant="outline" size="sm" className="rounded-full text-xs font-bold gap-1.5 border-accent text-accent">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{locale === 'fr' ? 'Ouvrir dans un onglet' : 'Open in new tab'}</span>
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
                        {locale === 'fr' ? 'Bannière d’atelier' : 'Workshop Banner'}
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
                      {nomAtelier || (locale === 'fr' ? 'Maison Adia Couture' : 'Adia Fashion House')}
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
                        <span>💬 {dict.publicVitrine.orderOnWhatsApp}</span>
                      </button>
                    </div>
                  </div>

                  {/* Showcase Gallery */}
                  <div className="p-4 space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-accent">
                      {dict.publicVitrine.galleryTitle} ({realisations.length})
                    </h5>
                    {realisations.length === 0 ? (
                      <div className="p-6 text-center text-xs text-sombre/50 border border-dashed border-sable rounded-2xl">
                        {dict.publicVitrine.noPhotosYet}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {realisations.map((r) => (
                          <div key={r.id} className="rounded-xl overflow-hidden bg-white border border-sable/50 shadow-xs">
                            <img src={r.photo_url} alt="Modèle" className="w-full h-24 object-cover" />
                            <p className="p-1.5 text-[10px] font-bold text-sombre truncate">
                              {r.description || (locale === 'fr' ? 'Modèle sur-mesure' : 'Custom piece')}
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
                  <span>{dict.vitrine.shareSectionTitle}</span>
                </h3>
                <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                  {dict.vitrine.shareSectionDesc}
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
                  <span>{copiedLink ? dict.common.copied : dict.vitrine.copyLinkBtn}</span>
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
                  <span>💬 {dict.vitrine.shareWhatsAppBtn}</span>
                </Button>
              </a>
            </Card>

            {/* Official Workshop QR Code */}
            <Card className="p-6 sm:p-7 bg-white border border-sable/70 rounded-3xl shadow-xs space-y-6">
              <div className="border-b border-sable/40 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-gold" />
                    <span>{dict.vitrine.qrCodeTitle}</span>
                  </h3>
                  <p className="text-xs text-sombre/60 font-semibold mt-0.5">
                    {dict.vitrine.qrCodeDesc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center sm:justify-start">
                <div className="p-4 bg-[#FAF9F6] border-2 border-sable/80 rounded-3xl shadow-sm shrink-0">
                  <img src={qrCodeUrl} alt="QR Code Vitrine" className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl" />
                </div>

                <div className="space-y-3 text-center sm:text-left max-w-sm">
                  <h4 className="text-sm font-bold text-sombre">
                    {locale === 'fr' ? 'Scannez pour ouvrir la vitrine' : 'Scan to open showcase'}
                  </h4>
                  <p className="text-xs text-sombre/70 leading-relaxed font-medium">
                    {locale === 'fr'
                      ? 'Vos clients peuvent scanner ce code avec l’appareil photo de leur smartphone pour voir instantanément vos modèles et passer commande.'
                      : 'Clients can scan this QR code with their smartphone camera to browse your gallery and order instantly.'}
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
                      <span>{locale === 'fr' ? 'Télécharger l’image QR Code' : 'Download QR Code'}</span>
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
                  <span>{dict.vitrine.uploadModalTitle}</span>
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
                    {locale === 'fr' ? 'Photo du modèle' : 'Model photo'}
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
                      <span>{dict.vitrine.selectImageBtn}</span>
                      <span className="text-[11px] text-sombre/50 font-normal">
                        {locale === 'fr' ? 'JPG, PNG ou WebP compressé automatiquement' : 'JPG, PNG or WebP automatically compressed'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageFileChange(e, setPhotoUrl)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <Input
                  label={locale === 'fr' ? 'OU Coller un lien d’image web (URL)' : 'OR Paste an image web URL'}
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />

                <Input
                  label={dict.vitrine.photoTitleLabel}
                  type="text"
                  placeholder={locale === 'fr' ? 'ex: Robe de soirée brodée en soie' : 'ex: Silk embroidered evening gown'}
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
                    {dict.common.cancel}
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    size="sm"
                    disabled={!photoUrl || uploadingPhoto}
                    className="rounded-full text-xs font-bold gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{uploadingPhoto ? (locale === 'fr' ? 'Publication…' : 'Publishing…') : dict.vitrine.savePhotoBtn}</span>
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
