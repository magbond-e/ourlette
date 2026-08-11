import { SupabaseService } from './supabaseService';
import { CodePromo } from '../types/database';
import { PRO_PLAN_PRICE } from '../utils/planLimits';

export const KKIAPAY_CONFIG = {
  key: process.env.NEXT_PUBLIC_KKIAPAY_KEY || '1eb64ce094f811f18bc145c6149be787',
  publicKey: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || 'tpk_1eb673f094f811f18bc145c6149be787',
  secretKey: process.env.KKIAPAY_SECRET_KEY || 'tsk_1eb673f194f811f18bc145c6149be787',
  sandbox: false, // Production or sandbox flag
  defaultPrice: PRO_PLAN_PRICE, // 2999 FCFA
};

declare global {
  interface Window {
    openKkiapayWidget?: (options: {
      amount: number;
      key: string;
      position?: string;
      sandbox?: boolean;
      data?: string;
      phone?: string;
      name?: string;
      email?: string;
      callback?: string;
      theme?: string;
    }) => void;
    addKkiapayListener?: (
      event: 'success' | 'failed',
      callback: (response: any) => void
    ) => void;
    removeKkiapayListener?: (
      event: 'success' | 'failed',
      callback: (response: any) => void
    ) => void;
  }
}

export class KkiapayService {
  private static scriptLoaded = false;
  private static scriptPromise: Promise<boolean> | null = null;

  /**
   * Dynamically loads the KKiaPay JS SDK script from CDN
   */
  static loadScript(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (this.scriptLoaded && window.openKkiapayWidget) return Promise.resolve(true);
    if (this.scriptPromise) return this.scriptPromise;

    this.scriptPromise = new Promise((resolve) => {
      const existingScript = document.querySelector('script[src="https://cdn.kkiapay.me/k.js"]');
      if (existingScript) {
        this.scriptLoaded = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.kkiapay.me/k.js';
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load KKiaPay SDK');
        resolve(false);
      };
      document.body.appendChild(script);
    });

    return this.scriptPromise;
  }

  /**
   * Validate a promo code against Supabase / local rules
   */
  static async validatePromoCode(
    code: string
  ): Promise<{ valid: boolean; discountAmount: number; finalPrice: number; promo?: CodePromo; message?: string }> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, discountAmount: 0, finalPrice: PRO_PLAN_PRICE, message: 'Code promo vide.' };
    }

    const supabase = SupabaseService['getClient']();
    if (!supabase) {
      return { valid: false, discountAmount: 0, finalPrice: PRO_PLAN_PRICE, message: 'Connexion indisponible.' };
    }

    try {
      const { data, error } = await supabase
        .from('codes_promo')
        .select('*')
        .eq('code', cleanCode)
        .eq('actif', true)
        .maybeSingle();

      if (error || !data) {
        return { valid: false, discountAmount: 0, finalPrice: PRO_PLAN_PRICE, message: 'Code promo invalide ou expiré.' };
      }

      const promo = data as CodePromo;

      // Check max uses
      if (promo.nombre_utilisation_max && promo.nombre_utilisation_actuel >= promo.nombre_utilisation_max) {
        return { valid: false, discountAmount: 0, finalPrice: PRO_PLAN_PRICE, message: 'Limite d’utilisation de ce code atteinte.' };
      }

      // Check expiration date
      if (promo.date_expiration && new Date(promo.date_expiration) < new Date()) {
        return { valid: false, discountAmount: 0, finalPrice: PRO_PLAN_PRICE, message: 'Ce code promo a expiré.' };
      }

      let discount = 0;
      if (promo.type === 'pourcentage') {
        discount = Math.round((PRO_PLAN_PRICE * promo.valeur) / 100);
      } else {
        discount = promo.valeur;
      }

      const finalPrice = Math.max(0, PRO_PLAN_PRICE - discount);

      return {
        valid: true,
        discountAmount: discount,
        finalPrice,
        promo,
        message: `Code promo appliqué ! Remise de ${discount} FCFA.`,
      };
    } catch (e) {
      return { valid: false, discountAmount: 0, finalPrice: PRO_PLAN_PRICE, message: 'Erreur lors de la vérification.' };
    }
  }

  /**
   * Triggers KKiaPay widget payment popup
   */
  static async openPaymentWidget(options: {
    amount: number;
    email?: string;
    phone?: string;
    name?: string;
    data?: string;
    onSuccess: (response: { transactionId: string }) => void;
    onFailed?: (error: any) => void;
  }): Promise<void> {
    const loaded = await this.loadScript();
    if (!loaded || !window.openKkiapayWidget) {
      alert('Impossible de charger le module KKiaPay. Veuillez vérifier votre connexion.');
      return;
    }

    const successHandler = (data: any) => {
      if (window.removeKkiapayListener) {
        window.removeKkiapayListener('success', successHandler);
      }
      options.onSuccess({
        transactionId: data.transactionId || data.reference || `trx_${Date.now()}`,
      });
    };

    const failedHandler = (err: any) => {
      if (window.removeKkiapayListener) {
        window.removeKkiapayListener('failed', failedHandler);
      }
      if (options.onFailed) options.onFailed(err);
    };

    if (window.addKkiapayListener) {
      window.addKkiapayListener('success', successHandler);
      window.addKkiapayListener('failed', failedHandler);
    }

    window.openKkiapayWidget({
      amount: options.amount,
      key: KKIAPAY_CONFIG.key,
      position: 'center',
      sandbox: KKIAPAY_CONFIG.sandbox,
      data: options.data || 'Abonnement Pro Ourlette',
      phone: options.phone || '',
      name: options.name || '',
      email: options.email || '',
      theme: '#8B1E2F', // Palette accent sombre Ourlette
    });
  }
}
