import type { Metadata } from "next";
import { SettingsScreen } from "@/components/screens/SettingsScreen";

export const metadata: Metadata = { title: "設定 | Poker Lesson" };

export default function SettingsPage() {
  return <SettingsScreen />;
}
