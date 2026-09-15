import type { Metadata } from "next";
import { TutorialScreen } from "@/components/screens/TutorialScreen";

export const metadata: Metadata = { title: "チュートリアル | Poker Lesson" };

export default function TutorialPage() {
  return <TutorialScreen />;
}
