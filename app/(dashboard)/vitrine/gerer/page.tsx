'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Share2, Plus, Trash2, ExternalLink, Image as ImageIcon, Check, Copy, Upload } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { MockStorageService } from '@/lib/services/mockStorage';
import { Realisation, Couturier } from '@/lib/types/database';
import { generateWhatsAppShareLink, formatDateFR } from '@/lib/utils/formatters';

export default function GererVitrinePage() {
  const [couturier, setCouturier] = useState<Couturier>(MockStorageService.getCouturier());
  const [realisations, setRealisations] = useState<Realisation[]>([]);

  // Profile Edit State
  const [nomAtelier, setNomAtelier] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('');
  const [telephone, setTelephone] = useState('');
  const [slug, setSlug] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Add Realisation State
  const [showAddModal, setShowAddModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = MockStorageService.getCouturier();
    setCouturier(c);
    setNomAtelier(c.nom_atelier);
    setVille(c.ville || '');
    setPays(c.pays || '');
    setTelephone(c.telephone || '');
    setSlug(c.slug_vitrine);
    setCoverUrl(c.cover_url || '');
    setLogoUrl(c.logo_url || '');

    setRealisations(MockStorageService.getRealisations());
    setLoading(false);
  }, []);

  const handleImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setter(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    const updated = MockStorageService.updateCouturier({
      nom_atelier: nomAtelier.trim(),
      ville: ville.trim(),
      pays: pays.trim(),
      telephone: telephone.trim(),
      slug_vitrine: slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
      cover_url: coverUrl.trim() || undefined,
      logo_url: logoUrl.trim() || undefined,
    });

    setCouturier(updated);
    setTimeout(() => {
      setSavingProfile(false);
    }, 400);
  };

  const handleAddRealisation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim()) return;

    MockStorageService.addRealisation({
      photo_url: photoUrl.trim(),
      description: description.trim() || 'Modèle Haute Couture',
    });

    setRealisations(MockStorageService.getRealisations());
    setShowAddModal(false);
    setPhotoUrl('');
    setDescription('');
  };

  const handleDeleteRealisation = (id: string) => {
    MockStorageService.deleteRealisation(id);
    setRealisations(MockStorageService.getRealisations());
  };

  const publicLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/${couturier.slug_vitrine}`;
  const whatsappShareUrl = generateWhatsAppShareLink(couturier.nom_atelier, couturier.slug_vitrine);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pb-28 font-sans">
        <main className="max-w-4xl mx-auto px-4 pt-12">
          <ThreadSpoolLoader label="Chargement de votre vitrine d'atelier…" size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 font-sans">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Gérer ma Vitrine Publique</h2>
            <p className="text-xs sm:text-sm text-sombre/70 font-semibold">Exposez vos créations et partagez votre catalogue d’atelier</p>
          </div>

          <Link href={`/${couturier.slug_vitrine}`} target="_blank">
            <Button variant="accent" size="sm" className="gap-2 shadow-md font-bold text-xs sm:text-sm rounded-full">
              <ExternalLink className="w-4 h-4" />
              <span>Aperçu public</span>
            </Button>
          </Link>
        </div>

        {/* Share Link Card */}
        <Card className="p-5 sm:p-6 space-y-4 bg-white border border-sable/80 shadow-xs rounded-3xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">Lien Public de votre Atelier</h3>
                <p className="text-xs text-sombre/70 font-semibold">Partagez ce lien à vos clients pour leur faire consulter votre vitrine</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Vitrine active</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-[#FAFAF8] p-3 rounded-2xl border border-sable/70">
            <div className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-sable/80 flex items-center min-w-0 shadow-inner">
              <span className="text-xs sm:text-sm font-mono text-sombre font-bold truncate select-all w-full">{publicLink}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-sombre text-white hover:bg-fonce active:scale-95'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4 text-gold" />}
                <span>{copiedLink ? 'Copié !' : 'Copier'}</span>
              </button>
              <Link href={`/${couturier.slug_vitrine}`} target="_blank">
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold px-3.5 py-2.5 border-sable text-sombre hover:text-accent gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Aperçu</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="pt-1">
            <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="accent" fullWidth size="md" className="gap-2 bg-[#25D366] hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm">
                <span>💬 Partager la vitrine sur WhatsApp</span>
              </Button>
            </a>
          </div>
        </Card>

        {/* Realisations Gallery Management */}
        <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 shadow-xs rounded-3xl">
          <div className="flex items-center justify-between gap-2 border-b border-sable/40 pb-3">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sombre flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-accent" />
              <span>Galerie de Réalisations ({realisations.length})</span>
            </h3>

            <Button
              variant="accent"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-2 font-bold text-xs sm:text-sm rounded-full"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajouter Photo</span>
            </Button>
          </div>

          {realisations.length === 0 ? (
            <div className="py-10 text-center text-xs sm:text-sm text-sombre/60 space-y-2 border-dashed border-2 border-sable/80 rounded-2xl">
              <ImageIcon className="w-10 h-10 mx-auto text-sombre/40" />
              <p className="font-semibold">Aucune réalisation publiée pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {realisations.map((real) => (
                <div key={real.id} className="relative group rounded-2xl overflow-hidden border border-sable/60 bg-[#FAFAF8] shadow-xs">
                  <img
                    src={real.photo_url}
                    alt={real.description || 'Création couture'}
                    className="w-full h-44 object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="p-3 bg-white space-y-1 border-t border-sable/40">
                    <p className="text-xs sm:text-sm font-bold text-sombre leading-snug line-clamp-2">{real.description || 'Création sur-mesure'}</p>
                    <p className="text-xs text-sombre/60 font-semibold">{formatDateFR(real.date_publication)}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteRealisation(real.id)}
                    className="absolute top-2.5 right-2.5 p-2 bg-accent text-white rounded-full shadow-md hover:bg-fonce transition-all"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Add Realisation Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-sombre/60 backdrop-blur-xs flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 space-y-4 bg-white shadow-xl border border-sable rounded-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-sombre">Ajouter une Création</h3>
                <button onClick={() => setShowAddModal(false)} className="text-sm font-bold text-sombre/50 hover:text-sombre">
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddRealisation} className="space-y-4 font-sans">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-bold text-sombre">
                    Photo du modèle
                  </label>

                  {photoUrl && (
                    <img src={photoUrl} alt="Preview" className="w-full h-44 object-cover rounded-2xl border border-sable/80 mb-2" />
                  )}

                  <label className="cursor-pointer bg-accent/10 hover:bg-accent/20 text-accent font-bold text-xs sm:text-sm px-4 py-3 rounded-full border border-accent/20 flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Uploader photo depuis mon téléphone</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, setPhotoUrl)}
                      className="hidden"
                    />
                  </label>
                </div>

                <Input
                  label="OU Coller un lien d'image (URL)"
                  type="text"
                  placeholder="https://..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />

                <Input
                  label="Description / Nom du Modèle"
                  type="text"
                  placeholder="ex: Robe de soirée brodée en soie"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="accent" size="sm">
                    Publier sur ma vitrine
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Profile & Image Settings Form */}
        <Card className="p-5 sm:p-6 space-y-4 bg-white border-sable/60 shadow-xs rounded-3xl">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-sable/40 pb-3">
            <Store className="w-5 h-5 text-accent" />
            <span>Informations & Images de Vitrine</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 font-sans">
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
              label="Téléphone de contact (WhatsApp)"
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />

            {/* Cover Banner Upload */}
            <div className="space-y-2 p-4 bg-[#FAFAF8] rounded-2xl border border-sable/60">
              <label className="block text-xs sm:text-sm font-bold text-sombre">
                Photo de Couverture (Bannière Vitrine)
              </label>

              <div className="flex items-center gap-4 pt-1">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover Banner" className="w-28 h-16 object-cover rounded-xl border border-sable/80" />
                ) : (
                  <div className="w-28 h-16 bg-white rounded-xl border border-dashed border-sable flex items-center justify-center text-xs text-sombre/50 font-bold">
                    Bannière
                  </div>
                )}

                <label className="cursor-pointer bg-accent hover:bg-fonce text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-xs inline-flex items-center gap-2">
                  <Upload className="w-4 h-4 text-white" />
                  <span>Uploader Bannière</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, setCoverUrl)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2 p-4 bg-[#FAFAF8] rounded-2xl border border-sable/60">
              <label className="block text-xs sm:text-sm font-bold text-sombre">
                Logo de l'Atelier
              </label>

              <div className="flex items-center gap-4 pt-1">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Atelier" className="w-14 h-14 object-cover rounded-full border-2 border-accent" />
                ) : (
                  <div className="w-14 h-14 bg-white rounded-full border border-dashed border-sable flex items-center justify-center text-xs text-sombre/50 font-bold">
                    Logo
                  </div>
                )}

                <label className="cursor-pointer bg-accent hover:bg-fonce text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-xs inline-flex items-center gap-2">
                  <Upload className="w-4 h-4 text-white" />
                  <span>Uploader Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, setLogoUrl)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <Input
              label="Lien unique de vitrine (Slug)"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              helperText={`ourlette.app/${slug}`}
              required
            />

            <Button type="submit" variant="accent" size="lg" fullWidth disabled={savingProfile} className="shadow-lg shadow-accent/20 font-bold rounded-full">
              {savingProfile ? 'Enregistrement…' : 'Enregistrer la vitrine →'}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
