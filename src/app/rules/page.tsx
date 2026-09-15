import type { Metadata } from "next";
import Link from "next/link";
import { RulesContent } from "@/components/guide/RulesContent";
import { AppHeader } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = { title: "ルール説明 | Poker Lesson" };

export default function RulesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: "/", label: "戻る" }} />
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8 sm:py-12">
        <h1 className="text-[28px] font-bold">ルール説明</h1>
        <RulesContent />
        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Link href="/hands" className={buttonClass("secondary", "lg")}>
            役一覧を見る
          </Link>
          <Link href="/tutorial" className={buttonClass("secondary", "lg")}>
            チュートリアルで練習する
          </Link>
          <Link href="/play" className={buttonClass("primary", "lg")}>
            遊んでみる
          </Link>
        </div>
      </main>
    </div>
  );
}
