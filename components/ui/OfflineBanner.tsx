'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Check } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export function OfflineBanner() {
  const { locale } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showSynced, setShowSynced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    let syncTimeout: NodeJS.Timeout | null = null;

    const handleOffline = () => {
      setIsOnline(false);
      setShowSynced(false);
      if (syncTimeout) clearTimeout(syncTimeout);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowSynced(true);
      syncTimeout = setTimeout(() => {
        setShowSynced(false);
      }, 2000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (syncTimeout) clearTimeout(syncTimeout);
    };
  }, []);

  // Rien à afficher si on est en ligne et que le flash "Synchronisé" est terminé
  if (isOnline && !showSynced) {
    return null;
  }

  return (
    <div
      role="status"
      className={`fixed top-16 inset-x-0 z-40 px-4 py-2 text-center text-xs font-bold transition-all duration-300 shadow-xs flex items-center justify-center gap-2 ${
        !isOnline
          ? 'bg-amber-500 text-sombre border-b border-amber-600/30'
          : 'bg-emerald-600 text-white border-b border-emerald-700/30 animate-fade-in'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>
            {locale === 'fr'
              ? 'Hors ligne — tes modifications sont enregistrées'
              : 'Offline — your changes are saved locally'}
          </span>
        </>
      ) : (
        <>
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{locale === 'fr' ? 'Synchronisé' : 'Synced'}</span>
        </>
      )}
    </div>
  );
}

export default OfflineBanner;
