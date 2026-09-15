import type { Metadata } from "next";
import { HandRankingList } from "@/components/guide/HandRankingList";
import { AppHeader } from "@/components/ui/AppHeader";

export const metadata: Metadata = { title: "役一覧 | Poker Lesson" };

export default function HandsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: "/", label: "戻る" }} />
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8 sm:py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold">役一覧</h1>
          <p className="text-[15px] text-muted">手札2枚と場のカード5枚から、一番強い5枚で役を作ります。</p>
        </div>
        <HandRankingList />
      </main>
    </div>
  );
}
