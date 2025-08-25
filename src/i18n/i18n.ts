import React, { createContext, useContext, useState, useCallback } from 'react';
import en from './locales/en.json';
import my from './locales/my.json';

type Language = 'en' | 'my';

const translations: Record<Language, Record<string, string>> = {
  en,
  my,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, ...args: (string | number)[]) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('my'); // Default to Myanmar

  const t = useCallback((key: string, ...args: (string | number)[]): string => {
    let translatedText = translations[language][key] || translations.en[key] || key;
    args.forEach((arg, index) => {
      translatedText = translatedText.replace(`{${index}}`, String(arg));
    });
    return translatedText;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};