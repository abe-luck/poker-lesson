"use client";

import type { ReactNode } from "react";
import { Rich, useI18n } from "@/i18n/I18nProvider";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-[1.8] text-pretty">{children}</div>
    </section>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] overflow-hidden rounded-xl border border-border bg-surface text-sm">
      {rows.map(([term, desc], i) => (
        <div key={term} className={`contents ${i > 0 ? "[&>*]:border-t [&>*]:border-border" : ""}`}>
          <dt className="px-4 py-2.5 font-bold whitespace-nowrap">{term}</dt>
          <dd className="px-4 py-2.5 leading-relaxed text-muted">{desc}</dd>
        </div>
      ))}
    </dl>
  );
}

const STREETS = [
  { street: "preflop", cards: 0 },
  { street: "flop", cards: 3 },
  { street: "turn", cards: 4 },
  { street: "river", cards: 5 },
] as const;

export function RulesContent() {
  const { t } = useI18n();
  const r = t.rules;
  return (
    <div className="flex flex-col gap-8">
      <Section title={r.goal.title}>
        {r.goal.paragraphs.map((p) => (
          <p key={p}>
            <Rich text={p} />
          </p>
        ))}
      </Section>

      <Section title={r.flow.title}>
        <p>
          <Rich text={r.flow.intro} />
        </p>
        <ol className="flex flex-col gap-2">
          {STREETS.map((s, i) => (
            <li key={s.street} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-felt text-xs font-bold text-white">{i + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-bold">{t.common.streetNames[s.street]}</span>
                <span className="text-[13px] text-muted">{r.flow.streets[i]}</span>
              </div>
              <div className="flex gap-0.5" role="img" aria-label={t.cards.boardCount(s.cards)}>
                {Array.from({ length: 5 }, (_, j) => (
                  <span key={j} className={`h-5 w-3.5 rounded-[3px] ${j < s.cards ? "bg-felt" : "border border-dashed border-line"}`} />
                ))}
              </div>
            </li>
          ))}
        </ol>
        <p>
          <Rich text={r.flow.outro} />
        </p>
      </Section>

      <Section title={r.actions.title}>
        <Table rows={r.actions.rows} />
        <p>{r.actions.outro}</p>
      </Section>

      <Section title={r.position.title}>
        {r.position.paragraphs.map((p) => (
          <p key={p}>
            <Rich text={p} />
          </p>
        ))}
      </Section>

      <Section title={r.terms.title}>
        <Table rows={r.terms.rows} />
      </Section>
    </div>
  );
}
