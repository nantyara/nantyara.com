---
name: sync-timetree
description: TimeTree公開カレンダーからイベントを取り込み、src/data/schedules/ のYAMLとフライヤー画像を更新する
argument-hint: "[--months N] [--dry-run]"
---

TimeTree公開カレンダーからイベントを取り込み、`src/data/schedules/` を更新してください。
実体はリポジトリの bashスクリプト `tools/sync-timetree` です。このコマンドはその
実行・確認・コミットまでの運用フローを担います。

## 引数

- $ARGUMENTS（任意）: `tools/sync-timetree` にそのまま渡すオプション
  - `--months N` … 取得月数（デフォルト12ヶ月）
  - `--dry-run` … 保存せず差分のみ表示

## 事前確認

スクリプトは `jq` / `yq`(mikefarah版) / `curl` / `date` に依存します。
不足していたら指摘して止めてください（環境を勝手に変更しない）。

```bash
for c in jq yq curl; do command -v "$c" >/dev/null || echo "MISSING: $c"; done
```

- `yq` は **mikefarah/yq (Go版)** であること（`yq --version` に `github.com/mikefarah/yq`）。
  Python版yqでは `yq eval` 構文が動きません。

## 手順

リポジトリルート（`nantyara.com/`）で実行すること。

1. **ドライランで差分を確認**（必ず最初に実行）
   ```bash
   tools/sync-timetree --dry-run        # $ARGUMENTS があれば付ける
   ```

2. 出力を要約してユーザーに報告する。
   - `+ <title> on <date>` … 新規追加
   - `↻ Updating content` … 既存の `content: TBD` を TimeTreeのnoteで更新
   - `⊘ Skipping duplicate` … `timetree_id` 一致でスキップ
   - 追加が0件なら、その旨伝えて終了（コミット不要）。

3. **本実行**（内容に納得が得られたら、`--dry-run` を外して実行）
   ```bash
   tools/sync-timetree
   ```
   cover画像は `public/events/<slug>.jpg` に自動ダウンロードされる。

4. **差分レビュー**
   ```bash
   git status --short
   git diff src/data/schedules/
   ```
   - YAMLは `date` 昇順にソート統合される。
   - 新規画像は `public/events/` にuntrackedで出る。
   - `content: TBD` の新規イベントは、後で `/extract-flyer <slug>` で埋める運用。

5. **コミット（実行前に必ずユーザー確認）**
   ```bash
   git add src/data/schedules/ public/events/
   git commit -m "TimeTreeからイベントをインポート"
   ```
   - pre-commitフックでYAML検証が走る。失敗時はエラーを読んで該当YAMLを直し再コミット。
   - push はユーザーが明示的に求めたときだけ。

## 注意

- イベントの一意キーは `timetree_id`。slugは `YYYYMMDD-timetree-{ID末尾8桁}`。
- 既存の `content`（TBD以外）は上書きしない設計。手編集の内容は保護される。
- カレンダーID・日本時間オフセット(+9h)はスクリプト内に固定。変更は `tools/sync-timetree` を直接編集。
- 推測でイベントを足さない。スクリプトが取得したものだけ反映する。
