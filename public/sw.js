// Poker Lesson のサービスワーカー: 一度開いたあとはオフラインでも遊べるようにする。
// ゲームの処理はすべてブラウザ内で行うので、ページと静的ファイルを保存しておけば動く。

const VERSION = "v1";
const PAGE_CACHE = `pages-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;

/** インストール時に保存しておくページ */
const PAGES = ["/", "/play", "/play/setup", "/play/game", "/tutorial", "/rules", "/hands", "/stats", "/settings"];

/** ページの HTML から、そのページが使う /_next/static のファイルを取り出す */
function assetUrls(html) {
  return [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) ?? [])];
}

async function precache() {
  const pages = await caches.open(PAGE_CACHE);
  const assets = await caches.open(ASSET_CACHE);
  await Promise.all(
    PAGES.map(async (path) => {
      try {
        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) return;
        await pages.put(path, response.clone());
        const urls = assetUrls(await response.text());
        await Promise.all(urls.map((url) => assets.match(url).then((hit) => hit ?? assets.add(url).catch(() => {}))));
      } catch {
        // 取得できなかったページは、あとで開いたときに保存する
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.endsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // ファイル名にハッシュが付いた静的ファイル: 保存済みならそれを使う
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // ページ: 通信できれば最新を取得して保存、できなければ保存済みを使う
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGE_CACHE);
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(url.pathname, response.clone());
          return response;
        } catch {
          return (await cache.match(url.pathname)) ?? (await cache.match("/")) ?? Response.error();
        }
      })(),
    );
  }
});
