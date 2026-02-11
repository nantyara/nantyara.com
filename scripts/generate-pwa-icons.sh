#!/bin/bash
# PWAアイコン生成スクリプト
# なんちゃらアイドルのロゴからPWA用アイコンを生成

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_IMAGE="$PROJECT_ROOT/public/pwa-icons/logo-source.png"
OUTPUT_DIR="$PROJECT_ROOT/public/pwa-icons"

if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "❌ エラー: ソース画像が見つかりません"
  echo "📁 $SOURCE_IMAGE に画像を配置してください"
  exit 1
fi

echo "🎨 PWAアイコンを生成中..."

# 192x192 (Androidホーム画面用)
echo "  📱 192x192 を生成..."
sips -z 192 192 "$SOURCE_IMAGE" --out "$OUTPUT_DIR/icon-192.png" > /dev/null

# 512x512 (スプラッシュ画面用)
echo "  📱 512x512 を生成..."
sips -z 512 512 "$SOURCE_IMAGE" --out "$OUTPUT_DIR/icon-512.png" > /dev/null

# Apple Touch Icon 180x180
echo "  🍎 180x180 (Apple Touch Icon) を生成..."
sips -z 180 180 "$SOURCE_IMAGE" --out "$OUTPUT_DIR/apple-touch-icon.png" > /dev/null

# Favicon 32x32
echo "  🔖 32x32 (Favicon) を生成..."
sips -z 32 32 "$SOURCE_IMAGE" --out "$OUTPUT_DIR/favicon-32x32.png" > /dev/null

# Favicon 16x16
echo "  🔖 16x16 (Favicon) を生成..."
sips -z 16 16 "$SOURCE_IMAGE" --out "$OUTPUT_DIR/favicon-16x16.png" > /dev/null

# favicon.ico (multi-size)
echo "  🌐 favicon.ico を生成..."
if command -v magick >/dev/null 2>&1; then
  magick "$OUTPUT_DIR/favicon-32x32.png" "$OUTPUT_DIR/favicon-16x16.png" "$PROJECT_ROOT/public/favicon.ico"
elif command -v convert >/dev/null 2>&1; then
  convert "$OUTPUT_DIR/favicon-32x32.png" "$OUTPUT_DIR/favicon-16x16.png" "$PROJECT_ROOT/public/favicon.ico"
else
  echo "  ⚠️  ImageMagick not found. Skipping favicon.ico generation."
  echo "     Install with: brew install imagemagick"
fi

echo "✅ 完了！以下のアイコンが生成されました："
echo "  - icon-192.png (192x192)"
echo "  - icon-512.png (512x512)"
echo "  - apple-touch-icon.png (180x180)"
echo "  - favicon-32x32.png (32x32)"
echo "  - favicon-16x16.png (16x16)"
echo "  - favicon.ico (32x32 + 16x16)"
echo ""
echo "📝 次のステップ："
echo "  1. public/pwa-icons/apple-touch-icon.png を public/ にコピー"
echo "  2. Layout.astro の <head> に以下を追加："
echo '     <link rel="apple-touch-icon" href="/apple-touch-icon.png">'
