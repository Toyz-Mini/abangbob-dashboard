'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import ms from '@/lib/i18n/ms.json';
import en from '@/lib/i18n/en.json';

type Language = 'ms' | 'en';

type TranslationKeys = keyof typeof ms;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'abangbob_language';

const translations: Record<Language, Record<string, string>> = {
  ms: ms as Record<string, string>,
  en: en as Record<string, string>,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ms');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && (stored === 'ms' || stored === 'en')) {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  // Set language
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, []);

  // Toggle between ms and en
  const toggleLanguage = useCallback(() => {
    const newLang = language === 'ms' ? 'en' : 'ms';
    setLanguage(newLang);
  }, [language, setLanguage]);

  // Translation function with parameter support
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations['ms'][key] || key;
    
    // Replace parameters like {{name}} with actual values
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }
    
    return translation;
  }, [language]);

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Helper hook for just getting translation function
export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}

