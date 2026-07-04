---
name: sync-x
description: X(Twitter)の公式アカウント（@nantyaraidol / @samami27 / @yokuwakan_nai）からライブ・イベント告知とフライヤー画像を発掘し、TimeTreeに無い情報を schedules YAML に反映して push まで行う
argument-hint: "[--dry-run]"
---

X の公式3アカウントの投稿からライブ・イベント情報を発掘し、`src/data/schedules/` に反映してください。
TimeTree（`/sync-timetree`）が構造化データの取り込み担当なのに対し、こちらは
「X にしか流れない告知・フライヤー・詳細情報」を拾う補完役です。

## 引数

- `--dry-run` … 反映（ファイル変更・commit・push）をせず、発見内容のレポートだけ出す

## 前提

- **Tavily MCP（`mcp__claude_ai_Tavily__*`）が必須**。未接続なら中止してユーザーに報告する
  （組み込み WebSearch では x.com がほぼ取れないため代替にならない）。
- リポジトリルート（`nantyara.com/`）で実行。`yq`(mikefarah版)・`jq`・`curl` 依存。

## 対象アカウント

| ハンドル | 誰 | 拾う情報 |
|---------|-----|---------|
| `@nantyaraidol` | グループ公式 | 主催・出演告知全般、リリース情報 |
| `@samami27` | 御茶海マミ | マミソロ案件（隔月刊御茶マミ等）、フライヤー |
| `@yokuwakan_nai` | あおはる | あおはるソロ案件、フライヤー、通算ライブ回数の言及 |

## 手順

### 1. 発見（複数の窓口から検索する）

各アカウント・各観点で `tavily_search` を実行（`search_depth: "advanced"`、`max_results: 10`、
`include_domains: ["x.com", "twitter.com"]`、直近の告知が目的なので `time_range: "month"` を基本に）:

- 「なんちゃらアイドル ライブ 告知」「御茶海マミ ライブ」「あおはる なんちゃら 出演」
- シリーズ名でも: 「隔月刊御茶マミ」など既知の定期イベント名
- 補助窓口として Yahoo!リアルタイム検索を `tavily_extract` で読む（X の代理インデックスとして有効）:
  `https://search.yahoo.co.jp/realtime/search/%23御茶海マミ` 等

ヒットした **個別ポスト（`/status/` URL）** を候補リストにする。プロフィールページ
（`x.com/nantyaraidol` 等）は部分的にしか取れないが、スニペットに最新告知が
出ることがあるので捨てずに読む。

### 2. 候補ポストの読解

各候補 URL を `tavily_extract`（`extract_depth: "advanced"`）で取得:

- 本文・投稿日時・`pbs.twimg.com` の画像 URL が取れる（ログイン不要・実証済み）
- 画像はフル解像度で取得する: URL のクエリを `?format=jpg&name=orig` に差し替えて curl でダウンロード
- ダウンロードした画像は必ず Read で**目視確認**し、どのイベントのフライヤーか突合する（取り違え防止）

### 3. schedules との突合

ポスト本文・フライヤーから **開催日・会場** を特定し、該当月の YAML を検索:

```bash
yq '.[] | select(.date | test("YYYY-MM-DD"))' src/data/schedules/YYYY-MM.yml
```

判定ルール:

| 状況 | アクション |
|------|-----------|
| 同日・同会場のエントリがあり `content: TBD` | 詳細を転記し、`images` 未設定ならフライヤー追加（`/extract-flyer` と同じ書式） |
| 同日・同会場のエントリがあり手動編集済み | 上書きしない。差分（新情報）があればレポートで報告のみ |
| エントリが存在しない | 新規追加。slug は `YYYYMMDD-{会場や企画の識別子}` 形式（timetree_id なし） |

- `site` の表記はリポジトリ内の多数派に合わせる（例: `渋谷La.mama` / `大塚Welcome Back` /
  `東新宿LOVE TKO`）。迷ったら `grep -h "site:" src/data/schedules/*.yml | sort | uniq -c` で確認
- `labels` は告知内容からマミソロ/あおはるソロと**断定できる場合のみ**付与。迷ったら付けない
- 過去イベントの告知も履歴充実のため反映してよい（表示は12時間ルールで自動的に過去扱いになる）

### 4. 反映

`--dry-run` ならここで止めてレポートのみ。そうでなければ:

```bash
npm run validate-yaml
git add src/data/schedules/ public/events/
git commit -m "Xの告知からイベント情報を取り込み"   # Co-Authored-By 付与
git push
```

反映が完了したら（dry-run 以外）、SessionStart hook の鮮度チェック用に最終実行を記録する:

```bash
touch .claude/sync-x-last-run   # mtime が最終実行日時。7日超で hook がリマインドを注入する
```

**push まで自動で行ってよい**（ユーザー合意済み 2026-07-04）。ただし例外:

- 日付・会場が読み取れない／自信がない情報は**反映せずレポートに回す**（推測で足さない）
- 既存の手動編集済み content の上書きが必要に見えるケースは、変更せずユーザーに確認

### 5. レポート

- 追加/更新したイベント一覧（日付・会場・タイトル・情報源ポストURL）
- スキップした候補と理由（既存・読解不能・自信なし）
- **重複チェック**: 同日・同会場のエントリが2件以上ないか確認して警告
  （手動追加エントリは timetree_id が無いので、後日 sync-timetree が同じイベントを
  重複作成しうる。逆に TimeTree 側に既にあるなら手動追加せずそちらを更新する）
- Tavily 消費の目安（search/extract の回数）

## 注意

- **推測でイベントを作らない**。ポスト本文かフライヤーに日付・会場が明記されているものだけ
- X の全ポストが取れるわけではない（Tavily のインデックス依存）。「網羅」ではなく
  「拾えたものを確実に反映」が目的。取りこぼしはある前提で定期的に回す
- マミの表記は「御茶海マミ」（フライヤーで「御茶マミ」「マニ」に見えても）
- フライヤーは誤植・訂正版が複数出回ることがある（例: 隔月刊御茶マミ 6月号の vol.008/009）。
  号数や日付が既存データと食い違ったら、複数ソースで裏取りしてから直す
