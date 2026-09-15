import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { I18nProvider } from "@/i18n/I18nProvider";
import { SETTINGS_KEY } from "@/store/settingsStore";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";
import { SettingsHydrator } from "./SettingsHydrator";

export function rootMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  return {
    // 言語の切り替え先 (hreflang) などを絶対 URL で出すための基準
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://poker-lesson.vercel.app"),
    title: { default: "Poker Lesson", template: "%s | Poker Lesson" },
    description: t.meta.description,
    applicationName: "Poker Lesson",
    appleWebApp: { capable: true, title: "Poker Lesson", statusBarStyle: "default" },
    alternates: { canonical: localePath(locale, "/"), languages: { ja: "/", en: "/en" } },
  };
}

/** ページごとのタイトルと、もう一方の言語の同じページへの対応 */
export function pageMetadata(locale: Locale, page: keyof ReturnType<typeof getDictionary>["meta"]["titles"], path: string): Metadata {
  return {
    title: getDictionary(locale).meta.titles[page],
    alternates: { canonical: localePath(locale, path), languages: { ja: localePath("ja", path), en: localePath("en", path) } },
  };
}

export const rootViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#17191c" },
  ],
};

// 描画前に保存済みのテーマ等を反映し、画面のちらつきを防ぐ
const applySavedSettings = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})||"{}").state||{};var r=document.documentElement;if(s.theme==="light"||s.theme==="dark")r.setAttribute("data-theme",s.theme);if(s.fourColorDeck)r.setAttribute("data-four-color","true");if(s.motion)r.setAttribute("data-motion",s.motion);}catch(e){}`;

/** 日本語 (/) と英語 (/en) のルートレイアウトで共通の <html> */
export function RootDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={getDictionary(locale).htmlLang} className="h-full antialiased" suppressHydrationWarning>
      {/* ルートレイアウト (app/(ja)/layout.tsx と app/en/layout.tsx) から使う共通の <html> なので、ここで head を書く */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: applySavedSettings }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <I18nProvider locale={locale}>
          <SettingsHydrator />
          <ServiceWorkerRegister />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
