import { Couturier, Client, Mesure, Commande, Realisation } from '../types/database';
import { NotificationItem, CreateNotificationInput } from '../types/notification';
import { SupabaseService } from './supabaseService';
import { NotificationTemplates } from './notificationService';

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
      try {
        const res = await fetch('/api/couturier', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.couturier) {
            remote = data.couturier;
          }
        }
      } catch (e) {
        console.warn('API couturier update fallback:', e);
      }

      if (!remote) {
        remote = await SupabaseService.updateCouturier(userId, updates);
      }
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
    if (!id) return undefined;
    const clients = await this.getClients(userId);
    const found = clients.find((c) => c.id === id);
    if (found) return found;

    // Fallback direct sur Supabase par ID si non présent dans le cache local
    if (typeof window !== 'undefined' && navigator.onLine) {
      try {
        const remote = await SupabaseService.getClientById(id);
        if (remote && (!userId || remote.couturier_id === userId)) {
          if (userId) {
            const updated = [...clients, remote];
            this.setStore(userId, 'clients', updated);
          }
          return remote;
        }
      } catch (e) {
        console.warn('Fallback getClientById remote error:', e);
      }
    }

    return undefined;
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

    // Notification instantanée nouveau client (dédupliquée)
    this.addNotification(
      userId,
      NotificationTemplates.clientCreated(userId, { id: finalClient.id, nom: finalClient.nom })
    ).catch(() => {});

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

    // Déclencher notification commande créée (dédupliquée)
    this.addNotification(
      userId,
      NotificationTemplates.orderCreated(userId, {
        id: finalCmd.id,
        clientNom: finalCmd.client_nom,
        description: finalCmd.description,
      })
    ).catch(() => {});

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
    const updatedCmd = cmds[index];

    // Notification commande prête
    if (updates.statut === 'prete') {
      this.addNotification(
        userId,
        NotificationTemplates.orderReady(userId, {
          id: updatedCmd.id,
          clientNom: updatedCmd.client_nom,
          description: updatedCmd.description,
        })
      ).catch(() => {});
    }

    // Si la commande est livrée : résoudre les alertes d'échéances et purger du cache
    if (updates.statut === 'livree') {
      SupabaseService.resolveOrderAlerts(userId, id).catch(() => {});
      const notifs = this.getStore<NotificationItem[]>(userId, 'notifications', []);
      const filtered = notifs.filter(
        (n) => !(n.orderId === id || n.metadata?.orderId === id)
      );
      this.setStore(userId, 'notifications', filtered);
    }

    return updatedCmd;
  }

  static async deleteCommande(userId: string | undefined, id: string): Promise<boolean> {
    if (!userId) return false;

    await safeDbExecute(`DELETE FROM commandes WHERE id = ?`, [id]);

    if (navigator.onLine) {
      await SupabaseService.deleteCommande(id);
    } else {
      this.pushToQueue(userId, { type: 'DELETE_COMMANDE', payload: { id } });
    }

    // Purger les alertes orphelines associées à cette commande
    SupabaseService.resolveOrderAlerts(userId, id).catch(() => {});
    const notifs = this.getStore<NotificationItem[]>(userId, 'notifications', []);
    const filtered = notifs.filter(
      (n) => !(n.orderId === id || n.metadata?.orderId === id)
    );
    this.setStore(userId, 'notifications', filtered);

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

    const updated = await this.updateCommande(userId, cmdId, {
      acompte: newTotalAcompte,
      versements: updatedVersements,
    });

    if (updated) {
      this.addNotification(
        userId,
        NotificationTemplates.paymentReceived(
          userId,
          { id: updated.id, clientNom: updated.client_nom },
          { id: newVersement.id, montant: newVersement.montant, devise: 'FCFA' }
        )
      ).catch(() => {});
    }

    return updated;
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

    // 1. Tenter l'API Route Handler sécurisée (contourne les récursions RLS)
    try {
      const res = await fetch(`/api/vitrine/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.couturier) {
          return {
            couturier: json.couturier as Couturier,
            realisations: (json.realisations || []) as Realisation[],
          };
        }
      }
    } catch (e) {
      console.warn('API getPublicVitrine fallback:', e);
    }

    // 2. Fallback direct Supabase
    if (navigator.onLine) {
      const c = await SupabaseService.getCouturier(slug);
      if (c) {
        const reals = await SupabaseService.getRealisations(c.id);
        return { couturier: c, realisations: reals };
      }
    }

    // 3. Fallback cache local si l'atelier est stocké localement
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const allKeys = Object.keys(localStorage);
        const lowerSlug = slug.toLowerCase();
        for (const k of allKeys) {
          if (k.endsWith('_couturier')) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (
                parsed &&
                (parsed.slug_vitrine?.toLowerCase() === lowerSlug ||
                  parsed.id === slug ||
                  parsed.slug_vitrine === slug)
              ) {
                return { couturier: parsed, realisations: [] };
              }
            }
          }
        }
      } catch {
        // Ignorer
      }
    }

    return { couturier: null, realisations: [] };
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

    const currentNotifs = this.getStore<NotificationItem[]>(userId, 'notifications', []);

    // Vérifier si une notification avec cette dedupe_key existe déjà dans le cache local
    if (notifData.dedupe_key) {
      const existing = currentNotifs.find((n) => n.dedupe_key === notifData.dedupe_key);
      if (existing) {
        return existing;
      }
    }

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
      link: notifData.action_url || notifData.link,
      action_url: notifData.action_url || notifData.link,
      dedupe_key: notifData.dedupe_key,
      metadata: notifData.metadata || {},
      data: notifData.data || {},
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
    const updatedNotifs = [
      finalNotif,
      ...currentNotifs.filter((n) => n.id !== finalNotif.id && (!finalNotif.dedupe_key || n.dedupe_key !== finalNotif.dedupe_key)),
    ];
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

  static async dismissNotification(userId: string | undefined, id: string): Promise<boolean> {
    if (!userId || !id) return false;

    if (navigator.onLine) {
      await SupabaseService.dismissNotification(id);
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

    const activeCmdMap = new Map<string, typeof commandes[0]>();
    commandes.forEach((cmd) => activeCmdMap.set(cmd.id, cmd));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Purge automatique des alertes orphelines, obsolètes ou pour commandes livrées
    for (const notif of existingNotifs) {
      if (notif.type === 'order_overdue' || notif.type === 'order_due_soon') {
        const cmdId = notif.orderId || notif.metadata?.orderId;
        const matchingCmd = cmdId ? activeCmdMap.get(cmdId) : null;

        // Si la commande n'existe plus, ou est livrée, supprimer l'alerte
        if (!matchingCmd || matchingCmd.statut === 'livree') {
          await this.deleteNotification(userId, notif.id);
          continue;
        }

        // Si la commande a une nouvelle date valide, vérifier si l'alerte est devenue obsolète
        if (matchingCmd.date_livraison_prevue) {
          const datePrev = new Date(matchingCmd.date_livraison_prevue);
          if (!isNaN(datePrev.getTime())) {
            datePrev.setHours(0, 0, 0, 0);
            const diffDays = Math.round((datePrev.getTime() - today.getTime()) / (1000 * 3600 * 24));

            // Si diffDays > 2, la commande n'est plus ni en retard ni imminente (échéance repoussée)
            if (diffDays > 2) {
              await this.deleteNotification(userId, notif.id);
              continue;
            }

            // Si l'alerte était un retard alors que la commande est maintenant sous 0 <= diffDays <= 2
            if (notif.type === 'order_overdue' && diffDays >= 0) {
              await this.deleteNotification(userId, notif.id);
              continue;
            }

            // Si l'alerte était une échéance proche alors que la commande est désormais en retard (diffDays < 0)
            if (notif.type === 'order_due_soon' && diffDays < 0) {
              await this.deleteNotification(userId, notif.id);
              continue;
            }
          }
        }
      }
    }

    // Récupérer la liste nettoyée
    const currentNotifs = await this.getNotifications(userId);

    // 2. Générer les vraies alertes actuelles pour les commandes actives
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

      const todayStr = today.toISOString().split('T')[0];

      // Cas A : Commande en retard (diffDays < 0)
      if (diffDays < 0 && notifRetardEnabled) {
        const daysOverdue = Math.abs(diffDays);
        const dedupeKey = `order_overdue:${cmd.id}:${todayStr}`;
        const alreadyAlerted = currentNotifs.some(
          (n) => n.dedupe_key === dedupeKey || (n.type === 'order_overdue' && (n.orderId === cmd.id || n.metadata?.orderId === cmd.id) && !n.read)
        );

        if (!alreadyAlerted) {
          const templ = NotificationTemplates.orderOverdue(
            userId,
            { id: cmd.id, clientNom: cmd.client_nom, description: cmd.description, dateLivraisonPrevue: formattedDate },
            daysOverdue,
            todayStr
          );
          await this.addNotification(userId, {
            ...templ,
            couturier_id: userId,
          });
        }
      }

      // Cas B : Échéance proche (0 <= diffDays <= 2)
      else if (diffDays >= 0 && diffDays <= 2 && notifRappelEnabled) {
        const dedupeKey = `order_due_soon:${cmd.id}:${todayStr}`;
        const alreadyAlerted = currentNotifs.some(
          (n) => n.dedupe_key === dedupeKey || (n.type === 'order_due_soon' && (n.orderId === cmd.id || n.metadata?.orderId === cmd.id) && !n.read)
        );

        if (!alreadyAlerted) {
          const templ = NotificationTemplates.orderDueSoon(
            userId,
            { id: cmd.id, clientNom: cmd.client_nom, description: cmd.description, dateLivraisonPrevue: formattedDate },
            diffDays,
            todayStr
          );
          await this.addNotification(userId, {
            ...templ,
            couturier_id: userId,
          });
        }
      }
    }

    return this.getNotifications(userId);
  }
}

