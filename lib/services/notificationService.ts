import { createClient } from '../supabase/client';
import {
  NotificationItem,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  CreateNotificationInput,
} from '../types/notification';
import { DbNotification, DbNotificationPreference } from '../types/database';

export interface CreateNotificationOptions {
  couturierId: string;
  type: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  dedupeKey?: string;
  actionUrl?: string;
  link?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  orderId?: string;
  expiresAt?: string | null;
  forceInApp?: boolean;
  sendEmail?: boolean;
}

export interface NotificationPreferenceItem {
  category: NotificationCategory;
  in_app: boolean;
  email: boolean;
}

export const ALL_CATEGORIES: NotificationCategory[] = ['order', 'payment', 'client', 'system', 'account'];

export class NotificationService {
  private static getClient() {
    return createClient();
  }

  // ── 1. Vérification des Préférences Utilisateur ───────────────────
  /**
   * Vérifie si un canal (in-app ou email) est actif pour une catégorie donnée.
   * Si aucune préférence personnalisée n'est encore enregistrée, applique les réglages par défaut.
   */
  static async isChannelAllowed(
    couturierId: string,
    category: NotificationCategory,
    channel: 'in_app' | 'email'
  ): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return channel === 'in_app';

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('couturier_id', couturierId)
        .eq('category', category)
        .maybeSingle();

      if (!error && data) {
        return Boolean(data[channel]);
      }

