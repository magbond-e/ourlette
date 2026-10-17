'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'compact' | 'select';
  isDark?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'pill',
  isDark = false,
  className = '',
}) => {
  const { locale, setLocale } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
          isDark
            ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
            : 'bg-sable/20 text-sombre hover:bg-sable/40 border border-sable/50'
        } ${className}`}
        title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
        aria-label="Changer de langue / Change language"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="uppercase">{locale}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-full border transition-all ${
        isDark
          ? 'bg-white/10 border-white/20 text-white'
          : 'bg-[#F4F4F0] border-sable/60 text-sombre'
      } ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLocale('fr')}
        className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all duration-200 ${
          locale === 'fr'
            ? isDark
              ? 'bg-gold text-sombre shadow-sm scale-102'
              : 'bg-sombre text-white shadow-xs scale-102'
            : isDark
            ? 'text-white/70 hover:text-white hover:bg-white/10'
            : 'text-sombre/60 hover:text-sombre hover:bg-white/60'
        }`}
        aria-pressed={locale === 'fr'}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all duration-200 ${
          locale === 'en'
            ? isDark
              ? 'bg-gold text-sombre shadow-sm scale-102'
              : 'bg-sombre text-white shadow-xs scale-102'
            : isDark
            ? 'text-white/70 hover:text-white hover:bg-white/10'
            : 'text-sombre/60 hover:text-sombre hover:bg-white/60'
        }`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  );
};
