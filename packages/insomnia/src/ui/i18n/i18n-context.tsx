import { createContext, type FC, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import type { Language } from '~/common/settings';

import { en, ptBR } from './translations';

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K) : never }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<typeof en>;

interface I18nContextType {
  language: Language;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  setLanguage: (language: Language) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations = {
  en,
  'pt-BR': ptBR,
};

function getValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return;
  }, obj);
}

function interpolateString(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

interface I18nProviderProps {
  children: ReactNode;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export const I18nProvider: FC<I18nProviderProps> = ({ children, language, onLanguageChange }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(language);

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const translationObj = translations[currentLanguage] || translations.en;
      const value = getValue(translationObj, key);

      if (typeof value !== 'string') {
        // Fallback to English
        const fallbackValue = getValue(translations.en, key);
        if (typeof fallbackValue === 'string') {
          return interpolateString(fallbackValue, params);
        }
        return key;
      }

      return interpolateString(value, params);
    },
    [currentLanguage],
  );

  const handleSetLanguage = useCallback(
    (newLanguage: Language) => {
      setCurrentLanguage(newLanguage);
      onLanguageChange(newLanguage);
    },
    [onLanguageChange],
  );

  return (
    <I18nContext.Provider value={{ language: currentLanguage, t, setLanguage: handleSetLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export { en, ptBR };
