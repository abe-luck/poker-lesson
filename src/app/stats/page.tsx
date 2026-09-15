import type { Metadata } from "next";
import { StatsScreen } from "@/components/screens/StatsScreen";

export const metadata: Metadata = { title: "成績 | Poker Lesson" };

export default function StatsPage() {
  return <StatsScreen />;
}
