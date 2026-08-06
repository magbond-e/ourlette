import { Couturier, Client, Mesure, Commande, Realisation, StatutCommande } from '../types/database';
import { SupabaseService } from './supabaseService';

const INITIAL_COUTURIER: Couturier = {
  id: 'couturier-1',
  nom: 'Adia Sylla',
  nom_atelier: 'Atelier Adia Couture',
  email: 'adia.couture@example.com',
  telephone: '+221 77 123 45 67',
  ville: 'Dakar',
  pays: 'Sénégal',
  langue: 'fr',
  plan: 'free',
  slug_vitrine: 'atelier-adia',
  date_creation: new Date().toISOString(),
};

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client-1',
    couturier_id: 'couturier-1',
    nom: 'Aïssatou Diop',
    telephone: '+221 77 987 65 43',
    notes: 'Préfère les tissus légers et les coupes ajustées',
    date_creation: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'client-2',
    couturier_id: 'couturier-1',
    nom: 'Moussa Ndiaye',
    telephone: '+221 70 456 78 90',
    notes: 'Habitué des boubous traditionnels pour cérémonies',
    date_creation: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'client-3',
    couturier_id: 'couturier-1',
    nom: 'Fatou Binetou',
    telephone: '+221 76 321 09 87',
    notes: 'Commande fréquente de robes de soirée',
    date_creation: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_MESURES: Record<string, Mesure> = {
  'client-1': {
    id: 'mesure-1',
    client_id: 'client-1',
    tour_poitrine: 92,
    tour_taille: 74,
    tour_hanches: 102,
    longueur_manche: 60,
    longueur_robe: 140,
    tour_cou: 38,
    largeur_epaules: 40,
    champs_personnalises: {
      'Tour de poignet': 17,
      'Hauteur taille-sol': 105,
    },
    prise_par: 'Adia',
    date_maj: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
  'client-2': {
    id: 'mesure-2',
    client_id: 'client-2',
    tour_poitrine: 108,
    tour_taille: 96,
    tour_hanches: 110,
    longueur_manche: 65,
    longueur_robe: 155,
    tour_cou: 42,
    largeur_epaules: 46,
    champs_personnalises: {
      'Longueur boubou': 150,
    },
    prise_par: 'Oumar (Apprenti)',
    date_maj: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
};

// Helper for dates in YYYY-MM-DD
function getFutureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getPastDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

const INITIAL_COMMANDES: Commande[] = [
  {
    id: 'cmd-1',
    couturier_id: 'couturier-1',
    client_id: 'client-1',
    type_commande: 'couture_complete',
    description: 'Robe de mariée 3 pièces brodée avec traîne',
    tissu: 'Bazin riche violet indigo & dentelle dorée',
    responsable: 'Adia',
    prix_total: 85000,
    acompte: 50000,
    versements: [
      { id: 'vers-1', montant: 30000, date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), note: 'Acompte initial (Espèces)' },
      { id: 'vers-2', montant: 20000, date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), note: 'Deuxième versement (Wave/Orange Money)' },
    ],
    statut: 'en_cours',
    date_commande: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    date_livraison_prevue: getFutureDate(2),
  },
  {
    id: 'cmd-2',
    couturier_id: 'couturier-1',
    client_id: 'client-2',
    type_commande: 'couture_complete',
    description: 'Grand Boubou traditionnel avec col brodé',
    tissu: 'Bazin Gagniako bleu nuit',
    responsable: 'Oumar',
    prix_total: 45000,
    acompte: 25000,
    versements: [
      { id: 'vers-3', montant: 25000, date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), note: 'Acompte commande' },
    ],
    statut: 'essayage',
    date_commande: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    date_livraison_prevue: getFutureDate(4),
  },
  {
    id: 'cmd-3',
    couturier_id: 'couturier-1',
    client_id: 'client-3',
    type_commande: 'retouche',
    description: 'Ourlet et reprise de taille sur veste de blazer',
    tissu: 'Tissu prêt-à-porter fourni par la cliente',
    responsable: 'Adia',
    prix_total: 8000,
    acompte: 8000,
    versements: [
      { id: 'vers-4', montant: 8000, date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), note: 'Règlement intégral' },
    ],
    statut: 'prete',
    date_commande: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    date_livraison_prevue: getFutureDate(1),
  },
  {
    id: 'cmd-4',
    couturier_id: 'couturier-1',
    client_id: 'client-1',
    type_commande: 'couture_complete',
    description: 'Ensemble Tafe & Marinière brodée',
    tissu: 'Wax hollandais motifs floraux',
    responsable: 'Adia',
    prix_total: 35000,
    acompte: 15000,
    versements: [
      { id: 'vers-5', montant: 15000, date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(), note: 'Acompte de départ' },
    ],
    statut: 'recue',
    date_commande: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    date_livraison_prevue: getPastDate(2), // OVERDUE for demonstration!
  },
];

