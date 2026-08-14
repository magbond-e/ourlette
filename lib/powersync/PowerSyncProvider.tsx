'use client';

/**
 * PowerSyncProvider — Ourlette
 *
 * Initialise la base locale PowerSync, se connecte au service de sync dès que
 * l'utilisateur est authentifié, et expose la DB via le contexte React de @powersync/react.
 *
 * À placer autour du contenu du dashboard uniquement (les pages publiques n'en ont pas besoin).
 */
import React, { useEffect, useRef, useState } from 'react';
import { PowerSyncContext } from '@powersync/react';
import { getPowerSyncDb, powerSyncConnector } from './client';

interface PowerSyncProviderProps {
  children: React.ReactNode;
}

export function PowerSyncProvider({ children }: PowerSyncProviderProps) {
  const db = getPowerSyncDb();
  const [ready, setReady] = useState(false);
  const connected = useRef(false);

  useEffect(() => {
    if (connected.current) return;
    connected.current = true;

    const powersyncUrl = process.env.NEXT_PUBLIC_POWERSYNC_URL;

    (async () => {
      try {
        await db.init();
        if (powersyncUrl && !powersyncUrl.includes('YOUR_INSTANCE')) {
          await db.connect(powerSyncConnector);
          console.info('[PowerSync] ✅ Connecté et en synchronisation.');
        } else {
          console.warn(
            '[PowerSync] NEXT_PUBLIC_POWERSYNC_URL non configuré — sync cloud désactivé, base locale SQLite active.'
          );
        }
      } catch (e) {
        console.warn('[PowerSync] Initialisation / Connexion échouée (mode hors ligne ?) :', e);
      } finally {
        setReady(true);
      }
    })();

    return () => {
      // Nettoyage : déconnecte proprement quand le composant est démonté
      db.disconnect().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On rend les enfants même si pas encore ready — ils liront depuis le cache local SQLite
  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}
