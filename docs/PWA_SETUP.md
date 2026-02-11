# PWA設定ガイド

なんちゃらアイドル公式サイトのPWA（Progressive Web App）設定手順。

## 📱 PWAとは

- **オフライン対応**: ネット繋がってなくてもスケジュール見れる
- **ホーム画面追加**: アプリみたいにインストールできる
- **高速表示**: リソースをガチでキャッシュするから爆速
- **プッシュ通知**: （将来的に実装可能）

## 🎨 現在の設定

- **アプリ名**: なんちゃらアイドル
- **短縮名**: なんちゃら
- **テーマカラー**: `#0A0A0A`（サイトの背景ダークカラー）
- **キャッシュ戦略**: ガチガチ設定
  - 全静的リソース（HTML/CSS/JS/画像）
  - Google Fonts（1年キャッシュ）
  - Font Awesome（1年キャッシュ）
  - イベント画像（30日キャッシュ）

## 🛠️ セットアップ手順

### 1. ロゴ画像を配置

チャットで送った「なんちゃらアイドル」のクエスチョンマークロゴを以下のパスに保存：

```
public/pwa-icons/logo-source.png
```

**推奨サイズ**: 512x512以上（正方形）

### 2. PWAアイコンを生成

```bash
npm run generate-pwa-icons
```

以下のアイコンが自動生成されます：
- `icon-192.png` (192x192) - Androidホーム画面用
- `icon-512.png` (512x512) - スプラッシュ画面用
- `apple-touch-icon.png` (180x180) - iOSホーム画面用
- `favicon-32x32.png` (32x32) - Favicon
- `favicon-16x16.png` (16x16) - Favicon

### 3. 開発サーバーで確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いて：
1. DevToolsの Application タブを開く
2. Manifest セクションでアプリ名・アイコンを確認
3. Service Workers セクションでSWが登録されているか確認
4. 「Install app」ボタンが表示されるか確認（Chrome/Edge）

### 4. ビルド

```bash
npm run build
```

ビルド時に以下が自動生成されます：
- `manifest.webmanifest` - PWAマニフェスト
- `sw.js` - Service Worker
- `workbox-*.js` - Workboxライブラリ

## 🧪 テスト方法

### デスクトップ（Chrome/Edge）

1. サイトを開く
2. アドレスバー右端の「インストール」ボタンをクリック
3. インストール後、スタンドアロンウィンドウで起動することを確認

### モバイル（iOS Safari）

1. サイトを開く
2. 共有ボタン → 「ホーム画面に追加」
3. ホーム画面にアイコンが追加されることを確認
4. アイコンタップで起動

### モバイル（Android Chrome）

1. サイトを開く
2. メニュー → 「ホーム画面に追加」
3. または、自動でインストールバナーが表示される

### オフライン動作確認

1. DevToolsの Network タブを開く
2. 「Offline」にチェック
3. ページをリロード
4. ちゃんと表示されればOK

## 📁 関連ファイル

```
nantyara.com/
├── astro.config.mjs          # PWA設定（@vite-pwa/astro）
├── src/layouts/Layout.astro  # PWAメタタグ
├── public/
│   └── pwa-icons/            # PWAアイコン
│       ├── logo-source.png   # ソース画像（手動配置）
│       ├── icon-192.png      # 生成
│       ├── icon-512.png      # 生成
│       └── apple-touch-icon.png # 生成
└── scripts/
    └── generate-pwa-icons.sh # アイコン生成スクリプト
```

## ⚙️ 設定詳細

### Workbox キャッシュ戦略

#### 静的リソース（Precaching）
- パターン: `**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2,ttf,eot,otf}`
- ビルド時に全リソースをキャッシュ

#### Google Fonts（CacheFirst）
- URL: `https://fonts.googleapis.com/*`
- キャッシュ期間: 1年
- 最大エントリ: 10

#### CDN（CacheFirst）
- URL: `https://cdnjs.cloudflare.com/*`
- キャッシュ期間: 1年
- 最大エントリ: 10

#### イベント画像（CacheFirst）
- URL: `/events/*`
- キャッシュ期間: 30日
- 最大エントリ: 100

### マニフェスト設定

```json
{
  "name": "なんちゃらアイドル",
  "short_name": "なんちゃら",
  "description": "なんちゃらアイドル公式サイト - スケジュール・ライブ情報",
  "theme_color": "#0A0A0A",
  "background_color": "#0A0A0A",
  "display": "standalone",
  "orientation": "portrait"
}
```

## 🐛 トラブルシューティング

### Service Workerが登録されない

```bash
# キャッシュをクリア
DevTools → Application → Storage → Clear site data

# ビルドし直す
npm run build
npm run preview
```

### アイコンが表示されない

```bash
# アイコンを再生成
npm run generate-pwa-icons

# ビルドし直す
npm run build
```

### オフラインで動かない

1. DevToolsの Application → Service Workers を確認
2. 「Update on reload」のチェックを外す
3. ページをリロードしてSWを登録
4. オフラインにしてテスト

## 🚀 本番環境での注意点

- **HTTPS必須**: PWAはHTTPSでのみ動作（localhost除く）
- **キャッシュバスティング**: Astroが自動でハッシュ付きファイル名を生成
- **更新**: `registerType: 'autoUpdate'` なので自動更新される

## 📊 Lighthouse監査

PWAの完成度をチェック：

```bash
# Chrome DevTools → Lighthouse
# PWA カテゴリで監査実行
```

目標スコア:
- ✅ **Installable**: インストール可能
- ✅ **PWA Optimized**: PWA最適化済み
- ✅ **Offline Support**: オフライン対応
- ✅ **Fast and reliable**: 高速・信頼性

## 🔗 参考リンク

- [@vite-pwa/astro ドキュメント](https://vite-pwa-org.netlify.app/frameworks/astro.html)
- [Workbox 戦略](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
- [Web App Manifest](https://developer.mozilla.org/ja/docs/Web/Manifest)