const INITIAL_REALISATIONS: Realisation[] = [
  {
    id: 'real-1',
    couturier_id: 'couturier-1',
    photo_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    description: 'Robe de gala sur-mesure en soie & bazin brodé main',
    date_publication: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'real-2',
    couturier_id: 'couturier-1',
    photo_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    description: 'Création Wax chic avec finitions passepoilées',
    date_publication: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'real-3',
    couturier_id: 'couturier-1',
    photo_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
    description: 'Boubou royal avec broderies traditionnelles',
    date_publication: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
];

// Helper to check browser environment safely
const isBrowser = typeof window !== 'undefined';

export class MockStorageService {
  private static getStore<T>(key: string, defaultVal: T): T {
    if (!isBrowser) return defaultVal;
    try {
      const item = localStorage.getItem(`ourlette_${key}`);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private static setStore<T>(key: string, val: T): void {
    if (!isBrowser) return;
    try {
      localStorage.setItem(`ourlette_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Couturier
  static getCouturier(): Couturier {
    return this.getStore<Couturier>('couturier', INITIAL_COUTURIER);
  }

  static updateCouturier(data: Partial<Couturier>): Couturier {
    const current = this.getCouturier();
    const updated = { ...current, ...data };
    this.setStore('couturier', updated);
    return updated;
  }

  // Clients
  static getClients(): Client[] {
    return this.getStore<Client[]>('clients', INITIAL_CLIENTS);
  }

  static getClientById(id: string): Client | undefined {
    return this.getClients().find((c) => c.id === id);
  }

  static addClient(client: Omit<Client, 'id' | 'couturier_id' | 'date_creation'>): Client {
    const couturier = this.getCouturier();
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      couturier_id: couturier.id,
      date_creation: new Date().toISOString(),
    };
    const clients = [newClient, ...this.getClients()];
    this.setStore('clients', clients);

    // Async sync to Supabase database if configured
    SupabaseService.addClient(newClient).catch((err) => {
      console.log('Supabase sync info:', err);
    });

    return newClient;
  }

  // Mesures
  static getMesureByClientId(clientId: string): Mesure | undefined {
    const dict = this.getStore<Record<string, Mesure>>('mesures', INITIAL_MESURES);
    return dict[clientId];
  }

  static saveMesure(clientId: string, mesureData: Partial<Mesure>): Mesure {
    const dict = this.getStore<Record<string, Mesure>>('mesures', INITIAL_MESURES);
    const existing = dict[clientId] || {
      id: `mesure-${Date.now()}`,
      client_id: clientId,
      champs_personnalises: {},
      date_maj: new Date().toISOString(),
    };

    const updated: Mesure = {
      ...existing,
      ...mesureData,
      date_maj: new Date().toISOString(),
    };

    dict[clientId] = updated;
    this.setStore('mesures', dict);

    // Async sync to Supabase database if configured
    SupabaseService.saveMesures(clientId, updated).catch((err) => {
      console.log('Supabase sync info:', err);
    });

    return updated;
  }

  // Commandes
  static getCommandes(): Commande[] {
    const rawCmds = this.getStore<Commande[]>('commandes', INITIAL_COMMANDES);
    const clients = this.getClients();
    
    // Hydrate client names & phone for quick viewing
    return rawCmds.map((cmd) => {
      const client = clients.find((c) => c.id === cmd.client_id);
      return {
        ...cmd,
        client_nom: client ? client.nom : 'Client inconnu',
        client_telephone: client ? client.telephone : '',
      };
    });
  }

  static getCommandeById(id: string): Commande | undefined {
    return this.getCommandes().find((c) => c.id === id);
  }

  static addCommande(cmdData: Omit<Commande, 'id' | 'couturier_id' | 'date_commande' | 'statut'>): Commande {
    const couturier = this.getCouturier();
    const newCmd: Commande = {
      ...cmdData,
      id: `cmd-${Date.now()}`,
      couturier_id: couturier.id,
      statut: 'recue',
      date_commande: new Date().toISOString(),
    };
    const cmds = [newCmd, ...this.getStore<Commande[]>('commandes', INITIAL_COMMANDES)];
    this.setStore('commandes', cmds);

    // Async sync to Supabase database if configured
    SupabaseService.addCommande(newCmd).catch((err) => {
      console.log('Supabase sync info:', err);
    });

    return newCmd;
  }

  static updateCommande(id: string, updates: Partial<Commande>): Commande | undefined {
    const rawCmds = this.getStore<Commande[]>('commandes', INITIAL_COMMANDES);
    const index = rawCmds.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    rawCmds[index] = { ...rawCmds[index], ...updates };
    this.setStore('commandes', rawCmds);
    return rawCmds[index];
  }

  static addVersement(cmdId: string, montant: number, note?: string): Commande | undefined {
    const rawCmds = this.getStore<Commande[]>('commandes', INITIAL_COMMANDES);
    const index = rawCmds.findIndex((c) => c.id === cmdId);
    if (index === -1) return undefined;

    const cmd = rawCmds[index];
    const currentVersements = cmd.versements || [
      ...(cmd.acompte > 0 ? [{ id: 'vers-0', montant: cmd.acompte, date: cmd.date_commande, note: 'Acompte initial' }] : []),
    ];

    const newVersement = {
      id: `vers-${Date.now()}`,
      montant,
      date: new Date().toISOString(),
      note: note || 'Versement complémentaire',
    };

    const updatedVersements = [...currentVersements, newVersement];
    const newTotalAcompte = updatedVersements.reduce((sum, v) => sum + v.montant, 0);

    const updatedCmd: Commande = {
      ...cmd,
      acompte: newTotalAcompte,
      versements: updatedVersements,
    };

    rawCmds[index] = updatedCmd;
    this.setStore('commandes', rawCmds);
    return updatedCmd;
  }

  // Realisations
  static getRealisations(): Realisation[] {
    return this.getStore<Realisation[]>('realisations', INITIAL_REALISATIONS);
  }

  static addRealisation(realData: Omit<Realisation, 'id' | 'couturier_id' | 'date_publication'>): Realisation {
    const couturier = this.getCouturier();
    const newReal: Realisation = {
      ...realData,
      id: `real-${Date.now()}`,
      couturier_id: couturier.id,
      date_publication: new Date().toISOString(),
    };
    const reals = [newReal, ...this.getRealisations()];
    this.setStore('realisations', reals);
    return newReal;
  }

  static deleteRealisation(id: string): void {
    const reals = this.getRealisations().filter((r) => r.id !== id);
    this.setStore('realisations', reals);
  }
}
