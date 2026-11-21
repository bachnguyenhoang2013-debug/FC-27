import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'vi' | 'en';

export const LANGUAGE_STORAGE_KEY = 'fc_app_language';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeName: string;
  regionLabel: string;
  flagUrl: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'vi',
    label: 'Tiếng Việt',
    nativeName: 'Tiếng Việt (Vietnamese)',
    regionLabel: 'Việt Nam',
    flagUrl: 'https://flagcdn.com/w40/vn.png',
  },
  {
    code: 'en',
    label: 'English',
    nativeName: 'English (International)',
    regionLabel: 'Global / UK / US',
    flagUrl: 'https://flagcdn.com/w40/gb.png',
  },
];

export const getSavedAppLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') return 'vi';
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return saved === 'en' ? 'en' : 'vi';
};

interface LanguageContextValue {
  lang: AppLanguage;
  isEn: boolean;
  setLang: (next: AppLanguage) => void;
  t: (vi: string, en: string) => string;
  locale: string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'vi',
  isEn: false,
  setLang: () => {},
  t: (vi) => vi,
  locale: 'vi-VN',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => getSavedAppLanguage());

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore storage quota errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = (next: AppLanguage) => {
    setLangState(next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      isEn: lang === 'en',
      setLang,
      t: (vi: string, en: string) => (lang === 'en' ? en : vi),
      locale: lang === 'en' ? 'en-US' : 'vi-VN',
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => useContext(LanguageContext);
