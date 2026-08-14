import React from 'react';
import Link from 'next/link';
import { WifiOff, Scissors, Users, Settings, RotateCcw } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mode Hors Ligne | Ourlette',
  description: 'Vous êtes actuellement hors-ligne. Accédez à vos commandes et clients sauvegardés localement.',
};

export default function OfflinePage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl border border-sable/40 shadow-couture p-6 sm:p-8 text-center">
        {/* Badge Icon */}
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5 text-accent shadow-inner">
          <WifiOff className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-serif font-bold text-sombre mb-2">
          Mode Hors Ligne
        </h1>
        
        <p className="text-sm text-sombre/70 mb-6 leading-relaxed">
          Aucune connexion Internet n’est détectée. Vous pouvez toujours consulter et modifier votre carnet d’atelier, vos commandes et vos clients en toute autonomie.
        </p>

        {/* Quick Links */}
        <div className="space-y-2.5 mb-6 text-left">
          <Link
            href="/commandes"
            className="flex items-center justify-between p-3.5 rounded-xl bg-clair-soft hover:bg-clair border border-sable/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-white text-accent shadow-xs group-hover:scale-105 transition-transform">
                <Scissors className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-sombre">Commandes en cours</p>
                <p className="text-xs text-sombre/60">Consulter et mettre à jour vos commandes</p>
              </div>
            </div>
            <span className="text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>

          <Link
            href="/clients"
            className="flex items-center justify-between p-3.5 rounded-xl bg-clair-soft hover:bg-clair border border-sable/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-white text-sombre shadow-xs group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-sombre">Clients & Mesures</p>
                <p className="text-xs text-sombre/60">Fiches clients et mensurations locales</p>
              </div>
            </div>
            <span className="text-xs font-bold text-sombre/70 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>

          <Link
            href="/parametres"
            className="flex items-center justify-between p-3.5 rounded-xl bg-clair-soft hover:bg-clair border border-sable/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-white text-sombre shadow-xs group-hover:scale-105 transition-transform">
                <Settings className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-sombre">Paramètres</p>
                <p className="text-xs text-sombre/60">Informations de votre atelier</p>
              </div>
            </div>
            <span className="text-xs font-bold text-sombre/70 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* Reload button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Réessayer la connexion
        </button>
      </div>
    </div>
  );
}
