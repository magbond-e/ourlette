import { AppSchema, Schema, Table, Column, ColumnType } from '@powersync/web';

/**
 * PowerSync Local Schema matching Supabase Data Model (data-model.md)
 */
export const clientsTable = new Table({
  couturier_id: new Column({ type: ColumnType.TEXT }),
  nom: new Column({ type: ColumnType.TEXT }),
  telephone: new Column({ type: ColumnType.TEXT }),
  email: new Column({ type: ColumnType.TEXT }),
  adresse: new Column({ type: ColumnType.TEXT }),
  notes: new Column({ type: ColumnType.TEXT }),
  date_creation: new Column({ type: ColumnType.TEXT }),
  updated_at: new Column({ type: ColumnType.TEXT }),
});

export const mesuresTable = new Table({
  client_id: new Column({ type: ColumnType.TEXT }),
  tour_poitrine: new Column({ type: ColumnType.INTEGER }),
  tour_taille: new Column({ type: ColumnType.INTEGER }),
  tour_hanches: new Column({ type: ColumnType.INTEGER }),
  longueur_manche: new Column({ type: ColumnType.INTEGER }),
  longueur_robe: new Column({ type: ColumnType.INTEGER }),
  tour_cou: new Column({ type: ColumnType.INTEGER }),
  largeur_epaules: new Column({ type: ColumnType.INTEGER }),
  champs_personnalises: new Column({ type: ColumnType.TEXT }), // JSON stringified
  prise_par: new Column({ type: ColumnType.TEXT }),
  date_maj: new Column({ type: ColumnType.TEXT }),
});

export const commandesTable = new Table({
  couturier_id: new Column({ type: ColumnType.TEXT }),
  client_id: new Column({ type: ColumnType.TEXT }),
  type_commande: new Column({ type: ColumnType.TEXT }),
  description: new Column({ type: ColumnType.TEXT }),
  tissu: new Column({ type: ColumnType.TEXT }),
  responsable: new Column({ type: ColumnType.TEXT }),
  prix_total: new Column({ type: ColumnType.INTEGER }),
  acompte: new Column({ type: ColumnType.INTEGER }),
  versements: new Column({ type: ColumnType.TEXT }), // JSON stringified
  statut: new Column({ type: ColumnType.TEXT }),
  date_commande: new Column({ type: ColumnType.TEXT }),
  date_livraison_prevue: new Column({ type: ColumnType.TEXT }),
  notes: new Column({ type: ColumnType.TEXT }),
  updated_at: new Column({ type: ColumnType.TEXT }),
});

export const AppDatabaseSchema = new Schema([
  clientsTable,
  mesuresTable,
  commandesTable,
]);

export type DatabaseSchema = typeof AppDatabaseSchema;
