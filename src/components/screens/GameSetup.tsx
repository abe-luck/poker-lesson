"use client";

import { useRouter } from "next/navigation";
import { HANDS_PER_LEVEL } from "@/engine/tournament";
import { useI18n } from "@/i18n/I18nProvider";
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
  const { t, href } = useI18n();
  const s = t.setup;
  const router = useRouter();
  const draft = useGameStore((state) => state.draft);
  const { updateDraft, startGame } = useGameStore.getState();
  const pro = draft.mode === "pro";

  const start = () => {
    startGame(draft);
    router.push(href("/play/game"));
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: href("/play"), label: t.common.back }} />
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8 sm:py-12">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-bold">{s.title}</h1>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${draft.mode === "beginner" ? "bg-accent-soft text-accent" : "bg-chip text-muted"}`}>
            {t.common.modeNames[draft.mode]}
          </span>
        </div>

        <RowGroup>
          <Row label={s.cpuCount}>
            <Segmented label={s.cpuCount} options={CPU_COUNTS} value={draft.cpuCount} format={String} onChange={(cpuCount) => updateDraft({ cpuCount })} />
          </Row>
          <Row label={s.startingStack}>
            <Segmented label={s.startingStack} options={STACKS} value={draft.startingStack} format={t.formatChips} onChange={(startingStack) => updateDraft({ startingStack })} />
          </Row>
          <Row label={pro && draft.format === "tournament" ? s.startingBlinds : s.blinds} sub={s.blindsSub}>
            <Segmented
              label={s.blinds}
              options={BLINDS}
              value={draft.blinds}
              format={(b) => `${b.small} / ${b.big}`}
              equals={(a, b) => a.small === b.small && a.big === b.big}
              onChange={(blinds) => updateDraft({ blinds })}
            />
          </Row>
          {pro ? (
            <>
              <Row label={s.cpuLevel}>
                <Segmented
                  label={s.cpuLevel}
                  options={["normal", "hard"] as const satisfies GameConfig["cpuLevel"][]}
                  value={draft.cpuLevel}
                  format={(v) => s.cpuLevels[v]}
                  onChange={(cpuLevel) => updateDraft({ cpuLevel })}
                />
              </Row>
              <Row label={s.format} sub={draft.format === "tournament" ? s.tournamentSub(HANDS_PER_LEVEL) : s.cashSub}>
                <Segmented
                  label={s.format}
                  options={["cash", "tournament"] as const satisfies GameFormat[]}
                  value={draft.format}
                  format={(v) => s.formats[v]}
                  onChange={(format) => updateDraft({ format })}
                />
              </Row>
              <Row label={s.timeLimit} sub={s.timeLimitSub}>
                <Segmented
                  label={s.timeLimit}
                  options={[0, 15, 30] as const satisfies TimeLimit[]}
                  value={draft.timeLimit}
                  format={s.timeOptions}
                  onChange={(timeLimit) => updateDraft({ timeLimit })}
                />
              </Row>
              <Row label={s.potOdds} sub={s.potOddsSub}>
                <Switch label={s.potOdds} checked={draft.showPotOdds} onChange={(showPotOdds) => updateDraft({ showPotOdds })} />
              </Row>
            </>
          ) : (
            <Row label={s.cpuLevel} sub={s.beginnerCpu}>
              <span className="text-[15px] text-muted">{s.easy}</span>
            </Row>
          )}
        </RowGroup>

        <div className="flex justify-end gap-3">
          <Button size="lg" onClick={() => router.push(href("/play"))}>
            {t.common.back}
          </Button>
          <Button variant="primary" size="lg" onClick={start}>
            {s.start}
          </Button>
        </div>
      </main>
    </div>
  );
}
