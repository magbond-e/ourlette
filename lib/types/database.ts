export type StatutCommande = 'recue' | 'en_cours' | 'essayage' | 'prete' | 'livree';
export type TypeCommande = 'couture_complete' | 'retouche';

export interface Couturier {
  id: string;
  nom: string;
  nom_atelier: string;
  email?: string;
  telephone?: string;
  ville?: string;
  pays?: string;
  langue: string;
  plan: 'free' | 'pro';
  slug_vitrine: string;
  logo_url?: string;
  cover_url?: string;
  date_creation: string;
}

export interface Client {
  id: string;
  couturier_id: string;
  nom: string;
  telephone?: string;
  notes?: string;
  date_creation: string;
}

export interface Mesure {
  id: string;
  client_id: string;
  tour_poitrine?: number | null;
  tour_taille?: number | null;
  tour_hanches?: number | null;
  longueur_manche?: number | null;
  longueur_robe?: number | null;
  tour_cou?: number | null;
  largeur_epaules?: number | null;
  champs_personnalises: Record<string, number | string>;
  prise_par?: string;
  date_maj: string;
}

export interface Versement {
  id: string;
  montant: number;
  date: string;
  note?: string;
}

export interface Commande {
  id: string;
  couturier_id: string;
  client_id: string;
  client_nom?: string; // Hydrated for UI
  client_telephone?: string; // Hydrated for UI
  type_commande: TypeCommande;
  description: string;
  tissu?: string;
  responsable?: string;
  prix_total: number;
  acompte: number;
  versements?: Versement[];
  statut: StatutCommande;
  date_commande: string;
  date_livraison_prevue: string;
}

export interface Realisation {
  id: string;
  couturier_id: string;
  photo_url: string;
  description?: string;
  commande_id?: string;
  date_publication: string;
}
