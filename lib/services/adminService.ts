import { SupabaseService } from './supabaseService';
import { Couturier, CodePromo, Abonnement, AdminLog } from '../types/database';
import { PRO_PLAN_PRICE } from '../utils/planLimits';

export interface AdminKPIs {
  totalCouturiers: number;
  activeCouturiers: number; // At least 1 commande
  newCouturiers30d: number;
  totalCommandes: number;
  activeVitrines: number;
  proCount: number;
  freeCount: number;
}

export interface FinancialMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue (MRR * 12)
  totalRevenue: number;
  averageBasket: number; // Panier moyen
  conversionRate: number; // Free -> Pro %
  churnRate: number; // Monthly Churn %
  estimatedLtv: number; // LifeTime Value
  resaleValuationMin: number; // 3x ARR
  resaleValuationMax: number; // 5x ARR
}

export interface GrowthChartPoint {
  date: string;
  inscriptions: number;
  commandes: number;
}

export class AdminService {
  private static getSupabase() {
    return SupabaseService['getClient']();
  }

  /**
   * Fetch overview KPIs for the admin dashboard
   */
  static async getDashboardKPIs(): Promise<AdminKPIs> {
    const supabase = this.getSupabase();
    if (!supabase) {
      return {
        totalCouturiers: 0,
        activeCouturiers: 0,
        newCouturiers30d: 0,
        totalCommandes: 0,
        activeVitrines: 0,
        proCount: 0,
        freeCount: 0,
      };
    }

    try {
      // 1. Couturiers stats
      const { data: couturiers } = await supabase.from('couturiers').select('id, plan, vitrine_active, date_creation');
      const totalCouturiers = couturiers?.length || 0;
      const proCount = couturiers?.filter((c) => c.plan === 'pro').length || 0;
      const freeCount = totalCouturiers - proCount;
      const activeVitrines = couturiers?.filter((c) => c.vitrine_active).length || 0;

      const date30DaysAgo = new Date();
      date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
      const newCouturiers30d = couturiers?.filter(
        (c) => c.date_creation && new Date(c.date_creation) >= date30DaysAgo
      ).length || 0;

      // 2. Commandes stats
      const { data: commandes } = await supabase.from('commandes').select('id, couturier_id');
      const totalCommandes = commandes?.length || 0;

      const couturiersWithOrders = new Set(commandes?.map((cmd) => cmd.couturier_id) || []);
      const activeCouturiers = couturiersWithOrders.size;

      return {
        totalCouturiers,
        activeCouturiers,
        newCouturiers30d,
        totalCommandes,
        activeVitrines,
        proCount,
        freeCount,
      };
    } catch (e) {
      console.error('Error fetching admin KPIs:', e);
      return {
        totalCouturiers: 0,
        activeCouturiers: 0,
        newCouturiers30d: 0,
        totalCommandes: 0,
        activeVitrines: 0,
        proCount: 0,
        freeCount: 0,
      };
    }
  }

  /**
   * Fetch growth chart data points grouped by day
   */
  static async getGrowthChartData(period: '7j' | '30j' | '90j' | 'tout' = '30j'): Promise<GrowthChartPoint[]> {
    const supabase = this.getSupabase();
    if (!supabase) return [];

    let daysCount = 30;
    if (period === '7j') daysCount = 7;
    if (period === '90j') daysCount = 90;
    if (period === 'tout') daysCount = 180;

    const points: Record<string, { date: string; inscriptions: number; commandes: number }> = {};

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      points[dateStr] = { date: dateStr, inscriptions: 0, commandes: 0 };
    }

