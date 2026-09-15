import { expect, test } from "@playwright/test";

test("テーマと4色デッキは再読み込み後も残る", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("radio", { name: "ダーク" }).click();
  await page.getByRole("switch", { name: "4色デッキ" }).click();

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(html).toHaveAttribute("data-four-color", "true");
  await expect(page.getByRole("switch", { name: "4色デッキ" })).toHaveAttribute("aria-checked", "true");
});

test("主要なページが表示できる", async ({ page }) => {
  for (const [path, heading] of [
    ["/", "Poker Lesson"],
    ["/rules", "ルール説明"],
    ["/hands", "役一覧"],
    ["/stats", "成績"],
    ["/settings", "設定"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }
});
