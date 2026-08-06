import React from 'react';
import { StatutCommande } from '@/lib/types/database';

interface StatusStepperProps {
  currentStatus: StatutCommande;
  onStatusChange?: (newStatus: StatutCommande) => void;
  interactive?: boolean;
}

const STATUTS_ORDER: { id: StatutCommande; label: string }[] = [
  { id: 'recue', label: 'Reçue' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'essayage', label: 'Essayage' },
  { id: 'prete', label: 'Prête' },
  { id: 'livree', label: 'Livrée' },
];

export const StatusStepper: React.FC<StatusStepperProps> = ({
  currentStatus,
  onStatusChange,
  interactive = true,
}) => {
  const currentIndex = STATUTS_ORDER.findIndex((s) => s.id === currentStatus);

  return (
    <div className="w-full py-1">
      {/* Stepper track with Basting Line signature */}
      <div className="relative flex items-center justify-between">
        {/* Horizontal Basting Line background */}
        <div aria-hidden="true" className="absolute left-3 right-3 top-3.5 -z-0 border-b-2 border-dashed border-accent/40" />

        {STATUTS_ORDER.map((step, index) => {
          const isReached = index <= currentIndex;
          const isCurrent = index === currentIndex;

          let dotClass = 'bg-clair border-2 border-sable text-sombre/50';
          if (isCurrent) {
            dotClass = 'bg-accent text-white ring-4 ring-accent/25 scale-110 shadow-md font-black';
          } else if (isReached) {
            dotClass = 'bg-vertbouton text-white font-black shadow-xs';
          }

          return (
            <button
              key={step.id}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onStatusChange && onStatusChange(step.id)}
              className={`group flex flex-col items-center z-10 transition-all duration-200 ease-out ${
                interactive ? 'cursor-pointer focus:outline-none hover:scale-105' : 'cursor-default'
              }`}
              title={`Marquer comme ${step.label}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-200 ease-out ${dotClass}`}
              >
                {isReached ? '✓' : index + 1}
              </div>
              <span
                className={`text-[11px] mt-1 tracking-tight transition-colors duration-200 ${
                  isCurrent
                    ? 'text-accent font-black font-sans'
                    : isReached
                    ? 'text-vertbouton-dark font-extrabold font-sans'
                    : 'text-sombre/60 font-medium font-sans'
                }`}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
