"use client";

import { useRouter } from "next/navigation";
import { formatChips, MODE_NAMES } from "@/content/ja";
import { HANDS_PER_LEVEL } from "@/engine/tournament";
import { useGameStore, type GameConfig, type GameFormat, type TimeLimit } from "@/store/gameStore";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Row, RowGroup, Segmented } from "@/components/ui/Form";
import { Switch } from "@/components/ui/Switch";

const CPU_COUNTS = [1, 2, 3, 4, 5];
const STACKS = [500, 1000, 2000];
const BLINDS = [
  { small: 5, big: 10 },
  { small: 10, big: 20 },
  { small: 25, big: 50 },
];

export function GameSetup() {
  const router = useRouter();
  const draft = useGameStore((s) => s.draft);
  const { updateDraft, startGame } = useGameStore.getState();
  const pro = draft.mode === "pro";

  const start = () => {
    startGame(draft);
    router.push("/play/game");
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: "/play", label: "戻る" }} />
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8 sm:py-12">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-bold">ゲーム設定</h1>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${draft.mode === "beginner" ? "bg-accent-soft text-accent" : "bg-chip text-muted"}`}>
            {MODE_NAMES[draft.mode]}
          </span>
        </div>

        <RowGroup>
          <Row label="CPUの人数">
            <Segmented label="CPUの人数" options={CPU_COUNTS} value={draft.cpuCount} format={String} onChange={(cpuCount) => updateDraft({ cpuCount })} />
          </Row>
          <Row label="最初のチップ">
            <Segmented label="最初のチップ" options={STACKS} value={draft.startingStack} format={formatChips} onChange={(startingStack) => updateDraft({ startingStack })} />
          </Row>
          <Row label={pro && draft.format === "tournament" ? "最初のブラインド" : "ブラインド"} sub="毎ハンド、2人が強制的に出すチップ">
            <Segmented
              label="ブラインド"
              options={BLINDS}
              value={draft.blinds}
              format={(b) => `${b.small} / ${b.big}`}
              equals={(a, b) => a.small === b.small && a.big === b.big}
              onChange={(blinds) => updateDraft({ blinds })}
            />
          </Row>
          {pro ? (
            <>
              <Row label="CPUの強さ">
                <Segmented
                  label="CPUの強さ"
                  options={["normal", "hard"] as const satisfies GameConfig["cpuLevel"][]}
                  value={draft.cpuLevel}
                  format={(v) => (v === "normal" ? "ふつう" : "強い")}
                  onChange={(cpuLevel) => updateDraft({ cpuLevel })}
                />
              </Row>
              <Row
                label="形式"
                sub={
                  draft.format === "tournament"
                    ? `${HANDS_PER_LEVEL}ハンドごとにブラインドが上がり、最後の1人になれば優勝です`
                    : "ブラインドは最後まで変わりません"
                }
              >
                <Segmented
                  label="形式"
                  options={["cash", "tournament"] as const satisfies GameFormat[]}
                  value={draft.format}
                  format={(v) => (v === "cash" ? "キャッシュゲーム" : "トーナメント")}
                  onChange={(format) => updateDraft({ format })}
                />
              </Row>
              <Row label="持ち時間" sub="時間切れはチェック、できなければフォールド">
                <Segmented
                  label="持ち時間"
                  options={[0, 15, 30] as const satisfies TimeLimit[]}
                  value={draft.timeLimit}
                  format={(v) => (v === 0 ? "なし" : `${v}秒`)}
                  onChange={(timeLimit) => updateDraft({ timeLimit })}
                />
              </Row>
              <Row label="ポットオッズを表示" sub="コールに必要な勝率を数字で表示します">
                <Switch label="ポットオッズを表示" checked={draft.showPotOdds} onChange={(showPotOdds) => updateDraft({ showPotOdds })} />
              </Row>
            </>
          ) : (
            <Row label="CPUの強さ" sub="初心者モードでは「弱い」に固定されます">
              <span className="text-[15px] text-muted">弱い</span>
            </Row>
          )}
        </RowGroup>

        <div className="flex justify-end gap-3">
          <Button size="lg" onClick={() => router.push("/play")}>
            戻る
          </Button>
          <Button variant="primary" size="lg" onClick={start}>
            ゲーム開始
          </Button>
        </div>
      </main>
    </div>
  );
}
