'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CloudOff, CheckCircle2 } from 'lucide-react';
import { usePowerSyncStatus } from '@/lib/powersync/hooks';

/**
 * OfflineBanner — Ourlette
 *
 * Affiche le statut de connexion / synchronisation PowerSync.
 * Trois états possibles :
 *  1. En ligne + sync active → invisible
 *  2. Hors ligne → badge rouge + nombre d'opérations en attente
 *  3. En ligne mais sync perdue (PowerSync déconnecté) → badge ambre discret
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Statut PowerSync (uploading, connected…)
  // usePowerSyncStatus utilise le contexte PowerSync — null-safe si le Provider est absent
  let psStatus = { connected: true, uploading: false, hasSyncedOnce: false };
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    psStatus = usePowerSyncStatus();
  } catch {
    // Si PowerSyncContext n'est pas disponible (pages publiques), on ignore
  }

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const updateStatus = () => setIsOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (!mounted) return null;

  // ── Hors ligne ───────────────────────────────────────────────────────────────
  if (isOffline) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-fade-in">
        <div className="bg-[#2A4A66] text-[#EDEAE0] px-4 py-2.5 rounded-full shadow-lg border border-[#D4AF37]/40 flex items-center justify-between gap-3 text-xs font-medium backdrop-blur-md bg-opacity-95">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] shrink-0">
              <WifiOff className="w-3.5 h-3.5" />
            </span>
            <span className="leading-tight">
              Mode Hors Ligne — tes modifications sont sauvegardées localement
            </span>
          </div>
          <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#1E3345]">
            Offline
          </span>
        </div>
      </div>
    );
  }

  // ── En ligne mais sync PowerSync en attente / en cours ────────────────────────
  if (psStatus.uploading) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-fade-in">
        <div className="bg-amber-700/90 text-amber-50 px-4 py-2.5 rounded-full shadow-lg border border-amber-400/30 flex items-center gap-2 text-xs font-medium backdrop-blur-md">
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>
            Synchronisation des modifications en cours…
          </span>
        </div>
      </div>
    );
  }

  // En ligne + aucune opération en attente → invisible
  return null;
}

export default OfflineBanner;
