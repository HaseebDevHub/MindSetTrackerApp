import { useCallback, useSyncExternalStore } from 'react';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { storage } from '../storage/storage';
import { english, type TranslationKey } from './languages/english';
import { french } from './languages/french';
import { german } from './languages/german';
import { spanish } from './languages/spanish';
import { urdu } from './languages/urdu';

export const languages = [
  'English',
  'Urdu',
  'Spanish',
  'French',
  'German',
] as const;

export type AppLanguage = (typeof languages)[number];
export type TranslationParameters = Record<string, string | number>;

const translations = {
  English: english,
  Urdu: urdu,
  Spanish: spanish,
  French: french,
  German: german,
} as const;

export const languageLocales: Record<AppLanguage, string> = {
  English: 'en-US',
  Urdu: 'ur-PK',
  Spanish: 'es-ES',
  French: 'fr-FR',
  German: 'de-DE',
};

export const isLanguageRTL = (language: AppLanguage) => language === 'Urdu';

const isAppLanguage = (value: unknown): value is AppLanguage =>
  typeof value === 'string' && languages.some(language => language === value);

let selectedLanguage: AppLanguage = (() => {
  const storedLanguage = storage.getString(STORAGE_KEYS.APP_LANGUAGE);
  return isAppLanguage(storedLanguage) ? storedLanguage : 'English';
})();

const languageListeners = new Set<() => void>();

export const getSelectedLanguage = () => selectedLanguage;

export function setSelectedLanguage(language: AppLanguage) {
  if (language === selectedLanguage) return true;

  const wasSaved = storage.setString(STORAGE_KEYS.APP_LANGUAGE, language);
  selectedLanguage = language;
  languageListeners.forEach(listener => listener());
  return wasSaved;
}

const subscribeToLanguage = (listener: () => void) => {
  languageListeners.add(listener);
  return () => languageListeners.delete(listener);
};

function translate(
  language: AppLanguage,
  key: TranslationKey,
  parameters?: TranslationParameters,
) {
  const dictionary = translations[language];
  const template = dictionary[key] || english[key] || key;

  if (!parameters) return template;

  return template.replace(/{{\s*([\w]+)\s*}}/g, (match, parameter: string) =>
    Object.prototype.hasOwnProperty.call(parameters, parameter)
      ? String(parameters[parameter])
      : match,
  );
}

export function t(
  key: TranslationKey,
  parameters?: TranslationParameters,
  language: AppLanguage = getSelectedLanguage(),
) {
  return translate(language, key, parameters);
}

export function useTranslation() {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getSelectedLanguage,
    getSelectedLanguage,
  );
  const translateForLanguage = useCallback(
    (key: TranslationKey, parameters?: TranslationParameters) =>
      translate(language, key, parameters),
    [language],
  );

  return {
    language,
    isRTL: isLanguageRTL(language),
    locale: languageLocales[language],
    t: translateForLanguage,
  };
}

export type { TranslationKey } from './languages/english';
