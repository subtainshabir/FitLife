"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { dictionaries, Dictionary, Language } from "./dictionaries";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  children,
  initialLanguage = "en",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    const saved = localStorage.getItem("fitlife_language") as Language;
    if (saved && (saved === "en" || saved === "ur")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("fitlife_language", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: dictionaries[language],
    isRtl: language === "ur",
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

