import { createClient } from '@/lib/supabase/client';
import { PRO_PLAN_PRICE } from '@/lib/utils/planLimits';
import { Couturier } from '@/lib/types/database';
import { DataService } from '@/lib/services/dataService';

export const MAKETOU_CONFIG = {
  apiKey: process.env.MAKETOU_SECRET_KEY || 'msk_8783dad10af9dd5678911f54c07c9da7b1a32524a2e64b959fdb54da52c26e14',
  productUrl: process.env.NEXT_PUBLIC_MAKETOU_PRODUCT_URL || 'https://ourlette.mymaketou.shop/products/abonnement-mensuel-ourlette',
  checkoutUrl: process.env.NEXT_PUBLIC_MAKETOU_CHECKOUT_URL || 'https://ourlette.mymaketou.shop/products/abonnement-mensuel-ourlette/checkout',
  productId: process.env.NEXT_PUBLIC_MAKETOU_PRODUCT_ID || '91778af7-2bd2-47cd-8b71-0fbf758d603a',
  defaultPrice: PRO_PLAN_PRICE, // 1999 FCFA
};

export interface MakeTouCheckoutOptions {
  couturierId: string;
  email?: string;
  phone?: string;
  name?: string;
  returnUrl?: string;
  amount?: number;
}

export class MakeTouService {
  /**
   * Builds the MakeTou checkout URL with pre-filled customer details and tracking reference
   */
  static buildCheckoutUrl(options: MakeTouCheckoutOptions): string {
    const base = MAKETOU_CONFIG.checkoutUrl;
    try {
      const url = new URL(base);
      if (options.couturierId) {
        url.searchParams.set('ref', options.couturierId);
        url.searchParams.set('custom_data', options.couturierId);
      }
      if (options.email) url.searchParams.set('email', options.email);
      if (options.phone) url.searchParams.set('phone', options.phone);
      if (options.name) url.searchParams.set('name', options.name);
      if (options.returnUrl) {
        url.searchParams.set('return_url', options.returnUrl);
        url.searchParams.set('redirect_url', options.returnUrl);
      }
      return url.toString();
    } catch {
      return base;
    }
  }

  /**
   * Activates the Pro plan for a couturier following successful payment
   */
  static async activateProSubscription(
    couturierId: string,
    amount: number = MAKETOU_CONFIG.defaultPrice,
    transactionId?: string
  ): Promise<boolean> {
    if (!couturierId) return false;

    // 1. Update couturier in DataService
    const updated = await DataService.updateCouturier(couturierId, {
      plan: 'pro',
      plan_change_manuel: false,
    });

    // 2. Insert subscription record in Supabase `abonnements` if online
    const supabase = createClient();
    if (supabase) {
      const now = new Date();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      try {
        await supabase.from('abonnements').insert([
          {
            couturier_id: couturierId,
            plan: 'pro',
            montant: amount,
            devise: 'FCFA',
            transaction_id: transactionId || `maketou_${Date.now()}`,
            date_debut: now.toISOString(),
            date_fin: expiry.toISOString(),
            statut: 'actif',
          },
        ]);
      } catch (err) {
        console.warn('Abonnement insert note:', err);
      }
    }

    return !!updated;
  }
}
