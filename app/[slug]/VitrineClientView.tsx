'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scissors,
  MapPin,
  Share2,
  Sparkles,
  Image as ImageIcon,
  PowerOff,
  Crown,
  X,
  MessageCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Couturier, Realisation } from '@/lib/types/database';
import { generateWhatsAppContactLink, generateWhatsAppShareLink, formatDateFR } from '@/lib/utils/formatters';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { isProPlan } from '@/lib/utils/planLimits';

const WhatsAppIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.419h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.445 4.43-9.874 9.876-9.874 2.637 0 5.116 1.028 6.98 2.893A9.816 9.816 0 0121.85 12.01c0 5.446-4.431 9.876-9.799 9.876m0-18.067c-6.647 0-12.04 5.394-12.04 12.04 0 2.12.553 4.188 1.605 6.012l-1.706 6.23 6.376-1.672a11.98 11.98 0 005.76 1.472h.005c6.645 0 12.038-5.393 12.038-12.041 0-3.218-1.254-6.242-3.533-8.521a11.942 11.942 0 00-8.505-3.52" />
  </svg>
);

interface VitrineClientViewProps {
  couturier: Couturier | null;
  realisations: Realisation[];
  slug: string;
}

export default function VitrineClientView({
  couturier,
  realisations,
  slug,
}: VitrineClientViewProps) {
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  const [activePhotoModal, setActivePhotoModal] = useState<Realisation | null>(null);

  const isVitrineDisabled =
    !couturier ||
    couturier.vitrine_active === false ||
    (couturier.vitrine_active as any) === 'false';

  const isPro = couturier ? isProPlan(couturier) : false;
  const nomAtelierDisplay = couturier?.nom_atelier || `Atelier ${slug.replace('-', ' ')}`;
  const contactPhone = couturier?.whatsapp_contact || couturier?.telephone || '';
  const cleanPhone = contactPhone.replace(/[^0-9]/g, '');

  const whatsappGeneralUrl = contactPhone
    ? generateWhatsAppContactLink(contactPhone, nomAtelierDisplay)
    : '#';
  const whatsappShareUrl = generateWhatsAppShareLink(nomAtelierDisplay, slug);
  const featuredCover = couturier?.cover_url || (realisations.length > 0 ? realisations[0].photo_url : null);

  // État : Vitrine désactivée ou introuvable
  if (isVitrineDisabled) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans text-sombre">
        <header className="bg-sombre text-white py-3 px-4 border-b border-gold/30">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="font-display font-bold text-sm text-white">{nomAtelierDisplay}</span>
            <LanguageSwitcher isDark variant="compact" />
          </div>
        </header>

        <main className="max-w-sm mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-sable/30 text-sombre flex items-center justify-center mx-auto">
            <PowerOff className="w-7 h-7 text-sombre/60" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-display font-bold text-sombre">{nomAtelierDisplay}</h1>
            <p className="text-xs text-sombre/70 font-medium">
              {locale === 'fr'
                ? 'Cette vitrine n’est pas disponible actuellement.'
                : 'This showcase is currently unavailable.'}
            </p>
          </div>

          {contactPhone && (
            <div className="pt-2">
              <a href={whatsappGeneralUrl} target="_blank" rel="noopener noreferrer">
                <Button className="rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold px-5 h-10 shadow-xs flex items-center justify-center gap-2 mx-auto">
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>{locale === 'fr' ? 'Contacter sur WhatsApp' : 'Contact on WhatsApp'}</span>
                </Button>
              </a>
            </div>
          )}
        </main>

        <footer className="text-center py-6 text-xs text-sombre/50">
          {!isPro && (
            <Link href="/" className="hover:underline font-medium">
              Créé avec <strong className="text-sombre font-display">Ourlette.</strong>
            </Link>
          )}
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 sm:pb-16 font-sans text-sombre">

      {/* ── En-tête supérieur fixé ──────────────────────────────────── */}
      <header className="bg-sombre text-white py-3 px-4 shadow-xs fixed top-0 inset-x-0 z-40 border-b border-gold/30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {couturier.logo_url ? (
              <img
                src={couturier.logo_url}
                alt="Logo"
                className="w-7 h-7 rounded-full object-cover border border-gold shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center border border-gold/40 shrink-0">
                <Scissors className="w-3.5 h-3.5 text-gold" />
              </div>
            )}
            <span className="font-display font-bold text-sm tracking-tight text-white truncate">
              {couturier.nom_atelier}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher isDark variant="compact" />
            <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" title="Partager">
              <Button size="sm" className="rounded-full bg-accent hover:bg-accent/90 text-white text-xs px-3 h-8 font-bold flex items-center gap-1 shadow-xs">
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dict.common.share}</span>
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Espacement sous le header fixe */}
      <div className="h-12" aria-hidden="true" />

      {/* ── Bannière & Hero Profil ──────────────────────────────────── */}
      <div className="relative bg-sombre text-white overflow-hidden border-b border-gold/30">
        {featuredCover && (
          <div className="absolute inset-0 z-0 opacity-25">
            <img
              src={featuredCover}
              alt="Bannière"
              className="w-full h-full object-cover blur-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sombre via-sombre/80 to-transparent" />
          </div>
        )}

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-10 text-center space-y-3">
          {couturier.logo_url ? (
            <img
              src={couturier.logo_url}
              alt={couturier.nom_atelier}
              className="w-20 h-20 rounded-full object-cover border-2 border-gold mx-auto shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-fonce border-2 border-gold text-gold flex items-center justify-center text-3xl font-display font-bold mx-auto shadow-md">
              {couturier.nom_atelier.charAt(0)}
            </div>
          )}

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                {couturier.nom_atelier}
              </h1>
              {isPro && (
                <span className="p-1 rounded-full bg-gold/20 border border-gold/40 text-gold" title="Atelier Certifié">
                  <Crown className="w-4 h-4 text-gold" />
                </span>
              )}
            </div>

            {(couturier.ville || couturier.pays) && (
              <p className="text-xs font-semibold text-gold/90 flex items-center justify-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {couturier.ville}
                  {couturier.ville && couturier.pays ? ', ' : ''}
                  {couturier.pays}
                </span>
              </p>
            )}
          </div>

          <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-sans max-w-md mx-auto">
            {couturier.bio || (locale === 'fr'
              ? 'Atelier de couture sur-mesure & créations d’exception.'
              : 'Bespoke tailoring atelier & fine craftsmanship.')}
          </p>

          {/* Bouton de contact WhatsApp sur desktop */}
          {contactPhone && (
            <div className="pt-2 hidden sm:block max-w-xs mx-auto">
              <a href={whatsappGeneralUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold h-11 flex items-center justify-center gap-2 shadow-md transition-colors">
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>{locale === 'fr' ? 'Contacter sur WhatsApp' : 'Contact on WhatsApp'}</span>
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Galerie de créations ────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-display font-bold text-sombre flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>{locale === 'fr' ? 'Nos Réalisations' : 'Our Creations'} ({realisations.length})</span>
          </h2>
          <span className="text-[11px] font-semibold text-fonce bg-sable/30 px-2.5 py-0.5 rounded-full">
            {locale === 'fr' ? 'Couture Sur-Mesure' : 'Bespoke'}
          </span>
        </div>

        {realisations.length === 0 ? (
          <Card className="py-12 text-center text-xs text-sombre/60 border-dashed border border-sable bg-white rounded-3xl space-y-2">
            <ImageIcon className="w-8 h-8 mx-auto text-sombre/40" />
            <p className="font-semibold">
              {locale === 'fr' ? 'Aucune photo publiée pour le moment.' : 'No photos published yet.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {realisations.map((real) => {
              const modelWhatsappUrl = contactPhone
                ? generateWhatsAppContactLink(
                    contactPhone,
                    couturier.nom_atelier,
                    real.description || (locale === 'fr' ? 'Création de l’atelier' : 'Creation')
                  )
                : '#';

              return (
                <div
                  key={real.id}
                  onClick={() => setActivePhotoModal(real)}
                  className="group relative aspect-4/5 rounded-2xl sm:rounded-3xl overflow-hidden bg-sable/20 border border-sable/60 shadow-2xs hover:shadow-md transition-all cursor-pointer"
                >
                  <img
                    src={real.photo_url}
                    alt={real.description || 'Création couture'}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                  {real.description && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sombre/90 via-sombre/50 to-transparent p-2.5 sm:p-3 text-white">
                      <p className="text-xs font-semibold leading-tight line-clamp-2">
                        {real.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Lightbox Plein Écran au Tap sur une Photo ────────────────── */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-sombre/95 backdrop-blur-md flex flex-col justify-between p-4 animate-fade-in"
          onClick={() => setActivePhotoModal(null)}
        >
          <div className="flex items-center justify-between text-white max-w-2xl mx-auto w-full pt-1">
            <span className="text-xs font-semibold text-white/80">
              {activePhotoModal.date_publication
                ? formatDateFR(activePhotoModal.date_publication, locale)
                : ''}
            </span>
            <button
              type="button"
              onClick={() => setActivePhotoModal(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center max-w-2xl mx-auto w-full py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePhotoModal.photo_url}
              alt={activePhotoModal.description || 'Création'}
              className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          <div
            className="max-w-md mx-auto w-full space-y-3 pb-2 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {activePhotoModal.description && (
              <p className="text-xs sm:text-sm text-white font-medium">
                {activePhotoModal.description}
              </p>
            )}

            {contactPhone && (
              <a
                href={generateWhatsAppContactLink(
                  contactPhone,
                  couturier.nom_atelier,
                  activePhotoModal.description || 'Création de la vitrine'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold h-11 flex items-center justify-center gap-2 shadow-lg">
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>{locale === 'fr' ? 'Commander ce modèle sur WhatsApp' : 'Order this model on WhatsApp'}</span>
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Bouton « Contacter sur WhatsApp » Fixé en Bas sur Mobile ──── */}
      {contactPhone && (
        <div className="fixed bottom-0 inset-x-0 p-3 bg-white/95 backdrop-blur-md border-t border-sable/50 z-30 sm:hidden shadow-lg">
          <a href={whatsappGeneralUrl} target="_blank" rel="noopener noreferrer">
            <Button className="w-full rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold h-12 flex items-center justify-center gap-2 shadow-md">
              <WhatsAppIcon className="w-5 h-5 fill-current" />
              <span>{locale === 'fr' ? 'Contacter sur WhatsApp' : 'Contact on WhatsApp'}</span>
            </Button>
          </a>
        </div>
      )}

      {/* ── Pied discret « Créé avec Ourlette » (retiré en Pro) ───────── */}
      {!isPro && (
        <footer className="mt-12 text-center py-6 border-t border-sable/30 max-w-4xl mx-auto font-sans">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-sombre/70 hover:text-fonce font-bold">
            <Scissors className="w-3.5 h-3.5 text-accent" />
            <span>
              {locale === 'fr' ? 'Créé avec' : 'Created with'}{' '}
              <strong className="font-display font-extrabold text-accent">Ourlette.</strong>
            </span>
          </Link>
        </footer>
      )}

    </div>
  );
}
