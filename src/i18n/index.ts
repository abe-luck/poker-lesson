import type { HandRank, Player, Rank } from "@/engine/types";
import { en } from "./en";
import { ja, type Dictionary } from "./ja";

export type { Dictionary };
export type Locale = "ja" | "en";

export const LOCALES: Locale[] = ["ja", "en"];
const DICTIONARIES: Record<Locale, Dictionary> = { ja, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** 日本語は今までどおり "/" から、英語は "/en" から始まる URL */
export function localePath(locale: Locale, path: string): string {
  if (locale === "ja") return path;
  return path === "/" ? "/en" : `/en${path}`;
}

/** URL のパスから言語と、言語を除いたパスを取り出す */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return { locale: "en", path: pathname.slice(3) || "/" };
  }
  return { locale: "ja", path: pathname };
}

export function rankLabel(rank: Rank): string {
  return ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Partial<Record<Rank, string>>)[rank] ?? String(rank);
}

/** 例: 「ワンペア（Aのペア）」 / "One Pair (Aces)" */
export function handName(t: Dictionary, hand: Pick<HandRank, "category" | "tiebreak">): string {
  const r = (i: number) => (hand.tiebreak[i] ? rankLabel(hand.tiebreak[i] as Rank) : "");
  return t.hands.name(hand.category, r(0), r(1));
}

/** 画面に出す名前。人間は「あなた」/ "You"、CPU は性格ごとの名前 */
export function playerName(t: Dictionary, player: Pick<Player, "isHuman" | "name" | "persona">): string {
  if (player.isHuman) return t.common.you;
  return player.persona ? t.personas[player.persona].name : player.name;
}
