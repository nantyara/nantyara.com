import { loadAllSchedules } from './schedules';

export interface ActEntry {
  /** 表示名（初出の表記を正とする） */
  name: string;
  /** 共演したイベント（日付降順） */
  events: any[];
}

// 対バン相手名の表記ゆれ（空白・大文字小文字）を正規化して比較する
export function normalizeAct(name: string): string {
  return String(name).replace(/\s/g, '').toLowerCase();
}

// events/[slug].astro はイベント数分（1000件超）ページを生成し、ページごとに collectActs() を
// 呼ぶため、メモ化なしだと毎回 loadAllSchedules() の全件走査を繰り返してしまう（issue #45）。
// ビルド1プロセス中は結果が変わらない前提でモジュールレベルにキャッシュする。
let cachedActs: Map<string, ActEntry> | null = null;

/**
 * 全スケジュールの acts フィールドを集計して、対バン相手ごとの共演履歴を返す。
 * key は正規化名。loadAllSchedules() が日付降順なので events も日付降順になる。
 */
export function collectActs(): Map<string, ActEntry> {
  if (cachedActs) return cachedActs;

  const acts = new Map<string, ActEntry>();
  for (const schedule of loadAllSchedules()) {
    if (!Array.isArray(schedule.acts)) continue;
    for (const rawName of schedule.acts) {
      const key = normalizeAct(rawName);
      if (!key) continue;
      if (!acts.has(key)) {
        acts.set(key, { name: String(rawName).trim(), events: [] });
      }
      acts.get(key)!.events.push(schedule);
    }
  }
  cachedActs = acts;
  return acts;
}
