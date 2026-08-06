import React from 'react';

interface BasteLineProps {
  color?: 'sable' | 'accent' | 'fonce' | 'vert' | 'indigo' | 'rouge';
  className?: string;
}

export const BasteLine: React.FC<BasteLineProps> = ({ color = 'accent', className = '' }) => {
  const colorClasses: Record<string, string> = {
    sable: 'border-sable',
    accent: 'border-accent',
    indigo: 'border-accent',
    fonce: 'border-fonce',
    vert: 'border-vertbouton',
    rouge: 'border-accent',
  };

  return (
    <div
      aria-hidden="true"
      className={`w-full border-b-2 border-dashed ${colorClasses[color] || 'border-accent'} my-3 opacity-90 ${className}`}
    />
  );
};
