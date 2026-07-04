# mining/ — 過去データ発掘の生データ置き場

`/mine-x` skill が X の検索結果から収穫した生データ（公式アカウントの告知ポスト）を保存する。
ここから日付・会場・出演者を裏取りして `src/data/schedules/` や `src/data/history.yml` に転記する。

- `x-archive/YYYY-MM.json` … 月ウィンドウごとの収穫（announces のみ。リプライは保存しない）
