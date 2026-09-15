import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";

type MenuItem = { title: string; description: string; icon: ReactNode };

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

// 各画面はまだ実装していないため、リンクは付けていない (M3 以降で追加)
const menu: MenuItem[] = [
  {
    title: "ルール説明",
    description: "流れと用語を図で説明",
    icon: (
      <svg {...iconProps}>
        <path d="M4 4.5h4.5A1.5 1.5 0 0 1 10 6v10a1.5 1.5 0 0 0-1.5-1.5H4zM16 4.5h-4.5A1.5 1.5 0 0 0 10 6v10a1.5 1.5 0 0 1 1.5-1.5H16z" />
      </svg>
    ),
  },
  {
    title: "役一覧",
    description: "10種類の役を強い順に",
    icon: (
      <svg {...iconProps}>
        <path d="M4 5h12M4 10h8M4 15h5" />
      </svg>
    ),
  },
  {
    title: "成績",
    description: "勝率と収支を確認",
    icon: (
      <svg {...iconProps}>
        <path d="M4 16V9M10 16V4M16 16v-5" />
      </svg>
    ),
  },
  {
    title: "設定",
    description: "テーマ・効果音など",
    icon: (
      <svg {...iconProps}>
        <path d="M4 6h8M15 6h1M4 14h2M9 14h7" />
        <circle cx="13.5" cy="6" r="1.5" />
        <circle cx="7.5" cy="14" r="1.5" />
      </svg>
    ),
  },
];

function PlayingCard({
  rank,
  suit,
  red,
  className = "",
}: {
  rank: string;
  suit: string;
  red?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex h-[112px] w-[80px] flex-col justify-between rounded-[10px] border border-[#d9d9d4] bg-white px-2.5 py-2 font-bold shadow-[0_2px_6px_rgba(0,0,0,.18)] sm:h-[136px] sm:w-[96px] ${
        red ? "text-[#b4443c]" : "text-[#1f2328]"
      } ${className}`}
    >
      <span className="text-2xl leading-none sm:text-3xl">{rank}</span>
      {/* U+FE0E: 絵文字ではなく文字として表示させる */}
      <span className="self-end text-[32px] leading-none sm:text-[40px]">
        {suit}
        {"︎"}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-10">
        <div className="flex items-center gap-2.5 text-lg font-bold">
          <LogoMark />
          Poker Lesson
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-12 px-4 py-10 sm:gap-18 sm:px-10 sm:py-18">
        <section className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-5">
            <span className="text-sm font-medium text-muted">テキサス・ホールデム</span>
            <h1 className="text-4xl leading-tight font-bold sm:text-[56px]">Poker Lesson</h1>
            <p className="text-base leading-[1.8] text-pretty text-muted sm:text-lg">
              ルールを覚えながら、テキサス・ホールデムを遊べます。
              <br className="hidden sm:inline" />
              はじめてでも、ガイドに沿って1ハンドずつ進められます。
            </p>
            <div className="mt-3">
              <Link href="/play" className={buttonClass("primary", "lg", "px-9")}>
                はじめる
              </Link>
            </div>
          </div>

          <div
            className="flex h-[260px] items-center justify-center rounded-3xl bg-felt shadow-[inset_0_0_0_10px_var(--felt-rim)] sm:h-[340px]"
            aria-hidden
          >
            <PlayingCard rank="A" suit="♠" className="translate-x-[18px] translate-y-[10px] -rotate-12" />
            <PlayingCard rank="K" suit="♥" red className="z-10 -translate-y-1.5" />
            <PlayingCard rank="Q" suit="♦" red className="z-20 -translate-x-[18px] translate-y-[10px] rotate-12" />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {menu.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3.5 rounded-xl border border-border bg-surface p-5"
            >
              <span className="text-felt">{item.icon}</span>
              <div className="flex flex-col gap-1">
                <span className="text-[15px] font-bold">{item.title}</span>
                <span className="text-[13px] text-muted">{item.description}</span>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="px-4 py-6 text-center text-[13px] text-muted">
        このアプリはゲームです。実際のお金を賭けるものではありません。
      </footer>
    </div>
  );
}
