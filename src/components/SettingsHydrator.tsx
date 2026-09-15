"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useGameStore } from "@/store/gameStore";
import { applySettingsToDocument, useSettingsStore } from "@/store/settingsStore";
import { useStatsStore } from "@/store/statsStore";

/**
 * 保存された設定・成績・途中のゲームを、画面の表示後に読み込む。
 * (サーバーで描いた HTML と食い違わないように、各ストアは skipHydration にしている)
 */
export function SettingsHydrator() {
  useEffect(() => {
    const unsubscribe = useSettingsStore.subscribe((s) => applySettingsToDocument(s));
    void useSettingsStore.persist.rehydrate();
    void useStatsStore.persist.rehydrate();
    void useGameStore.persist.rehydrate();
    return unsubscribe;
  }, []);
  return null;
}

/** 途中のゲームの読み込みが終わったか */
export function useGameStoreHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useGameStore.persist.onFinishHydration(onChange),
    () => useGameStore.persist.hasHydrated(),
    () => false,
  );
}
