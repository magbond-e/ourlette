import React from 'react';
import { StatutCommande } from '@/lib/types/database';
import { getStatutDetails } from '@/lib/utils/formatters';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'urgent' | 'success' | 'indigo' | 'sable';
  statut?: StatutCommande;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  statut,
  className = '',
}) => {
  if (statut) {
    const details = getStatutDetails(statut);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${details.bg} ${details.text} ${details.border} ${className}`}
      >
        {details.label}
      </span>
    );
  }

  const variants = {
    default: 'bg-sable/40 text-sombre border-sable',
    urgent: 'bg-accent/15 text-accent border-accent/40 font-extrabold animate-pulse',
    success: 'bg-vertbouton/15 text-vertbouton-dark border-vertbouton/40 font-bold',
    indigo: 'bg-fonce/15 text-fonce border-fonce/30 font-bold',
    sable: 'bg-sable text-sombre border-sable-dark',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
