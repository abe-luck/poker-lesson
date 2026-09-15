import { expect, type Page } from "@playwright/test";

/** 自分の番ならチェック (できなければコール) する。ハンドが終わるまで繰り返す */
export async function playUntilHandOver(page: Page, { beginner = true } = {}) {
  const fold = page.getByRole("button", { name: "フォールド", exact: true });
  const review = page.getByRole("dialog", { name: /の振り返り/ });
  const barNext = page.getByRole("button", { name: /次のハンドへ|チップを補充して続ける|もう一度遊ぶ/ });

  for (let i = 0; i < 120; i++) {
    if (beginner ? await review.isVisible() : await barNext.first().isVisible()) return;
    if (await fold.isVisible()) {
      const check = page.getByRole("button", { name: "チェック", exact: true });
      if (await check.isVisible()) await check.click();
      else await page.getByRole("button", { name: /^(コール|オールイン) / }).first().click();
    }
    await page.waitForTimeout(300);
  }
  throw new Error("ハンドが終わりませんでした");
}

/** チュートリアルを済ませた状態にする (初心者モードを選んだときに直接設定画面へ進むように) */
export async function markTutorialDone(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    const key = "poker.settings.v1";
    const saved = JSON.parse(localStorage.getItem(key) ?? "{}");
    localStorage.setItem(key, JSON.stringify({ state: { ...saved.state, tutorialDone: true }, version: 0 }));
  });
}

export async function startGame(page: Page, mode: "初心者モード" | "プロモード", options: (page: Page) => Promise<void> = async () => {}) {
  await page.goto("/play");
  await page.getByRole("button", { name: `${mode}で遊ぶ` }).click();
  await expect(page).toHaveURL(/\/play\/setup$/);
  await options(page);
  await page.getByRole("button", { name: "ゲーム開始" }).click();
  await expect(page).toHaveURL(/\/play\/game$/);
}
