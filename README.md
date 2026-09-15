# Poker Lesson

ルールを覚えながらテキサス・ホールデムを遊べるポーカーアプリです。初心者モードとプロモードがあります。

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
| `npm test` | テストを実行 (Vitest) |

## 公開

GitHub の `main` ブランチに入った変更は Vercel で自動的に本番公開されます。Pull Request ごとに確認用 URL も作られます。
