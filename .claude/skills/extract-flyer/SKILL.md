---
name: extract-flyer
description: イベントのフライヤー画像からcontent情報を抽出してYAMLに展開する
disable-model-invocation: true
argument-hint: [slug]
---

指定されたslugのイベントのフライヤー画像を読み取り、contentフィールドを更新してください。

## 引数

- slug: $ARGUMENTS

## 手順

1. `src/data/schedules/` 配下のYAMLファイルから、指定されたslugのイベントを探す
2. そのイベントの `images` フィールドから画像パスを取得する（`public/` 配下に実ファイルがある）
3. 画像を読み取り、以下の情報を抽出する:
   - イベントタイトル（titleフィールドと異なる場合は更新）
   - 出演者一覧
   - 開場/開演時間
   - チケット料金（前売/当日）
   - ドリンク代
   - その他記載されている情報
4. 抽出した情報を `content` フィールドに展開する
5. commitはせず、ユーザーに確認を求める

## contentのフォーマット例

```yaml
content: |
  【出演】
  アーティスト名1
  アーティスト名2
  アーティスト名3

  開場/開演 18:30/19:00
  ADV/DOOR ¥2,500/¥3,000
  +1DRINK ¥500
```

## 注意事項

- 画像から読み取れない情報は無理に推測しない
- titleフィールドが会場名のままの場合、画像にイベント名があれば更新する
- 既存のcontent（TBD以外）がある場合は、上書き前にユーザーに確認する
