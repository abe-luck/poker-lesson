import { expect, test } from "@playwright/test";

test("練習問題: 答えると解説が出て、8問で結果が出る", async ({ page }) => {
  await page.goto("/practice");
  await page.getByRole("button", { name: "はじめる" }).click();

  const bar = page.locator(".sticky");
  for (let i = 1; i <= 8; i++) {
    await expect(page.locator("header")).toContainText(`第 ${i} 問`);
    await expect(bar.getByText("あなたならどうしますか？")).toBeVisible();

    // フォールドはどの場面でも選べる
    await bar.getByRole("button", { name: "フォールド" }).click();

    // 正解・惜しい・考え直してみましょう のいずれかと、理由が出る
    await expect(bar.getByText(/正解|惜しい|考え直してみましょう/).first()).toBeVisible();
    await expect(bar.getByText(/おすすめは「.+」でした/)).toBeVisible();
    await bar.getByRole("button", { name: i === 8 ? "結果を見る" : "次の問題" }).click();
  }

  await expect(page.getByRole("heading", { name: "練習の結果" })).toBeVisible();
  await expect(page.getByText(/8 問中 \d+ 問 正解/)).toBeVisible();
  await page.getByRole("button", { name: "もう一度" }).click();
  await expect(page.locator("header")).toContainText("第 1 問");
});

test("英語版の練習問題も動く", async ({ page }) => {
  await page.goto("/en/practice");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator("header")).toContainText("Question 1 of 8");
  await page.locator(".sticky").getByRole("button", { name: "Fold" }).click();
  await expect(page.locator(".sticky").getByText(/The suggested action was/)).toBeVisible();
});
