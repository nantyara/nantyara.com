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
