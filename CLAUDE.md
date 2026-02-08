# CLAUDE.md - なんちゃらアイドル公式サイト開発ガイド

このファイルは、Claude（AI開発アシスタント）がこのプロジェクトで作業する際の参考情報をまとめたものです。

## プロジェクト概要

なんちゃらアイドルのスケジュール管理と情報発信のためのウェブサイト。Astro（静的サイトジェネレーター）で構築されています。

### 技術スタック

- **フレームワーク**: Astro 5.x
- **言語**: TypeScript
- **データ形式**: YAML（イベント・リリース情報）
- **スタイリング**: CSS（デフォルト）
- **ツール**: jq, yq, Node.js

## ディレクトリ構造

```
nantyara.com/
├── src/
│   ├── data/
│   │   ├── schedules/          # イベントスケジュール（YAML）
│   │   │   ├── 2026-01.yml     # 月ごとにファイル分割
│   │   │   ├── 2026-02.yml
│   │   │   └── ...
│   │   └── releases.yml        # 音源リリース情報
│   ├── pages/                  # ルーティング
│   ├── components/             # 再利用可能なコンポーネント
│   └── layouts/                # レイアウトテンプレート
├── public/
│   └── events/                 # イベント画像（静的ファイル）
├── tools/                      # 開発支援ツール
│   ├── schedule-list           # スケジュール一覧表示
│   └── sync-timetree          # TimeTree同期
├── scripts/
│   └── validate-yaml.js        # YAML検証スクリプト
├── package.json
└── astro.config.mjs
```

## データ管理

### スケジュールYAMLファイル

場所: `src/data/schedules/YYYY-MM.yml`

#### フィールド定義

| フィールド | 必須 | 型 | 説明 |
|----------|------|-----|------|
| `id` | ✓ | string | イベントの一意なID（`event-{slug}`形式） |
| `slug` | ✓ | string | URL用のスラッグ（`YYYYMMDD-{venue}`形式） |
| `date` | ✓ | string | 開始日時（`YYYY-MM-DD HH:MM:SS +0900`形式） |
| `end` | | string | 終了日時（オプション） |
| `title` | ✓ | string | イベントタイトル |
| `site` | ✓ | string | 会場名 |
| `label` | | string | ラベル（例：「マミソロ」「あおはるソロ」） |
| `content` | ✓ | string | イベント詳細（Markdown可） |
| `images` | | array | 画像パスの配列 |

#### 例

```yaml
- id: event-20260212-lamama
  slug: 20260212-lamama
  date: 2026-02-12 19:00:00 +0900
  title: なんちゃらアイドル主催 大人の文化祭～バラエティだよ人生はvol.003～
  site: 渋谷 La.mama
  label: マミソロ
  content: |
    【出演】
    温-たずね-
    マグノリアの雫。
    S.B.Q.アイドル部

    開場/開演　18:30/19:00
    ADV　¥2,500＋1D
  images:
    - /events/20260212-lamama.jpeg
```

### リリース情報

場所: `src/data/releases.yml`

音源のリリース情報を管理。詳細はファイル内の既存エントリを参照。

## 開発ツール

### 1. schedule-list

スケジュールを一覧表示するコマンドラインツール。

**実装**: シェルスクリプト（Bash + yq + date）
**場所**: `tools/schedule-list`
**シンボリックリンク**: `~/bin/schedule-list`

**主な機能**:
- 月ごとのスケジュール表示
- 今後のイベントフィルタリング
- 日付順ソート
- カラー表示

**使用例**:
```bash
schedule-list                # 全イベント表示
schedule-list 2026-02        # 2026年2月のみ
schedule-list --upcoming     # 今後のイベントのみ
```

### 2. sync-timetree

TimeTree公開カレンダーからイベントをインポートするツール。

**実装**: シェルスクリプト（Bash + jq + yq + curl）
**場所**: `tools/sync-timetree`

**主な機能**:
- TimeTree APIからイベント取得
- 重複チェック（タイトル + 日付）
- ラベル情報の自動反映
- 月ごとのYAMLファイルへの自動追加
- 既存イベントの保護（上書きしない）

**使用例**:
```bash
sync-timetree                  # 12ヶ月分インポート
sync-timetree --months 6       # 6ヶ月分
sync-timetree --dry-run        # ドライラン
```

**重要な仕様**:
- 既存のイベント（タイトルと日付が一致）は上書きしない
- TimeTreeのラベル（`public_calendar_label.name`）を自動的にYAMLの`label`フィールドに反映
- イベントのslugは `YYYYMMDD-timetree-{ID末尾8桁}` 形式で生成

## TimeTree API仕様

### エンドポイント

```
GET https://timetreeapp.com/api/v2/public_calendars/{calendar_id}/public_events
```

### パラメータ

| パラメータ | 型 | 説明 |
|----------|-----|------|
| `from` | integer | 開始日時（UNIXタイムスタンプ、ミリ秒） |
| `to` | integer | 終了日時（UNIXタイムスタンプ、ミリ秒） |
| `utc_offset` | integer | UTCオフセット（秒、日本時間は32400） |

### リクエストヘッダー

```
X-Timetreea: web/2.1.0/en
Accept: application/json
```

### レスポンス構造

```json
{
  "paging": {
    "next_cursor": "...",
    "next": false
  },
  "public_events": [
    {
      "id": "...",
      "public_calendar_id": 1000186001,
      "public_calendar_label": {
        "label_id": 6,
        "name": "マミソロ",
        "color": 15153979
      },
      "title": "新宿drunken shrimp",
      "note": "イベント詳細...",
      "link_url": "https://...",
      "start_at": 1770714000000,
      "end_at": 1770714000000,
      "images": {
        "cover": [
          {
            "url": "https://...",
            "thumbnail_url": "https://..."
          }
        ]
      }
    }
  ]
}
```

