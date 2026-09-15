import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeStorage } from "@/lib/storage";

export type Theme = "light" | "dark" | "system";
export type Motion = "normal" | "short" | "none";
export type Volume = "low" | "medium" | "high";

export const SETTINGS_KEY = "poker.settings.v1";

export type Settings = {
  theme: Theme;
  fourColorDeck: boolean;
  motion: Motion;
  soundEnabled: boolean;
  volume: Volume;
  /** 初心者モードでおすすめを表示する */
  showRecommendation: boolean;
  /** プロモードで今の役を表示する */
  proShowHand: boolean;
  tutorialDone: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  fourColorDeck: false,
  motion: "normal",
  soundEnabled: false,
  volume: "medium",
  showRecommendation: true,
  proShowHand: false,
  tutorialDone: false,
};

type SettingsStore = Settings & {
  update: (patch: Partial<Settings>) => void;
  setShowRecommendation: (value: boolean) => void;
  reset: () => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      setShowRecommendation: (showRecommendation) => set({ showRecommendation }),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: SETTINGS_KEY,
      storage: safeStorage,
      // サーバーで描いた HTML と食い違わないよう、読み込みは画面の表示後に行う (SettingsHydrator)
      skipHydration: true,
    },
  ),
);

/** <html> の属性に反映する (テーマ・4色デッキ・アニメーション) */
export function applySettingsToDocument(settings: Pick<Settings, "theme" | "fourColorDeck" | "motion">) {
  const root = document.documentElement;
  if (settings.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", settings.theme);
  root.setAttribute("data-four-color", String(settings.fourColorDeck));
  root.setAttribute("data-motion", settings.motion);
}
