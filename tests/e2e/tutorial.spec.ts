import { expect, test } from "@playwright/test";

test("初めて初心者モードを選ぶとチュートリアルが始まり、3ハンド終えると設定画面へ進む", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("button", { name: "初心者モードで遊ぶ" }).click();
  await expect(page).toHaveURL(/\/tutorial$/);

  const bar = page.locator(".sticky");
  const finish = bar.getByRole("button", { name: "初心者モードで遊ぶ" });

  for (let step = 0; step < 60 && !(await finish.isVisible()); step++) {
    const next = bar.getByRole("button", { name: /^次へ$|次の練習へ/ });
    const prompted = bar.locator("button.ring-4:not([disabled])");
    await expect(next.or(prompted).or(finish).first()).toBeVisible({ timeout: 10_000 });

    if (await prompted.isVisible()) {
      // 案内された操作以外のボタンは押せない
      await expect(bar.locator("button[disabled]").first()).toBeVisible();
      await prompted.click();
    } else if (await next.isVisible()) {
      await next.click();
    }
  }

  await finish.click();
  await expect(page).toHaveURL(/\/play\/setup$/);

  // 2回目は直接設定画面へ
  await page.goto("/play");
  await page.getByRole("button", { name: "初心者モードで遊ぶ" }).click();
  await expect(page).toHaveURL(/\/play\/setup$/);
});
