"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getDictionary, localePath, type Dictionary, type Locale } from "./index";

type I18n = {
  locale: Locale;
  t: Dictionary;
  /** 今の言語に合わせたリンク先 */
  href: (path: string) => string;
};

const I18nContext = createContext<I18n>({ locale: "ja", t: getDictionary("ja"), href: (path) => path });

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, t: getDictionary(locale), href: (path) => localePath(locale, path) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}

/** `**太字**` を <strong> にして表示する */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
      )}
    </>
  );
}
