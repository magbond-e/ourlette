'use client';

import React from 'react';

interface ThreadSpoolLoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ThreadSpoolLoader: React.FC<ThreadSpoolLoaderProps> = ({
  label = "Chargement d'atelier…",
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 p-6 text-center ${className}`}>
      {/* Rotating Thread Spool SVG */}
      <div className={`relative ${sizeMap[size]} animate-spin text-accent`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Top Flange / Head of Spool */}
          <rect x="16" y="8" width="32" height="6" rx="3" fill="#D4AF37" />
          <rect x="22" y="5" width="20" height="3" rx="1.5" fill="#8B0000" />

          {/* Spool Core & Thread Body */}
          <rect x="20" y="14" width="24" height="36" rx="2" fill="#8B0000" />
          
          {/* Winding Thread Lines (Filament texture) */}
          <line x1="20" y1="18" x2="44" y2="18" stroke="#D4AF37" strokeWidth="2.5" />
          <line x1="20" y1="24" x2="44" y2="24" stroke="#D4AF37" strokeWidth="2.5" />
          <line x1="20" y1="30" x2="44" y2="30" stroke="#D4AF37" strokeWidth="2.5" />
          <line x1="20" y1="36" x2="44" y2="36" stroke="#D4AF37" strokeWidth="2.5" />
          <line x1="20" y1="42" x2="44" y2="42" stroke="#D4AF37" strokeWidth="2.5" />
          <line x1="20" y1="48" x2="44" y2="48" stroke="#D4AF37" strokeWidth="2.5" />

          {/* Bottom Flange */}
          <rect x="16" y="50" width="32" height="6" rx="3" fill="#D4AF37" />
          <rect x="22" y="56" width="20" height="3" rx="1.5" fill="#8B0000" />

          {/* Floating Needle & Loop Thread */}
          <path
            d="M48 20 Q56 28 44 46"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeDasharray="3 3"
            fill="none"
          />
        </svg>
      </div>

      {label && (
        <p className="text-xs sm:text-sm font-bold text-sombre/80 font-sans tracking-wide">
          {label}
        </p>
      )}
    </div>
  );
};
