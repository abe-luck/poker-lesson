"use client";

import { useEffect } from "react";

/** 本番環境でだけサービスワーカーを登録する (開発中は古いファイルが残らないように使わない) */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // 登録できなくても、通常どおりオンラインで遊べる
    });
  }, []);
  return null;
}
