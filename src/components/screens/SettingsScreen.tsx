"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseCards } from "@/engine/cards";
import { localePath, type Locale } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { playSound } from "@/lib/sound";
import { clearAppData } from "@/lib/storage";
import { SETTINGS_KEY, useSettingsStore, type Motion, type Theme, type Volume } from "@/store/settingsStore";
import { SESSION_KEY, useGameStore } from "@/store/gameStore";
import { STATS_KEY, useStatsStore } from "@/store/statsStore";
import { PlayingCard } from "@/components/table/PlayingCard";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Row, RowGroup, Segmented } from "@/components/ui/Form";
import { Switch } from "@/components/ui/Switch";

const THEMES: Theme[] = ["light", "dark", "system"];
const MOTIONS: Motion[] = ["normal", "short", "none"];
const VOLUMES: Volume[] = ["low", "medium", "high"];
const LANGUAGES: { locale: Locale; label: string }[] = [
  { locale: "ja", label: "日本語" },
  { locale: "en", label: "English" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="mx-1 text-[13px] font-bold text-muted">{title}</h2>
      <RowGroup>{children}</RowGroup>
    </section>
  );
}

export function SettingsScreen() {
  const { t, locale, href } = useI18n();
  const s = t.settings;
  const router = useRouter();
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
      <AppHeader back={{ href: href("/"), label: t.common.back }} />
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8 sm:py-10">
        <h1 className="text-[28px] font-bold">{s.title}</h1>

        <Section title={s.display}>
          <Row label={s.language}>
            <Segmented
              label={s.language}
              options={LANGUAGES}
              value={LANGUAGES.find((l) => l.locale === locale)!}
              format={(l) => l.label}
              equals={(a, b) => a.locale === b.locale}
              onChange={(l) => router.push(localePath(l.locale, "/settings"))}
            />
          </Row>
          <Row label={s.theme}>
            <Segmented label={s.theme} options={THEMES} value={settings.theme} format={(v) => s.themes[v]} onChange={(theme) => settings.update({ theme })} />
          </Row>
          <Row label={s.fourColor} sub={s.fourColorSub}>
            <div className="flex items-center gap-4">
              <div className="flex gap-1" aria-hidden>
                {parseCards("As Ah Ad Ac").map((card) => (
                  <PlayingCard key={card.suit} card={card} size="sm" />
                ))}
              </div>
              <Switch label={s.fourColor} checked={settings.fourColorDeck} onChange={(fourColorDeck) => settings.update({ fourColorDeck })} />
            </div>
          </Row>
          <Row label={s.motion} sub={s.motionSub}>
            <Segmented label={s.motion} options={MOTIONS} value={settings.motion} format={(v) => s.motions[v]} onChange={(motion) => settings.update({ motion })} />
          </Row>
        </Section>

        <Section title={s.sound}>
          <Row label={s.sound} sub={s.soundSub}>
            <Switch
              label={s.sound}
              checked={settings.soundEnabled}
              onChange={(soundEnabled) => {
                settings.update({ soundEnabled });
                if (soundEnabled) playSound("turn", settings.volume);
              }}
            />
          </Row>
          <Row label={s.volume}>
            <Segmented
              label={s.volume}
              options={VOLUMES}
              value={settings.volume}
              format={(v) => s.volumes[v]}
              onChange={(volume) => {
                settings.update({ volume });
                if (settings.soundEnabled) playSound("chips", volume);
              }}
            />
          </Row>
        </Section>

        <Section title={s.hints}>
          <Row label={s.showRecommendation}>
            <Switch label={s.showRecommendation} checked={settings.showRecommendation} onChange={(showRecommendation) => settings.update({ showRecommendation })} />
          </Row>
          <Row label={s.proShowHand}>
            <Switch label={s.proShowHand} checked={settings.proShowHand} onChange={(proShowHand) => settings.update({ proShowHand })} />
          </Row>
        </Section>

        <Section title={s.data}>
          <Row label={s.clear} sub={cleared ? s.cleared : s.irreversible}>
            <Button variant="danger" onClick={() => setConfirming(true)}>
              {s.clearButton}
            </Button>
          </Row>
        </Section>
      </main>

      <Dialog
        open={confirming}
        title={s.confirmTitle}
        onClose={() => setConfirming(false)}
        footer={
          <>
            <Button size="lg" onClick={() => setConfirming(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" size="lg" onClick={clearData}>
              {s.clearButton}
            </Button>
          </>
        }
      >
        <p className="text-[15px] leading-[1.8]">{s.confirmBody}</p>
      </Dialog>
    </div>
  );
}
