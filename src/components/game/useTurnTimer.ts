"use client";

import { useEffect, useState } from "react";

const TICK_MS = 250;

type Options = {
  /** 0 なら持ち時間なし */
  seconds: number;
  /** 手番が変わるたびに変わる値。変わると残り時間が戻る */
  turnKey: string | null;
  paused: boolean;
  onExpire: () => void;
};

/** 自分の番の残り秒数を返す。持ち時間なし・自分の番でないときは null */
export function useTurnTimer({ seconds, turnKey, paused, onExpire }: Options): number | null {
  const full = seconds * 1000;
  const [tick, setTick] = useState({ key: "", left: full });
  const active = seconds > 0 && turnKey !== null;
  const left = tick.key === turnKey ? tick.left : full;

  useEffect(() => {
    if (!active || paused) return;
    const id = setInterval(() => {
      setTick((prev) => {
        const base = prev.key === turnKey ? prev.left : full;
        return { key: turnKey!, left: Math.max(0, base - TICK_MS) };
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [active, paused, turnKey, full]);

  useEffect(() => {
    if (active && !paused && tick.key === turnKey && tick.left <= 0) onExpire();
  }, [active, paused, tick, turnKey, onExpire]);

  return active ? Math.ceil(left / 1000) : null;
}
