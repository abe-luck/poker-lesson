import { expect, test } from "@playwright/test";
import { markTutorialDone } from "./helpers";

test("英語版: トップから初心者モードで1ハンド遊ぶと、英語で振り返りが出る", async ({ page }) => {
  await markTutorialDone(page);
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("This is a game. No real money is involved.")).toBeVisible();

  await page.getByRole("link", { name: "Start playing" }).click();
  await expect(page).toHaveURL(/\/en\/play$/);
  await page.getByRole("button", { name: "Play Beginner mode" }).click();
  await expect(page).toHaveURL(/\/en\/play\/setup$/);
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page).toHaveURL(/\/en\/play\/game$/);

  const review = page.getByRole("dialog", { name: /review$/ });
  const fold = page.getByRole("button", { name: "Fold", exact: true });
  for (let i = 0; i < 120 && !(await review.isVisible()); i++) {
    if (await fold.isVisible()) {
      const check = page.getByRole("button", { name: "Check", exact: true });
      if (await check.isVisible()) await check.click();
      else await page.getByRole("button", { name: /^(Call|All-in) / }).first().click();
    }
    await page.waitForTimeout(300);
  }
  await expect(review.getByText("Why did it turn out this way?")).toBeVisible();
  // 日本語が混ざっていない
  expect(await review.innerText()).not.toMatch(/[぀-ヿ一-鿿]/);
});

test("設定の言語切り替えで、同じ設定ページの英語版 / 日本語版に移動する", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("radio", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/settings$/);
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();

  await page.getByRole("radio", { name: "日本語" }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
});

test("英語版のルールと役一覧", async ({ page }) => {
  await page.goto("/en/rules");
  await expect(page.getByRole("heading", { level: 1, name: "Rules" })).toBeVisible();
  await expect(page.getByRole("strong").filter({ hasText: "2 hole cards" })).toBeVisible();

  await page.goto("/en/hands");
  await expect(page.getByText("Royal Flush")).toBeVisible();
  await expect(page.getByRole("img", { name: "Ace of Spades" }).first()).toBeVisible();
});

test("存在しない URL は共通の 404 ページになる", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Page not found")).toBeVisible();
  await expect(page.getByText("ページが見つかりません")).toBeVisible();
});
