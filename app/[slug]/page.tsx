'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Scissors, MapPin, Share2, Sparkles, Image as ImageIcon, PowerOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThreadSpoolLoader } from '@/components/ui/ThreadSpoolLoader';
import { DataService } from '@/lib/services/dataService';
import { Couturier, Realisation } from '@/lib/types/database';
import { generateWhatsAppContactLink, generateWhatsAppShareLink, formatDateFR } from '@/lib/utils/formatters';

const WhatsAppIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.419h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.445 4.43-9.874 9.876-9.874 2.637 0 5.116 1.028 6.98 2.893A9.816 9.816 0 0121.85 12.01c0 5.446-4.431 9.876-9.799 9.876m0-18.067c-6.647 0-12.04 5.394-12.04 12.04 0 2.12.553 4.188 1.605 6.012l-1.706 6.23 6.376-1.672a11.98 11.98 0 005.76 1.472h.005c6.645 0 12.038-5.393 12.038-12.041 0-3.218-1.254-6.242-3.533-8.521a11.942 11.942 0 00-8.505-3.52" />
  </svg>
);

export default function VitrinePubliquePage() {
  const params = useParams();
  const slugParam = params.slug as string;

  const [couturier, setCouturier] = useState<Couturier | null>(null);
  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVitrine = useCallback(async () => {
    if (!slugParam || slugParam.includes('.')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { couturier: c, realisations: reals } = await DataService.getPublicVitrine(slugParam);
    if (c) {
      setCouturier(c);
      setRealisations(reals);
    } else {
      setCouturier(null);
      setRealisations([]);
    }
    setLoading(false);
  }, [slugParam]);

  useEffect(() => {
    loadVitrine();
  }, [loadVitrine]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-sans">
        <ThreadSpoolLoader label="Chargement de la vitrine d'atelier…" size="lg" />
      </div>
    );
  }

  if (slugParam && slugParam.includes('.')) return null;

  const isVitrineDisabled = !couturier || couturier.vitrine_active === false || (couturier.vitrine_active as any) === 'false';

  const nomAtelierDisplay = couturier?.nom_atelier || `Atelier ${slugParam.replace('-', ' ')}`;

  const whatsappGeneralUrl = couturier ? generateWhatsAppContactLink(
    couturier.whatsapp_contact || couturier.telephone || '',
    couturier.nom_atelier
  ) : '#';

  const whatsappShareUrl = generateWhatsAppShareLink(nomAtelierDisplay, slugParam);
  const featuredImage = couturier?.cover_url || (realisations.length > 0 ? realisations[0].photo_url : null);

  // If Vitrine is Deactivated or Not Found
  if (isVitrineDisabled) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans">
        <header className="bg-sombre text-white py-3.5 px-4 shadow-md border-b border-gold/30 w-full">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Scissors className="w-4 h-4 text-gold" />
              <span className="font-display font-bold text-sm text-white">{nomAtelierDisplay}</span>
            </div>
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full font-bold">
              Vitrine Désactivée
            </span>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-sombre/10 text-sombre flex items-center justify-center mx-auto shadow-inner border border-sable/80">
            <PowerOff className="w-9 h-9 text-sombre/60" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold text-sombre">{nomAtelierDisplay}</h1>
            <p className="text-sm text-sombre/70 font-medium leading-relaxed">
              La vitrine publique de cet atelier est actuellement temporairement en pause ou indisponible.
            </p>
          </div>

          {couturier && (couturier.telephone || couturier.whatsapp_contact) && (
            <div className="pt-2">
              <a href={whatsappGeneralUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button
                  variant="success"
                  size="md"
                  fullWidth
                  className="gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md text-sm py-3 rounded-full"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current" />
                  <span>Contacter l'atelier sur WhatsApp</span>
                </Button>
              </a>
            </div>
          )}
        </main>

        <footer className="text-center py-6 border-t border-dashed border-sable max-w-4xl mx-auto font-sans">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-sombre/70 font-bold">
            <Scissors className="w-4 h-4 text-accent" />
            <span>Propulsé par <strong className="font-display font-extrabold text-accent">Ourlette.</strong></span>
          </Link>
        </footer>
      </div>
    );
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: couturier?.nom_atelier || nomAtelierDisplay,
    description: couturier?.bio || `Atelier de couture ${couturier?.nom_atelier} - Créations et retouches sur mesure`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: couturier?.ville || 'Ville',
      addressCountry: couturier?.pays || 'Pays',
    },
    ...(couturier?.logo_url ? { image: couturier.logo_url } : {}),
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-16 font-sans">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* Fixed Header Navigation */}
      <header className="bg-sombre text-white py-3.5 px-4 shadow-md fixed top-0 left-0 right-0 z-50 border-b border-gold/30 w-full">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {couturier.logo_url ? (
              <img src={couturier.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-gold" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-gold/40">
                <Scissors className="w-4 h-4 text-gold" />
              </div>
            )}
            <span className="font-display font-bold text-sm tracking-tight text-white">{couturier.nom_atelier}</span>
          </div>

          <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" title="Partager cette vitrine">
            <Button size="sm" variant="accent" className="text-xs py-1 px-3 min-h-[34px] font-bold gap-1 shadow-sm rounded-full">
              <Share2 className="w-3.5 h-3.5" />
              <span>Partager</span>
            </Button>
          </a>
        </div>
      </header>
      <div className="h-[57px] shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Hero Header */}
      <div className="relative bg-sombre text-white overflow-hidden border-b-2 border-accent/40">
        {featuredImage && (
          <div className="absolute inset-0 z-0 opacity-30">
            <img
              src={featuredImage}
              alt="Cover"
              className="w-full h-full object-cover blur-xs"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sombre via-sombre/80 to-transparent" />
          </div>
        )}

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 text-center space-y-4">
          {couturier.logo_url ? (
            <img
              src={couturier.logo_url}
              alt="Logo Atelier"
              className="w-24 h-24 rounded-full object-cover border-2 border-gold mx-auto shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-sombre border-2 border-gold text-white flex items-center justify-center text-4xl font-display font-black mx-auto shadow-xl">
              {couturier.nom_atelier.charAt(0)}
            </div>
          )}

          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white leading-tight">
              {couturier.nom_atelier}
            </h1>
            {(couturier.ville || couturier.pays) && (
              <p className="text-xs sm:text-sm font-bold text-gold flex items-center justify-center gap-1 mt-1 font-sans">
                <MapPin className="w-4 h-4 text-gold" />
                <span>
                  {couturier.ville}
                  {couturier.ville && couturier.pays ? ', ' : ''}
                  {couturier.pays}
                </span>
              </p>
            )}
          </div>

          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans font-medium max-w-md mx-auto">
            {couturier.bio || "Maison de couture sur-mesure & créations d'exception. Contactez l'atelier directement sur WhatsApp."}
          </p>

          <div className="pt-2 max-w-xs mx-auto">
            <a href={whatsappGeneralUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button
                variant="success"
                size="lg"
                fullWidth
                className="gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-lg text-sm py-3.5 rounded-full"
              >
                <WhatsAppIcon className="w-5 h-5 fill-current" />
                <span>Contacter sur WhatsApp</span>
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Main Gallery Section */}
      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase tracking-wider text-sombre flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <span>Réalisations & Modèles ({realisations.length})</span>
            </h2>
            <span className="text-xs font-bold text-accent font-sans bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
              Couture Sur-Mesure
            </span>
          </div>

          {realisations.length === 0 ? (
            <Card className="py-12 text-center text-xs text-sombre/60 border-dashed border-2 border-sable bg-white rounded-3xl">
              <ImageIcon className="w-10 h-10 mx-auto text-sombre/40 mb-2" />
              <p className="font-semibold">Aucune réalisation publiée pour l'instant.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {realisations.map((real) => {
                const modelWhatsappUrl = generateWhatsAppContactLink(
                  couturier.whatsapp_contact || couturier.telephone || '+2290140872836',
                  couturier.nom_atelier,
                  real.description || 'Création sur-mesure'
                );

                return (
                  <Card key={real.id} className="p-0 overflow-hidden border-sable/60 shadow-xs bg-white flex flex-col justify-between rounded-3xl hover:shadow-md transition-shadow">
                    <div>
                      <img
                        src={real.photo_url}
                        alt={real.description || 'Création couture'}
                        className="w-full h-64 object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="p-4 space-y-1.5">
                        <p className="text-sm font-bold font-sans text-sombre leading-snug">{real.description || 'Création sur-mesure'}</p>
                        {real.date_publication && (
                          <p className="text-xs text-sombre/60 font-medium font-sans">
                            Publié le {formatDateFR(real.date_publication)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <a href={modelWhatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <Button
                          variant="success"
                          size="md"
                          fullWidth
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm py-2.5 rounded-2xl"
                        >
                          <WhatsAppIcon className="w-4 h-4 fill-current" />
                          <span>Commander ce modèle</span>
                        </Button>
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center py-6 border-t border-dashed border-sable max-w-4xl mx-auto font-sans">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-sombre/70 hover:text-accent font-bold">
          <Scissors className="w-4 h-4 text-accent" />
          <span>Propulsé par <strong className="font-display font-extrabold text-accent">Ourlette.</strong></span>
        </Link>
      </footer>
    </div>
  );
}
