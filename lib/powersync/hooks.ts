'use client';

/**
 * PowerSync Hooks — Ourlette
 *
 * Hooks réactifs pour lire les données locales en temps réel.
 * Utilisent usePowerSyncQuery (@powersync/react) qui émet une nouvelle valeur
 * à chaque fois que la table locale change (insert/update/delete ou sync entrant).
 *
 * Les écritures passent par DataService (qui écrit en local SQLite + queue Supabase)
 * ou directement via db.execute() pour les mutations atomiques.
 */
import { useQuery, useStatus } from '@powersync/react';
import { Commande, Client, Mesure } from '../types/database';

// ── useCommandes ─────────────────────────────────────────────────────────────

/**
 * Retourne la liste réactive des commandes du couturier connecté.
 * Enrichit chaque commande avec client_nom / client_telephone depuis la table locale `clients`.
 */
export function useCommandes(userId: string | undefined): Commande[] {
  const { data: results } = useQuery<any>(
    userId
      ? `SELECT
          c.*,
          cl.nom      AS client_nom,
          cl.telephone AS client_telephone
         FROM commandes c
         LEFT JOIN clients cl ON cl.id = c.client_id
         WHERE c.couturier_id = ?
         ORDER BY c.date_commande DESC`
      : 'SELECT * FROM commandes WHERE 0', // Query vide si pas d'userId
    userId ? [userId] : []
  );

  return (results ?? []).map((row: any) => ({
    ...row,
    prix_total: row.prix_total ?? 0,
    acompte: row.acompte ?? 0,
    versements: row.versements ? tryParseJson(row.versements, []) : [],
    client_nom: row.client_nom || 'Client inconnu',
    client_telephone: row.client_telephone || '',
  })) as Commande[];
}

// ── useClients ───────────────────────────────────────────────────────────────

/**
 * Retourne la liste réactive des clients du couturier connecté.
 */
export function useClients(userId: string | undefined): Client[] {
  const { data: results } = useQuery<any>(
    userId
      ? `SELECT * FROM clients WHERE couturier_id = ? ORDER BY date_creation DESC`
      : 'SELECT * FROM clients WHERE 0',
    userId ? [userId] : []
  );

  return (results ?? []) as Client[];
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

  if (!results || results.length === 0) return null;

  const row = results[0];
  return {
    ...row,
    champs_personnalises: row.champs_personnalises
      ? tryParseJson(row.champs_personnalises, {})
      : {},
  } as Mesure;
}

// ── usePowerSyncStatus ────────────────────────────────────────────────────────

/**
 * Expose l'état de la synchronisation PowerSync :
 * - connected : connexion active au service de sync
 * - hasSyncedOnce : au moins un cycle de sync complété
 * - uploading : opérations locales en attente d'être envoyées
 */
export function usePowerSyncStatus() {
  const status = useStatus();

  return {
    connected: status?.connected ?? false,
    hasSyncedOnce: status?.hasSynced ?? false,
    uploading: status?.uploading ?? false,
    downloading: status?.downloading ?? false,
    dataFlowStatus: status?.dataFlowStatus,
  };
}

// ── Utilitaire ────────────────────────────────────────────────────────────────

function tryParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
