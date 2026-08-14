import { Couturier, Client, Mesure, Commande, Realisation } from '../types/database';
import { SupabaseService } from './supabaseService';

const isBrowser = typeof window !== 'undefined';

interface QueueItem {
  id: string;
  type: 'ADD_CLIENT' | 'UPDATE_CLIENT' | 'DELETE_CLIENT' | 'SAVE_MESURE' | 'ADD_COMMANDE' | 'UPDATE_COMMANDE' | 'ADD_REALISATION' | 'DELETE_REALISATION';
  payload: any;
  timestamp: string;
}

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

  private static getQueue(userId: string): QueueItem[] {
    return this.getStore<QueueItem[]>(userId, 'sync_queue', []);
  }

  private static pushToQueue(userId: string, item: Omit<QueueItem, 'id' | 'timestamp'>) {
    const queue = this.getQueue(userId);
    const newItem: QueueItem = {
      ...item,
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    this.setStore(userId, 'sync_queue', [...queue, newItem]);
  }

  public static async syncPendingQueue(userId: string | undefined): Promise<void> {
    if (!userId || !isBrowser || !navigator.onLine) return;

    const queue = this.getQueue(userId);
    if (queue.length === 0) return;

    const remainingQueue: QueueItem[] = [];

    for (const item of queue) {
      try {
        let success = true;
        switch (item.type) {
          case 'ADD_CLIENT':
            success = Boolean(await SupabaseService.addClient(item.payload));
            break;
          case 'UPDATE_CLIENT':
            success = Boolean(await SupabaseService.updateClient(item.payload.id, item.payload.updates));
            break;
          case 'DELETE_CLIENT':
            success = await SupabaseService.deleteClient(item.payload.id);
            break;
          case 'SAVE_MESURE':
            success = Boolean(await SupabaseService.saveMesures(item.payload.clientId, item.payload.mesureData));
            break;
          case 'ADD_COMMANDE':
            success = Boolean(await SupabaseService.addCommande(item.payload));
            break;
          case 'UPDATE_COMMANDE':
            success = Boolean(await SupabaseService.updateCommande(item.payload.id, item.payload.updates));
            break;
          case 'ADD_REALISATION':
            success = Boolean(await SupabaseService.addRealisation(item.payload));
            break;
          case 'DELETE_REALISATION':
            success = await SupabaseService.deleteRealisation(item.payload.id);
            break;
          default:
            break;
        }

        if (!success) {
          remainingQueue.push(item);
        }
      } catch (e) {
        remainingQueue.push(item);
      }
    }

    this.setStore(userId, 'sync_queue', remainingQueue);
  }

  // ── Couturier ────────────────────────────────────────────────────
  static async getCouturier(userId: string | undefined): Promise<Couturier | null> {
    if (!userId) return null;

    if (navigator.onLine) {
      await this.syncPendingQueue(userId);
      const remote = await SupabaseService.getCouturier(userId);
      if (remote) {
        this.setStore(userId, 'couturier', remote);
        return remote;
      }
    }

    return this.getStore<Couturier | null>(userId, 'couturier', null);
  }

  static async updateCouturier(userId: string | undefined, updates: Partial<Couturier>): Promise<Couturier | null> {
    if (!userId) return null;

    let remote: Couturier | null = null;
    if (navigator.onLine) {
      remote = await SupabaseService.updateCouturier(userId, updates);
    }

    const existing = await this.getCouturier(userId);
    const updated = remote || { ...(existing || {}), ...updates, id: userId } as Couturier;

    this.setStore(userId, 'couturier', updated);
    return updated;
  }

  // ── Clients ──────────────────────────────────────────────────────
  static async getClients(userId: string | undefined): Promise<Client[]> {
    if (!userId) return [];

    if (navigator.onLine) {
      await this.syncPendingQueue(userId);
      const remote = await SupabaseService.getClients(userId);
      if (remote && remote.length > 0) {
        this.setStore(userId, 'clients', remote);
        return remote;
      }
    }

    return this.getStore<Client[]>(userId, 'clients', []);
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

    let remote: Client | null = null;
    if (navigator.onLine) {
      remote = await SupabaseService.addClient(newClient);
    } else {
      this.pushToQueue(userId, { type: 'ADD_CLIENT', payload: newClient });
    }

    const finalClient = remote || newClient;
    const currentClients = this.getStore<Client[]>(userId, 'clients', []);
    const updatedClients = [finalClient, ...currentClients.filter((c) => c.id !== finalClient.id)];
    this.setStore(userId, 'clients', updatedClients);

    return finalClient;
  }

  static async updateClient(userId: string | undefined, id: string, updates: Partial<Client>): Promise<Client | null> {
    if (!userId) return null;

    if (navigator.onLine) {
      await SupabaseService.updateClient(id, updates);
    } else {
      this.pushToQueue(userId, { type: 'UPDATE_CLIENT', payload: { id, updates } });
    }

    const clients = this.getStore<Client[]>(userId, 'clients', []);
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

    if (navigator.onLine) {
      await SupabaseService.deleteClient(id);
    } else {
      this.pushToQueue(userId, { type: 'DELETE_CLIENT', payload: { id } });
    }

    const clients = this.getStore<Client[]>(userId, 'clients', []).filter((c) => c.id !== id);
    this.setStore(userId, 'clients', clients);
    return true;
  }

  // ── Mesures ──────────────────────────────────────────────────────
  static async getMesureByClientId(userId: string | undefined, clientId: string): Promise<Mesure | undefined> {
    if (!userId || !clientId) return undefined;

    if (navigator.onLine) {
      await this.syncPendingQueue(userId);
      const remote = await SupabaseService.getMesureByClientId(clientId);
      if (remote) {
        const dict = this.getStore<Record<string, Mesure>>(userId, 'mesures', {});
        dict[clientId] = remote;
        this.setStore(userId, 'mesures', dict);
        return remote;
      }
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

    let remote: Mesure | null = null;
    if (navigator.onLine) {
      remote = await SupabaseService.saveMesures(clientId, mesureData);
    } else {
      this.pushToQueue(userId, { type: 'SAVE_MESURE', payload: { clientId, mesureData } });
    }

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

    let cmds: Commande[] = [];
    if (navigator.onLine) {
      await this.syncPendingQueue(userId);
      const remote = await SupabaseService.getCommandes(userId);
      if (remote && remote.length > 0) {
        cmds = remote;
      }
    }

    if (cmds.length === 0) {
      cmds = this.getStore<Commande[]>(userId, 'commandes', []);
    }

    const clients = await this.getClients(userId);
    cmds = cmds.map((cmd) => {
      const client = clients.find((c) => c.id === cmd.client_id);
      return {
        ...cmd,
        client_nom: client ? client.nom : (cmd.client_nom || 'Client inconnu'),
        client_telephone: client ? client.telephone : (cmd.client_telephone || ''),
      };
    });

    this.setStore(userId, 'commandes', cmds);
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

    let remote: Commande | null = null;
    if (navigator.onLine) {
      remote = await SupabaseService.addCommande(newCmd);
    } else {
      this.pushToQueue(userId, { type: 'ADD_COMMANDE', payload: newCmd });
    }

    const finalCmd = remote || newCmd;
    const cmds = [finalCmd, ...(await this.getCommandes(userId)).filter((c) => c.id !== finalCmd.id)];
    this.setStore(userId, 'commandes', cmds);

    return finalCmd;
  }

  static async updateCommande(
    userId: string | undefined,
    id: string,
    updates: Partial<Commande>
  ): Promise<Commande | undefined> {
    if (!userId) return undefined;

    if (navigator.onLine) {
      await SupabaseService.updateCommande(id, updates);
    } else {
      this.pushToQueue(userId, { type: 'UPDATE_COMMANDE', payload: { id, updates } });
    }

    const cmds = this.getStore<Commande[]>(userId, 'commandes', []);
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

    return this.updateCommande(userId, cmdId, {
      acompte: newTotalAcompte,
      versements: updatedVersements,
    });
  }

  // ── Realisations ─────────────────────────────────────────────────
  static async getRealisations(userId: string | undefined): Promise<Realisation[]> {
    if (!userId) return [];

    if (navigator.onLine) {
      await this.syncPendingQueue(userId);
      const remote = await SupabaseService.getRealisations(userId);
      if (remote && remote.length > 0) {
        this.setStore(userId, 'realisations', remote);
        return remote;
      }
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

    let remote: Realisation | null = null;
    if (navigator.onLine) {
      remote = await SupabaseService.addRealisation(newReal);
    } else {
      this.pushToQueue(userId, { type: 'ADD_REALISATION', payload: newReal });
    }

    const finalReal = remote || newReal;
    const reals = [finalReal, ...(await this.getRealisations(userId)).filter((r) => r.id !== finalReal.id)];
    this.setStore(userId, 'realisations', reals);

    return finalReal;
  }

  static async deleteRealisation(userId: string | undefined, id: string): Promise<boolean> {
    if (!userId) return false;

    if (navigator.onLine) {
      await SupabaseService.deleteRealisation(id);
    } else {
      this.pushToQueue(userId, { type: 'DELETE_REALISATION', payload: { id } });
    }

    const reals = (await this.getRealisations(userId)).filter((r) => r.id !== id);
    this.setStore(userId, 'realisations', reals);
    return true;
  }

  // ── Vitrine Publique ──────────────────────────────────────────────
  static async getPublicVitrine(slug: string): Promise<{ couturier: Couturier | null; realisations: Realisation[] }> {
    let couturier = await SupabaseService.getCouturier(slug);

    let localCouturier: Couturier | null = null;
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('ourlette_') && key.endsWith('_couturier')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const c = JSON.parse(raw) as Couturier;
              if (c && c.slug_vitrine === slug) {
                localCouturier = c;
                break;
              }
            }
          }
        }
      } catch {
        // ignore storage parse error
      }
    }

    if (!couturier) {
      couturier = localCouturier;
    } else if (localCouturier && localCouturier.vitrine_active !== undefined) {
      couturier.vitrine_active = localCouturier.vitrine_active;
    }

    if (!couturier) {
      return { couturier: null, realisations: [] };
    }

    let realisations = await SupabaseService.getRealisations(couturier.id);
    if ((!realisations || realisations.length === 0) && couturier.id) {
      realisations = this.getStore<Realisation[]>(couturier.id, 'realisations', []);
    }

    return { couturier, realisations };
  }
}

