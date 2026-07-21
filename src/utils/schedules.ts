import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { resolveVenue } from './venues';

// ビルド時、動的ルート（events/[slug].astro 等）はイベント数分（1000件超）ページを生成するため、
// メモ化なしだと毎ページ生成のたびに全YAMLファイルを再読み込み・再パースしてしまい、
// ビルド時間の急増を招く（issue #45）。ビルド1プロセス中はファイル内容が変わらない前提で、
// モジュールレベルにキャッシュする（venues.ts の venueIndex() と同じパターン）。
let cachedSchedules: any[] | null = null;

export function loadAllSchedules() {
  if (cachedSchedules) return cachedSchedules;

  const schedulesDir = 'src/data/schedules';
  const files = readdirSync(schedulesDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

  const allSchedules = files.flatMap(file => {
    const content = readFileSync(`${schedulesDir}/${file}`, 'utf-8');
    return parse(content) || [];
  });

  // フライヤー未設定のイベントに会場のデフォルト画像を補う
  // （YAML には書き込まないビルド時注入。後日フライヤーが images に入れば自然に上書きされる）
  const withVenueDefaults = allSchedules.map((s: any) => {
    if (s.images?.length || !s.site) return s;
    const defaultImage = resolveVenue(s.site)?.default_event_image;
    return defaultImage ? { ...s, images: [defaultImage] } : s;
  });

  // 日付でソート（新しい順）
  cachedSchedules = withVenueDefaults.sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return cachedSchedules;
}

// 「2026年9月20日(日)」形式の日付表示（日本時間）
export function formatDateJa(dateStr: string): string {
  const d = new Date(dateStr);
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(d);
  const get = (type: string) => parts.find(p => p.type === type)?.value;
  return `${get('year')}年${get('month')}月${get('day')}日(${get('weekday')})`;
}

/** イベントの開催年を、ビルド環境ではなく日本時間を基準に返す。 */
export function eventYearJa(dateStr: string): number {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) throw new TypeError(`Invalid event date: ${dateStr}`);
  return Number(new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
  }).format(date));
}
