import type { HandCategory, HandRank, LogEntry, Mode, Rank, Street, Suit } from "@/engine/types";

export const HAND_CATEGORY_NAMES: Record<HandCategory, string> = {
  0: "ハイカード",
  1: "ワンペア",
  2: "ツーペア",
  3: "スリーカード",
  4: "ストレート",
  5: "フラッシュ",
  6: "フルハウス",
  7: "フォーカード",
  8: "ストレートフラッシュ",
  9: "ロイヤルフラッシュ",
};

export const MODE_NAMES: Record<Mode, string> = {
  beginner: "初心者モード",
  pro: "プロモード",
};

export const STREET_NAMES: Record<Street, string> = {
  preflop: "プリフロップ",
  flop: "フロップ",
  turn: "ターン",
  river: "リバー",
  showdown: "ショーダウン",
};

export const SUIT_NAMES: Record<Suit, string> = { s: "スペード", h: "ハート", d: "ダイヤ", c: "クラブ" };
export const SUIT_SYMBOLS: Record<Suit, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };

export function rankLabel(rank: Rank): string {
  return ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Partial<Record<Rank, string>>)[rank] ?? String(rank);
}

/** 例: 「ワンペア（Aのペア）」 */
export function handName(hand: HandRank): string {
  const name = HAND_CATEGORY_NAMES[hand.category];
  const r = (i: number) => rankLabel(hand.tiebreak[i] as Rank);
  switch (hand.category) {
    case 1:
      return `${name}（${r(0)}のペア）`;
    case 2:
      return `${name}（${r(0)}と${r(1)}）`;
    case 3:
    case 7:
      return `${name}（${r(0)}）`;
    case 6:
      return `${name}（${r(0)}と${r(1)}）`;
    case 4:
    case 8:
      return `${name}（${r(0)}まで）`;
    case 0:
    case 5:
      return `${name}（${r(0)}が一番上）`;
    default:
      return name;
  }
}

export function formatChips(amount: number): string {
  return amount.toLocaleString("ja-JP");
}

/** 席に表示する短い行動名 */
export function actionLabel(entry: LogEntry): string {
  switch (entry.type) {
    case "fold":
      return "フォールド";
    case "check":
      return "チェック";
    case "call":
      return `コール ${formatChips(entry.paid)}`;
    case "bet":
      return `ベット ${formatChips(entry.total)}`;
    case "raise":
      return `レイズ ${formatChips(entry.total)}`;
    case "allin":
      return `オールイン ${formatChips(entry.total)}`;
    case "smallBlind":
      return `SB ${formatChips(entry.paid)}`;
    case "bigBlind":
      return `BB ${formatChips(entry.paid)}`;
  }
}

/** 読み上げ・ログ用の文章 */
export function actionSentence(name: string, entry: LogEntry): string {
  switch (entry.type) {
    case "fold":
      return `${name} がフォールドしました`;
    case "check":
      return `${name} がチェックしました`;
    case "call":
      return `${name} が ${formatChips(entry.paid)} コールしました`;
    case "bet":
      return `${name} が ${formatChips(entry.total)} ベットしました`;
    case "raise":
      return `${name} が ${formatChips(entry.total)} にレイズしました`;
    case "allin":
      return `${name} がオールインしました（${formatChips(entry.total)}）`;
    case "smallBlind":
      return `${name} がスモールブラインド ${formatChips(entry.paid)} を出しました`;
    case "bigBlind":
      return `${name} がビッグブラインド ${formatChips(entry.paid)} を出しました`;
  }
}
