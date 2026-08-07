import { Couturier, Client, Mesure, Commande, Realisation } from '../types/database';
import { SupabaseService } from './supabaseService';

const isBrowser = typeof window !== 'undefined';

// Cleanup legacy un-scoped localStorage keys from initial prototype
if (isBrowser) {
  try {
    localStorage.removeItem('ourlette_clients');
    localStorage.removeItem('ourlette_commandes');
    localStorage.removeItem('ourlette_mesures');
    localStorage.removeItem('ourlette_realisations');
    localStorage.removeItem('ourlette_couturier');
  } catch {
    // Ignore cleanup errors
  }
}

export class DataService {
  private static getStore<T>(userId: string | undefined, key: string, defaultVal: T): T {
    if (!isBrowser || !userId) return defaultVal;
    try {
      const item = localStorage.getItem(`ourlette_${userId}_${key}`);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private static setStore<T>(userId: string | undefined, key: string, val: T): void {
    if (!isBrowser || !userId) return;
    try {
      localStorage.setItem(`ourlette_${userId}_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // ── Couturier ────────────────────────────────────────────────────
  static async getCouturier(userId: string | undefined): Promise<Couturier | null> {
    if (!userId) return null;

    // Try Supabase first
    const remote = await SupabaseService.getCouturier(userId);
    if (remote) {
      this.setStore(userId, 'couturier', remote);
      return remote;
    }

    // Fallback to local user store
    return this.getStore<Couturier | null>(userId, 'couturier', null);
  }

  static async updateCouturier(userId: string | undefined, updates: Partial<Couturier>): Promise<Couturier | null> {
    if (!userId) return null;

    const remote = await SupabaseService.updateCouturier(userId, updates);
    const existing = await this.getCouturier(userId);
    const updated = remote || { ...(existing || {}), ...updates, id: userId } as Couturier;

    this.setStore(userId, 'couturier', updated);
    return updated;
  }

  // ── Clients ──────────────────────────────────────────────────────
  static async getClients(userId: string | undefined): Promise<Client[]> {
    if (!userId) return [];

    const remote = await SupabaseService.getClients(userId);
    if (remote && remote.length > 0) {
      this.setStore(userId, 'clients', remote);
      return remote;
    }

    const local = this.getStore<Client[]>(userId, 'clients', []);
    return local;
  }

  static async getClientById(userId: string | undefined, id: string): Promise<Client | undefined> {
    const clients = await this.getClients(userId);
    return clients.find((c) => c.id === id);
  }

  static async addClient(
    userId: string | undefined,
    clientData: Omit<Client, 'id' | 'couturier_id' | 'date_creation'>
  ): Promise<Client | null> {
    if (!userId) return null;

    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}`,
      couturier_id: userId,
      date_creation: new Date().toISOString(),
    };

    const remote = await SupabaseService.addClient(newClient);
    const finalClient = remote || newClient;

    const clients = [finalClient, ...(await this.getClients(userId))];
    this.setStore(userId, 'clients', clients);

    return finalClient;
  }

  static async updateClient(userId: string | undefined, id: string, updates: Partial<Client>): Promise<Client | null> {
    if (!userId) return null;

    await SupabaseService.updateClient(id, updates);

    const clients = await this.getClients(userId);
    const index = clients.findIndex((c) => c.id === id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...updates };
      this.setStore(userId, 'clients', clients);
      return clients[index];
    }
    return null;
  }

  static async deleteClient(userId: string | undefined, id: string): Promise<boolean> {
    if (!userId) return false;

    await SupabaseService.deleteClient(id);

    const clients = (await this.getClients(userId)).filter((c) => c.id !== id);
    this.setStore(userId, 'clients', clients);
    return true;
  }

  // ── Mesures ──────────────────────────────────────────────────────
  static async getMesureByClientId(userId: string | undefined, clientId: string): Promise<Mesure | undefined> {
    if (!userId || !clientId) return undefined;

    const remote = await SupabaseService.getMesureByClientId(clientId);
    if (remote) {
      const dict = this.getStore<Record<string, Mesure>>(userId, 'mesures', {});
      dict[clientId] = remote;
      this.setStore(userId, 'mesures', dict);
      return remote;
    }

    const dict = this.getStore<Record<string, Mesure>>(userId, 'mesures', {});
    return dict[clientId];
  }

  static async saveMesure(
    userId: string | undefined,
    clientId: string,
    mesureData: Partial<Mesure>
  ): Promise<Mesure | null> {
    if (!userId || !clientId) return null;

    const remote = await SupabaseService.saveMesures(clientId, mesureData);

    const dict = this.getStore<Record<string, Mesure>>(userId, 'mesures', {});
    const existing = dict[clientId] || {
      id: `mesure-${Date.now()}`,
      client_id: clientId,
      champs_personnalises: {},
      date_maj: new Date().toISOString(),
    };

    const updated: Mesure = remote || {
      ...existing,
      ...mesureData,
      date_maj: new Date().toISOString(),
    };

    dict[clientId] = updated;
    this.setStore(userId, 'mesures', dict);

    return updated;
  }

  // ── Commandes ────────────────────────────────────────────────────
  static async getCommandes(userId: string | undefined): Promise<Commande[]> {
    if (!userId) return [];

    const remote = await SupabaseService.getCommandes(userId);
    const clients = await this.getClients(userId);

    let cmds = remote && remote.length > 0 ? remote : this.getStore<Commande[]>(userId, 'commandes', []);

    // Hydrate client names & phone for UI display
    cmds = cmds.map((cmd) => {
      const client = clients.find((c) => c.id === cmd.client_id);
      return {
        ...cmd,
        client_nom: client ? client.nom : (cmd.client_nom || 'Client inconnu'),
        client_telephone: client ? client.telephone : (cmd.client_telephone || ''),
      };
    });

    if (remote && remote.length > 0) {
      this.setStore(userId, 'commandes', cmds);
    }

    return cmds;
  }

  static async getCommandeById(userId: string | undefined, id: string): Promise<Commande | undefined> {
    const cmds = await this.getCommandes(userId);
    return cmds.find((c) => c.id === id);
  }

  static async addCommande(
    userId: string | undefined,
    cmdData: Omit<Commande, 'id' | 'couturier_id' | 'date_commande' | 'statut'>
  ): Promise<Commande | null> {
    if (!userId) return null;

    const newCmd: Commande = {
      ...cmdData,
      id: `cmd-${Date.now()}`,
      couturier_id: userId,
      statut: 'recue',
      date_commande: new Date().toISOString(),
    };

    const remote = await SupabaseService.addCommande(newCmd);
    const finalCmd = remote || newCmd;

    const cmds = [finalCmd, ...(await this.getCommandes(userId))];
    this.setStore(userId, 'commandes', cmds);

    return finalCmd;
  }

  static async updateCommande(
    userId: string | undefined,
    id: string,
    updates: Partial<Commande>
  ): Promise<Commande | undefined> {
    if (!userId) return undefined;

    await SupabaseService.updateCommande(id, updates);

    const cmds = await this.getCommandes(userId);
    const index = cmds.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    cmds[index] = { ...cmds[index], ...updates };
    this.setStore(userId, 'commandes', cmds);
    return cmds[index];
  }

  static async addVersement(
    userId: string | undefined,
    cmdId: string,
    montant: number,
    note?: string
  ): Promise<Commande | undefined> {
    if (!userId) return undefined;

    await SupabaseService.addVersement(cmdId, montant, note);

    const cmds = await this.getCommandes(userId);
    const index = cmds.findIndex((c) => c.id === cmdId);
    if (index === -1) return undefined;

    const cmd = cmds[index];
    const currentVersements = cmd.versements || [
      ...(cmd.acompte > 0 ? [{ id: 'vers-0', montant: cmd.acompte, date: cmd.date_commande || new Date().toISOString(), note: 'Acompte initial' }] : []),
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

    cmds[index] = updatedCmd;
    this.setStore(userId, 'commandes', cmds);
    return updatedCmd;
  }

  // ── Realisations ─────────────────────────────────────────────────
  static async getRealisations(userId: string | undefined): Promise<Realisation[]> {
    if (!userId) return [];

    const remote = await SupabaseService.getRealisations(userId);
    if (remote && remote.length > 0) {
      this.setStore(userId, 'realisations', remote);
      return remote;
    }

    return this.getStore<Realisation[]>(userId, 'realisations', []);
  }

  static async addRealisation(
    userId: string | undefined,
    realData: Omit<Realisation, 'id' | 'couturier_id' | 'date_publication'>
  ): Promise<Realisation | null> {
    if (!userId) return null;

    const newReal: Realisation = {
      ...realData,
      id: `real-${Date.now()}`,
      couturier_id: userId,
      date_publication: new Date().toISOString(),
    };

    const remote = await SupabaseService.addRealisation(newReal);
    const finalReal = remote || newReal;

    const reals = [finalReal, ...(await this.getRealisations(userId))];
    this.setStore(userId, 'realisations', reals);

    return finalReal;
  }

  static async deleteRealisation(userId: string | undefined, id: string): Promise<boolean> {
    if (!userId) return false;

    await SupabaseService.deleteRealisation(id);

    const reals = (await this.getRealisations(userId)).filter((r) => r.id !== id);
    this.setStore(userId, 'realisations', reals);
    return true;
  }

  // ── Vitrine Publique ──────────────────────────────────────────────
  static async getPublicVitrine(slug: string): Promise<{ couturier: Couturier | null; realisations: Realisation[] }> {
    const couturier = await SupabaseService.getCouturier(slug);
    if (!couturier) {
      return { couturier: null, realisations: [] };
    }

    const realisations = await SupabaseService.getRealisations(couturier.id);
    return { couturier, realisations };
  }
}
