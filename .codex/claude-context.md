# Claude -> Codex static handoff

Extracted 2026-09-11 from local Claude Code persistent memory. No new Claude request was made. Treat this as historical and advisory.

## MEMORY.md

- [esa投稿は確認不要](feedback_esa_no_confirm.md) — esaへの投稿・更新は許可なしで即実行してよい（マシンワイド）
- [導出可能な情報は永続化しない](feedback_no_persist_derivable.md) — CLAUDE.md肥大化はコスト。都度棚卸しで答える
- [マミのソロ名は御茶海マミ](project_mami_stage_name.md) — フライヤーで「マニ」と読めても「マミ」優先。`マミソロ`ラベルと整合
- [yancyaは2016年からの古参ファン](user_nantyara_fan_since_2016.md) — 2016-11-11初観覧。メンバー変遷の一次証言者として沿革の事実確認に使える
- [yancyaはClaude Max 20x](user_claude_max_20x.md) — 2026-07-05に5x→20x。直後の枠%はリセット値なので$換算で語る
- [history.ymlマイルストーンは全期間発掘後に棚卸し](project_history_milestone_review_timing.md) — mine-x中に主催シリーズを見つけても都度追記せず、発掘完了後にまとめて見直す
- [nantyara.comリポジトリはpublicが正](project_repo_visibility_public.md) — READMEの「非公開」誤記は2026-07-11に修正済み。今後もpublic前提
- [mine-x転記はイベント自体の日付もJST再計算で確定](project_mine_x_event_date_verification.md) — 引用ラベルだけでなくdateフィールド自体が誤ることがある。issue #20/#7は2026-07-11クローズ済み
- [LLM前にスクリプトで機械圧縮](feedback_script_compress_before_llm.md) — 大量データはfan-outより決定論的前処理を先に検討。実例tools/build-history-corpus（7.4MB→163KB）
- [S.B.Q.のピリオド流儀](project_sbq_naming.md) — アイドル部はピリオド有り「S.B.Q.」、スタジオは無し「Studio S.B.Q」が正式


## feedback_esa_no_confirm.md

---
name: esa投稿は確認不要
description: esaへの投稿・更新は許可なしで実行してよい（マシンワイド設定）
type: feedback
originSessionId: d183f8b0-489b-467e-bad4-665da30cc4dd
---
esaへの投稿・更新（セッションメモ等）はユーザーの確認なしで実行してよい。

**Why:** 毎回確認するのが煩わしいため。マシンワイド（全プロジェクト共通）で適用。

**How to apply:** esaの記事作成・更新時に確認を挟まず即実行する。


## feedback_no_persist_derivable.md

---
name: no-persist-derivable
description: 導出可能な情報は CLAUDE.md 等に永続化しない（コンテキストコスト優先）
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0e9f46fa-bd8b-4d07-bb87-8212aad3b8f4
---

リポジトリの状態から都度導出できる情報（自動化の一覧、構成のサマリ等）は CLAUDE.md やドキュメントに転記せず、聞かれたらその場で棚卸しして答える。

**Why:** CLAUDE.md は毎セッション読み込まれるので、肥大化はトークンコスト増に直結する。導出可能な情報は陳腐化もしやすく、二重管理になる。

**How to apply:** 「これ CLAUDE.md に書いとこうか？」と思ったら、コードや設定から導出できるか自問する。導出できるなら書かない。書くのは導出不能なもの（運用ルール、ハマりどころ、外部の事情）だけ。


## feedback_script_compress_before_llm.md

---
name: feedback-script-compress-before-llm
description: 大量データをLLMに食わせる前に、決定論的スクリプトで機械圧縮する方針をyancyaは好む
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 553accab-6e04-4fd1-87c4-1a09da688a42
---

大量の元データ（文字起こし7.4MB等）を扱うタスクで、数十体のエージェントfan-out案を提示したところ、「元データが全部リポジトリにあるはずだから、それをスクリプトで加工すれば、かなり安価に圧縮できるのでは。仕組み作りからやってほしい」と方針転換の指示を受けた（2026-07-16、issue #8）。

**Why:** fan-outは高コスト（4〜6Mトークン級）で再現性も低い。決定論的な前処理（keyword grep等）なら再実行可能・チューニング可能・約1/30のコストで済んだ（実績: 7.4MB→163KB、1エージェント15万トークンで完遂）。

**How to apply:** 大量データ×LLMのタスクでは、まず「スクリプトで機械圧縮できないか」を検討し、仕組み（再利用可能なツール）として作ってからLLM段に渡す。fan-out提案はその後の選択肢。実例は nantyara.com の `tools/build-history-corpus`。


## project_history_milestone_review_timing.md

---
name: history-milestone-review-timing
description: history.yml への主催イベントシリーズ追加は、mine-x全期間発掘完了後にまとめて見直す方針
metadata: 
  node_type: memory
  type: project
  originSessionId: 553accab-6e04-4fd1-87c4-1a09da688a42
