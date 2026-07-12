import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import AstroPWA from './integrations/pwa';

// https://astro.build/config
export default defineConfig({
  site: 'https://nantyara.com',
  base: '/',
  build: {
    assets: '_astro',
  },
  server: {
    port: 3000,
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Yusei Magic',
      cssVariable: '--font-yusei',
      fallbacks: ['Hiragino Maru Gothic ProN', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Rampart One',
      cssVariable: '--font-rampart',
      fallbacks: ['Hiragino Maru Gothic ProN', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'RocknRoll One',
      cssVariable: '--font-rocknroll',
      fallbacks: ['Hiragino Maru Gothic ProN', 'sans-serif'],
    },
  ],
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/font-test/'),
    }),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'なんちゃらアイドル',
        short_name: 'なんちゃら',
        description: 'なんちゃらアイドル公式サイト - スケジュール・ライブ情報',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // HTML は precache しない（スケジュールの鮮度が SW 更新頼みになり、
        // iOS Safari が SW 更新をサボると何週間も古い予定が表示され続けるため）。
        // アセットはガチガチキャッシュ、HTML はオンラインなら常にネットワーク優先。
        globPatterns: ['**/*.{js,css,ico,png,jpg,jpeg,svg,webp,woff,woff2,ttf,eot,otf}'],
        runtimeCaching: [
          {
            // ページ遷移（HTML）: ネットワーク優先、オフライン時のみキャッシュ
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdnjs-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // フライヤー画像のみ（イベント詳細ページのHTMLを巻き込まないよう拡張子で限定）
            urlPattern: /\/events\/.*\.(?:png|jpe?g|webp|svg|gif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'event-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30日
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        navigateFallback: null,
        cleanupOutdatedCaches: true
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});
