'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Store,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  Copy,
  Upload,
  Share2,
  Eye,
  Camera,
  Image as ImageIcon,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { SupabaseService } from '@/lib/services/supabaseService';
import { Realisation, Couturier } from '@/lib/types/database';
import { generateWhatsAppShareLink } from '@/lib/utils/formatters';
import { isProPlan, FREE_PLAN_LIMITS } from '@/lib/utils/planLimits';
import { compressImage } from '@/lib/utils/imageCompression';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';

export default function GererVitrinePage() {
  const { user, couturier: authCouturier, refreshProfile } = useAuth();
  const { locale } = useLanguage();
  const [couturier, setCouturier] = useState<Couturier | null>(null);
  const [realisations, setRealisations] = useState<Realisation[]>([]);

  // Vitrine active status
  const [vitrineActive, setVitrineActive] = useState<boolean>(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Profile Form Fields
  const [nomAtelier, setNomAtelier] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('');
  const [telephone, setTelephone] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  // Add Realisation State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);

  // UI state
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  const isPro = couturier ? isProPlan(couturier) : false;
  const maxPhotos = FREE_PLAN_LIMITS.maxRealisations;
  const atPhotoLimit = !isPro && realisations.length >= maxPhotos;

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
      setBio(activeC.bio || '');
      setCoverUrl(activeC.cover_url || '');
      setLogoUrl(activeC.logo_url || '');
    }

    setRealisations(reals);
    setLoading(false);
  }, [user?.id, authCouturier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle showcase active
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

  // Copy link
  const activeSlug = couturier?.slug_vitrine || slug || 'mon-atelier';
  const publicLink = typeof window !== 'undefined'
    ? `${window.location.origin}/${activeSlug}`
    : `https://ourlette.app/${activeSlug}`;
  const whatsappShareUrl = generateWhatsAppShareLink(nomAtelier || 'Mon Atelier', activeSlug);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Profile save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSavingProfile(true);
    setSavedSuccessMsg('');

    const slugified = slug ? slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : '';

    const updatePayload: Partial<Couturier> = {
      nom_atelier: nomAtelier.trim(),
      ville: ville.trim(),
      pays: pays.trim(),
      telephone: telephone.trim(),
      whatsapp_contact: telephone.trim(),
      bio: bio.trim().slice(0, 160),
      cover_url: coverUrl || undefined,
      logo_url: logoUrl || undefined,
      vitrine_active: vitrineActive,
    };

    if (isPro && slugified) {
      updatePayload.slug_vitrine = slugified;
    }

    const updated = await DataService.updateCouturier(user.id, updatePayload);

    if (updated) {
      setCouturier(updated);
      await refreshProfile();
      setSavedSuccessMsg(locale === 'fr' ? 'Profil vitrine mis à jour avec succès !' : 'Showcase profile updated successfully!');
      setTimeout(() => setSavedSuccessMsg(''), 3000);
    }
    setSavingProfile(false);
  };

  // Handle Logo & Banner upload
  const handleMediaUpload = async (file: File, setter: (url: string) => void) => {
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type) || file.name.toLowerCase().endsWith('.svg')) {
      alert(locale === 'fr' ? 'Format non autorisé. JPG, PNG ou WebP uniquement.' : 'Invalid format. JPG, PNG or WebP only.');
      return;
    }

    try {
      const compressed = await compressImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.82 });
      let publicUrl: string | null = null;
      if (user?.id && navigator.onLine) {
        publicUrl = await SupabaseService.uploadImage('vitrine', `${user.id}/${Date.now()}-${compressed.name}`, compressed);
      }

      if (publicUrl) {
        setter(publicUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setter(event.target.result as string);
          }
        };
        reader.readAsDataURL(compressed);
      }
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de l’optimisation de l’image.');
    }
  };

  // Handle file select for gallery
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (atPhotoLimit) {
      alert(locale === 'fr'
        ? 'Vous avez atteint la limite de 8 photos du Plan Gratuit. Passez en Pro pour publier en illimité !'
        : 'You reached the 8 photos limit on the Free plan. Upgrade to Pro for unlimited photos!');
      e.target.value = '';
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type) || file.name.toLowerCase().endsWith('.svg')) {
      alert(locale === 'fr' ? 'Format non autorisé. JPG, PNG ou WebP uniquement.' : 'Invalid format. JPG, PNG or WebP only.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError(null);
  };

  // Upload and publish realisation
  const handlePublishPhoto = async () => {
    if (!selectedFile || !user?.id) return;

    setIsSubmittingPhoto(true);
    setUploadProgress(15);
    setUploadError(null);

    try {
      // 1. Compression client
      setUploadProgress(40);
      const compressed = await compressImage(selectedFile, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });

      // 2. Upload vers Supabase storage si en ligne
      setUploadProgress(70);
      let photoFinalUrl: string | null = null;

      if (navigator.onLine) {
        photoFinalUrl = await SupabaseService.uploadImage(
          'realisations',
          `${user.id}/${Date.now()}-${compressed.name}`,
          compressed
        );
      }

      // Fallback base64 si hors-ligne ou si le bucket distant n'est pas prêt
      if (!photoFinalUrl) {
        photoFinalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressed);
        });
      }

      setUploadProgress(90);

      // 3. Enregistrement via DataService
      const created = await DataService.addRealisation(user.id, {
        photo_url: photoFinalUrl,
        description: photoDescription.trim(),
      });

      if (created) {
        setUploadProgress(100);
        const reals = await DataService.getRealisations(user.id);
        setRealisations(reals);

        // Reset
        setTimeout(() => {
          setSelectedFile(null);
          setPreviewUrl(null);
          setPhotoDescription('');
          setUploadProgress(null);
          setIsSubmittingPhoto(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 300);
      } else {
        throw new Error('Échec de la sauvegarde');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Erreur lors de la publication de la photo.');
      setIsSubmittingPhoto(false);
      setUploadProgress(null);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoDescription('');
    setUploadProgress(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Delete realisation
  const handleDeleteRealisation = async (id: string) => {
    if (!user?.id) return;
    const confirmMsg = locale === 'fr'
      ? 'Supprimer définitivement cette photo de votre vitrine ?'
      : 'Permanently delete this photo from your showcase?';
    if (!confirm(confirmMsg)) return;

    await DataService.deleteRealisation(user.id, id);
    const reals = await DataService.getRealisations(user.id);
    setRealisations(reals);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
        <main className="max-w-2xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label={locale === 'fr' ? 'Chargement de la vitrine…' : 'Loading showcase…'} size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans text-sombre">
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-6">

        {/* ── En-tête : Titre & Interrupteur Vitrine Visible ────────── */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-sable/50 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sombre text-gold flex items-center justify-center shrink-0 shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-display font-bold text-sombre truncate">
                {locale === 'fr' ? 'Vitrine de l’atelier' : 'Showcase Studio'}
              </h1>
              <p className="text-xs text-sombre/60">
                {vitrineActive
                  ? (locale === 'fr' ? 'Visible par le public' : 'Publicly visible')
                  : (locale === 'fr' ? 'Vitrine masquée' : 'Hidden from public')}
              </p>
            </div>
          </div>

          {/* Interrupteur Vitrine visible */}
          <button
            type="button"
            onClick={handleToggleVitrineActive}
            disabled={togglingStatus}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              vitrineActive ? 'bg-vertbouton' : 'bg-sable/70'
            }`}
            aria-label="Toggle showcase visibility"
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                vitrineActive ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* ── Bloc 1 : Lien public ────────────────────────────────────── */}
        <Card className="p-4 sm:p-5 rounded-3xl border border-sable/50 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sombre/70">
              {locale === 'fr' ? 'Lien public de votre atelier' : 'Public link'}
            </h2>
            <span className="text-[11px] font-mono font-medium text-fonce/80 bg-sable/30 px-2 py-0.5 rounded-md truncate max-w-[200px]">
              ourlette.app/{activeSlug}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="w-full rounded-2xl h-11 text-xs font-semibold flex items-center justify-center gap-2 border-sable/70 text-sombre hover:bg-sable/20"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-vertbouton" />
                  <span>{locale === 'fr' ? 'Copié !' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-sombre/70" />
                  <span>{locale === 'fr' ? 'Copier le lien' : 'Copy link'}</span>
                </>
              )}
            </Button>

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{locale === 'fr' ? 'WhatsApp' : 'WhatsApp'}</span>
            </a>

            <Link
              href={`/${activeSlug}`}
              target="_blank"
              className="w-full h-11 rounded-2xl bg-sombre hover:bg-fonce text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Eye className="w-4 h-4 text-gold" />
              <span>{locale === 'fr' ? 'Voir ma vitrine' : 'View showcase'}</span>
            </Link>
          </div>
        </Card>

        {/* ── Bloc 2 : Galerie de réalisations ───────────────────────── */}
        <Card className="p-4 sm:p-5 rounded-3xl border border-sable/50 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-display font-bold text-sombre">
                {locale === 'fr' ? 'Galerie de vos créations' : 'Creations Gallery'}
              </h2>
              {/* Compteur uniquement pour le plan gratuit */}
              {!isPro ? (
                <p className="text-xs text-sombre/60 font-medium">
                  {realisations.length}/{maxPhotos} {locale === 'fr' ? 'photos (Plan Gratuit)' : 'photos (Free Plan)'}
                </p>
              ) : (
                <p className="text-xs text-vertbouton font-semibold flex items-center gap-1">
                  <span>{realisations.length} {locale === 'fr' ? 'photos publiées' : 'photos published'}</span>
                  <span className="text-[10px] bg-vertbouton/10 px-1.5 py-0.5 rounded-full font-bold">Pro Illimité</span>
                </p>
              )}
            </div>

            {/* Input file caché déclenché par le bouton */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            {!atPhotoLimit ? (
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-accent hover:bg-accent/90 text-white text-xs font-bold px-4 h-10 flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{locale === 'fr' ? 'Ajouter une photo' : 'Add photo'}</span>
              </Button>
            ) : (
              <Link
                href="/pro"
                className="rounded-full bg-gold/15 text-sombre border border-gold/40 text-xs font-bold px-3.5 h-10 flex items-center gap-1.5 hover:bg-gold/25 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-accent" />
                <span>{locale === 'fr' ? 'Passer Pro' : 'Go Pro'}</span>
              </Link>
            )}
          </div>

          {/* Formulaire modal ou en-place lors de la sélection d'une photo */}
          {selectedFile && previewUrl && (
            <div className="bg-[#FAFAF8] rounded-2xl p-4 border border-sable/80 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Aperçu"
                  className="w-16 h-16 rounded-xl object-cover border border-sable shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-sombre truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-sombre/60">
                    {(selectedFile.size / 1024).toFixed(0)} Ko · {locale === 'fr' ? 'Sera optimisée automatiquement' : 'Will be optimized'}
                  </p>
                </div>
              </div>

              {/* Barre de progression pendant compression/upload */}
              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-fonce">
                    <span>
                      {uploadProgress < 50
                        ? (locale === 'fr' ? 'Optimisation de la photo…' : 'Optimizing photo…')
                        : (locale === 'fr' ? 'Publication sur la vitrine…' : 'Publishing to showcase…')}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-sable/40 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 p-2 bg-rose-50 text-rose-800 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Champ description facultatif */}
              <div>
                <label className="block text-xs font-semibold text-sombre/80 mb-1">
                  {locale === 'fr' ? 'Description (facultative)' : 'Description (optional)'}
                </label>
                <Input
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  placeholder={locale === 'fr' ? 'Ex : Robe de cocktail en pagne tissé' : 'Ex: Evening gown in woven fabric'}
                  disabled={isSubmittingPhoto}
                  className="rounded-xl h-10 text-xs bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelUpload}
                  disabled={isSubmittingPhoto}
                  className="rounded-xl h-9 text-xs px-3 border-sable text-sombre/70"
                >
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  onClick={handlePublishPhoto}
                  disabled={isSubmittingPhoto}
                  className="rounded-xl h-9 text-xs px-4 bg-accent hover:bg-accent/90 text-white font-bold flex items-center gap-1.5"
                >
                  {isSubmittingPhoto && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{locale === 'fr' ? 'Publier' : 'Publish'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Grille des photos publiées */}
          {realisations.length === 0 && !selectedFile ? (
            <div className="text-center py-10 px-4 bg-[#FAFAF8] rounded-2xl border border-dashed border-sable/70 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-sable/30 flex items-center justify-center text-sombre/50">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-sombre">
                  {locale === 'fr' ? 'Aucune photo publiée' : 'No photos yet'}
                </p>
                <p className="text-[11px] text-sombre/60 mt-0.5">
                  {locale === 'fr' ? 'Montrez vos plus belles réalisations à vos futurs clients.' : 'Showcase your finest creations to future clients.'}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-sombre text-white text-xs font-bold px-4 h-9 shadow-xs"
              >
                {locale === 'fr' ? 'Ajouter une première photo' : 'Add first photo'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {realisations.map((real) => (
                <div
                  key={real.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-sable/20 border border-sable/50 shadow-2xs"
                >
                  <img
                    src={real.photo_url}
                    alt={real.description || 'Création'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {real.description && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sombre/80 via-sombre/40 to-transparent p-2 text-white text-[11px] truncate">
                      {real.description}
                    </div>
                  )}
                  {/* Bouton supprimer */}
                  <button
                    type="button"
                    onClick={() => handleDeleteRealisation(real.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-sombre/80 hover:bg-accent text-white flex items-center justify-center shadow-xs transition-colors"
                    aria-label="Supprimer la photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Bloc 3 : Profil de l'atelier ───────────────────────────── */}
        <Card className="p-4 sm:p-5 rounded-3xl border border-sable/50 bg-white space-y-4">
          <div>
            <h2 className="text-sm font-display font-bold text-sombre">
              {locale === 'fr' ? 'Profil de l’atelier' : 'Atelier Profile'}
            </h2>
            <p className="text-xs text-sombre/60">
              {locale === 'fr' ? 'Informations publiques affichées sur votre vitrine' : 'Public information displayed on your showcase'}
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Nom atelier */}
            <div>
              <label className="block text-xs font-bold text-sombre mb-1">
                {locale === 'fr' ? 'Nom de l’atelier' : 'Workshop name'} *
              </label>
              <Input
                required
                value={nomAtelier}
                onChange={(e) => setNomAtelier(e.target.value)}
                placeholder="Ex : Maison Adia Couture"
                className="rounded-2xl h-11 text-xs"
              />
            </div>

            {/* Ville & Pays */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-sombre mb-1">
                  {locale === 'fr' ? 'Ville' : 'City'}
                </label>
                <Input
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Ex : Cotonou"
                  className="rounded-2xl h-11 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-sombre mb-1">
                  {locale === 'fr' ? 'Pays' : 'Country'}
                </label>
                <Input
                  value={pays}
                  onChange={(e) => setPays(e.target.value)}
                  placeholder="Ex : Bénin"
                  className="rounded-2xl h-11 text-xs"
                />
              </div>
            </div>

            {/* WhatsApp contact */}
            <div>
              <label className="block text-xs font-bold text-sombre mb-1">
                {locale === 'fr' ? 'Numéro WhatsApp de contact' : 'WhatsApp Contact Number'}
              </label>
              <Input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex : +229 97 00 00 00"
                className="rounded-2xl h-11 text-xs"
              />
              <p className="text-[11px] text-sombre/50 mt-1">
                {locale === 'fr' ? 'Utilisé pour le bouton « Contacter sur WhatsApp » de votre vitrine.' : 'Used for the “Contact on WhatsApp” button on your showcase.'}
              </p>
            </div>

            {/* Bio (max 160 caractères) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-sombre">
                  {locale === 'fr' ? 'Bio de présentation' : 'Presentation Bio'}
                </label>
                <span className={`text-[10px] font-mono ${bio.length > 150 ? 'text-accent font-bold' : 'text-sombre/50'}`}>
                  {bio.length}/160
                </span>
              </div>
              <textarea
                value={bio}
                maxLength={160}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder={locale === 'fr' ? 'Présentez votre style, vos créations et vos spécialités couture…' : 'Share your style and tailor specialties…'}
                className="w-full rounded-2xl border border-sable/80 p-3 text-xs bg-white text-sombre focus:border-fonce focus:outline-hidden transition-colors"
              />
            </div>

            {/* Logo & Bannière */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Logo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-sombre">
                  {locale === 'fr' ? 'Logo ou Photo de profil' : 'Logo or Profile Photo'}
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleMediaUpload(f, setLogoUrl);
                  }}
                />
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-sable/30 border border-sable overflow-hidden flex items-center justify-center shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-sombre/40" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    className="rounded-xl h-9 text-xs px-3 border-sable text-sombre hover:bg-sable/20"
                  >
                    {logoUrl ? (locale === 'fr' ? 'Changer' : 'Change') : (locale === 'fr' ? 'Choisir un logo' : 'Choose logo')}
                  </Button>
                </div>
              </div>

              {/* Bannière */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-sombre">
                  {locale === 'fr' ? 'Photo de couverture' : 'Cover banner'}
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleMediaUpload(f, setCoverUrl);
                  }}
                />
                <div className="flex items-center gap-3">
                  <div className="w-20 h-14 rounded-2xl bg-sable/30 border border-sable overflow-hidden flex items-center justify-center shrink-0">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Bannière" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-sombre/40" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    className="rounded-xl h-9 text-xs px-3 border-sable text-sombre hover:bg-sable/20"
                  >
                    {coverUrl ? (locale === 'fr' ? 'Changer' : 'Change') : (locale === 'fr' ? 'Choisir une photo' : 'Choose photo')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Slug modifiable seulement en Pro */}
            {isPro && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-sombre mb-1">
                  {locale === 'fr' ? 'Lien personnalisé (Avantage Pro)' : 'Custom URL Slug (Pro Perk)'}
                </label>
                <div className="flex items-center rounded-2xl border border-sable/80 bg-white px-3 h-11 text-xs">
                  <span className="text-sombre/50 mr-1">ourlette.app/</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="mon-atelier"
                    className="flex-1 bg-transparent font-medium text-sombre focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {savedSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{savedSuccessMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={savingProfile}
              className="w-full rounded-2xl h-11 bg-sombre hover:bg-fonce text-white text-xs font-bold shadow-xs transition-colors"
            >
              {savingProfile
                ? (locale === 'fr' ? 'Enregistrement…' : 'Saving…')
                : (locale === 'fr' ? 'Enregistrer les modifications' : 'Save atelier profile')}
            </Button>
          </form>
        </Card>

      </main>
    </div>
  );
}