---

/mine-x での月次バックフィル中に「これは新規主催シリーズの初開催っぽい」（例: 2018-04-25
「なんちゃらなヘブン vol.01」）が見つかっても、その場でhistory.ymlに追記判断しない。

**Why:** なんちゃら主催イベントは複数シリーズが並行・入れ替わりで存在し、"vol.01"と
名乗っていても実際には1回きりで終わったシリーズもありうる。月ごとに逐次判断すると、
後続月の発掘で「実は1回で終わってた」と分かっても遡って直す手間が発生し、誤ったマイルストーン
が残るリスクがある（2026-07-08 ユーザー方針）。

**How to apply:** mine-x の月次転記では、主催シリーズらしきイベントも通常のschedules
YAMLに転記するだけに留め、history.ymlへのマイルストーン追加候補としてメモ・報告はするが
実際の追記はしない。全期間（現状〜2016年10月まで遡る予定）の発掘が完了した段階で、
主催シリーズを横断的に棚卸し（vol数・開催頻度・終了時期を確認）してからhistory.ymlを
まとめて更新する。

**更新（2026-07-16）:** 横断棚卸しは issue #8 の全ソース再生成（`tools/build-history-corpus`
で圧縮した全文字起こし＋全イベント突合、commit b3e8e72）として実施済み。issue #8/#11〜15/#22
はクローズした。以後の mine-x 新発見（例: 2016-03-21 QuinQ大還元フェスの開催実績）は、
シリーズ判断が不要な単発マイルストーンなら都度 history.yml に追記してよい。


## project_mami_stage_name.md

---
name: project-mami-stage-name
description: なんちゃらアイドルのメンバー「マミ」の表記とソロ活動名のメモ
metadata: 
  node_type: memory
  type: project
  originSessionId: 52f74b4d-2a7c-4615-a0d7-13f48a59ecb6
---

なんちゃらアイドルのメンバー「マミ」のソロ活動名は **御茶海マミ**（おちゃみマミ）。
隔月刊で「隔月刊御茶マミ」というイベントを東新宿LOVE TKOで開催している。

YAMLの `labels` フィールドにある `マミソロ` は、このマミのソロ活動を指す。

**Why:** フライヤー画像から内容を抽出した際に「御茶海マニ」と誤読してコミットしてしまい、ユーザーから訂正を受けた。「マミ」の小書きカナ「ミ」がフォント・解像度によって「ニ」と紛らわしい。

**How to apply:** フライヤー画像から人物名を読む際、「マニ」「ﾐ」っぽい字は「マミ」の可能性を優先して検討する。既存ラベル `マミソロ` との整合も確認材料にする。同様に他メンバーの「あおはるソロ」ラベルもメンバー本人の活動名と紐づく可能性が高い。


## project_mine_x_event_date_verification.md

---
name: mine-x-event-date-verification
description: mine-x転記時はイベント自体の日付をJST再計算で確定する（引用日付ラベルだけでなく）
metadata: 
  node_type: memory
  type: project
  originSessionId: 553accab-6e04-4fd1-87c4-1a09da688a42
---

X告知アーカイブからschedules YAMLへの転記（`/mine-x` skill）で、2024-09ウィンドウにて「引用の日付ラベル誤り」より重大な「イベント自体のdateフィールドが1日ずれる」バグを発見した。

**Why:** 三軒茶屋HEAVEN'S DOORイベントが当初9/19として転記されていたが、実際は当日告知2件が9/20早朝3時台投稿、お礼投稿も9/20 23時台で、全て9/20を指していた。「深夜投稿は前日の投稿だろう」という思い込みで日付を決め打ちしたのが原因。イベントに紐づく全ツイートの実UTC→JST変換時刻を機械的に並べてからイベント日付を確定する手順に切り替えたところ、10〜12月ウィンドウでは同種のイベント日付誤りは検出されなくなった（日付ラベルの軽微なズレは10月で6件あったが、イベント自体の日付は正しかった）。

**How to apply:** 今後mine-xで月次ドラフトを sub-agent に依頼する際は、プロンプト内で「イベントの日付ラベルだけでなく、イベント自体の日付を全ソースツイートのJST実時刻から機械的に再計算して確定すること」を明示的に指示する。`.claude/skills/mine-x/SKILL.md`への恒久化はまだ未実施（2026-07-11時点の残課題）。issue #20（2024年分）は全12ヶ月完了・クローズ済み、issue #7（mine-x全期間発掘）もクローズ済み。


## project_repo_visibility_public.md

---
name: repo-visibility-public
description: nantyara.com GitHubリポジトリは意図的にpublic。READMEの誤記は修正済み
metadata: 
  node_type: memory
  type: project
  originSessionId: 553accab-6e04-4fd1-87c4-1a09da688a42
---

