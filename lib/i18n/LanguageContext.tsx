'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Locale, Translations } from './types';
import { fr } from './locales/fr';
import { en } from './locales/en';

const dictionaries: Record<Locale, Translations> = {
  fr,
  en,
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: Translations;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'fr',
  setLocale: () => {},
  dict: fr,
  t: (path) => path,
});

const STORAGE_KEY = 'ourlette_locale';
const COOKIE_KEY = 'ourlette_locale';

export const LanguageProvider: React.FC<{ children: React.ReactNode; initialLocale?: Locale }> = ({
  children,
  initialLocale = 'fr',
}) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (savedLocale === 'fr' || savedLocale === 'en') {
        setLocaleState(savedLocale);
        document.documentElement.lang = savedLocale;
        return;
      }

      // Check cookie
      const match = document.cookie.match(new RegExp('(^| )' + COOKIE_KEY + '=([^;]+)'));
      const cookieLocale = match ? (match[2] as Locale) : null;
      if (cookieLocale === 'fr' || cookieLocale === 'en') {
        setLocaleState(cookieLocale);
        document.documentElement.lang = cookieLocale;
        return;
      }

      // Par défaut, Ourlette privilégie toujours le Français (fr) pour les ateliers
      setLocaleState('fr');
      document.documentElement.lang = 'fr';
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `${COOKIE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  const dict = useMemo(() => dictionaries[locale] || fr, [locale]);

  /**
   * Helper function to retrieve nested translation strings by path (e.g., 'common.save')
   * with optional parameter replacement {count}, {name}, etc.
   */
  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const parts = path.split('.');
      let current: any = dict;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          // Fallback to French if key is missing in active locale
          let fallback: any = fr;
          for (const fbPart of parts) {
            if (fallback && typeof fallback === 'object' && fbPart in fallback) {
              fallback = fallback[fbPart];
            } else {
              return path;
            }
          }
          current = fallback;
          break;
        }
      }

      if (typeof current !== 'string') {
        return path;
      }

      if (params) {
        return Object.entries(params).reduce((str, [key, val]) => {
          return str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
        }, current);
      }

      return current;
    },
    [dict]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dict, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
