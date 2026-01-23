#!/bin/sh
# YAMLファイルのバリデーション（pre-commit hook）

echo "🔍 YAMLファイルをバリデーション中..."

# バリデーションスクリプト実行
npm run validate-yaml

# エラーがあればコミットを中止
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ コミットが中断されました。YAMLファイルを修正してください。"
  exit 1
fi

echo ""
echo "✅ バリデーション完了。コミットを続行します。"
exit 0
