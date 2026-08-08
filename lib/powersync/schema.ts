/**
 * PowerSync / Local Schema Definition matching Supabase Data Model (data-model.md)
 */

export interface PowerSyncColumn {
  type: 'TEXT' | 'INTEGER' | 'REAL';
}

export interface PowerSyncTable {
  name: string;
  columns: Record<string, PowerSyncColumn>;
}

export const clientsTableSchema: PowerSyncTable = {
  name: 'clients',
  columns: {
    couturier_id: { type: 'TEXT' },
    nom: { type: 'TEXT' },
    telephone: { type: 'TEXT' },
    email: { type: 'TEXT' },
    adresse: { type: 'TEXT' },
    notes: { type: 'TEXT' },
    date_creation: { type: 'TEXT' },
    updated_at: { type: 'TEXT' },
  },
};

export const mesuresTableSchema: PowerSyncTable = {
  name: 'mesures',
  columns: {
    client_id: { type: 'TEXT' },
    tour_poitrine: { type: 'INTEGER' },
    tour_taille: { type: 'INTEGER' },
    tour_hanches: { type: 'INTEGER' },
    longueur_manche: { type: 'INTEGER' },
    longueur_robe: { type: 'INTEGER' },
    tour_cou: { type: 'INTEGER' },
    largeur_epaules: { type: 'INTEGER' },
    champs_personnalises: { type: 'TEXT' },
    prise_par: { type: 'TEXT' },
    date_maj: { type: 'TEXT' },
  },
};

export const commandesTableSchema: PowerSyncTable = {
  name: 'commandes',
  columns: {
    couturier_id: { type: 'TEXT' },
    client_id: { type: 'TEXT' },
    type_commande: { type: 'TEXT' },
    description: { type: 'TEXT' },
    tissu: { type: 'TEXT' },
    responsable: { type: 'TEXT' },
    prix_total: { type: 'INTEGER' },
    acompte: { type: 'INTEGER' },
    versements: { type: 'TEXT' },
    statut: { type: 'TEXT' },
    date_commande: { type: 'TEXT' },
    date_livraison_prevue: { type: 'TEXT' },
    notes: { type: 'TEXT' },
    updated_at: { type: 'TEXT' },
  },
};

export const AppDatabaseTables = [
  clientsTableSchema,
  mesuresTableSchema,
  commandesTableSchema,
];
