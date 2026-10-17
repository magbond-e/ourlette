import { StatutCommande } from '../types/database';

/**
 * Format currency in FCFA or custom currency
 */
export function formatFCFA(amount: number, devise: string = 'FCFA'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `0 ${devise}`;
  const formattedNumber = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount);

  if (devise === 'EUR' || devise === '€') return `${formattedNumber} €`;
  if (devise === 'USD' || devise === '$') return `$${formattedNumber}`;

  return `${formattedNumber} ${devise}`;
}

/**
 * Format date into readable localized string (ex: "14 août 2026" in FR or "Aug 14, 2026" in EN)
 */
export function formatDateFR(dateString?: string | null, locale: string = 'fr'): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const targetLocale = locale.startsWith('en') ? 'en-US' : 'fr-FR';
    return date.toLocaleDateString(targetLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export const formatDateLocalized = formatDateFR;

/**
 * Check if an order is overdue
 */
export function isCommandeEnRetard(dateLivraisonPrevue: string, statut: StatutCommande): boolean {
  if (statut === 'livree') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(dateLivraisonPrevue);
  return delivery < today;
}

/**
 * Calculate remaining balance
 */
export function calculSolde(prixTotal: number, acompte: number): number {
  const solde = (prixTotal || 0) - (acompte || 0);
  return solde < 0 ? 0 : solde;
}

/**
 * Generate WhatsApp share link for workshop showcase
 */
export function generateWhatsAppShareLink(nomAtelier: string, slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ourlette.app';
  const vitrineUrl = `${origin}/${slug}`;
  const message = encodeURIComponent(
    `Bonjour ! Découvrez les réalisations et l'atelier ${nomAtelier} sur Ourlette : ${vitrineUrl}`
  );
  return `https://wa.me/?text=${message}`;
}

/**
 * Generate direct contact WhatsApp link for a client visiting showcase
 */
export function generateWhatsAppContactLink(telephone: string, nomAtelier: string, nomModele?: string): string {
  const cleanPhone = telephone.replace(/[^0-9+]/g, '');
  const textMsg = nomModele
    ? `Bonjour ${nomAtelier}, je visite votre vitrine Ourlette et je souhaiterais commander le modèle "${nomModele}".`
    : `Bonjour ${nomAtelier}, je visite votre vitrine Ourlette et je souhaiterais passer une commande.`;
  const message = encodeURIComponent(textMsg);
  return `https://wa.me/${cleanPhone.replace('+', '')}?text=${message}`;
}

/**
 * Human readable label & style for order status
 */
export function getStatutDetails(
  statut: StatutCommande,
  locale: string = 'fr'
): { label: string; bg: string; text: string; border: string } {
  const isEn = locale.startsWith('en');
  switch (statut) {
    case 'recue':
      return {
        label: isEn ? 'Received' : 'Reçue',
        bg: 'bg-sable-light',
        text: 'text-charbon',
        border: 'border-sable',
      };
    case 'en_cours':
      return {
        label: isEn ? 'In Progress' : 'En cours',
        bg: 'bg-indigo-tisse/10',
        text: 'text-indigo-tisse',
        border: 'border-indigo-tisse',
      };
    case 'essayage':
      return {
        label: isEn ? 'Fitting' : 'Essayage',
        bg: 'bg-amber-100',
        text: 'text-amber-900',
        border: 'border-amber-400',
      };
    case 'prete':
      return {
        label: isEn ? 'Ready' : 'Prête',
        bg: 'bg-emerald-100',
        text: 'text-emerald-900',
        border: 'border-emerald-500',
      };
    case 'livree':
      return {
        label: isEn ? 'Delivered' : 'Livrée',
        bg: 'bg-vertbouton/15',
        text: 'text-vertbouton-dark',
        border: 'border-vertbouton',
      };
    default:
      return {
        label: statut,
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300',
      };
  }
}
