import { Couturier } from '../types/database';

/**
 * Feature flag: Controls visibility of account plans, tiers, badges, and limits.
 * Set to false to hide Free/Pro distinctions, pricing tables, and limits when showcasing to users.
 */
export const SHOW_ACCOUNT_PLANS = false;

export const FREE_PLAN_LIMITS = {
  maxActiveCommandes: 10,
  maxRealisations: 8,
  allowCustomSlug: false,
};

export const PRO_PLAN_PRICE = 1999; // FCFA / mois

export const PRO_PLAN_LIMITS = {
  maxActiveCommandes: Infinity,
  maxRealisations: Infinity,
  allowCustomSlug: true,
};

/**
 * Generate a random 6-character alphanumeric slug for Free Plan workshops
 * Example: "atelier-k7x9p2"
 */
export function generateRandomSlug(prefix: string = 'atelier'): string {
  const randomChars = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${randomChars}`.toLowerCase();
}

/**
 * Check if the couturier is on the Pro Plan
 */
export function isProPlan(couturier: Couturier | null | undefined): boolean {
  return couturier?.plan === 'pro';
}

/**
 * Check if a new active order can be created based on plan limits
 */
export function checkCommandeLimit(
  couturier: Couturier | null | undefined,
  activeCommandesCount: number
): { allowed: boolean; message?: string } {
  // If plan limits are hidden/disabled for presentation, allow unlimited orders
  if (!SHOW_ACCOUNT_PLANS || isProPlan(couturier)) {
    return { allowed: true };
  }

  if (activeCommandesCount >= FREE_PLAN_LIMITS.maxActiveCommandes) {
    return {
      allowed: false,
      message: `Vous avez atteint la limite de ${FREE_PLAN_LIMITS.maxActiveCommandes} commandes actives du Plan Gratuit. Passez au Plan Pro pour enregistrer des commandes illimitées.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if a new showcase photo can be added based on plan limits
 */
export function checkRealisationLimit(
  couturier: Couturier | null | undefined,
  realisationsCount: number
): { allowed: boolean; message?: string } {
  // If plan limits are hidden/disabled for presentation, allow unlimited photos
  if (!SHOW_ACCOUNT_PLANS || isProPlan(couturier)) {
    return { allowed: true };
  }

  if (realisationsCount >= FREE_PLAN_LIMITS.maxRealisations) {
    return {
      allowed: false,
      message: `Vous avez atteint la limite de ${FREE_PLAN_LIMITS.maxRealisations} photos de réalisation du Plan Gratuit. Passez au Plan Pro pour publier des créations illimitées.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if custom slug personalization is allowed
 */
export function canCustomizeSlug(couturier: Couturier | null | undefined): boolean {
  // If plan limits are hidden/disabled, allow custom slug for all ateliers
  if (!SHOW_ACCOUNT_PLANS) {
    return true;
  }
  return isProPlan(couturier);
}
