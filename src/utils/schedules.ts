import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';

export function loadAllSchedules() {
  const schedulesDir = 'src/data/schedules';
  const files = readdirSync(schedulesDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

  const allSchedules = files.flatMap(file => {
    const content = readFileSync(`${schedulesDir}/${file}`, 'utf-8');
    return parse(content) || [];
  });

  // 日付でソート（新しい順）
  return allSchedules.sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
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
