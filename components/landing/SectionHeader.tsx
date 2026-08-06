import React from 'react';

interface SectionHeaderProps {
  badge: string;
  badgeIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  badgeIcon,
  title,
  subtitle,
  className = '',
  centered = true,
}) => {
  return (
    <div className={`${centered ? 'text-center' : 'text-left'} space-y-3 max-w-3xl mx-auto ${className}`}>
      {/* Pill Badge */}
      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-full text-xs font-extrabold tracking-wide shadow-xs hover:scale-105 transition-transform">
        {badgeIcon}
        <span>{badge}</span>
      </div>

      {/* Main Section Title */}
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-sombre tracking-tight leading-tight">
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-base sm:text-lg text-sombre/75 font-medium leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}

      {/* Farata Signature Accent Underline Bar */}
      <div className={`w-16 h-1 rounded-full bg-gradient-to-r from-accent via-gold to-fonce ${centered ? 'mx-auto' : ''} my-3 opacity-90 shadow-xs animate-pulse`} />
    </div>
  );
};