      // Valeurs par défaut si pas encore configuré en base :
      // - In-app : toujours actif par défaut (sauf si expressément coupé)
      // - Email : inactif par défaut sauf alertes système
      if (channel === 'in_app') return true;
      if (channel === 'email') return category === 'system';
      return true;
    } catch {
      return channel === 'in_app';
    }
  }

  // ── 2. Récupération et Sauvegarde des Préférences ─────────────────
  static async getPreferences(couturierId: string): Promise<Record<NotificationCategory, { in_app: boolean; email: boolean }>> {
    const defaultPrefs: Record<NotificationCategory, { in_app: boolean; email: boolean }> = {
      order: { in_app: true, email: false },
      payment: { in_app: true, email: false },
      client: { in_app: true, email: false },
      system: { in_app: true, email: true },
      account: { in_app: true, email: false },
    };

    const supabase = this.getClient();
    if (!supabase || !couturierId) return defaultPrefs;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('couturier_id', couturierId);

      if (error || !data) return defaultPrefs;

      const merged = { ...defaultPrefs };
      for (const row of data as DbNotificationPreference[]) {
        if (row.category && (row.category as NotificationCategory) in merged) {
          merged[row.category as NotificationCategory] = {
            in_app: Boolean(row.in_app),
            email: Boolean(row.email),
          };
        }
      }
      return merged;
    } catch {
      return defaultPrefs;
    }
  }

  static async updatePreference(
    couturierId: string,
    category: NotificationCategory,
    inApp: boolean,
    email: boolean
  ): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return false;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            couturier_id: couturierId,
            category,
            in_app: inApp,
            email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'couturier_id,category' }
        );

      return !error;
    } catch (e) {
      console.error('[NotificationService] Erreur mise à jour préférences:', e);
      return false;
    }
  }

  // ── 3. Création Sécurisée & Dédupliquée (createNotification) ─────
  static async createNotification(options: CreateNotificationOptions): Promise<NotificationItem | null> {
    const supabase = this.getClient();
    if (!supabase || !options.couturierId) return null;

    const category: NotificationCategory = options.category || 'order';

    // 1. Contrôle des préférences utilisateur (sauf si notification forcée)
    if (!options.forceInApp) {
      const inAppAllowed = await this.isChannelAllowed(options.couturierId, category, 'in_app');
      if (!inAppAllowed) {
        // Le couturier a désactivé ce type de notification in-app
        return null;
      }
    }

    const payload: Partial<DbNotification> = {
      couturier_id: options.couturierId,
      type: options.type,
      category,
      priority: options.priority || 'medium',
      title: options.title,
      message: options.message,
      link: options.actionUrl || options.link || null,
      action_url: options.actionUrl || options.link || null,
      read: false,
      dedupe_key: options.dedupeKey || null,
      expires_at: options.expiresAt || null,
      metadata: {
        ...(options.metadata || {}),
        ...(options.orderId ? { orderId: options.orderId } : {}),
      },
      data: {
        ...(options.data || {}),
        ...(options.orderId ? { orderId: options.orderId } : {}),
      },
    };

    try {
      // Insertion sécurisée avec retour de l'enregistrement créé
      const { data, error } = await supabase
        .from('notifications')
        .insert([payload])
        .select()
        .single();

      if (error) {
        // Code 23505 = violation d'unicité PostgreSQL (la dedupe_key existe déjà)
        if (error.code === '23505' && options.dedupeKey) {
          // Notification déjà existante : on la récupère pacifiquement sans dupliquer
          const { data: existing } = await supabase
            .from('notifications')
            .select('*')
            .eq('couturier_id', options.couturierId)
            .eq('dedupe_key', options.dedupeKey)
            .maybeSingle();

          if (existing) {
            return this.mapDbToItem(existing);
          }
        }
        console.warn('[NotificationService] Insertion ignorée ou existante:', error.message);
        return null;
      }

      const item = this.mapDbToItem(data);

      // Si le canal email est demandé et autorisé, déclencher l'envoi en arrière-plan
      if (options.sendEmail) {
        this.triggerEmailNotification(options).catch((err) =>
          console.warn('[NotificationService] Envoi email échoué:', err)
        );
      }

      return item;
    } catch (e: any) {
      console.error('[NotificationService] Erreur création notification:', e);
      return null;
    }
  }

  // ── 4. Cycle de vie : Lecture, Vue, Fermeture, Résolution ─────────
  static async markAsRead(id: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !id) return false;

    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: now, updated_at: now })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }

  static async markAllAsRead(couturierId: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return false;

    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: now, updated_at: now })
        .eq('couturier_id', couturierId)
        .eq('read', false);

      return !error;
    } catch {
      return false;
    }
  }

  static async markAsSeen(couturierId: string, ids?: string[]): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return false;

    const now = new Date().toISOString();
    try {
      let query = supabase
        .from('notifications')
        .update({ seen_at: now })
        .eq('couturier_id', couturierId)
        .is('seen_at', null);

      if (ids && ids.length > 0) {
        query = query.in('id', ids);
      }

      const { error } = await query;
      return !error;
    } catch {
      return false;
    }
  }

  static async dismissNotification(id: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !id) return false;

    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: now, updated_at: now })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Résout une alerte lorsqu'une action corrige la cause (ex: commande livrée => plus de retard)
   */
  static async resolveNotificationsByDedupePrefix(couturierId: string, prefix: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !couturierId || !prefix) return false;

    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ resolved_at: now, updated_at: now })
        .eq('couturier_id', couturierId)
        .like('dedupe_key', `${prefix}%`)
        .is('resolved_at', null);

      return !error;
    } catch {
      return false;
    }
  }

  // ── 5. Récupération pour l'UI ─────────────────────────────────────
  static async getActiveNotifications(couturierId: string, limit: number = 80): Promise<NotificationItem[]> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return [];

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('couturier_id', couturierId)
        .is('dismissed_at', null)
        .is('resolved_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data.map((row) => this.mapDbToItem(row));
    } catch {
      return [];
    }
  }

  // ── Helpers Internes ─────────────────────────────────────────────
  private static mapDbToItem(row: DbNotification): NotificationItem {
    return {
      id: row.id,
      couturier_id: row.couturier_id,
      type: row.type as NotificationType,
      category: (row.category || 'order') as NotificationCategory,
      priority: (row.priority || 'medium') as NotificationPriority,
      title: row.title,
      message: row.message,
      date: row.created_at,
      read: Boolean(row.read),
      link: row.action_url || row.link || undefined,
      action_url: row.action_url || row.link || undefined,
      metadata: row.metadata || {},
      data: row.data || {},
      orderId: (row.data?.orderId || row.metadata?.orderId) as string | undefined,
      dedupe_key: row.dedupe_key || undefined,
      seen_at: row.seen_at,
      read_at: row.read_at,
      dismissed_at: row.dismissed_at,
      resolved_at: row.resolved_at,
      expires_at: row.expires_at,
    };
  }

  private static async triggerEmailNotification(options: CreateNotificationOptions) {
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couturierId: options.couturierId,
          title: options.title,
          message: options.message,
          actionUrl: options.actionUrl || options.link,
        }),
      });
    } catch {
      // Ignorer les erreurs d'envoi réseau non bloquantes
    }
  }
}

