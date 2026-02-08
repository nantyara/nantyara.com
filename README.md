# nantyara.com

なんちゃらアイドルの公式ウェブサイト

## 概要

このサイトは[Astro](https://astro.build/)を使用して構築された、なんちゃらアイドルのスケジュール管理と情報発信のためのウェブサイトです。

### 主な機能

- **スケジュール管理**: イベント情報をYAML形式で管理し、自動的にサイトに反映
- **TimeTree連携**: TimeTree公開カレンダーからイベント情報を自動インポート
- **音源情報**: リリース情報の管理と表示
- **レスポンシブデザイン**: モバイル・デスクトップ両対応

## セットアップ

### 必要な環境

- Node.js >= 20.0.0
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/nantyara/nantyara.com.git
cd nantyara.com

# 依存関係をインストール
npm install
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

開発サーバーが `http://localhost:3000/` で起動します。

### ビルド

```bash
npm run build
```

本番用にビルドされたファイルが `dist/` ディレクトリに生成されます。

### プレビュー

```bash
npm run preview
```

ビルドしたサイトをローカルでプレビューできます。

### YAML検証

```bash
npm run validate-yaml
```

スケジュールとリリース情報のYAMLファイルを検証します。

## プロジェクト構造

```
.
├── src/
│   ├── data/
│   │   ├── schedules/      # イベントスケジュール（月ごとのYAMLファイル）
│   │   │   ├── 2026-01.yml
│   │   │   ├── 2026-02.yml
│   │   │   └── ...
│   │   └── releases.yml    # 音源リリース情報
│   ├── pages/              # ページコンポーネント
│   └── ...
├── public/
│   └── events/             # イベント画像
├── tools/                  # 開発ツール
│   ├── schedule-list       # スケジュール一覧ツール
│   └── sync-timetree       # TimeTree同期ツール
└── scripts/
    └── validate-yaml.js    # YAML検証スクリプト
```

## スケジュール管理

### YAMLファイルの構造

イベント情報は `src/data/schedules/` ディレクトリに月ごとのYAMLファイルとして管理されています。

```yaml
- id: event-20260212-lamama
  slug: 20260212-lamama
  date: 2026-02-12 19:00:00 +0900
  title: なんちゃらアイドル主催 大人の文化祭～バラエティだよ人生はvol.003～
  site: 渋谷 La.mama
  label: ラベル名（オプション）
  content: |
    イベントの詳細情報をここに記述
  images:
    - /events/20260212-lamama.jpeg
```

### フィールド説明

- `id`: イベントの一意なID
- `slug`: URL用のスラッグ
- `date`: 開始日時（ISO 8601形式、日本時間）
- `title`: イベントタイトル
- `site`: 会場名
- `label`: ラベル（オプション、例：「マミソロ」「あおはるソロ」）
- `content`: イベントの詳細説明（Markdown記法可）
- `images`: イベント画像のパス（配列）

## コマンドラインツール

### schedule-list

スケジュールを一覧表示するツールです。

```bash
# 全イベントを表示
schedule-list

# 特定の月のイベントを表示
schedule-list 2026-02

# 今後のイベントのみ表示
schedule-list --upcoming

# ヘルプを表示
schedule-list --help
```

### sync-timetree

TimeTree公開カレンダーからイベントをインポートするツールです。

```bash
# 12ヶ月分のイベントをインポート
sync-timetree

# 6ヶ月分のイベントをインポート
sync-timetree --months 6

# ドライラン（実際には保存しない）
sync-timetree --dry-run

# ヘルプを表示
sync-timetree --help
```

**重要**: このツールは既存のイベントを上書きしません。同じタイトルと日付のイベントは自動的にスキップされます。

## TimeTree連携

このプロジェクトはTimeTreeの公開カレンダー（`yokuwakan_nai`）からイベント情報を取得できます。

### API仕様

- **エンドポイント**: `https://timetreeapp.com/api/v2/public_calendars/{calendar_id}/public_events`
- **パラメータ**:
  - `from`: 開始日時（UNIXタイムスタンプ、ミリ秒）
  - `to`: 終了日時（UNIXタイムスタンプ、ミリ秒）
  - `utc_offset`: UTCオフセット（秒、日本時間は32400）
- **ヘッダー**:
  - `X-Timetreea: web/2.1.0/en`
  - `Accept: application/json`

### ラベル対応

TimeTreeのラベル情報（`public_calendar_label.name`）は、YAMLファイルの`label`フィールドに自動的に反映されます。

## デプロイ

このサイトは静的サイトとしてビルドされるため、任意の静的サイトホスティングサービスにデプロイできます。

## 開発履歴

### 2026-02-08

- TimeTree公開カレンダーからのイベント自動インポート機能を実装
- `sync-timetree` ツールを作成（jq/yqのみで実装）
- `schedule-list` ツールを作成
- TimeTreeのラベル情報をYAMLに反映する機能を追加
- 2月12日、2月21日のイベント情報を更新

## ライセンス

このプロジェクトは非公開プロジェクトです。

## 連絡先

なんちゃらアイドル
