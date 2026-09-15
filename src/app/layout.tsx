import type { Metadata } from "next";
import { SettingsHydrator } from "@/components/SettingsHydrator";
import { SETTINGS_KEY } from "@/store/settingsStore";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poker Lesson",
  description:
    "ルールを覚えながらテキサス・ホールデムを遊べるポーカーアプリ。初心者モードとプロモードがあります。",
};

// 描画前に保存済みのテーマ等を反映し、画面のちらつきを防ぐ
const applySavedSettings = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})||"{}").state||{};var r=document.documentElement;if(s.theme==="light"||s.theme==="dark")r.setAttribute("data-theme",s.theme);if(s.fourColorDeck)r.setAttribute("data-four-color","true");if(s.motion)r.setAttribute("data-motion",s.motion);}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applySavedSettings }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <SettingsHydrator />
        {children}
      </body>
    </html>
  );
}
