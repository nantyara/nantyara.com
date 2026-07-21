import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export interface Venue {
  id: string;
  name: string;
  aliases?: string[];
  address?: string;
  url?: string;
  /** 公式Xアカウント（@なし） */
  x?: string;
  /** この会場のイベントに images が無いときビルド時に補うデフォルト画像パス */
  default_event_image?: string;
  note?: string;
}

// 会場名の表記ゆれ（空白・大文字小文字）を正規化して比較する
// scripts/validate-yaml.js の normalizeSite と同一ロジックを保つこと
export function normalizeSite(site: string): string {
  return String(site).replace(/\s/g, '').toLowerCase();
}

export function loadVenues(): Venue[] {
  const content = readFileSync('src/data/venues.yml', 'utf-8');
  return parse(content) || [];
}

let cachedIndex: Map<string, Venue> | null = null;

function venueIndex(): Map<string, Venue> {
  if (!cachedIndex) {
    cachedIndex = new Map();
    for (const venue of loadVenues()) {
      for (const label of [venue.name, ...(venue.aliases ?? [])]) {
        cachedIndex.set(normalizeSite(label), venue);
      }
    }
  }
  return cachedIndex;
}

/** schedules の site（自由記述）を会場マスタのエントリに解決する */
export function resolveVenue(site: string): Venue | null {
  if (!site) return null;
  return venueIndex().get(normalizeSite(site)) ?? null;
}
