import type { Metadata } from "next";
import { en } from "@/i18n/en";
import { ja } from "@/i18n/ja";
import "./globals.css";

export const metadata: Metadata = {
  title: `${ja.notFound.title} / ${en.notFound.title} | Poker Lesson`,
};

/** 日本語と英語のどちらのページにも当てはまらない URL (ルートレイアウトが2つあるため共通の 404 を置く) */
export default function GlobalNotFound() {
  return (
    <html lang="ja">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 text-center font-sans">
        {[
          { t: ja, href: "/", lang: "ja" },
          { t: en, href: "/en", lang: "en" },
        ].map(({ t, href, lang }) => (
          <section key={lang} lang={lang} className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold">{t.notFound.title}</h1>
            <p className="text-muted">{t.notFound.body}</p>
            <a href={href} className="mt-1 font-medium text-accent underline-offset-4 hover:underline">
              {t.notFound.home}
            </a>
          </section>
        ))}
      </body>
    </html>
  );
}
