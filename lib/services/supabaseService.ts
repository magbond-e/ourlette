import { createClient } from '../supabase/client';
import { Client, Mesure, Commande, Couturier, Realisation, Versement, DbNotification } from '../types/database';
import { NotificationItem, CreateNotificationInput } from '../types/notification';

export class SupabaseService {
  private static getClient() {
    return createClient();
  }

  // ── Couturiers / Profil Atelier ──────────────────────────────────
  static async getCouturier(slugOrId?: string): Promise<Couturier | null> {
    const supabase = this.getClient();
    if (!supabase || !slugOrId) return null;

    const { data, error } = await supabase
      .from('couturiers')
      .select('*')
      .or(`id.eq.${slugOrId},slug_vitrine.eq.${slugOrId}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as Couturier;
  }

  static async createOrEnsureCouturier(userId: string, profileData: Partial<Couturier>): Promise<Couturier | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const existing = await this.getCouturier(userId);
    if (existing) return existing;

    const slugBase = (profileData.nom_atelier || 'atelier')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `atelier-${userId.substring(0, 6)}`;

    const newProfile: Partial<Couturier> = {
      id: userId,
      nom: profileData.nom || 'Artisan Couturier',
      nom_atelier: profileData.nom_atelier || 'Mon Atelier',
      email: profileData.email || '',
      telephone: profileData.telephone || '',
      whatsapp_contact: profileData.whatsapp_contact || profileData.telephone || '',
      ville: profileData.ville || '',
      pays: profileData.pays || '',
      slug_vitrine: profileData.slug_vitrine || slugBase,
      langue: profileData.langue || 'fr',
      devise: profileData.devise || 'FCFA',
      plan: 'free',
      notifications_email: true,
      notif_rappel_livraison: true,
      notif_retard: true,
    };

    const { data, error } = await supabase
      .from('couturiers')
      .upsert([newProfile])
      .select()
      .single();

    if (error) {
      console.error('Error creating couturier profile:', error);
      return null;
    }
    return data as Couturier;
  }

  static async updateCouturier(id: string, updates: Partial<Couturier>): Promise<Couturier | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('couturiers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating couturier:', error);
      return null;
    }
    return data as Couturier;
  }

  // ── Clients ──────────────────────────────────────────────────────
  static async getClients(couturierId: string): Promise<Client[]> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return [];

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('couturier_id', couturierId)
      .order('date_creation', { ascending: false });

    if (error || !data) return [];
    return data as Client[];
  }

  static async getClientById(id: string): Promise<Client | null> {
    const supabase = this.getClient();
    if (!supabase || !id) return null;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Client;
  }

  static async addClient(client: Omit<Client, 'id' | 'date_creation'> & { id?: string }): Promise<Client | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();

    if (error) {
      console.error('Error adding client to Supabase:', error);
      return null;
    }
    return data as Client;
  }

  static async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data as Client;
  }

  static async deleteClient(id: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase) return false;

    const { error } = await supabase.from('clients').delete().eq('id', id);
    return !error;
  }

  // ── Mesures ──────────────────────────────────────────────────────
  static async getMesureByClientId(clientId: string): Promise<Mesure | null> {
    const supabase = this.getClient();
    if (!supabase || !clientId) return null;

    const { data, error } = await supabase
      .from('mesures')
      .select('*')
      .eq('client_id', clientId)
      .order('date_maj', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as Mesure;
  }

  static async saveMesures(clientId: string, mesuresData: Partial<Mesure>): Promise<Mesure | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const existing = await this.getMesureByClientId(clientId);
    if (existing) {
      const { data, error } = await supabase
        .from('mesures')
        .update({
          ...mesuresData,
          date_maj: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return null;
      return data as Mesure;
    } else {
      const { data, error } = await supabase
        .from('mesures')
        .insert([{
          client_id: clientId,
          ...mesuresData,
          date_maj: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) return null;
      return data as Mesure;
    }
  }

  // ── Commandes ────────────────────────────────────────────────────
  static async getCommandes(couturierId: string): Promise<Commande[]> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return [];

    const { data, error } = await supabase
      .from('commandes')
      .select(`
        *,
        clients (
          nom,
          telephone
        )
      `)
      .eq('couturier_id', couturierId)
      .order('date_commande', { ascending: false });

    if (error || !data) return [];
    
    return data.map((item: any) => ({
      ...item,
      client_nom: item.clients?.nom || 'Client inconnu',
      client_telephone: item.clients?.telephone || '',
    })) as Commande[];
  }

  static async getCommandeById(id: string): Promise<Commande | null> {
    const supabase = this.getClient();
    if (!supabase || !id) return null;

    const { data, error } = await supabase
      .from('commandes')
      .select(`
        *,
        clients (
          nom,
          telephone
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      client_nom: data.clients?.nom || 'Client inconnu',
      client_telephone: data.clients?.telephone || '',
    } as Commande;
  }

  static async addCommande(commande: Omit<Commande, 'id' | 'date_commande'> & { id?: string }): Promise<Commande | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const { client_nom, client_telephone, ...dbPayload } = commande as any;

    const { data, error } = await supabase
      .from('commandes')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      console.error('Error adding order to Supabase:', error);
      return null;
    }
    return data as Commande;
  }

  static async updateCommande(id: string, updates: Partial<Commande>): Promise<Commande | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const { client_nom, client_telephone, ...dbPayload } = updates as any;

    const { data, error } = await supabase
      .from('commandes')
      .update({
        ...dbPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return data as Commande;
  }

  static async deleteCommande(id: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !id) return false;

    const { error } = await supabase.from('commandes').delete().eq('id', id);
    return !error;
  }

  static async addVersement(cmdId: string, montant: number, note?: string): Promise<Commande | null> {
    const cmd = await this.getCommandeById(cmdId);
    if (!cmd) return null;

    const currentVersements: Versement[] = cmd.versements || [
      ...(cmd.acompte > 0 ? [{ id: 'vers-0', montant: cmd.acompte, date: cmd.date_commande || new Date().toISOString(), note: 'Acompte initial' }] : []),
    ];

    const newVersement: Versement = {
      id: `vers-${Date.now()}`,
      montant,
      date: new Date().toISOString(),
      note: note || 'Versement complémentaire',
    };

    const updatedVersements = [...currentVersements, newVersement];
    const newTotalAcompte = updatedVersements.reduce((sum, v) => sum + v.montant, 0);

    return this.updateCommande(cmdId, {
      acompte: newTotalAcompte,
      versements: updatedVersements,
    });
  }

  // ── Realisations ─────────────────────────────────────────────────
  static async getRealisations(couturierId: string): Promise<Realisation[]> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return [];

    const { data, error } = await supabase
      .from('realisations')
      .select('*')
      .eq('couturier_id', couturierId)
      .order('date_publication', { ascending: false });

    if (error || !data) return [];
    return data as Realisation[];
  }

  static async addRealisation(realisation: Omit<Realisation, 'id' | 'date_publication'> & { id?: string }): Promise<Realisation | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('realisations')
      .insert([realisation])
      .select()
      .single();

    if (error) {
      console.error('Error adding realisation to Supabase:', error);
      return null;
    }
    return data as Realisation;
  }

  static async deleteRealisation(id: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase) return false;

    const { error } = await supabase.from('realisations').delete().eq('id', id);
    return !error;
  }

  // ── Storage / Images ─────────────────────────────────────────────
  static async uploadImage(bucket: string, path: string, file: File): Promise<string | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (error) {
        console.error('Error uploading image to Supabase Storage:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicUrlData?.publicUrl || null;
    } catch (e) {
      console.error('Failed image upload:', e);
      return null;
    }
  }

  // ── Notifications ────────────────────────────────────────────────
  static async getNotifications(couturierId: string): Promise<NotificationItem[]> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return [];

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('couturier_id', couturierId)
        .order('created_at', { ascending: false })
        .limit(80);

      if (error) {
        console.warn('Could not fetch notifications from Supabase:', error.message);
        return [];
      }

      return (data || []).map((row: DbNotification) => ({
        id: row.id,
        couturier_id: row.couturier_id,
        type: row.type as any,
        category: (row.category || 'order') as any,
        priority: (row.priority || 'medium') as any,
        title: row.title,
        message: row.message,
        date: row.created_at,
        read: Boolean(row.read),
        link: row.link || undefined,
        metadata: row.metadata || {},
        orderId: row.metadata?.orderId || undefined,
      }));
    } catch (e) {
      console.error('Error fetching notifications:', e);
      return [];
    }
  }

  static async addNotification(input: CreateNotificationInput): Promise<NotificationItem | null> {
    const supabase = this.getClient();
    if (!supabase || !input.couturier_id) return null;

    try {
      const payload: Partial<DbNotification> = {
        couturier_id: input.couturier_id,
        type: input.type,
        category: input.category || 'order',
        priority: input.priority || 'medium',
        title: input.title,
        message: input.message,
        link: input.link || null,
        read: input.read || false,
        metadata: {
          ...(input.metadata || {}),
          ...(input.orderId ? { orderId: input.orderId } : {}),
        },
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([payload])
        .select()
        .single();

      if (error || !data) {
        console.error('Error adding notification:', error);
        return null;
      }

      return {
        id: data.id,
        couturier_id: data.couturier_id,
        type: data.type as any,
        category: data.category as any,
        priority: data.priority as any,
        title: data.title,
        message: data.message,
        date: data.created_at,
        read: data.read,
        link: data.link || undefined,
        metadata: data.metadata || {},
        orderId: data.metadata?.orderId || undefined,
      };
    } catch (e) {
      console.error('Error adding notification to Supabase:', e);
      return null;
    }
  }

  static async markNotificationAsRead(id: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !id) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      return !error;
    } catch (e) {
      console.error('Error marking notification as read:', e);
      return false;
    }
  }

  static async markAllNotificationsAsRead(couturierId: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('couturier_id', couturierId)
        .eq('read', false);

      return !error;
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
      return false;
    }
  }

  static async deleteNotification(id: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !id) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      return !error;
    } catch (e) {
      console.error('Error deleting notification:', e);
      return false;
    }
  }

  static async clearAllNotifications(couturierId: string): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase || !couturierId) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('couturier_id', couturierId);

      return !error;
    } catch (e) {
      console.error('Error clearing notifications:', e);
      return false;
    }
  }
}

