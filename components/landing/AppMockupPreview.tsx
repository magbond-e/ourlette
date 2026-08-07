'use client';

import React, { useState } from 'react';
import { ClipboardList, Ruler, Store, CheckCircle, Clock, AlertTriangle, Eye, Phone, ChevronRight, Search, Plus, Settings } from 'lucide-react';

export const AppMockupPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'commandes' | 'mesures' | 'vitrine'>('commandes');

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. DESKTOP PREVIEW FRAME (Visible on md+ screens)                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-3xl overflow-hidden shadow-2xl border border-sable/80 bg-white">
        {/* Browser Top Chrome Header */}
        <div className="bg-sombre px-4 py-3 flex items-center justify-between border-b border-accent/20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/90"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/90"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/90"></div>
          </div>
          <div className="bg-white/10 px-4 py-1 rounded-full text-xs font-mono text-white/80 flex items-center gap-1.5 border border-white/10">
            <span className="text-gold">🔒</span>
            <span>ourlette.app/atelier-adia</span>
          </div>
          <div className="text-xs text-gold/80 font-bold px-2 py-0.5 rounded bg-white/10">Aperçu Ordinateur</div>
        </div>

        {/* Tab Selectors inside Desktop Mockup */}
        <div className="bg-clair/50 px-6 py-3 border-b border-sable/60 flex items-center justify-start gap-3">
          <button
            onClick={() => setActiveTab('commandes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'commandes'
              ? 'bg-accent text-white shadow-md'
              : 'bg-white text-sombre/80 hover:bg-white/80 hover:text-accent border border-sable/40'
              }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Carnet de Commandes</span>
          </button>
          <button
            onClick={() => setActiveTab('mesures')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'mesures'
              ? 'bg-accent text-white shadow-md'
              : 'bg-white text-sombre/80 hover:bg-white/80 hover:text-accent border border-sable/40'
              }`}
          >
            <Ruler className="w-4 h-4" />
            <span>Fiches Mesures</span>
          </button>
          <button
            onClick={() => setActiveTab('vitrine')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'vitrine'
              ? 'bg-accent text-white shadow-md'
              : 'bg-white text-sombre/80 hover:bg-white/80 hover:text-accent border border-sable/40'
              }`}
          >
            <Store className="w-4 h-4" />
            <span>Vitrine Publique</span>
          </button>
        </div>

        {/* Desktop Active Content Window */}
        <div className="p-6 bg-[#FAFAF8] min-h-[420px] flex flex-col justify-between">
          {activeTab === 'commandes' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Summary Stats Grid Desktop */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-sable/60 shadow-xs">
                  <p className="text-xs font-bold text-sombre/60 uppercase tracking-wider">Commandes Actives</p>
                  <p className="text-2xl font-display font-bold text-sombre mt-1">12 tenues</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-sable/60 shadow-xs">
                  <p className="text-xs font-bold text-sombre/60 uppercase tracking-wider">Montant à Encaisser</p>
                  <p className="text-2xl font-display font-bold text-vertbouton mt-1">185 000 FCFA</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-sable/60 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-sombre/60 uppercase tracking-wider">Livraisons cette semaine</p>
                    <p className="text-2xl font-display font-bold text-accent mt-1">4 livraisons</p>
                  </div>
                  <span className="text-3xl">🧵</span>
                </div>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-sombre/40" />
                <input
                  type="text"
                  readOnly
                  value="Recherche par nom de client, tissu, modèle..."
                  className="w-full bg-white border border-sable/60 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-sombre/50 cursor-pointer shadow-xs focus:outline-none"
                />
              </div>

              {/* Desktop Orders Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-sable/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-display font-bold text-base text-sombre">Aminata Koné</h5>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      Essayage
                    </span>
                  </div>
                  <p className="text-xs text-sombre/70 font-medium">Bazin Riche 3 pièces · Tissu fourni par la cliente</p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-sable/40">
                    <span className="text-sombre/60 font-semibold">Livraison: 12 Août</span>
                    <span className="font-extrabold text-vertbouton">Reste: 25 000 F</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-sable/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-display font-bold text-base text-sombre">Ulrich Magbonde</h5>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Prête
                    </span>
                  </div>
                  <p className="text-xs text-sombre/70 font-medium">Costume Mariage Wax Brodé · 2 pièces</p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-sable/40">
                    <span className="text-sombre/60 font-semibold">Livraison: 8 Août</span>
                    <span className="font-extrabold text-emerald-700">Soldé 100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mesures' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white p-5 rounded-2xl border border-sable/60 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-sable/40 pb-3">
                  <div>
                    <h5 className="text-lg font-display font-bold text-sombre">Fiche Mesures : Aminata Koné</h5>
                    <p className="text-xs text-sombre/70">Téléphone: +225 07 08 09 10 11 · Pris par Adia</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-accent/10 text-accent rounded-full border border-accent/20">
                    Fiche Complète
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-[#FAFAF8] p-3 rounded-xl border border-sable/40 text-center">
                    <span className="text-xs text-sombre/70 font-bold uppercase block">Poitrine</span>
                    <span className="text-lg font-bold text-sombre">98 cm</span>
                  </div>
                  <div className="bg-[#FAFAF8] p-3 rounded-xl border border-sable/40 text-center">
                    <span className="text-xs text-sombre/70 font-bold uppercase block">Taille</span>
                    <span className="text-lg font-bold text-sombre">76 cm</span>
                  </div>
                  <div className="bg-[#FAFAF8] p-3 rounded-xl border border-sable/40 text-center">
                    <span className="text-xs text-sombre/70 font-bold uppercase block">Hanches</span>
                    <span className="text-lg font-bold text-sombre">104 cm</span>
                  </div>
                  <div className="bg-[#FAFAF8] p-3 rounded-xl border border-sable/40 text-center">
                    <span className="text-xs text-sombre/70 font-bold uppercase block">Long. Robe</span>
                    <span className="text-lg font-bold text-sombre">145 cm</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vitrine' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white p-5 rounded-2xl border border-sable/60 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-sable/40 pb-3">
                  <div>
                    <h5 className="text-lg font-display font-bold text-sombre">Atelier Adia Haute Couture</h5>
                    <p className="text-xs text-sombre/70">Abidjan, Côte d'Ivoire · Vitrine en ligne active</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                    <Eye className="w-3.5 h-3.5" /> Lien WhatsApp Actif
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="aspect-video bg-sombre/5 rounded-xl border border-sable/40 flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-2xl">👗</span>
                    <span className="text-xs font-bold text-sombre mt-1">Robe Gala Bazin</span>
                  </div>
                  <div className="aspect-video bg-sombre/5 rounded-xl border border-sable/40 flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-2xl">👔</span>
                    <span className="text-xs font-bold text-sombre mt-1">Ensemble Brodé</span>
                  </div>
                  <div className="aspect-video bg-sombre/5 rounded-xl border border-sable/40 flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-2xl">✨</span>
                    <span className="text-xs font-bold text-sombre mt-1">Tenue Mariage</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. MOBILE PREVIEW FRAME (Visible on phone / sm screens)            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="block md:hidden max-w-sm mx-auto">
        <div className="rounded-[2.5rem] p-3.5 bg-sombre shadow-2xl border-4 border-sombre relative">
          {/* Smartphone Speaker Island Notch */}
          <div className="w-28 h-4 bg-sombre rounded-b-xl mx-auto mb-2 flex items-center justify-center">
            <div className="w-8 h-1 bg-white/20 rounded-full"></div>
          </div>

          {/* Smartphone Inside Screen */}
          <div className="bg-[#FAFAF8] rounded-[1.8rem] overflow-hidden min-h-[500px] flex flex-col justify-between border border-sable/40 relative">
            {/* Smartphone Top Header Bar */}
            <div className="bg-white px-4 py-3 border-b border-sable/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-accent text-white font-bold flex items-center justify-center text-xs">
                  ✂️
                </div>
                <span className="font-display font-bold text-sm text-sombre">Ourlette<span className="text-gold">.</span></span>
              </div>
              <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                Mobile
              </span>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="bg-white/80 px-2 py-2 border-b border-sable/40 flex items-center justify-around text-xs">
              <button
                onClick={() => setActiveTab('commandes')}
                className={`px-3 py-1 rounded-full font-bold transition-all text-[11px] ${activeTab === 'commandes' ? 'bg-accent text-white' : 'text-sombre/70'
                  }`}
              >
                Commandes
              </button>
              <button
                onClick={() => setActiveTab('mesures')}
                className={`px-3 py-1 rounded-full font-bold transition-all text-[11px] ${activeTab === 'mesures' ? 'bg-accent text-white' : 'text-sombre/70'
                  }`}
              >
                Mesures
              </button>
              <button
                onClick={() => setActiveTab('vitrine')}
                className={`px-3 py-1 rounded-full font-bold transition-all text-[11px] ${activeTab === 'vitrine' ? 'bg-accent text-white' : 'text-sombre/70'
                  }`}
              >
                Vitrine
              </button>
            </div>

            {/* Smartphone Content Body */}
            <div className="p-3.5 space-y-3 flex-1 overflow-y-auto pb-16">
              {activeTab === 'commandes' && (
                <>
                  {/* Mobile Summary Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2.5 rounded-2xl border border-sable/60 shadow-xs">
                      <p className="text-[10px] font-bold text-sombre/60 uppercase">Actives</p>
                      <p className="text-base font-display font-bold text-sombre">12 tenues</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-2xl border border-sable/60 shadow-xs">
                      <p className="text-[10px] font-bold text-sombre/60 uppercase">À encaisser</p>
                      <p className="text-xs sm:text-sm font-display font-bold text-vertbouton truncate">185 000 F</p>
                    </div>
                  </div>

                  {/* Orders List Mobile */}
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded-2xl border border-sable/60 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h6 className="font-bold text-xs text-sombre">Aminata Koné</h6>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Essayage
                        </span>
                      </div>
                      <p className="text-[10px] text-sombre/70">Bazin 3 pièces · Livr: 12 Août</p>
                      <div className="flex justify-between items-center text-[10px] pt-1 border-t border-sable/30">
                        <span className="text-sombre/60">Tissu client</span>
                        <span className="font-bold text-vertbouton">Reste: 25 000 F</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-sable/60 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h6 className="font-bold text-xs text-sombre">Ulrich Magbonde</h6>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Prête
                        </span>
                      </div>
                      <p className="text-[10px] text-sombre/70">Costume Mariage Wax</p>
                      <div className="flex justify-between items-center text-[10px] pt-1 border-t border-sable/30">
                        <span className="text-sombre/60">Livr: 8 Août</span>
                        <span className="font-bold text-emerald-700">Soldé ✓</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'mesures' && (
                <div className="bg-white p-3 rounded-2xl border border-sable/60 shadow-xs space-y-2">
                  <h6 className="font-bold text-xs text-sombre">Fiche Mesures : Aminata</h6>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="bg-[#FAFAF8] p-2 rounded-xl text-center border border-sable/30">
                      <span className="text-[9px] text-sombre/60 block font-bold">Poitrine</span>
                      <strong className="text-sombre">98 cm</strong>
                    </div>
                    <div className="bg-[#FAFAF8] p-2 rounded-xl text-center border border-sable/30">
                      <span className="text-[9px] text-sombre/60 block font-bold">Taille</span>
                      <strong className="text-sombre">76 cm</strong>
                    </div>
                    <div className="bg-[#FAFAF8] p-2 rounded-xl text-center border border-sable/30">
                      <span className="text-[9px] text-sombre/60 block font-bold">Hanches</span>
                      <strong className="text-sombre">104 cm</strong>
                    </div>
                    <div className="bg-[#FAFAF8] p-2 rounded-xl text-center border border-sable/30">
                      <span className="text-[9px] text-sombre/60 block font-bold">Robe</span>
                      <strong className="text-sombre">145 cm</strong>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'vitrine' && (
                <div className="bg-white p-3 rounded-2xl border border-sable/60 shadow-xs space-y-2 text-center">
                  <h6 className="font-bold text-xs text-sombre">Atelier Adia</h6>
                  <p className="text-[10px] text-sombre/70">Vitrine publique avec lien WhatsApp</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="aspect-square bg-sombre/5 rounded-xl flex items-center justify-center text-xl">
                      👗
                    </div>
                    <div className="aspect-square bg-sombre/5 rounded-xl flex items-center justify-center text-xl">
                      👔
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Action Button ON MOBILE MOCKUP (Safely placed above bottom nav) */}
            <div className="absolute bottom-14 right-3 z-20">
              <div className="bg-accent text-white px-3 py-2 rounded-full shadow-lg text-[10px] font-extrabold flex items-center gap-1 border border-white">
                <Plus className="w-3 h-3" />
                <span>Commande</span>
              </div>
            </div>

            {/* Smartphone Bottom Navigation Bar */}
            <div className="bg-white/95 backdrop-blur-md border-t border-sable/80 px-2 py-2 flex items-center justify-around text-[10px] font-bold text-sombre z-10">
              <div className="flex flex-col items-center text-accent">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Commandes</span>
              </div>
              <div className="flex flex-col items-center text-sombre/50">
                <Ruler className="w-3.5 h-3.5" />
                <span>Clients</span>
              </div>
              <div className="flex flex-col items-center text-sombre/50">
                <Store className="w-3.5 h-3.5" />
                <span>Vitrine</span>
              </div>
              <div className="flex flex-col items-center text-sombre/50">
                <Settings className="w-3.5 h-3.5" />
                <span>Paramètres</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
