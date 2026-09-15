import type { Metadata } from "next";
import { ModeSelect } from "@/components/screens/ModeSelect";

export const metadata: Metadata = { title: "モードを選ぶ | Poker Lesson" };

export default function PlayPage() {
  return <ModeSelect />;
}
