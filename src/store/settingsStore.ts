import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SettingsStore = {
  /** 初心者モードでおすすめを表示する */
  showRecommendation: boolean;
  setShowRecommendation: (value: boolean) => void;
};

// ブラウザの保存領域が使えない環境 (プライベートブラウズ等) では保存せずに動く
const safeStorage = createJSONStorage(() => {
  try {
    const key = "poker.test";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => void memory.set(k, v),
      removeItem: (k: string) => void memory.delete(k),
    };
  }
});

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      showRecommendation: true,
      setShowRecommendation: (showRecommendation) => set({ showRecommendation }),
    }),
    { name: "poker.settings.v1", storage: safeStorage },
  ),
);
