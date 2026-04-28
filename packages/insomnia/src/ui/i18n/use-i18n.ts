import { useCallback } from 'react';

import type { Language } from '~/common/settings';

import { en, ptBR } from './translations';

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K) : never }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<typeof en>;

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

export function useI18n(language: Language = 'en') {
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const translationObj = translations[language] || translations.en;
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
    [language],
  );

  return { t, language };
}

function interpolateString(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;

  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

export type { TranslationKey };
