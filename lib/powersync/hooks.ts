'use client';

/**
 * PowerSync Hooks — Ourlette
 *
 * Hooks réactifs pour lire les données locales en temps réel.
 * Synchronisation à 0ms via localStorage/DataService avec enrichissement SQLite PowerSync.
 */
import { useEffect, useState } from 'react';
import { useQuery, useStatus } from '@powersync/react';
import { Commande, Client, Mesure } from '../types/database';

function getCachedUserId(explicitUserId?: string): string | undefined {
  if (explicitUserId) return explicitUserId;
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('ourlette_cached_couturier');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return parsed.id;
    }
  } catch {}
  return undefined;
}

// ── useCommandes ─────────────────────────────────────────────────────────────

/**
 * Retourne la liste réactive des commandes du couturier connecté.
 * Synchronisation instantanée 0ms depuis le stockage local avec mise à jour SQLite.
 */
export function useCommandes(userId: string | undefined): Commande[] {
  const effectiveUserId = getCachedUserId(userId);

  const { data: results } = useQuery<any>(
    effectiveUserId
      ? `SELECT
          c.*,
          cl.nom      AS client_nom,
          cl.telephone AS client_telephone
         FROM commandes c
         LEFT JOIN clients cl ON cl.id = c.client_id
         WHERE c.couturier_id = ?
         ORDER BY c.date_commande DESC`
      : 'SELECT * FROM commandes WHERE 0',
    effectiveUserId ? [effectiveUserId] : []
  );

  const [localFallback, setLocalFallback] = useState<Commande[]>(() => {
    if (!effectiveUserId || typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`ourlette_${effectiveUserId}_commandes`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!effectiveUserId || typeof window === 'undefined') return;

    const reloadLocal = () => {
      try {
        const raw = localStorage.getItem(`ourlette_${effectiveUserId}_commandes`);
        if (raw) {
          setLocalFallback(JSON.parse(raw));
        }
      } catch {}
    };

    reloadLocal();

    const handleDataChange = (e: any) => {
      if (!e.detail || e.detail.type === 'commandes' || e.detail.type === 'all') {
        reloadLocal();
      }
    };

    window.addEventListener('ourlette_data_change', handleDataChange);
    window.addEventListener('storage', handleDataChange);

    return () => {
      window.removeEventListener('ourlette_data_change', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [effectiveUserId, results]);

  if (results && results.length > 0) {
    return results.map((row: any) => ({
      ...row,
      prix_total: Number(row.prix_total) || 0,
      acompte: Number(row.acompte) || 0,
      versements: row.versements ? tryParseJson(row.versements, []) : [],
      client_nom: row.client_nom || 'Client inconnu',
      client_telephone: row.client_telephone || '',
    })) as Commande[];
  }

  return localFallback;
}

// ── useClients ───────────────────────────────────────────────────────────────

/**
 * Retourne la liste réactive des clients du couturier connecté.
 * Synchronisation instantanée 0ms depuis le stockage local avec mise à jour SQLite.
 */
export function useClients(userId: string | undefined): Client[] {
  const effectiveUserId = getCachedUserId(userId);

  const { data: results } = useQuery<any>(
    effectiveUserId
      ? `SELECT * FROM clients WHERE couturier_id = ? ORDER BY date_creation DESC`
      : 'SELECT * FROM clients WHERE 0',
    effectiveUserId ? [effectiveUserId] : []
  );

  const [localFallback, setLocalFallback] = useState<Client[]>(() => {
    if (!effectiveUserId || typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`ourlette_${effectiveUserId}_clients`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!effectiveUserId || typeof window === 'undefined') return;

    const reloadLocal = () => {
      try {
        const raw = localStorage.getItem(`ourlette_${effectiveUserId}_clients`);
        if (raw) {
          setLocalFallback(JSON.parse(raw));
        }
      } catch {}
    };

    reloadLocal();

    const handleDataChange = (e: any) => {
      if (!e.detail || e.detail.type === 'clients' || e.detail.type === 'all') {
        reloadLocal();
      }
    };

    window.addEventListener('ourlette_data_change', handleDataChange);
    window.addEventListener('storage', handleDataChange);

    return () => {
      window.removeEventListener('ourlette_data_change', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [effectiveUserId, results]);

  if (results && results.length > 0) {
    return results as Client[];
  }

  return localFallback;
}

// ── useMesureByClientId ───────────────────────────────────────────────────────

/**
 * Retourne la mesure la plus récente pour un client donné.
 */
export function useMesureByClientId(clientId: string | undefined): Mesure | null {
  const { data: results } = useQuery<any>(
    clientId
      ? `SELECT * FROM mesures WHERE client_id = ? ORDER BY date_maj DESC LIMIT 1`
      : 'SELECT * FROM mesures WHERE 0',
    clientId ? [clientId] : []
  );

  const [localFallback, setLocalFallback] = useState<Mesure | null>(() => {
    if (!clientId || typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`ourlette_mesure_${clientId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!clientId || typeof window === 'undefined') return;

    const reloadLocal = () => {
      try {
        const raw = localStorage.getItem(`ourlette_mesure_${clientId}`);
        if (raw) setLocalFallback(JSON.parse(raw));
      } catch {}
    };

    reloadLocal();

    const handleDataChange = (e: any) => {
      if (!e.detail || e.detail.type === 'mesures' || e.detail.type === 'all') {
        reloadLocal();
      }
    };

    window.addEventListener('ourlette_data_change', handleDataChange);
    window.addEventListener('storage', handleDataChange);

    return () => {
      window.removeEventListener('ourlette_data_change', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [clientId, results]);

  if (results && results.length > 0) {
    const row = results[0];
    return {
      ...row,
      champs_personnalises: row.champs_personnalises
        ? tryParseJson(row.champs_personnalises, {})
        : {},
    } as Mesure;
  }

  return localFallback;
}

// ── usePowerSyncStatus ────────────────────────────────────────────────────────

/**
 * Expose l'état de synchronisation sans jamais lever d'exception.
 */
export function usePowerSyncStatus() {
  try {
    const status = useStatus();
    return {
      connected: status?.connected ?? false,
      hasSyncedOnce: status?.hasSynced ?? false,
      uploading: status?.uploading ?? false,
      downloading: status?.downloading ?? false,
      dataFlowStatus: status?.dataFlowStatus,
    };
  } catch {
    return {
      connected: false,
      hasSyncedOnce: false,
      uploading: false,
      downloading: false,
      dataFlowStatus: undefined,
    };
  }
}

// ── Utilitaire ────────────────────────────────────────────────────────────────

function tryParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
