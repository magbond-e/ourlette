'use client';

/**
 * PowerSync Client — Ourlette
 *
 * Instancie PowerSyncDatabase avec le schéma local et le connecteur Supabase.
 * Le connecteur gère :
 *   - fetchCredentials : récupère le token JWT Supabase pour s'authentifier auprès de PowerSync
 *   - uploadData       : reçoit les opérations locales en attente et les envoie à Supabase
 */
import {
  PowerSyncDatabase,
  PowerSyncBackendConnector,
  CrudEntry,
  UpdateType,
} from '@powersync/web';
import { createClient } from '../supabase/client';
import { AppSchema } from './schema';

// ── Connecteur Supabase ──────────────────────────────────────────────────────

export class SupabasePowerSyncConnector implements PowerSyncBackendConnector {
  private powersyncUrl: string;

  constructor() {
    this.powersyncUrl = process.env.NEXT_PUBLIC_POWERSYNC_URL || '';
  }

  /**
   * fetchCredentials — appelé par PowerSync pour obtenir les credentials de sync.
   * Retourne l'URL PowerSync + le JWT de la session Supabase en cours.
   */
  async fetchCredentials() {
    const supabase = createClient();
    if (!supabase || !this.powersyncUrl) return null;

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      console.warn('[PowerSync] Impossible de récupérer la session Supabase:', error?.message);
      return null;
    }

    return {
      endpoint: this.powersyncUrl,
      token: session.access_token,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined,
    };
  }

  /**
   * uploadData — appelé par PowerSync dès qu'une écriture locale est en attente.
   * Traite chaque opération CRUD et l'envoie à Supabase via supabase-js.
   */
  async uploadData(database: PowerSyncDatabase): Promise<void> {
    const supabase = createClient();
    if (!supabase) return;

    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        await this.processOperation(supabase, op);
      }
      await transaction.complete();
    } catch (e) {
      console.error('[PowerSync] Erreur uploadData:', e);
      // Ne pas appeler transaction.complete() — PowerSync réessaiera automatiquement
    }
  }

  private async processOperation(supabase: ReturnType<typeof createClient>, op: CrudEntry) {
    if (!supabase) return;
    const { table, op: opType, id, opData } = op;

    // Supprimer les champs calculés côté client non présents dans Supabase
    const cleanData = { ...opData };
    delete (cleanData as any).client_nom;
    delete (cleanData as any).client_telephone;

    switch (opType) {
      case UpdateType.PUT:
        await supabase.from(table).upsert({ id, ...cleanData });
        break;
      case UpdateType.PATCH:
        await supabase
          .from(table)
          .update({ ...cleanData, updated_at: new Date().toISOString() })
          .eq('id', id);
        break;
      case UpdateType.DELETE:
        await supabase.from(table).delete().eq('id', id);
        break;
    }
  }
}

// ── Singleton — base de données locale ───────────────────────────────────────

let _db: PowerSyncDatabase | null = null;

export function getPowerSyncDb(): PowerSyncDatabase {
  if (!_db) {
    _db = new PowerSyncDatabase({
      schema: AppSchema,
      database: {
        dbFilename: 'ourlette.db',
      },
    });
  }
  return _db;
}

export const powerSyncConnector = new SupabasePowerSyncConnector();
