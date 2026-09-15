# Poker Lesson

ルールを覚えながらテキサス・ホールデムを遊べるポーカーアプリです。初心者モードとプロモードがあります。日本語 (`/`) と英語 (`/en`) に対応し、ホーム画面に追加してオフラインでも遊べます (PWA)。

- 公開サイト: https://poker-lesson.vercel.app/ (英語版: https://poker-lesson.vercel.app/en)
- 設計書: [docs/DESIGN.md](docs/DESIGN.md)
- 画面モックアップ（元ファイル）: [design/mockups/](design/mockups/)

## 開発

必要なもの: Node.js 24 以上

```bash
npm install      # 初回のみ
npm run dev      # http://localhost:3000 で起動
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番用にビルド |
| `npm run lint` | ESLint でチェック |
| `npm run typecheck` | TypeScript の型チェック |
| `npm test` | 単体テスト (Vitest) |
| `npm run test:e2e` | 画面操作テスト (Playwright)。先に `npm run build` が必要 |
| `node scripts/generate-icons.mjs` | アプリアイコンを作り直す |

画面の文言は `src/i18n/ja.ts` (日本語) と `src/i18n/en.ts` (英語) にあります。文言を足すときは両方に同じ形で追加してください (型チェックで漏れが分かります)。

## 公開

GitHub の `main` ブランチに入った変更は Vercel で自動的に本番公開されます。Pull Request ごとに確認用 URL も作られます。GitHub Actions では lint・型チェック・単体テスト・ビルド・画面操作テストを実行します。
