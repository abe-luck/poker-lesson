import { expect, test } from "@playwright/test";
import { markTutorialDone, playUntilHandOver, startGame } from "./helpers";

test.beforeEach(async ({ page }) => {
  await markTutorialDone(page);
});

test("初心者モード: 1ハンド遊ぶと振り返りが開き、成績に記録される", async ({ page }) => {
  await startGame(page, "初心者モード");
  await playUntilHandOver(page);

  const review = page.getByRole("dialog", { name: /の振り返り/ });
  await expect(review.getByText("なぜこの結果になったの？")).toBeVisible();
  await review.getByRole("button", { name: "次のハンドへ" }).click();
  await expect(page.locator("header")).toContainText("#2");

  await page.goto("/stats");
  await expect(page.getByText("遊んだハンド")).toBeVisible();
  await expect(page.getByRole("heading", { name: "ハンド履歴" })).toBeVisible();
});

test("途中で再読み込みしても、同じハンドから続けられる", async ({ page }) => {
  await startGame(page, "初心者モード");
  const header = page.locator("header");
  await expect(header).toContainText("#1");
  await page.reload();
  await expect(header).toContainText("初心者モード");
  await expect(header).toContainText("#1");

  await page.goto("/");
  await page.getByRole("link", { name: /続きから/ }).click();
  await expect(page).toHaveURL(/\/play\/game$/);
});

test("キーボードの C でチェック / コールできる", async ({ page, isMobile }) => {
  test.skip(isMobile, "キーボード操作は PC のみ");
  await startGame(page, "初心者モード");
  const fold = page.getByRole("button", { name: "フォールド", exact: true });
  await expect(fold).toBeVisible({ timeout: 20_000 });
  const before = await page.locator("[aria-live=polite].sr-only").textContent();
  await page.keyboard.press("c");
  await expect(page.locator("[aria-live=polite].sr-only")).not.toHaveText(before ?? "");
});

test("プロモード: 持ち時間が切れると自動でチェックかフォールドになる", async ({ page }) => {
  await page.clock.install();
  await startGame(page, "プロモード", async (p) => {
    await p.getByRole("radio", { name: "15秒" }).click();
  });

  const timer = page.getByRole("timer");
  for (let i = 0; i < 40 && !(await timer.isVisible()); i++) {
    const next = page.getByRole("button", { name: "次のハンドへ" });
    if (await next.isVisible()) await next.click();
    await page.clock.runFor(1_000);
  }
  await expect(timer).toBeVisible();

  type Entry = { playerId: string; type: string };
  const humanActions = () =>
    page.evaluate(() =>
      (JSON.parse(localStorage.getItem("poker.session.v1") ?? "{}").state.game.log as Entry[]).filter((e) => e.playerId === "you"),
    );
  const before = (await humanActions()).length;

  await page.clock.runFor(16_000);
  // 時間切れで、あなたの行動としてチェックかフォールドが1回だけ記録されている
  // (その後すぐ次の自分の番になり、タイマーが再び表示されることもある)
  await expect.poll(async () => (await humanActions()).length).toBe(before + 1);
  expect(["check", "fold"]).toContain((await humanActions()).at(-1)!.type);
});
