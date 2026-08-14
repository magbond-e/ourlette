import { Couturier, Client, Mesure, Commande, Realisation } from '../types/database';
import { NotificationItem, CreateNotificationInput } from '../types/notification';
import { SupabaseService } from './supabaseService';

const isBrowser = typeof window !== 'undefined';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function safeDbExecute(sql: string, params: any[] = []): Promise<void> {
  if (!isBrowser) return;
  try {
    const { getPowerSyncDb } = await import('../powersync/client');
    const db = getPowerSyncDb();
    if (db) {
      await db.execute(sql, params);
    }
  } catch (e) {
    // Si la base SQLite n'est pas encore prête ou initialisée, on continue
    console.debug('[PowerSync local write skipped/error]:', e);
  }
}

interface QueueItem {
  id: string;
  type:
    | 'ADD_CLIENT'
    | 'UPDATE_CLIENT'
    | 'DELETE_CLIENT'
    | 'SAVE_MESURE'
    | 'ADD_COMMANDE'
    | 'UPDATE_COMMANDE'
    | 'DELETE_COMMANDE'
    | 'ADD_REALISATION'
    | 'DELETE_REALISATION'
    | 'ADD_NOTIFICATION'
    | 'MARK_NOTIF_READ'
    | 'MARK_ALL_NOTIFS_READ'
    | 'DELETE_NOTIF'
    | 'CLEAR_NOTIFS';
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
          case 'DELETE_COMMANDE':
            success = await SupabaseService.deleteCommande(item.payload.id);
            break;
          case 'ADD_REALISATION':
            success = Boolean(await SupabaseService.addRealisation(item.payload));
            break;
          case 'DELETE_REALISATION':
            success = await SupabaseService.deleteRealisation(item.payload.id);
            break;
          case 'ADD_NOTIFICATION':
            success = Boolean(await SupabaseService.addNotification(item.payload));
            break;
          case 'MARK_NOTIF_READ':
            success = await SupabaseService.markNotificationAsRead(item.payload.id);
            break;
          case 'MARK_ALL_NOTIFS_READ':
            success = await SupabaseService.markAllNotificationsAsRead(item.payload.couturierId);
            break;
          case 'DELETE_NOTIF':
            success = await SupabaseService.deleteNotification(item.payload.id);
            break;
          case 'CLEAR_NOTIFS':
            success = await SupabaseService.clearAllNotifications(item.payload.couturierId);
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
        // Synchroniser également dans SQLite en tâche de fond
        for (const c of remote) {
          safeDbExecute(
            `INSERT OR REPLACE INTO clients (id, couturier_id, nom, telephone, email, adresse, notes, date_creation, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [c.id, c.couturier_id, c.nom, c.telephone || '', c.email || '', c.adresse || '', c.notes || '', c.date_creation, c.updated_at || c.date_creation]
          );
        }
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
    clientData: Omit<Client, 'id' | 'couturier_id' | 'date_creation'> & { id?: string }
  ): Promise<Client | null> {
    if (!userId) return null;

    const validId = clientData.id && clientData.id.includes('-') && !clientData.id.startsWith('client-')
      ? clientData.id
      : generateUUID();

    const newClient: Client = {
      ...clientData,
      id: validId,
      couturier_id: userId,
      date_creation: new Date().toISOString(),
    };

    // 1. Écriture locale immédiate dans PowerSync SQLite (réactivité 0ms)
    await safeDbExecute(
      `INSERT OR REPLACE INTO clients (id, couturier_id, nom, telephone, email, adresse, notes, date_creation, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newClient.id,
        newClient.couturier_id,
        newClient.nom,
        newClient.telephone || '',
        newClient.email || '',
        newClient.adresse || '',
        newClient.notes || '',
        newClient.date_creation,
        new Date().toISOString(),
      ]
    );

    // 2. Synchronisation Supabase / File d'attente
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

    // 1. Écriture locale immédiate dans PowerSync SQLite
    await safeDbExecute(
      `UPDATE clients SET
        nom = COALESCE(?, nom),
        telephone = COALESCE(?, telephone),
        email = COALESCE(?, email),
        adresse = COALESCE(?, adresse),
        notes = COALESCE(?, notes),
        updated_at = ?
       WHERE id = ?`,
      [
        updates.nom ?? null,
        updates.telephone ?? null,
        updates.email ?? null,
        updates.adresse ?? null,
        updates.notes ?? null,
        new Date().toISOString(),
        id,
      ]
    );

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

    // 1. Suppression SQLite
    await safeDbExecute(`DELETE FROM clients WHERE id = ?`, [id]);
    await safeDbExecute(`DELETE FROM commandes WHERE client_id = ?`, [id]);
    await safeDbExecute(`DELETE FROM mesures WHERE client_id = ?`, [id]);

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

    const mesureId = (mesureData as any).id && (mesureData as any).id.includes('-') && !(mesureData as any).id.startsWith('mesure-')
      ? (mesureData as any).id
      : generateUUID();

    // 1. Écriture SQLite immédiate
    await safeDbExecute(
      `INSERT OR REPLACE INTO mesures (
        id, client_id, tour_poitrine, tour_taille, tour_hanches, longueur_manche,
        longueur_robe, tour_cou, largeur_epaules, champs_personnalises, prise_par, date_maj
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mesureId,
        clientId,
        mesureData.tour_poitrine ?? null,
        mesureData.tour_taille ?? null,
        mesureData.tour_hanches ?? null,
        mesureData.longueur_manche ?? null,
        mesureData.longueur_robe ?? null,
        mesureData.tour_cou ?? null,
        mesureData.largeur_epaules ?? null,
        mesureData.champs_personnalises
          ? (typeof mesureData.champs_personnalises === 'string' ? mesureData.champs_personnalises : JSON.stringify(mesureData.champs_personnalises))
          : '{}',
        mesureData.prise_par ?? '',
        new Date().toISOString(),
      ]
    );

    let remote: Mesure | null = null;
    if (navigator.onLine) {
      remote = await SupabaseService.saveMesures(clientId, mesureData);
    } else {
      this.pushToQueue(userId, { type: 'SAVE_MESURE', payload: { clientId, mesureData } });
    }

    const finalMesure: Mesure = remote || {
      id: mesureId,
      client_id: clientId,
      ...mesureData,
      date_maj: new Date().toISOString(),
    } as Mesure;

    const dict = this.getStore<Record<string, Mesure>>(userId, 'mesures', {});
    dict[clientId] = finalMesure;
    this.setStore(userId, 'mesures', dict);

    return finalMesure;
  }

  // ── Commandes ────────────────────────────────────────────────────
  static async getCommandes(userId: string | undefined): Promise<Commande[]> {
    if (!userId) return [];

    if (navigator.onLine) {
      await this.syncPendingQueue(userId);
      const remote = await SupabaseService.getCommandes(userId);
      if (remote && remote.length > 0) {
        this.setStore(userId, 'commandes', remote);
        // Synchroniser dans SQLite
        for (const cmd of remote) {
          safeDbExecute(
            `INSERT OR REPLACE INTO commandes (
              id, couturier_id, client_id, type_commande, description, tissu, responsable,
              prix_total, acompte, versements, statut, date_commande, date_livraison_prevue, notes, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              cmd.id,
              cmd.couturier_id,
              cmd.client_id,
              cmd.type_commande || 'couture_complete',
              cmd.description,
              cmd.tissu || '',
              cmd.responsable || '',
              cmd.prix_total || 0,
              cmd.acompte || 0,
              typeof cmd.versements === 'string' ? cmd.versements : JSON.stringify(cmd.versements || []),
              cmd.statut || 'recue',
              cmd.date_commande || new Date().toISOString(),
              cmd.date_livraison_prevue || '',
              cmd.notes || '',
              cmd.updated_at || new Date().toISOString(),
            ]
          );
        }
        return remote;
      }
    }

    const cachedCmds = this.getStore<Commande[]>(userId, 'commandes', []);
    const clients = await this.getClients(userId);

    const cmds = cachedCmds.map((cmd) => {
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
    cmdData: Omit<Commande, 'id' | 'couturier_id' | 'date_commande' | 'statut'> & { id?: string }
  ): Promise<Commande | null> {
    if (!userId) return null;

    const validId = cmdData.id && cmdData.id.includes('-') && !cmdData.id.startsWith('cmd-')
      ? cmdData.id
      : generateUUID();

    const newCmd: Commande = {
      ...cmdData,
      id: validId,
      couturier_id: userId,
      statut: 'recue',
      date_commande: new Date().toISOString(),
    };

    // 1. Écriture locale immédiate dans PowerSync SQLite (réactivité 0ms)
    await safeDbExecute(
      `INSERT OR REPLACE INTO commandes (
        id, couturier_id, client_id, type_commande, description, tissu, responsable,
        prix_total, acompte, versements, statut, date_commande, date_livraison_prevue, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newCmd.id,
        newCmd.couturier_id,
        newCmd.client_id,
        newCmd.type_commande || 'couture_complete',
        newCmd.description,
        newCmd.tissu || '',
        newCmd.responsable || '',
        newCmd.prix_total || 0,
        newCmd.acompte || 0,
        typeof newCmd.versements === 'string' ? newCmd.versements : JSON.stringify(newCmd.versements || []),
        newCmd.statut || 'recue',
        newCmd.date_commande,
        newCmd.date_livraison_prevue || '',
        newCmd.notes || '',
        new Date().toISOString(),
      ]
    );

    // 2. Synchronisation Supabase / File d'attente
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

    // 1. Mise à jour SQLite immédiate
    await safeDbExecute(
      `UPDATE commandes SET
        statut = COALESCE(?, statut),
        prix_total = COALESCE(?, prix_total),
        acompte = COALESCE(?, acompte),
        versements = COALESCE(?, versements),
        date_livraison_prevue = COALESCE(?, date_livraison_prevue),
        description = COALESCE(?, description),
        tissu = COALESCE(?, tissu),
        responsable = COALESCE(?, responsable),
        notes = COALESCE(?, notes),
        updated_at = ?
       WHERE id = ?`,
      [
        updates.statut ?? null,
        updates.prix_total ?? null,
        updates.acompte ?? null,
        updates.versements ? (typeof updates.versements === 'string' ? updates.versements : JSON.stringify(updates.versements)) : null,
        updates.date_livraison_prevue ?? null,
        updates.description ?? null,
        updates.tissu ?? null,
        updates.responsable ?? null,
        updates.notes ?? null,
        new Date().toISOString(),
        id,
      ]
    );

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

  static async deleteCommande(userId: string | undefined, id: string): Promise<boolean> {
    if (!userId) return false;

    await safeDbExecute(`DELETE FROM commandes WHERE id = ?`, [id]);

    if (navigator.onLine) {
      await SupabaseService.deleteCommande(id);
    } else {
      this.pushToQueue(userId, { type: 'DELETE_COMMANDE', payload: { id } });
    }

    const cmds = this.getStore<Commande[]>(userId, 'commandes', []).filter((c) => c.id !== id);
    this.setStore(userId, 'commandes', cmds);
    return true;
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
      id: generateUUID(),
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
    realData: Omit<Realisation, 'id' | 'couturier_id' | 'date_publication'> & { id?: string }
  ): Promise<Realisation | null> {
    if (!userId) return null;

    const validId = realData.id && realData.id.includes('-') && !realData.id.startsWith('real-')
      ? realData.id
      : generateUUID();

    const newReal: Realisation = {
      ...realData,
      id: validId,
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

  // ── Vitrine Publique ─────────────────────────────────────────────
  static async getPublicVitrine(slug: string): Promise<{ couturier: Couturier | null; realisations: Realisation[] }> {
    if (!slug) return { couturier: null, realisations: [] };

    if (navigator.onLine) {
      const c = await SupabaseService.getCouturier(slug);
      if (c) {
        const reals = await SupabaseService.getRealisations(c.id);
        return { couturier: c, realisations: reals };
      }
    }

  // ── Notifications ────────────────────────────────────────────────
  static async getNotifications(userId: string | undefined): Promise<NotificationItem[]> {
    if (!userId) return [];

    if (navigator.onLine) {
      await this.syncPendingQueue(userId);
      const remote = await SupabaseService.getNotifications(userId);
      if (remote && remote.length >= 0) {
        this.setStore(userId, 'notifications', remote);
        return remote;
      }
    }

    return this.getStore<NotificationItem[]>(userId, 'notifications', []);
  }

  static async addNotification(
    userId: string | undefined,
    notifData: CreateNotificationInput & { id?: string }
  ): Promise<NotificationItem | null> {
    if (!userId) return null;

    const validId = notifData.id && notifData.id.includes('-') && !notifData.id.startsWith('notif-')
      ? notifData.id
      : generateUUID();

    const newNotif: NotificationItem = {
      id: validId,
      couturier_id: userId,
      type: notifData.type,
      category: notifData.category || 'order',
      priority: notifData.priority || 'medium',
      title: notifData.title,
      message: notifData.message,
      date: new Date().toISOString(),
      read: notifData.read ?? false,
      link: notifData.link,
      metadata: notifData.metadata || {},
      orderId: notifData.orderId,
    };

    let remote: NotificationItem | null = null;
    if (navigator.onLine) {
      remote = await SupabaseService.addNotification({
        ...notifData,
        couturier_id: userId,
      });
    } else {
      this.pushToQueue(userId, {
        type: 'ADD_NOTIFICATION',
        payload: { ...notifData, couturier_id: userId },
      });
    }

    const finalNotif = remote || newNotif;
    const currentNotifs = this.getStore<NotificationItem[]>(userId, 'notifications', []);
    const updatedNotifs = [finalNotif, ...currentNotifs.filter((n) => n.id !== finalNotif.id)];
    this.setStore(userId, 'notifications', updatedNotifs);

    return finalNotif;
  }

  static async markNotificationAsRead(userId: string | undefined, id: string): Promise<boolean> {
    if (!userId || !id) return false;

    if (navigator.onLine) {
      await SupabaseService.markNotificationAsRead(id);
    } else {
      this.pushToQueue(userId, { type: 'MARK_NOTIF_READ', payload: { id } });
    }

    const notifs = this.getStore<NotificationItem[]>(userId, 'notifications', []);
    const index = notifs.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifs[index] = { ...notifs[index], read: true };
      this.setStore(userId, 'notifications', notifs);
      return true;
    }
    return false;
  }

  static async markAllNotificationsAsRead(userId: string | undefined): Promise<boolean> {
    if (!userId) return false;

    if (navigator.onLine) {
      await SupabaseService.markAllNotificationsAsRead(userId);
    } else {
      this.pushToQueue(userId, { type: 'MARK_ALL_NOTIFS_READ', payload: { couturierId: userId } });
    }

    const notifs = this.getStore<NotificationItem[]>(userId, 'notifications', []);
    const updated = notifs.map((n) => ({ ...n, read: true }));
    this.setStore(userId, 'notifications', updated);
    return true;
  }

  static async deleteNotification(userId: string | undefined, id: string): Promise<boolean> {
    if (!userId || !id) return false;

    if (navigator.onLine) {
      await SupabaseService.deleteNotification(id);
    } else {
      this.pushToQueue(userId, { type: 'DELETE_NOTIF', payload: { id } });
    }

    const notifs = this.getStore<NotificationItem[]>(userId, 'notifications', []).filter((n) => n.id !== id);
    this.setStore(userId, 'notifications', notifs);
    return true;
  }

  static async clearAllNotifications(userId: string | undefined): Promise<boolean> {
    if (!userId) return false;

    if (navigator.onLine) {
      await SupabaseService.clearAllNotifications(userId);
    } else {
      this.pushToQueue(userId, { type: 'CLEAR_NOTIFS', payload: { couturierId: userId } });
    }

    this.setStore(userId, 'notifications', []);
    return true;
  }

  /**
   * Synchronise intelligemment les alertes d'échéances et de retards de commandes.
   * Génère les notifications persistées une seule fois par commande/état pour éviter les doublons.
   */
  static async syncOrderAlerts(userId: string | undefined, couturier: Couturier | null): Promise<NotificationItem[]> {
    if (!userId) return [];

    const notifRetardEnabled = couturier?.notif_retard ?? true;
    const notifRappelEnabled = couturier?.notif_rappel_livraison ?? true;

    if (!notifRetardEnabled && !notifRappelEnabled) {
      return this.getNotifications(userId);
    }

    const [commandes, existingNotifs] = await Promise.all([
      this.getCommandes(userId),
      this.getNotifications(userId),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const cmd of commandes) {
      if (cmd.statut === 'livree' || !cmd.date_livraison_prevue) continue;

      const datePrev = new Date(cmd.date_livraison_prevue);
      if (isNaN(datePrev.getTime())) continue;

      datePrev.setHours(0, 0, 0, 0);
      const diffDays = Math.round((datePrev.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const formattedDate = new Date(cmd.date_livraison_prevue).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      // 1. Commande en retard (diffDays < 0)
      if (diffDays < 0 && notifRetardEnabled) {
        const alreadyAlerted = existingNotifs.some(
          (n) => n.type === 'order_overdue' && (n.orderId === cmd.id || n.metadata?.orderId === cmd.id)
        );

        if (!alreadyAlerted) {
          await this.addNotification(userId, {
            type: 'order_overdue',
            category: 'order',
            priority: 'urgent',
            title: '🚨 Commande en retard',
            message: `La commande pour ${cmd.client_nom || 'un client'} ("${cmd.description}") accuse ${Math.abs(diffDays)} jour(s) de retard (Échéance: ${formattedDate}).`,
            link: `/commandes?id=${cmd.id}`,
            orderId: cmd.id,
            metadata: { orderId: cmd.id, alertType: 'overdue' },
          });
        }
      }

      // 2. Échéance proche (0 <= diffDays <= 2)
      else if (diffDays >= 0 && diffDays <= 2 && notifRappelEnabled) {
        const alreadyAlerted = existingNotifs.some(
          (n) => n.type === 'order_due_soon' && (n.orderId === cmd.id || n.metadata?.orderId === cmd.id)
        );

        if (!alreadyAlerted) {
          const label = diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? "Demain" : `dans ${diffDays} jours`;
          await this.addNotification(userId, {
            type: 'order_due_soon',
            category: 'order',
            priority: 'high',
            title: `⏰ Échéance proche (${label})`,
            message: `La commande pour ${cmd.client_nom || 'un client'} ("${cmd.description}") doit être livrée le ${formattedDate}.`,
            link: `/commandes?id=${cmd.id}`,
            orderId: cmd.id,
            metadata: { orderId: cmd.id, alertType: 'due_soon' },
          });
        }
      }
    }

    return this.getNotifications(userId);
  }
}

