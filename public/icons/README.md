# アイコン・ブランドアセット管理ポリシー

## 実装方針

このプロジェクトでは、各プラットフォームのブランドアイコンを以下の方法で実装しています。

### 使用方法

**Font Awesome CDN経由でWebフォントを使用**

画像ファイルとして保存するのではなく、Font Awesome 6.5.1のCDNを利用してアイコンをWebフォントとして提供しています。

- CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css`
- ライセンス: Font Awesome Free License（商用利用可）
- 実装場所: `src/layouts/Layout.astro`

### 理由

1. **著作権・商標権の遵守**: 公式ロゴ画像を直接ホスティングせず、ライセンスされたアイコンフォントを使用
2. **保守性**: CDN経由なので最新版への更新が容易
3. **パフォーマンス**: Webフォントのキャッシュ効果
4. **スケーラビリティ**: ベクターなのでどのサイズでも綺麗に表示

## 各プラットフォームのブランドガイドライン

### シェアボタン

#### X (旧Twitter)
- **公式ブランドカラー**: `#000000` (黒)
- **Font Awesomeアイコン**: `fa-x-twitter`
- **ガイドライン**: https://about.twitter.com/en/who-we-are/brand-toolkit
- **使用ルール**:
  - 𝕏ロゴは黒または白のみ
  - ロゴの改変禁止
  - 最小サイズ: 16px

#### Facebook
- **公式ブランドカラー**: `#1877F2` (Facebook Blue)
- **Font Awesomeアイコン**: `fa-facebook-f`
- **ガイドライン**: https://about.meta.com/brand/resources/facebook/logo/
- **使用ルール**:
  - Facebook Blueまたは白/黒のみ
  - "f"ロゴまたはフルロゴを使用
  - 最小サイズ: 40px（推奨）

#### LINE
- **公式ブランドカラー**: `#06C755` (LINE Forest Green)
- **Font Awesomeアイコン**: `fa-line`
- **ガイドライン**: https://line.me/ja/logo （公式ロゴダウンロード）
- **使用ルール**:
  - LINEグリーンを基本とする
  - ロゴの変形・回転禁止

### 音楽ストリーミングサービス

#### Spotify
- **公式ブランドカラー**: `#1DB954` (Spotify Green)
- **Font Awesomeアイコン**: `fa-spotify`
- **公式ガイドライン**: https://developer.spotify.com/documentation/design
- **公式メディアキット**: https://newsroom.spotify.com/media-kit/logo-and-brand-assets/
- **使用ルール**:
  - Spotifyグリーンを基本とする（黒・白背景用にバリエーションあり）
  - フルロゴ（アイコン+ワードマーク）を推奨
  - 最小サイズ: デジタルで70px、アイコン単体は21px
  - ロゴの改変・回転・変形禁止

#### Apple Music
- **公式ブランドカラー**: `#FA243C` (Apple Music Red/Pink)
- **Font Awesomeアイコン**: `fa-apple`
- **公式ガイドライン**: https://marketing.services.apple/apple-music-identity-guidelines
- **公式マーケティングツール**: https://tools.applemusic.com
- **サポートページ**: https://artists.apple.com/support/1117-apple-music-marketing-tools
- **使用ルール**:
  - 公式が提供する "Listen on Apple Music" バッジを使用
  - SVG形式（Web用）、EPS形式（印刷用）
  - 42言語対応
  - バッジの改変禁止
  - 使用前にIdentity Guidelinesの確認必須

#### YouTube Music
- **公式ブランドカラー**: `#FF0000` (YouTube Red)
- **Font Awesomeアイコン**: `fa-youtube`
- **公式ガイドライン**: https://brand.youtube/
- **API ブランディングガイドライン**: https://developers.google.com/youtube/terms/branding-guidelines
- **使用ルール**:
  - YouTubeロゴの色は変更不可
  - 単一の背景色で使用
  - YouTubeのコンテンツにリンクする場合のみ使用可能
  - 最小サイズ要件あり

## カラーコード一覧

```css
/* シェアボタン */
--x-black: #000000;
--facebook-blue: #1877F2;
--line-green: #06C755;

/* ストリーミングサービス */
--spotify-green: #1DB954;
--apple-music-red: #FA243C;
--apple-music-pink: #FF6B81;
--youtube-red: #FF0000;
```

## BASE公式ロゴの使用

このディレクトリには、BASEの公式サービスロゴが含まれています。

**ファイル:**
- `base_logo_horizontal_white.png` - 横型ロゴ（白）
- `base_logo_horizontal_black.png` - 横型ロゴ（黒）
- `base_logo_vertical_white.png` - 縦型ロゴ（白）
- `base_logo_vertical_black.png` - 縦型ロゴ（黒）

**ダウンロード元:**
- 公式ブランドガイドライン: https://binc.jp/en/brand-guideline
- ダウンロードURL: https://binc.jp/wp-content/themes/base-corporate/assets/download/base_service.zip

**使用許可:**
- 個人ブログやSNSでのBASEサービス紹介に限定して使用可能
- なんちゃらアイドル公式サイトのLinksページでのBASE Shopへのリンク表示に使用

**使用ルール:**
- 最小サイズ: Web 50px、印刷 18mm
- ティピ（テント）なしでの使用禁止
- 回転・変形・色変更禁止
- オブジェクトの重ね合わせ禁止
- トリミング・フィルター・効果の使用禁止

**禁止事項:**
- アプリアイコンやSNSプロフィール画像としての使用
- ロゴ入り製品の無断販売

**ダウンロード日:** 2026-01-23

## Font Awesomeライセンス

Font Awesome Free is free, open source, and GPL friendly. You can use it for commercial projects, open source projects, or really almost whatever you want.

- **Icons**: CC BY 4.0 License (https://creativecommons.org/licenses/by/4.0/)
- **Fonts**: SIL OFL 1.1 License (https://scripts.sil.org/OFL)
- **Code**: MIT License (https://opensource.org/licenses/MIT)

公式サイト: https://fontawesome.com/license/free

## 今後、公式バッジ画像を使用する場合

将来的に、Font Awesomeではなく各社が提供する公式バッジ画像を使用する場合は、このディレクトリに配置してください。

### ダウンロード先

- **Spotify**: https://newsroom.spotify.com/media-kit/logo-and-brand-assets/
- **Apple Music**: https://tools.applemusic.com (Badges and Lockupsセクション)
- **X**: https://about.twitter.com/en/who-we-are/brand-toolkit
- **Facebook**: https://about.meta.com/brand/resources/facebook/logo/
- **LINE**: https://line.me/ja/logo

### 命名規則（推奨）

```
spotify-icon-green.svg
spotify-logo-green.svg
apple-music-badge-ja.svg
apple-music-badge-en.svg
x-logo-black.svg
facebook-logo-blue.svg
line-logo-green.svg
```

### 注意事項

1. 公式サイトからダウンロードした原本は `original/` サブディレクトリに保管
2. 最適化・リサイズしたファイルをルートに配置
3. ダウンロード日時とURLを記録
4. ライセンス条項を遵守

## 更新履歴

- 2026-01-22: Font Awesome 6.5.1 CDNを採用、各ブランドガイドラインへのリンクを整理
