---
name: mine-x
description: X の過去ポストを月ウィンドウ検索（since/until）で発掘し、過去のライブ・イベントを schedules YAML にバックフィルする。「2016年の予定を発掘して」「Xの過去データを引っ張って」等で発動。Claude in Chrome 必須（ログイン済みセッションで検索するため Tavily では代替不可）
---

X の公式3アカウント（@nantyaraidol / @samami27 / @yokuwakan_nai）の**過去ポスト**を
月ウィンドウで検索・収穫し、過去のライブ情報を `src/data/schedules/YYYY-MM.yml` に
バックフィルする。/sync-x が「直近の告知」担当なのに対し、こちらは「歴史の発掘」担当。

## 前提

- **Claude in Chrome 必須**。X の検索はログイン必須なので、ユーザーのログイン済み
  Chrome セッションを使う（Tavily/WebFetch では検索結果ページが取れない）
- 引数: 対象期間（例: `2016-11`、`2017-01..2017-03`）。無指定なら未発掘の最古月から

## 手順

### 1. 検索 URL を開く

月ウィンドウごとに新規タブで開く（`AND` は書かない。空白が暗黙の AND）:

```
https://x.com/search?q=(from%3Asamami27%20OR%20from%3Ayokuwakan_nai%20OR%20from%3Anantyaraidol)%20since%3AYYYY-MM-DD%20until%3AYYYY-MM-DD&src=typed_query&f=live
```

- `f=live`（最新順）。until は翌月1日、since は当月1日（余裕を見て前後1日重ねてもよい。重複は URL でマージされる）

### 2. JS ハーベスタを仕込む

javascript_tool で収穫関数を定義（ページ遷移すると消えるので、遷移したら再定義）:

```js
window.__harvest = new Map();
window.__collect = () => {
  document.querySelectorAll('article[data-testid="tweet"]').forEach(a => {
    const link = a.querySelector('a[href*="/status/"] time')?.closest('a');
    if (!link) return;
    const url = link.getAttribute('href');
    if (window.__harvest.has(url)) return;
    const time = a.querySelector('time')?.getAttribute('datetime') || '';
    const handle = (a.querySelector('div[data-testid="User-Name"]')?.innerText.match(/@[\w_]+/) || [''])[0];
    const text = a.querySelector('div[data-testid="tweetText"]')?.innerText || '';
    const imgs = [...a.querySelectorAll('div[data-testid="tweetPhoto"] img')].map(i => i.src.split('?')[0]);
    const isReply = !!a.innerText.match(/^.*返信先/m);
    window.__harvest.set(url, { url, time, handle, text, imgs, isReply });
  });
  return window.__harvest.size;
};
window.__collect();
```

### 3. スクロール収穫ループ

**1回の javascript_exec につき8ラウンドまで**（CDP が45秒でタイムアウトするため）:

```js
for (let i = 0; i < 8; i++) {
  window.scrollBy(0, 1500);
  await new Promise(r => setTimeout(r, 1100));
  window.__collect();
}
window.__harvest.size;
```

- size が増えなくなるまで繰り返す。最後に `oldest`（`[...__harvest.values()].map(p=>p.time).sort()[0]`）が
  ウィンドウ先頭に届いたか確認
- ⚠️ `scrollTo(0, document.body.scrollHeight)` の一気ジャンプは禁止。仮想リストが白抜けして
  ロードが死ぬ（2026-07-05 実測）。死んだら: 収穫済み分を先に clipboard 退避 →
  `until:` を「収穫済み最古の日付」に差し替えた URL で仕切り直して続きから
- ⚠️ X 検索にはレート制限がある。1セッションで数ウィンドウ程度にとどめ、詰まったら休む

### 4. clipboard 経由でダンプ

javascript_exec の出力は 1.5KB 程度で切れる＋クエリ文字列入り URL は DLP にブロックされる。
**clipboard 転送が正解**（画像URLの `?` 以降は必ず落とす）:

1. **検索ボックスをクリック**してフォーカスを得る（⚠️ タイムライン上をクリックすると
   ツイートに遷移して window が消し飛ぶ）
2. ```js
   const all = [...window.__harvest.values()];
   await navigator.clipboard.writeText(JSON.stringify({
     announces: all.filter(p => !p.isReply),
     replies: all.filter(p => p.isReply).map(p => ({url: p.url, time: p.time, handle: p.handle, text: p.text}))
   }));
   ```
3. Bash で `pbpaste > <scratchpad>/x-YYYY-MM-raw.json`

### 5. アーカイブ保存 → 転記

- announces を `mining/x-archive/YYYY-MM.json` にマージ保存（`unique_by(.url) | sort_by(.time)`、
  リプライは保存しない）。コミット対象
- announces から日付・会場・時刻・出演者が読めるイベントを `src/data/schedules/YYYY-MM.yml` に転記:
  - 書式・判定ルールは /sync-x と同じ（venues.yml 追記、acts 付与、content 末尾に
    「※Xの告知アーカイブから復元」と付ける）
  - 時刻不明は `time_tbd: true` ＋ `date: YYYY-MM-DD 12:00:00 +0900`
  - 「10月予定」型のまとめポストは裏取りの一次情報として超有能。個別告知と突合する
  - 会場・日付が読めないものは転記せずレポートへ（推測で作らない）
- `npm run validate-yaml` → commit → push

### 6. レポート

- 発掘イベント一覧（既知の沿革との突合結果も）
- 未転記の候補（証拠不足）と、次に掘るべきウィンドウ
- history.yml に足せそうなマイルストーン（初主催、初遠征等）があれば提案

## コスト方針（sub-agent 活用）

モデル費用を抑えるため、機械的な工程は**安いモデルの sub-agent に委譲**する:

- **収穫（手順1〜4）**: `model: sonnet` の sub-agent に1ウィンドウ丸ごと任せてよい
  （ToolSearch で mcp__claude-in-chrome__* をロードさせる。手順はこの SKILL.md を
  プロンプトに貼る）。⚠️ ブラウザは1つなので収穫 agent は**直列**で。並列にしない
- **転記ドラフト（手順5）**: `mining/x-archive/YYYY-MM.json` → schedules YAML 案の作成は
  `model: sonnet`（複数月あれば**並列**でOK）。venues.yml の新会場リサーチも sonnet
- **親（メインモデル）がやること**: ウィンドウの割り当て、ドラフトのレビュー
  （日付・会場の裏取り、既存データとの突合）、commit/push の判断だけ

## 実績メモ

- 2016-10 実施済み（2026-07-05）: 299告知 → 8イベント転記。初主催「なんちゃらフェス」
  （2016-11-11 新宿JAM）の告知も発見 → 11月ウィンドウで本体を掘ること