## よくあるタスク

### イベント情報の追加

**手動追加の場合**:

1. 該当する月のYAMLファイルを開く（例：`src/data/schedules/2026-02.yml`）
2. 既存のエントリを参考に新しいイベントを追加
3. 画像がある場合は `public/events/` に配置
4. `npm run validate-yaml` で検証
5. コミット

**TimeTreeから自動インポートの場合**:

```bash
# ドライランで確認
sync-timetree --dry-run --months 3

# 実際にインポート
sync-timetree --months 3

# 結果を確認
git status
git diff src/data/schedules/

# コミット
git add src/data/schedules/
git commit -m "TimeTreeからイベントをインポート"
```

### イベント画像の追加

1. 画像を `public/events/` に配置
2. ファイル名は `YYYYMMDD-{slug}.jpeg` 形式を推奨
3. YAMLファイルの `images` フィールドに追加:
   ```yaml
   images:
     - /events/20260212-lamama.jpeg
   ```

### スケジュールの確認

```bash
# 全イベントを確認
schedule-list

# 今後のイベントのみ
schedule-list --upcoming

# 特定の月
schedule-list 2026-02
```

### YAML検証

```bash
npm run validate-yaml
```

以下をチェック:
- YAML構文エラー
- 必須フィールドの欠落
- ID/Slugの重複
- 日付フォーマット

## Git運用

### コミット時の自動検証

pre-commitフックでYAML検証が自動実行されます。エラーがある場合はコミットできません。

### コミットメッセージの例

```
2月12日イベント情報を詳細に更新

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## トラブルシューティング

### YAML検証エラー

```bash
# エラー内容を確認
npm run validate-yaml

# 該当ファイルを確認
cat src/data/schedules/YYYY-MM.yml
```

よくあるエラー:
- インデントミス（YAMLはスペース2つでインデント）
- 日付フォーマットエラー（`YYYY-MM-DD HH:MM:SS +0900`形式を使用）
- ID/Slugの重複

### sync-timetreeが動かない

1. 依存ツールの確認:
   ```bash
   which jq    # /opt/homebrew/bin/jq
   which yq    # /opt/homebrew/bin/yq
   which curl  # /usr/bin/curl
   ```

2. API接続確認:
   ```bash
   curl -H "X-Timetreea: web/2.1.0/en" \
        "https://timetreeapp.com/api/v2/public_calendars/yokuwakan_nai/public_events?from=1769353200000&to=1772377200000&utc_offset=32400"
   ```

3. ドライランで詳細確認:
   ```bash
   sync-timetree --dry-run
   ```

### 開発サーバーが起動しない

```bash
# ポートが使われていないか確認
lsof -i :3000

# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install

# 再起動
npm run dev
```

## ベストプラクティス

### イベント追加時

1. **既存イベントをチェック**: 重複を避けるため、同じ日時のイベントがないか確認
2. **slugは一意に**: `YYYYMMDD-{venue-or-identifier}` 形式で重複しないようにする
3. **画像パスは相対パス**: `/events/` から始まる相対パスを使用
4. **contentは詳細に**: 出演者、タイムテーブル、料金など、ユーザーに有用な情報を記載
5. **ラベルは統一**: 既存のラベル名を使用する（例：「マミソロ」「あおはるソロ」）

### ツール開発時

1. **jq/yqを優先**: Python依存関係を増やさず、jq/yqで実装
2. **エラーハンドリング**: 適切なエラーメッセージを表示
3. **ドライランモード**: 破壊的操作の前に確認できるようにする
4. **シンボリックリンク解決**: `~/bin/` にリンクを貼る場合は、正しくパス解決できるようにする

### データ管理

1. **月ごとにファイル分割**: スケジュールは `YYYY-MM.yml` 形式で月ごとに管理
2. **日付順にソート**: イベントは常に日付順（昇順）にソート
3. **過去のデータも保持**: 過去のイベントも削除せず、履歴として保持
4. **バリデーション実行**: コミット前に必ず `npm run validate-yaml` を実行

## 開発履歴メモ

### 2026-02-08: TimeTree連携機能の実装

**実装内容**:
1. TimeTree APIエンドポイントの調査・発見
2. `sync-timetree` ツールの作成（jq/yqのみで実装）
3. ラベル情報の自動反映機能
4. 重複チェック機能（タイトル + 日付）
5. `schedule-list` ツールの作成

**学習したこと**:
- TimeTree公式APIは2023年12月に廃止されている
- 公開カレンダーは v2 APIで取得可能（`/api/v2/public_calendars/{id}/public_events`）
- ラベル情報は `public_calendar_label.name` に格納されている
- タイムスタンプはミリ秒単位のUNIXタイムスタンプ
- yqで配列を結合する場合は `yq eval-all '[.[]]' file1.yml file2.yml` を使用

**課題**:
- 画像URLは外部URL（TimeTreeのCDN）なので、ローカルにダウンロードする機能は未実装
- TimeTreeのイベント詳細（note）が空の場合、「TimeTreeからインポート」という汎用メッセージになる

## 参考リンク

- [Astro Documentation](https://docs.astro.build/)
- [YAML Specification](https://yaml.org/spec/)
- [jq Manual](https://stedolan.github.io/jq/manual/)
- [yq Documentation](https://mikefarah.gitbook.io/yq/)
- TimeTree API: `https://timetreeapp.com/api/v2/` (非公式)

## 連絡先

プロジェクトに関する質問は、なんちゃらアイドル公式チャンネルへ。
