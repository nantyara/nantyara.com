# スクリプト

## YAMLバリデーション

### 概要

`validate-yaml.js` は、YAMLファイルの構造と型をチェックするバリデーションスクリプトです。

- `src/data/schedules/*.yml` - イベントスケジュール
- `src/data/releases.yml` - 音源リリース情報

### 使い方

手動でバリデーションを実行：

```bash
npm run validate-yaml
```

### チェック内容

**スケジュール (`schedules/*.yml`)**
- 必須フィールド: `id`, `slug`, `date`, `title`, `site`
- 日付形式: ISO 8601形式 with timezone (`YYYY-MM-DD HH:mm:ss +0900`)
- slug形式: `YYYYMMDD-xxx` 形式を推奨
- images: 配列型
- end: 日付形式（オプショナル）

**リリース (`releases.yml`)**
- 必須フィールド: `id`, `title`, `release_date`, `type`
- 日付形式: ISO 8601形式 (`YYYY-MM-DD`)
- type: `single`, `album`, `ep` のいずれか
- links: 配列型、各要素に `platform` と `url` が必要
- tracks: 配列型（オプショナル）

### エラー例

```
✗ 2026-01.yml: イベント[0]: 必須フィールド "slug" がありません
✗ 2026-02.yml: イベント[3]: 日付形式が不正です: 2026-02-32 19:00:00 +0900
✗ releases.yml: リリース[1]: typeは "single", "album", "ep" のいずれかである必要があります: compilation
```

## Git Hooks

### セットアップ

初回のみ実行：

```bash
./scripts/setup-hooks.sh
```

または手動でセットアップ：

```bash
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### pre-commit hook

コミット前に自動的に `npm run validate-yaml` を実行します。

- バリデーションエラーがある場合、コミットが中断されます
- エラーを修正してから再度コミットしてください

### hookを一時的に無効化

```bash
git commit --no-verify
```

**注意**: YAMLエラーがあるとビルドが失敗する可能性があるため、通常は `--no-verify` の使用は推奨しません。

## その他

### package.json スクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run validate-yaml` - YAMLバリデーション
