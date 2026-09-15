"use client";

import { useRouter } from "next/navigation";
import type { Mode } from "@/engine/types";
import { useGameStore } from "@/store/gameStore";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";

const MODES: {
  mode: Mode;
  title: string;
  tag: string;
  description: string;
  features: string[];
}[] = [
  {
    mode: "beginner",
    title: "初心者モード",
    tag: "はじめての方に",
    description: "ガイドを見ながら、ルールを覚えて進めます。",
    features: ["今の段階と、できることを説明", "今の役と、手の強さを表示", "おすすめのアクションと理由", "ハンド後に勝ち負けの理由を解説"],
  },
  {
    mode: "pro",
    title: "プロモード",
    tag: "経験者向け",
    description: "ヒントなしで、テンポよく本格的に遊びます。",
    features: ["CPUの強さを2段階から選択", "トーナメント形式と持ち時間", "ポットオッズ表示（任意）", "ハンド履歴と成績の記録"],
  },
];

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--felt)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 10.5 3 3 7-7" />
    </svg>
  );
}

export function ModeSelect() {
  const router = useRouter();
  const updateDraft = useGameStore((s) => s.updateDraft);

  const choose = (mode: Mode) => {
    updateDraft({ mode });
    router.push("/play/setup");
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: "/", label: "戻る" }} />
      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-4 py-10 sm:gap-10 sm:py-18">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-[28px] font-bold sm:text-[32px]">モードを選ぶ</h1>
          <p className="text-[15px] text-muted">ゲームを始めるたびに選べます。</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {MODES.map((m) => {
            const primary = m.mode === "beginner";
            return (
              <section
                key={m.mode}
                className={`flex flex-col gap-5 rounded-2xl bg-surface p-6 sm:p-8 ${primary ? "border-2 border-accent" : "border border-border"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold">{m.title}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${primary ? "bg-accent-soft text-accent" : "bg-chip text-muted"}`}>
                    {m.tag}
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed text-muted">{m.description}</p>
                <ul className="flex flex-col gap-3">
                  {m.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[15px]">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant={primary ? "primary" : "secondary"} size="lg" className="mt-2 w-full" onClick={() => choose(m.mode)}>
                  {m.title}で遊ぶ
                </Button>
              </section>
            );
          })}
        </div>
        <p className="text-center text-[13px] text-muted">
          過去のハンド履歴と成績の記録は、今後追加します。
        </p>
      </main>
    </div>
  );
}
