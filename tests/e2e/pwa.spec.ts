import { expect, test } from "@playwright/test";

test("マニフェストとアイコンが配信されている", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ name: "Poker Lesson", display: "standalone", start_url: "/" });
  for (const icon of manifest.icons as { src: string }[]) {
    const res = await request.get(icon.src);
    expect(res.ok(), icon.src).toBe(true);
    expect(res.headers()["content-type"]).toBe("image/png");
  }
  const sw = await request.get("/sw.js");
  expect(sw.headers()["cache-control"]).toContain("no-store");
});

test("一度開いたあとは、オフラインでもページを開いてゲームを始められる", async ({ page, context }) => {
  await page.goto("/");
  // サービスワーカーが有効になり、ページの保存が終わるまで待つ
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
    }
    return registration.active?.state;
  });
  await expect
    .poll(() => page.evaluate(async () => (await caches.open("pages-v3")).keys().then((k) => k.length)), { timeout: 20_000 })
    .toBeGreaterThanOrEqual(20);

  await context.setOffline(true);

  await page.goto("/rules");
  await expect(page.getByRole("heading", { level: 1, name: "ルール説明" })).toBeVisible();

  await page.goto("/play");
  await page.getByRole("button", { name: "プロモードで遊ぶ" }).click();
  await page.getByRole("button", { name: "ゲーム開始" }).click();
  await expect(page.locator("header")).toContainText("ハンド");
  await expect(page.getByText("ポット", { exact: false }).first()).toBeVisible();
});
