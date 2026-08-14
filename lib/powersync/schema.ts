/**
 * PowerSync Local Schema — Ourlette
 *
 * Miroir local des tables Supabase synchronisées via PowerSync.
 * PowerSync gère l'id (TEXT PRIMARY KEY) en interne — ne pas le redéclarer.
 * Seules les tables en lecture/écriture offline sont déclarées ici.
 * `realisations` est gérée par Supabase Storage directement (hors périmètre).
 */
import { Schema, Table, column } from '@powersync/web';

// ── clients ─────────────────────────────────────────────────────────────────
const clients = new Table({
  couturier_id: column.text,
  nom: column.text,
  telephone: column.text,
  email: column.text,
  adresse: column.text,
  notes: column.text,
  date_creation: column.text,
  updated_at: column.text,
});

// ── mesures ──────────────────────────────────────────────────────────────────
const mesures = new Table({
  client_id: column.text,
  tour_poitrine: column.real,
  tour_taille: column.real,
  tour_hanches: column.real,
  longueur_manche: column.real,
  longueur_robe: column.real,
  tour_cou: column.real,
  largeur_epaules: column.real,
  champs_personnalises: column.text,   // JSON stringifié
  prise_par: column.text,
  date_maj: column.text,
});

// ── commandes ────────────────────────────────────────────────────────────────
const commandes = new Table({
  couturier_id: column.text,
  client_id: column.text,
  type_commande: column.text,
  description: column.text,
  tissu: column.text,
  responsable: column.text,
  prix_total: column.real,
  acompte: column.real,
  versements: column.text,             // JSON stringifié (Versement[])
  statut: column.text,
  date_commande: column.text,
  date_livraison_prevue: column.text,
  notes: column.text,
  updated_at: column.text,
});

// ── Schéma global de l'app ───────────────────────────────────────────────────
export const AppSchema = new Schema({ clients, mesures, commandes });

export type Database = (typeof AppSchema)['types'];
