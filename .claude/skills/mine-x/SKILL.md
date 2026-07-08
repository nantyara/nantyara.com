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

⚠️ **後始末必須**（2026-07-06 ユーザー要望）: 収穫が終わったら、開いた検索タブは
`tabs_close_mcp` で**全部閉じてから**最終報告すること。仕切り直しで積んだタブも忘れずに。
親も同様に、自分で開いたタブはターン終了時に閉じる。

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
    const getImgs = () => [...a.querySelectorAll('div[data-testid="tweetPhoto"] img')].map(i => i.src.split('?')[0]);
    if (window.__harvest.has(url)) {
      // 画像は lazy-load されるため、既収穫エントリでも imgs が空なら埋め直す
      // （これが無いと高速スクロール時に画像を系統的に取りこぼす。2016-12 で実害）
      const e = window.__harvest.get(url);
      if (!e.imgs || !e.imgs.length) { const im = getImgs(); if (im.length) e.imgs = im; }
      return;
    }
    const time = a.querySelector('time')?.getAttribute('datetime') || '';
    const handle = (a.querySelector('div[data-testid="User-Name"]')?.innerText.match(/@[\w_]+/) || [''])[0];
    const text = a.querySelector('div[data-testid="tweetText"]')?.innerText || '';
    const isReply = !!a.innerText.match(/^.*返信先/m);
    window.__harvest.set(url, { url, time, handle, text, imgs: getImgs(), isReply });
  });
  return window.__harvest.size;
};
window.__collect();
```

### 3. スクロール収穫ループ（★適応型: 20ラウンドで回し、白抜けたら即6+nudgeに落とす）

収穫の所要時間は「ツール呼び出し回数×10〜15秒/回」が支配的。**まず20ラウンドの大バッチで回す**
（CDP45秒枠に対し 20×(scroll+0.9s)≈20秒で安全）。白抜けが起きなければこれが最速（2017-07実測で
往復半減・3〜4割短縮）:

```js
for (let i = 0; i < 20; i++) {
  window.scrollBy(0, 1800);
  await new Promise(r => setTimeout(r, 900));
  window.__collect();
}
window.__harvest.size;
```

- ⚠️ **ただし白抜けは X 側の変動要因で、月によっては20ラウンドが即白抜けする**（2017-09実測: 毎回
  20スクロール後に size 据え置き）。**大バッチ後に size が伸びていなかったら、その月は白抜け多発モードと
  判断し、以降は小刻みリカバリパターンに切り替える**:
  `6ラウンドスクロール → collect → scrollBy(0,-400)（2ノッチ戻す）→ 2秒待ち → scrollBy(0,2400) → collect`
  を繰り返す。遅いが確実（2017-09はこれで25サイクル）
- size が増えなくなるまで繰り返す。最後に `oldest`（`[...__harvest.values()].map(p=>p.time).sort()[0]`）が
  ウィンドウ先頭に届いたか確認
- ⚠️ CDP は45秒でタイムアウトするので1呼び出し20ラウンドを上限とする（待ちを詰めても増やさない）
- ⚠️ `scrollTo(0, document.body.scrollHeight)` の一気ジャンプは禁止。仮想リストが白抜けして
  ロードが死ぬ（2026-07-05 実測）。白抜けしたらまず `window.scrollBy(0,1)` +1秒待ちで復旧を試す。
  ダメなら: 収穫済み分を先に手順4でダンプ保存 → `until:` を「収穫済み最古の日付」に差し替えた
  URL で仕切り直して続きから（2016-11実測: 2日分ごとに1回程度この仕切り直しが必要だった）
- ⚠️ X 検索にはレート制限がある。1セッションで数ウィンドウ程度にとどめ、詰まったら休む
- 📎 収穫タブは CDP が `visibilityState: visible` に保つので、バックグラウンド由来の
  setTimeout スロットリング・レンダリング停止は起きない（2026-07-07 実測）。フォアグラウンド化は
  不要。ただしユーザーが**同じ Chrome ウィンドウで別タブに手動で切り替える**と hidden 落ちして
  スロットリング＋白抜けが本格化するので、収穫中は収穫タブから離れないのが吉

### 4. get_page_text 経由でダンプ

javascript_exec の出力は 1.5KB 程度で切れる＋クエリ文字列入り URL は DLP にブロックされる。
さらに ⚠️ **`navigator.clipboard.writeText` / `document.execCommand('copy')` は自動化コンテキスト
では静かに失敗する**（2026-07-05 実測。旧 clipboard 方式は使用禁止）。
**`<pre>` ノード注入 → get_page_text が正解**（画像URLの `?` 以降は必ず落とす）:

1. javascript_tool で JSON を DOM に注入:
   ```js
   const all = [...window.__harvest.values()];
   const data = JSON.stringify({
     announces: all.filter(p => !p.isReply),
     replies: all.filter(p => p.isReply).map(p => ({url: p.url, time: p.time, handle: p.handle, text: p.text}))
   });
   let pre = document.getElementById('__dump');
   if (!pre) { pre = document.createElement('pre'); pre.id = '__dump'; document.body.appendChild(pre); }
   pre.textContent = '###DUMP_START###' + data + '###DUMP_END###';
   'ok:' + data.length;
   ```
2. `get_page_text` でページテキストを取得し、マーカー間の JSON を抜き出して
   Write で `<scratchpad>/x-YYYY-MM-raw-N.json` に保存（仕切り直しごとに続き番号）
3. `jq '.announces | length' <ファイル>` で JSON 妥当性を確認
4. `document.getElementById('__dump').remove()` で掃除してから収穫続行

### 5. アーカイブ保存 → 転記

- announces を `mining/x-archive/YYYY-MM.json` にマージ保存（`unique_by(.url) | sort_by(.time)`、
  リプライは保存しない）。コミット対象
- announces から日付・会場・時刻・出演者が読めるイベントを `src/data/schedules/YYYY-MM.yml` に転記:
  - 書式・判定ルールは /sync-x と同じ（venues.yml 追記、acts 付与、content 末尾に
    「※Xの告知アーカイブから復元」と付ける）
  - **`sources:` に根拠となった告知ポストの URL を1〜3件付ける（必須）**。event 詳細ページに
    「情報源」セクションとして表示される（2026-07-07 追加）。告知本体＋事後報告を優先し、
    リプライより announces のポストを選ぶ。形式:
    ```yaml
    sources:
      - https://x.com/nantyaraidol/status/xxxxxxxxxxxx
    ```
  - 時刻不明は `time_tbd: true` ＋ `date: YYYY-MM-DD 12:00:00 +0900`
  - 「10月予定」型のまとめポストは裏取りの一次情報として超有能。個別告知と突合する
  - 会場・日付が読めないものは転記せずレポートへ（推測で作らない）
  - **告知ポスト本文にURL（会場公式ページ・チケット販売ページ等）が含まれる場合は、
    そのリンク先も開いて開演時刻・出演者・住所等の詳細を裏取りする**（2026-07-08〜）。
    ポスト本文だけでは分からない詳細（時間帯の分割、共演者の正確な表記等）がリンク先に
    載っていることが多い。取得したら `sources:` にそのURLも追加する
- `npm run validate-yaml` → commit → push

### 5.5. 画像サルベージ（消える前に全部確保）

- アーカイブ保存後、announces の `imgs` を**全部**ダウンロードして
  `mining/x-archive/images/YYYY-MM/{mediaId}.jpg` に確保する（フライヤー選別は後でよい。
  「ダウンロードできるものは先に全部落とす」方針・2026-07-05 ユーザー決定）
- URL は保存時に `?` 以降を落としてあるので `?format=jpg&name=orig` を付けて取得
  （404なら `name=large` にフォールバック）。`ext_tw_video_thumb` はそのまま取得して
  `video_thumb_` プレフィックスで保存
- ⚠️ **images/ ディレクトリはコミットしない**（2ヶ月で24MB→10年分で1.5GB級になるため
  保管方針は未定。URL は JSON にコミット済みなので再取得可能。git 管理したくなったら
  LFS or 別リポジトリを検討）
- 添付画像はフライヤーとは限らない（出演者アイコン・ライブ写真・日常写真が多い）。
  フライヤーを見つけたら `public/events/YYYYMMDD-slug.jpeg` にコピーして
  イベントの `images:` に配線。出演者アイコン集合画像は acts の裏取り証拠にもなる

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
- 2016-11 実施済み（2026-07-05）: 224告知 → 2イベント転記（11/11 なんちゃらフェス vol.1
  ＠新宿JAM 本体、11/21 逆噴射婚活＠阿佐ヶ谷ロフトA）。白抜けが頻発し dump-and-renavigate
  を計19回実施（clipboard 死亡 → get_page_text 方式を確立したのもこの回）。
  御茶海マミは当時「ローズヒップss」という別ユニットと掛け持ちしており、samami27 の
  ライブ告知はグループをよく確認すること（11/2, 11/13, 11/14 はローズヒップss側で除外）。
  未解決: 4thシングル「Ivory song」（2016-11-11 会場限定・完売）は releases.yml 未登録、
  サイゾー×ホチキス撮影会（11/6, 11/19）・ミサミソニック（11/26-27）は会場不明で未転記
- 2016-12〜2017-02 実施済み（2026-07-06）: 各194/156/164告知 → 5/5/4イベント転記。
  収穫は sonnet 安定（各300k〜500k tokens）。**haiku は収穫に不適格**（2016-12で実験
  →20ポストで指示待ち化して停止。以後収穫は sonnet 固定）
- 重要ロア確定（2026-07-06）: はるか活休=12/24が最終出演（当時告知は「来春まで」）、
  12/28=マミ・あお・せいら新体制お披露目（yancya現地証言）、
  **「（元）なんちゃらアイドル」は解散ネタ由来のグループ自称**（〜2017-01のフェスボルタまで
  使用確認。「脱退」と誤読しないこと）。せいらの1/20「復活記念」出演有無は未解決
- ユーザー（yancya）自身の当時ポストも一次史料になる:
  `なんちゃら from:yancya until:YYYY-MM-DD` で発掘可能（12/28の「解散ing」証言等）
- 未処理の宿題:
  - **2016-12の画像補修**（収穫時のlazy-loadバグで imgs がほぼ空。重要ポストを個別訪問して回収）
  - releases.yml 候補: 4th「Ivory song」（2016-11-11 会場限定・完売）、「なんでもない」
    （2017-02-18 マミ生誕レコ発・消しゴム版画ジャケ）→ ユーザー確認待ち
  - 帰属不明で未転記: 1/27 渋谷ロックのこころ「内緒」、1/30 Sweet Motion Vol18、
    2/27 DVDリリイベ、「玉姫予報」の正体（タマキ=誰?）
- 2017-03〜05 実施済み（2026-07-06）: 各180/284/175告知 → 9/6/8イベント転記。
  月9本ペースの多忙期。改良ハーベスタで画像も安定回収（4月は140枚）
- 音源考古学の収穫（releases.yml バックフィル一次資料）:
  - **過去シングルフェア**スレッド（2017-05-22, /nantyaraidol/status/866700503379345408 〜）:
    デビューシングル「み〜ちゅう」（作詞リーシャウロン/作曲赤羽勇一郎）、
    シングル「さよならOdyssey」（作詞永岡輔/作曲赤羽勇一郎、物販¥500。2020年の
    1stアルバム＝release-002 とは別の先行シングル）。フェア3以降は6月ウィンドウで探す
  - 「ivory song は永久絶盤」の公式言及（2017-05-21）
  - 「夜の煙突」の初出は 2017-04-26 早稲田あかね公開レコーディング（ファンコーラス収録、
    アレンジ: エママウス。release-001 の3年前）。「星くず兄弟の伝説」カバーも同日収録
  - 新曲「優しい歌」（ザ アイドルズ田中さん作詞作曲）初披露 = 2017-05-02 ナインスパイス
- はるか（元リーダー）: 2017年4〜5月のアーカイブに言及ゼロ。「来春復帰」は実現せず
  そのまま脱退に至った可能性が高い（history.yml の現記述と整合）
- 5/17 弾き語り最強決定戦＠ちょ美ひげは 4/27 中止発表（ハーリー木村氏「国家権力に
  身柄の自由を奪われている」）のまま開催されず。中止イベントは schedules に転記しない方針
- 次: 2017-06 ウィンドウ。拾うべき予告 → 6/3 出番17:00〜（「尊敬するアーティストと」）、
  **6/11 主催ライブ（「夜の煙突」大合唱企画・現体制初オリジナルTシャツ・ハーレムチェキ特典）**、
  6/26 ロックバンドと対バン。6月予定表 URL: freecalend.com/open/mem66207_nopopon（未検証）。
  未転記持ち越し: 5/3-5/4 JAM FES 出演有無、5/5 コスホリオフ会会場、5/20 QuinQ個撮
  （マミソロ扱いにするか要ユーザー判断）、5/21 テクノブレイク

## コスト実測（2016-11 ウィンドウ、2026-07-05 /cost 実測）

- **1ウィンドウ ≈ $22.63 API換算**（このときの枠表示9%/2〜3%は Max 5x→20x アップグレード
  直後のリセット値なので参考にならない。指標は$換算の方を使うこと）
  - Sonnet sub-agent×3: $14.95 — うち**cache read 35.9M ≈ $10.8 が主犯**（出力135.5kは$2程度）
  - Fable 親: $7.68（レビュー・突合・commit判断）
- ブラウザ収穫は tool 往復（今回318回）×膨張コンテキストの再読で「cache read 課金」が積む。
  白抜け仕切り直しの get_page_text 巨大戻り値がコンテキスト残留するのが効く
- 削減レバー（未検証）: ①収穫 agent を haiku に格下げ（cache read 単価1/3以下）、
  ②仕切り直しごとに agent を使い捨ててコンテキストをリセット（cache read 激減の見込み）
  → 次ウィンドウでどちらか試して結果をここに追記