nantyara/nantyara.com のGitHubリポジトリはpublic設定が正しい（2018-04-20の作成時からずっとpublicだったと見られる）。

**Why:** 2026-07-11、ユーザーの友人からのタレコミで「READMEに『非公開プロジェクトです』と書かれているのにリポジトリがpublicになっている」と指摘があった。調査の結果、`.env`等の機密ファイルは含まれておらず、実害（シークレット漏洩）は無かった。ユーザーに確認したところ「公開が意図通り」との回答で、README側が誤りと判明。さらにユーザーは「ライセンスを付与すると画像等の自由利用権を与えてしまう」ことを懸念しており、GitHubにLICENSEファイルが無い状態＝法的にAll rights reserved（デフォルトの著作権保護、再利用不可）であることを説明。README.mdのライセンス節を最終的に「本リポジトリは公開していますが、ライセンスは付与していません（All rights reserved）。画像・テキスト等の無断使用・転載はご遠慮ください。」に修正しcommit（`ab89ec3`→`00f969d`）・push済み。

**How to apply:** 今後このリポジトリの公開設定やREADMEの記載について疑問が出た場合、この経緯を踏まえて「publicだがAll rights reserved・再利用不可」という前提で対応する。正式なオープンソースライセンスを付与する話が出たらこのメモを更新する。


## project_sbq_naming.md

---
name: sbq-naming-convention
description: S.B.Q.アイドル部はピリオド有り、Studio S.B.Q はピリオド無しが正式表記
metadata: 
  node_type: memory
  type: project
  originSessionId: 553accab-6e04-4fd1-87c4-1a09da688a42
---

紛らわしいが正式表記が異なる（2026-07-21 ユーザー確認）:

- **S.B.Q.アイドル部** — 末尾までピリオド有りの「S.B.Q.」が正式
- **Studio S.B.Q** — 末尾ピリオド無しの「S.B.Q」が正式（市ヶ谷の撮影スタジオ）

**How to apply:** schedules の title/acts に書くとき、撮影会イベントは
「Studio S.B.Q 個人撮影会」（ピリオド無し）、対バン相手のアイドル部は
「S.B.Q.アイドル部」（ピリオド有り）。venues.yml の studio-sbq エントリの
name も「Studio S.B.Q」。


## user_claude_max_20x.md

---
name: user-claude-max-20x
description: yancya は 2026-07-05 に Claude Max 5x → 20x にアップグレード済み
metadata: 
  node_type: memory
  type: user
  originSessionId: 553accab-6e04-4fd1-87c4-1a09da688a42
---

yancya のプランは Claude Max **20x**（2026-07-05 に 5x からアップグレード）。

アップグレード時に使用量メーターがリセットされるので、直後の /cost の枠%は実消費の指標にならない。コスト議論では API換算$の方を使う。エコモデル運用ポリシー（[[feedback_esa_no_confirm]] とは別の CLAUDE.md 記載の sub-agent 振り分け方針）は 20x でも継続。


## user_nantyara_fan_since_2016.md

---
name: user-nantyara-fan-since-2016
description: yancya は 2016-11-11 からなんちゃらアイドルを見ている古参ファンで、沿革の一次証言者として使える
metadata: 
  node_type: memory
  type: user
  originSessionId: 66d19163-fb49-4cad-89e1-7ff14545bc18
---

yancya は 2016-11-11 に初めてなんちゃらアイドルのライブを見て以来の古参ファン。メンバー変遷の直接目撃者なので、沿革（src/data/history.yml）の事実確認は本人証言が一次情報として使える。

運営とも直接のやりとりがあり、フライヤー等の素材を公式ルートで受け取ることがある（例: 2026-07-28 大人の文化祭〜初夏〜のAI生成フライヤー）。yancya がチャットで持ち込む素材は「運営由来の公式情報」として扱ってよい（ファイル名が Gemini_Generated 等でも本物のことがある）。

本人証言で確定済みの事実（2026-07-06 再確認済み）:
- 2016-11-11 時点: はるか・御茶海マミ・あおはる の3人体制
- 2016-12-28 のライブ: 御茶海マミ・あおはる・せいら の3人で出演（せいらはこの1回のみで正式加入せず）。なんちゃラジオ EP002 の「2016年12月29とかだったかな」は 12/28 が正
- 以後ずっと御茶海マミ・あおはるの2人体制。旧メンバー（はるか・ぬる）が年1回程度「旧メンバーコラボ」でライブ出演することがある

本人の当時ツイートも一次史料として使える（`なんちゃら from:yancya until:YYYY-MM-DD` 検索で発掘可能）:
- 初観覧 2016-11-11: https://x.com/yancya/status/796965531479748608 「これが噂の、なんちゃらアイドル」
- 2016-12-28 現地: https://x.com/yancya/status/814076128268648448 「解散ingアイドル、（元）なんちゃらアイドルだー！シャンパンあおってる」

関連: [[project-mami-stage-name]]

