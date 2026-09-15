import { createJSONStorage } from "zustand/middleware";

/** ブラウザの保存領域が使えない環境 (プライベートブラウズ等) では、メモリに保存して動く */
export const safeStorage = createJSONStorage(() => {
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

/** このアプリが保存したデータをすべて消す */
export function clearAppData(keys: string[]) {
  try {
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // 保存領域が使えない環境では何もしない
  }
}
