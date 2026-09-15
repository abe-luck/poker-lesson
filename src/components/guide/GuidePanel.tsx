"use client";

import type { GameState } from "@/engine/types";
import { useI18n } from "@/i18n/I18nProvider";
import { useSettingsStore } from "@/store/settingsStore";
import { Switch } from "@/components/ui/Switch";
import type { Guide } from "./useGuide";

const STAGE: Record<GameState["street"], number> = { preflop: 1, flop: 2, turn: 3, river: 4, showdown: 5 };

type Props = {
  state: GameState;
  guide: Guide;
  onOpenHands: () => void;
  onOpenRules: () => void;
};

function LabeledSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span aria-hidden>{label}</span>
      <Switch label={label} checked={checked} onChange={onChange} />
    </div>
  );
}

function Stage({ state }: { state: GameState }) {
  const { t } = useI18n();
  const stage = STAGE[state.street];
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold text-accent">{t.common.streetNames[state.street]}</span>
        <span className="text-[13px] text-muted tabular-nums">{t.guide.stage(stage)}</span>
      </div>
      <div className="grid grid-cols-5 gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`h-1 rounded-full ${i < stage ? "bg-felt" : i === stage ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}

function RecommendationBox({ guide }: { guide: Guide }) {
  const { t } = useI18n();
  const rec = guide.recommendation;
  if (!rec) return null;
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-accent-soft p-4">
      <span className="text-xs font-bold text-accent">{t.guide.recommendation}</span>
      <span className="text-xl font-bold">{rec.label}</span>
      <p className="text-sm leading-relaxed text-pretty">{rec.reason}</p>
      {rec.detail && <p className="text-xs leading-relaxed text-muted">{rec.detail}</p>}
      <span className="text-xs text-muted">{t.guide.disclaimer}</span>
    </div>
  );
}

function PanelBody({ state, guide, onOpenHands, onOpenRules }: Props) {
  const { t } = useI18n();
  const showRecommendation = useSettingsStore((s) => s.showRecommendation);
  const setShowRecommendation = useSettingsStore((s) => s.setShowRecommendation);

  return (
    <div className="flex flex-col gap-6">
      <Stage state={state} />

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-muted">{t.guide.situation}</span>
        {guide.situation.map((line) => (
          <p key={line} className="text-sm leading-[1.8] text-pretty">
            {line}
          </p>
        ))}
      </div>

      {guide.flow.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-muted">{t.guide.flow}</span>
          <ul className="flex flex-col gap-1.5 text-sm">
            {guide.flow.map((row, i) => (
              <li key={i} className={`flex justify-between gap-3 ${row.current ? "font-bold" : ""}`}>
                <span>{row.name}</span>
                <span className={`tabular-nums ${row.current ? "text-accent" : "text-muted"}`}>{row.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showRecommendation && <RecommendationBox guide={guide} />}
      <LabeledSwitch label={t.guide.showRecommendation} checked={showRecommendation} onChange={setShowRecommendation} />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onOpenHands} className="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-line text-sm hover:bg-background">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--felt)" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
            <path d="M4 5h12M4 10h8M4 15h5" />
          </svg>
          {t.common.hands}
        </button>
        <button type="button" onClick={onOpenRules} className="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-line text-sm hover:bg-background">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--felt)" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
            <path d="M4 4.5h4.5A1.5 1.5 0 0 1 10 6v10a1.5 1.5 0 0 0-1.5-1.5H4zM16 4.5h-4.5A1.5 1.5 0 0 0 10 6v10a1.5 1.5 0 0 1 1.5-1.5H16z" />
          </svg>
          {t.common.rulesFull}
        </button>
      </div>
    </div>
  );
}

/** 広い画面: 右側に常に表示 */
export function GuideSidePanel(props: Props) {
  const { t } = useI18n();
  return (
    <aside aria-label={t.guide.title} className="hidden w-[340px] shrink-0 overflow-y-auto border-l border-border bg-surface p-6 xl:block">
      <h2 className="mb-5 text-[17px] font-bold">{t.guide.title}</h2>
      <PanelBody {...props} />
    </aside>
  );
}

/** 狭い画面: 操作バーの上に1行の要約。押すと全体をダイアログで開く */
export function GuideSummaryButton({ state, guide, onOpen }: { state: GameState; guide: Guide; onOpen: () => void }) {
  const { t } = useI18n();
  const showRecommendation = useSettingsStore((s) => s.showRecommendation);
  const rec = guide.recommendation;
  const summary = showRecommendation && rec ? t.guide.recommendationSummary(rec.label) : (guide.situation.at(-1) ?? "");

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="flex w-full items-center gap-3 rounded-xl bg-accent-soft px-4 py-2.5 text-left xl:hidden"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs text-muted">
          {t.guide.summary(t.common.streetNames[state.street], STAGE[state.street])}
        </span>
        <span className="truncate text-sm font-bold">{summary}</span>
      </div>
      <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-accent">
        {t.guide.details}
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m5 12.5 5-5 5 5" />
        </svg>
      </span>
    </button>
  );
}

/** ダイアログ内に表示するガイド全体 */
export function GuideDetails(props: Props) {
  return <PanelBody {...props} />;
}
