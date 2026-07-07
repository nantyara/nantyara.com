import type { APIRoute } from 'astro';
import { loadAllSchedules } from '../utils/schedules';

// トップページの「過去/すべて」表示用の軽量データ（ビルド時に静的生成される）。
// 過去イベントはXアーカイブ発掘で今後も増え続けるため、トップページの初回表示には含めず、
// ユーザーが実際に「過去」「すべて」を選んだ瞬間だけクライアントがこれを fetch する
// （lazy load）。フィールド名は転送量削減のため短縮している。
// t=日時(epoch ms) ti=タイトル s=会場 sl=slug c=詳細本文 im=サムネイル画像 l=ラベル tb=時刻未定フラグ
export const GET: APIRoute = () => {
  const schedules = loadAllSchedules();
  const data = schedules.map((s: any) => ({
    t: new Date(s.date).getTime(),
    ti: s.title,
    s: s.site,
    sl: s.slug,
    c: s.content ?? '',
    im: s.images?.[0],
    l: s.labels,
    tb: s.time_tbd || undefined,
  }));

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      // ビルドごとに再生成される静的ファイルなので長めにキャッシュしてよい
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
