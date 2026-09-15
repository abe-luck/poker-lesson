import type { ReactNode } from "react";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-bold">{title}</h3>
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
  { name: "プリフロップ", cards: 0, text: "手札が2枚ずつ配られ、1回目のベット" },
  { name: "フロップ", cards: 3, text: "場に3枚開いて、2回目のベット" },
  { name: "ターン", cards: 4, text: "4枚目が開いて、3回目のベット" },
  { name: "リバー", cards: 5, text: "5枚目が開いて、最後のベット" },
];

export function RulesContent() {
  return (
    <div className="flex flex-col gap-8">
      <Section title="1. 目的">
        <p>
          テキサス・ホールデムは、自分だけの<strong>手札2枚</strong>と、全員で使う<strong>場のカード5枚</strong>を合わせた7枚から、一番強い5枚の役を作って競うゲームです。
        </p>
        <p>
          勝つとテーブルの中央に集まったチップ（<strong>ポット</strong>）をもらえます。最後まで残って一番強い役を見せるか、ほかの全員を降ろせば勝ちです。
        </p>
      </Section>

      <Section title="2. 1ハンドの流れ">
        <p>
          毎回、ディーラーの左の2人が<strong>ブラインド</strong>という決まった額を先に出してから始まります（左隣がスモールブラインド、その次がビッグブラインド）。
        </p>
        <ol className="flex flex-col gap-2">
          {STREETS.map((s, i) => (
            <li key={s.name} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-felt text-xs font-bold text-white">{i + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-bold">{s.name}</span>
                <span className="text-[13px] text-muted">{s.text}</span>
              </div>
              <div className="flex gap-0.5" aria-label={`場のカード ${s.cards} 枚`}>
                {Array.from({ length: 5 }, (_, j) => (
                  <span key={j} className={`h-5 w-3.5 rounded-[3px] ${j < s.cards ? "bg-felt" : "border border-dashed border-line"}`} />
                ))}
              </div>
            </li>
          ))}
        </ol>
        <p>
          リバーのベットが終わって2人以上残っていれば、手札を見せ合います（<strong>ショーダウン</strong>）。一番強い役の人がポットをもらいます。
        </p>
      </Section>

      <Section title="3. 自分の番にできること">
        <Table
          rows={[
            ["フォールド", "このハンドを降ります。それまでに出したチップは戻りません。"],
            ["チェック", "チップを出さずに次の人へ回します。まだ誰もベットしていないときだけできます。"],
            ["コール", "前の人と同じ額を出して、勝負を続けます。"],
            ["ベット", "まだ誰も賭けていないときに、最初にチップを賭けます。"],
            ["レイズ", "前の人の額より多く出して、額を上げます。"],
            ["オールイン", "手持ちのチップを全部出します。足りなくても最後まで勝負に参加できます。"],
          ]}
        />
        <p>全員の出した額がそろうと、次の段階へ進みます。</p>
      </Section>

      <Section title="4. 順番とポジション">
        <p>
          <strong>D</strong>（ディーラー）のマークは1ハンドごとに左へ移ります。プリフロップはビッグブラインドの左の人から、フロップ以降はディーラーの左の人から、時計回りに行動します。
        </p>
        <p>後から行動するほど、ほかの人の行動を見てから決められるので有利です。</p>
      </Section>

      <Section title="5. 覚えておきたい言葉">
        <Table
          rows={[
            ["ポット", "テーブルの中央に集まったチップ。勝った人がもらいます。"],
            ["キッカー", "同じ役どうしで比べるときに使う、役に関係しない残りのカード。"],
            ["サイドポット", "オールインした人より多く賭けた人どうしで争う、別のポット。"],
            ["山分け", "同じ強さの役なら、ポットを等分します。"],
          ]}
        />
      </Section>
    </div>
  );
}
