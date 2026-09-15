"use client";

import { useState } from "react";
import { parseCards } from "@/engine/cards";
import { playSound } from "@/lib/sound";
import { clearAppData } from "@/lib/storage";
import { DEFAULT_SETTINGS, SETTINGS_KEY, useSettingsStore, type Motion, type Theme, type Volume } from "@/store/settingsStore";
import { SESSION_KEY, useGameStore } from "@/store/gameStore";
import { STATS_KEY, useStatsStore } from "@/store/statsStore";
import { PlayingCard } from "@/components/table/PlayingCard";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Row, RowGroup, Segmented } from "@/components/ui/Form";
import { Switch } from "@/components/ui/Switch";

const THEMES = { light: "ライト", dark: "ダーク", system: "端末に合わせる" } satisfies Record<Theme, string>;
const MOTIONS = { normal: "通常", short: "短め", none: "なし" } satisfies Record<Motion, string>;
const VOLUMES = { low: "小", medium: "中", high: "大" } satisfies Record<Volume, string>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="mx-1 text-[13px] font-bold text-muted">{title}</h2>
      <RowGroup>{children}</RowGroup>
    </section>
  );
}

export function SettingsScreen() {
  const settings = useSettingsStore();
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);

  const clearData = () => {
    clearAppData([STATS_KEY, SESSION_KEY, SETTINGS_KEY]);
    useStatsStore.getState().reset();
    useGameStore.getState().quit();
    settings.reset();
    setConfirming(false);
    setCleared(true);
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader back={{ href: "/", label: "戻る" }} />
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8 sm:py-10">
        <h1 className="text-[28px] font-bold">設定</h1>

        <Section title="表示">
          <Row label="テーマ">
            <Segmented label="テーマ" options={Object.keys(THEMES) as Theme[]} value={settings.theme} format={(v) => THEMES[v]} onChange={(theme) => settings.update({ theme })} />
          </Row>
          <Row label="4色デッキ" sub="♦ を青、♣ を緑で表示して見分けやすくします">
            <div className="flex items-center gap-4">
              <div className="flex gap-1" aria-hidden>
                {parseCards("As Ah Ad Ac").map((card) => (
                  <PlayingCard key={card.suit} card={card} size="sm" />
                ))}
              </div>
              <Switch label="4色デッキ" checked={settings.fourColorDeck} onChange={(fourColorDeck) => settings.update({ fourColorDeck })} />
            </div>
          </Row>
          <Row label="アニメーション" sub="端末の「視差効果を減らす」がオンのときは動きを止めます">
            <Segmented label="アニメーション" options={Object.keys(MOTIONS) as Motion[]} value={settings.motion} format={(v) => MOTIONS[v]} onChange={(motion) => settings.update({ motion })} />
          </Row>
        </Section>

        <Section title="効果音">
          <Row label="効果音" sub="ゲーム画面のスピーカーボタンからも切り替えられます">
            <Switch label="効果音" checked={settings.soundEnabled} onChange={(soundEnabled) => {
              settings.update({ soundEnabled });
              if (soundEnabled) playSound("turn", settings.volume);
            }} />
          </Row>
          <Row label="音量">
            <Segmented
              label="音量"
              options={Object.keys(VOLUMES) as Volume[]}
              value={settings.volume}
              format={(v) => VOLUMES[v]}
              onChange={(volume) => {
                settings.update({ volume });
                if (settings.soundEnabled) playSound("chips", volume);
              }}
            />
          </Row>
        </Section>

        <Section title="ヒント">
          <Row label="初心者モードで、おすすめを表示">
            <Switch label="初心者モードで、おすすめを表示" checked={settings.showRecommendation} onChange={(showRecommendation) => settings.update({ showRecommendation })} />
          </Row>
          <Row label="プロモードで、今の役を表示">
            <Switch label="プロモードで、今の役を表示" checked={settings.proShowHand} onChange={(proShowHand) => settings.update({ proShowHand })} />
          </Row>
        </Section>

        <Section title="データ">
          <Row label="成績・履歴・設定を消去" sub={cleared ? "消去しました" : "この操作は取り消せません"}>
            <Button variant="danger" onClick={() => setConfirming(true)}>
              消去する
            </Button>
          </Row>
        </Section>
      </main>

      <Dialog
        open={confirming}
        title="データを消去しますか？"
        onClose={() => setConfirming(false)}
        footer={
          <>
            <Button size="lg" onClick={() => setConfirming(false)}>
              やめる
            </Button>
            <Button variant="danger" size="lg" onClick={clearData}>
              消去する
            </Button>
          </>
        }
      >
        <p className="text-[15px] leading-[1.8]">
          成績、ハンド履歴、途中のゲーム、設定をすべて消して、最初の状態（テーマ: {THEMES[DEFAULT_SETTINGS.theme]}、効果音: オフ）に戻します。
        </p>
      </Dialog>
    </div>
  );
}