// ==============================================================================
// GABARITS DE NOTIFICATIONS STANDARDIZÉS (Templates V2)
// Chaque gabarit garantit une `dedupeKey` unique pour rendre impossible les doublons.
// ==============================================================================
export const NotificationTemplates = {
  welcome: (couturierId: string, atelierName?: string): CreateNotificationOptions => ({
    couturierId,
    type: 'welcome',
    category: 'account',
    priority: 'medium',
    dedupeKey: `welcome:${couturierId}`,
    title: '🎉 Bienvenue sur Ourlette !',
    message: `Heureux de vous compter parmi nous ${atelierName ? `– ${atelierName}` : ''} ! Prenez en main la gestion de vos clients, commandes et vitrine d'atelier.`,
    actionUrl: '/clients/nouveau',
    link: '/clients/nouveau',
  }),

  orderCreated: (
    couturierId: string,
    order: { id: string; clientNom?: string; description?: string }
  ): CreateNotificationOptions => ({
    couturierId,
    type: 'order_created',
    category: 'order',
    priority: 'medium',
    dedupeKey: `order_created:${order.id}`,
    title: '✂️ Nouvelle commande',
    message: `Commande enregistrée pour ${order.clientNom || 'le client'}${order.description ? ` (${order.description})` : ''}.`,
    actionUrl: `/commandes/${order.id}`,
    link: `/commandes/${order.id}`,
    orderId: order.id,
  }),

  orderDueSoon: (
    couturierId: string,
    order: { id: string; clientNom?: string; description?: string; dateLivraisonPrevue: string },
    daysRemaining: number,
    dateKey: string // YYYY-MM-DD
  ): CreateNotificationOptions => {
    const isToday = daysRemaining === 0;
    const isTomorrow = daysRemaining === 1;
    const title = isToday ? "⚠️ Livraison aujourd'hui !" : isTomorrow ? '⏳ Livraison demain !' : `⏳ Livraison dans ${daysRemaining} jours`;

    return {
      couturierId,
      type: 'order_due_soon',
      category: 'order',
      priority: isToday ? 'high' : 'medium',
      dedupeKey: `order_due_soon:${order.id}:${dateKey}`,
      title,
      message: `La commande pour ${order.clientNom || 'le client'}${order.description ? ` (${order.description})` : ''} arrive à échéance le ${order.dateLivraisonPrevue}.`,
      actionUrl: `/commandes/${order.id}`,
      link: `/commandes/${order.id}`,
      orderId: order.id,
      data: { daysRemaining, dateLivraisonPrevue: order.dateLivraisonPrevue },
    };
  },

  orderOverdue: (
    couturierId: string,
    order: { id: string; clientNom?: string; description?: string; dateLivraisonPrevue: string },
    daysOverdue: number,
    dateKey: string // YYYY-MM-DD
  ): CreateNotificationOptions => ({
    couturierId,
    type: 'order_overdue',
    category: 'order',
    priority: 'urgent',
    dedupeKey: `order_overdue:${order.id}:${dateKey}`,
    title: `🚨 Commande en retard (${daysOverdue} j)`,
    message: `La livraison pour ${order.clientNom || 'le client'}${order.description ? ` (${order.description})` : ''} était prévue le ${order.dateLivraisonPrevue}.`,
    actionUrl: `/commandes/${order.id}`,
    link: `/commandes/${order.id}`,
    orderId: order.id,
    data: { daysOverdue, dateLivraisonPrevue: order.dateLivraisonPrevue },
  }),

  orderReady: (
    couturierId: string,
    order: { id: string; clientNom?: string; description?: string }
  ): CreateNotificationOptions => ({
    couturierId,
    type: 'order_status',
    category: 'order',
    priority: 'medium',
    dedupeKey: `order_ready:${order.id}`,
    title: '✨ Commande prête',
    message: `La commande de ${order.clientNom || 'le client'} est prête pour l'essayage ou la livraison.`,
    actionUrl: `/commandes/${order.id}`,
    link: `/commandes/${order.id}`,
    orderId: order.id,
  }),

  paymentReceived: (
    couturierId: string,
    order: { id: string; clientNom?: string },
    versement: { id: string; montant: number; devise?: string }
  ): CreateNotificationOptions => ({
    couturierId,
    type: 'payment_received',
    category: 'payment',
    priority: 'medium',
    dedupeKey: `payment_received:${order.id}:${versement.id}`,
    title: '💰 Versement reçu',
    message: `Paiement de ${versement.montant.toLocaleString('fr-FR')} ${versement.devise || 'FCFA'} enregistré pour ${order.clientNom || 'la commande'}.`,
    actionUrl: `/commandes/${order.id}`,
    link: `/commandes/${order.id}`,
    orderId: order.id,
    data: { montant: versement.montant, versementId: versement.id },
  }),

  clientCreated: (
    couturierId: string,
    client: { id: string; nom: string }
  ): CreateNotificationOptions => ({
    couturierId,
    type: 'client_created',
    category: 'client',
    priority: 'low',
    dedupeKey: `client_created:${client.id}`,
    title: '👤 Nouveau client',
    message: `Fiche de ${client.nom} créée avec succès.`,
    actionUrl: `/clients/${client.id}`,
    link: `/clients/${client.id}`,
  }),
};
