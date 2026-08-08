'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showRestored) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 bg-emerald-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top-2 duration-200">
        <Wifi className="w-4 h-4 animate-pulse" />
        <span>Connexion rétablie — Vos modifications sont synchronisées avec le serveur.</span>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-sombre text-amber-300 border-b border-amber-500/40 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-md font-sans">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Mode Hors Ligne — Vos commandes et mesures sont enregistrées localement et seront synchronisées au retour du réseau.</span>
    </div>
  );
};