    try {
      const { data: couturiers } = await supabase.from('couturiers').select('date_creation');
      const { data: commandes } = await supabase.from('commandes').select('date_commande');

      couturiers?.forEach((c) => {
        if (c.date_creation) {
          const day = c.date_creation.split('T')[0];
          if (points[day]) points[day].inscriptions += 1;
        }
      });

      commandes?.forEach((cmd) => {
        if (cmd.date_commande) {
          const day = cmd.date_commande.split('T')[0];
          if (points[day]) points[day].commandes += 1;
        }
      });

      return Object.values(points);
    } catch (e) {
      return Object.values(points);
    }
  }

  /**
   * Fetch list of all couturiers with details
   */
  static async getAllCouturiers(): Promise<Couturier[]> {
    const supabase = this.getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('couturiers')
        .select('*')
        .order('date_creation', { ascending: false });

      if (error || !data) return [];
      return data as Couturier[];
    } catch (e) {
      return [];
    }
  }

  /**
   * Change account plan manually (Free <-> Pro)
   */
  static async updateCouturierPlan(
    adminUserId: string,
    couturierId: string,
    targetPlan: 'free' | 'pro',
    isManual: boolean = true
  ): Promise<boolean> {
    const supabase = this.getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('couturiers')
        .update({
          plan: targetPlan,
          plan_change_manuel: isManual,
          updated_at: new Date().toISOString(),
        })
        .eq('id', couturierId);

      if (error) return false;

      // Log admin action
      await supabase.from('admin_logs').insert([
        {
          admin_id: adminUserId,
          action: 'changement_plan',
          cible_type: 'couturier',
          cible_id: couturierId,
          details: { nouveau_plan: targetPlan, manuel: isManual },
        },
      ]);

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Toggle couturier status (actif / suspendu)
   */
  static async updateCouturierStatus(
    adminUserId: string,
    couturierId: string,
    targetStatus: 'actif' | 'suspendu'
  ): Promise<boolean> {
    const supabase = this.getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('couturiers')
        .update({
          statut_compte: targetStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', couturierId);

      if (error) return false;

      // Log admin action
      await supabase.from('admin_logs').insert([
        {
          admin_id: adminUserId,
          action: 'changement_statut',
          cible_type: 'couturier',
          cible_id: couturierId,
          details: { nouveau_statut: targetStatus },
        },
      ]);

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Promo Codes Management
   */
  static async getPromoCodes(): Promise<CodePromo[]> {
    const supabase = this.getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('codes_promo')
        .select('*')
        .order('date_creation', { ascending: false });

      if (error || !data) return [];
      return data as CodePromo[];
    } catch (e) {
      return [];
    }
  }

  static async createPromoCode(
    adminUserId: string,
    codeData: Omit<CodePromo, 'id' | 'nombre_utilisation_actuel' | 'date_creation'>
  ): Promise<CodePromo | null> {
    const supabase = this.getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('codes_promo')
        .insert([
          {
            ...codeData,
            code: codeData.code.trim().toUpperCase(),
            nombre_utilisation_actuel: 0,
          },
        ])
        .select()
        .single();

      if (error) return null;

      // Log action
      await supabase.from('admin_logs').insert([
        {
          admin_id: adminUserId,
          action: 'creation_code_promo',
          cible_type: 'code_promo',
          cible_id: data.id,
          details: { code: data.code, valeur: data.valeur },
        },
      ]);

      return data as CodePromo;
    } catch (e) {
      return null;
    }
  }

  static async togglePromoCode(adminUserId: string, promoId: string, active: boolean): Promise<boolean> {
    const supabase = this.getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('codes_promo').update({ actif: active }).eq('id', promoId);
      if (error) return false;

      await supabase.from('admin_logs').insert([
        {
          admin_id: adminUserId,
          action: active ? 'activation_code_promo' : 'desactivation_code_promo',
          cible_type: 'code_promo',
          cible_id: promoId,
        },
      ]);

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Financial Analytics & SaaS Valuation calculation
   */
  static async getFinancialMetrics(): Promise<FinancialMetrics> {
    const supabase = this.getSupabase();
    if (!supabase) {
      return {
        mrr: 0,
        arr: 0,
        totalRevenue: 0,
        averageBasket: PRO_PLAN_PRICE,
        conversionRate: 0,
        churnRate: 3.5,
        estimatedLtv: 0,
        resaleValuationMin: 0,
        resaleValuationMax: 0,
      };
    }

    try {
      // 1. Get couturiers with plan='pro' and plan_change_manuel=false
      const { data: couturiers } = await supabase.from('couturiers').select('id, plan, plan_change_manuel');
      const totalCount = couturiers?.length || 0;

      const paidProCouturiers = couturiers?.filter(
        (c) => c.plan === 'pro' && !c.plan_change_manuel
      ) || [];
      const totalProCount = couturiers?.filter((c) => c.plan === 'pro').length || 0;

      const mrr = paidProCouturiers.length * PRO_PLAN_PRICE;
      const arr = mrr * 12;

      // 2. Total revenue from abonnements table
      const { data: abonnements } = await supabase.from('abonnements').select('montant');
      const totalRevenue = abonnements?.reduce((sum, a) => sum + (Number(a.montant) || 0), 0) || (paidProCouturiers.length * PRO_PLAN_PRICE);

      const conversionRate = totalCount > 0 ? Number(((totalProCount / totalCount) * 100).toFixed(1)) : 0;
      const averageBasket = PRO_PLAN_PRICE;
      const churnRate = 3.5; // Estimated 3.5% monthly churn for niche SaaS
      const estimatedLtv = Math.round(averageBasket / (churnRate / 100));

      const resaleValuationMin = arr * 3;
      const resaleValuationMax = arr * 5;

      return {
        mrr,
        arr,
        totalRevenue,
        averageBasket,
        conversionRate,
        churnRate,
        estimatedLtv,
        resaleValuationMin,
        resaleValuationMax,
      };
    } catch (e) {
      return {
        mrr: 0,
        arr: 0,
        totalRevenue: 0,
        averageBasket: PRO_PLAN_PRICE,
        conversionRate: 0,
        churnRate: 3.5,
        estimatedLtv: 0,
        resaleValuationMin: 0,
        resaleValuationMax: 0,
      };
    }
  }
}
