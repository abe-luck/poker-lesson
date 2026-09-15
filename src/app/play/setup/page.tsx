import type { Metadata } from "next";
import { GameSetup } from "@/components/screens/GameSetup";

export const metadata: Metadata = { title: "ゲーム設定 | Poker Lesson" };

export default function SetupPage() {
  return <GameSetup />;
}
