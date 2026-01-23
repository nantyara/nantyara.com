#!/bin/bash
# Git hooksのセットアップスクリプト

echo "🔧 Git hooksをセットアップ中..."

# pre-commit hookのコピー
cp -f scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Git hooksのセットアップが完了しました"
echo ""
echo "📝 以下のhookがインストールされました:"
echo "  - pre-commit: YAMLファイルのバリデーション"
