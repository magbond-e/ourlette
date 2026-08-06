import { createClient } from '../supabase/client';
import { Client, Mesure, Commande, Couturier, Realisation, StatutCommande } from '../types/database';

export class SupabaseService {
  private static getClient() {
    return createClient();
  }

  // ── Couturiers / Profil Atelier ──────────────────────────────────
  static async getCouturier(slugOrId?: string): Promise<Couturier | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    let query = supabase.from('couturiers').select('*');
    if (slugOrId) {
      query = query.or(`id.eq.${slugOrId},slug_vitrine.eq.${slugOrId}`);
    }

    const { data, error } = await query.limit(1).single();
    if (error || !data) return null;
    return data as Couturier;
  }

  static async updateCouturier(id: string, updates: Partial<Couturier>): Promise<Couturier | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('couturiers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data as Couturier;
  }

  // ── Clients ──────────────────────────────────────────────────────
  static async getClients(couturierId: string): Promise<Client[]> {
    const supabase = this.getClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('couturier_id', couturierId)
      .order('date_creation', { ascending: false });

    if (error || !data) return [];
    return data as Client[];
  }

  static async addClient(client: Omit<Client, 'id' | 'date_creation'>): Promise<Client | null> {
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
      .update(updates)
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
    if (!supabase) return null;

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
    if (!supabase) return [];

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
    
    // Hydrate client_nom & client_telephone from relation
    return data.map((item: any) => ({
      ...item,
      client_nom: item.clients?.nom || 'Client inconnu',
      client_telephone: item.clients?.telephone || '',
    })) as Commande[];
  }

  static async addCommande(commande: Omit<Commande, 'id' | 'date_commande'>): Promise<Commande | null> {
    const supabase = this.getClient();
    if (!supabase) return null;

    const { client_nom, client_telephone, versements, ...dbPayload } = commande as any;

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
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data as Commande;
  }
}
