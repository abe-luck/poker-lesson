import { parseCards } from "@/engine/cards";
import { PlayingCard } from "@/components/table/PlayingCard";

/** 強い順。example の先頭 keyCount 枚が役を作るカード */
const RANKINGS = [
  { name: "ロイヤルフラッシュ", description: "同じマークの 10・J・Q・K・A", example: "As Ks Qs Js Ts", keyCount: 5 },
  { name: "ストレートフラッシュ", description: "同じマークで数字が5つ連続", example: "9h 8h 7h 6h 5h", keyCount: 5 },
  { name: "フォーカード", description: "同じ数字が4枚", example: "7c 7d 7h 7s Kd", keyCount: 4 },
  { name: "フルハウス", description: "同じ数字3枚 ＋ 同じ数字2枚", example: "Qc Qd Qh 4s 4d", keyCount: 5 },
  { name: "フラッシュ", description: "同じマークが5枚（数字はばらばらでよい）", example: "Ad Jd 8d 6d 2d", keyCount: 5 },
  { name: "ストレート", description: "数字が5つ連続（マークはばらばらでよい）", example: "Tc 9d 8h 7s 6c", keyCount: 5 },
  { name: "スリーカード", description: "同じ数字が3枚", example: "8s 8h 8d Kc 3h", keyCount: 3 },
  { name: "ツーペア", description: "同じ数字2枚の組が2つ", example: "Jc Jd 5h 5s Ac", keyCount: 4 },
  { name: "ワンペア", description: "同じ数字が2枚", example: "Ah Ad 9c 6s 3d", keyCount: 2 },
  { name: "ハイカード", description: "役なし。一番大きいカードで比べる", example: "Kh Jc 8d 5s 2h", keyCount: 1 },
];

export function HandRankingList() {
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {RANKINGS.map((r, i) => (
          <li key={r.name} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-chip text-xs font-bold text-muted tabular-nums">
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">{r.name}</span>
                <span className="text-[13px] text-muted">{r.description}</span>
              </div>
            </div>
            <div className="flex gap-1 pl-9 sm:pl-0">
              {parseCards(r.example).map((card, j) => (
                <div key={j} className={j < r.keyCount ? "" : "opacity-45"}>
                  <PlayingCard card={card} size="sm" />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-relaxed text-muted">
        <li>上にあるほど強い役です。1が一番強く、10が一番弱い役です。</li>
        <li>数字は A が一番強く、K・Q・J・10…と続き、2 が一番弱くなります。</li>
        <li>A-2-3-4-5 もストレートです（この場合は 5 が一番上として扱います）。</li>
        <li>同じ役どうしは、役を作る数字 → 残りのカード（キッカー）の順に比べます。マークに強さはありません。</li>
        <li>役を作らないカードは薄く表示しています。</li>
      </ul>
    </div>
  );
}
