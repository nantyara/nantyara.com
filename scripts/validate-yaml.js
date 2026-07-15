#!/usr/bin/env node

/**
 * YAMLファイルのバリデーションスクリプト
 * schedules/*.yml と releases.yml の構造と型をチェック
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

let hasError = false;

// エラーログ出力
function logError(file, message) {
  console.error(`\x1b[31m✗ ${file}: ${message}\x1b[0m`);
  hasError = true;
}

// 成功ログ出力
function logSuccess(file) {
  console.log(`\x1b[32m✓ ${file}\x1b[0m`);
}

// 警告ログ出力（エラーにはしない）
function logWarn(file, message) {
  console.warn(`\x1b[33m⚠ ${file}: ${message}\x1b[0m`);
}

function isValidCalendarDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

// 日付形式チェック（ISO 8601形式 with timezone）
function isValidDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = match;
  const values = [year, month, day, hour, minute, second, offsetHour, offsetMinute].map(Number);
  const [y, m, d, h, min, sec, offsetH, offsetMin] = values;
  return isValidCalendarDate(y, m, d)
    && h <= 23 && min <= 59 && sec <= 59
    && offsetH <= 14 && offsetMin <= 59
    && (offsetH < 14 || offsetMin === 0);
}

function isValidReleaseDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return Boolean(match) && isValidCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

function validateStringArray(value, field, file, index) {
  if (!Array.isArray(value)) {
    logError(file, `イベント[${index}]: ${field}は配列である必要があります`);
    return;
  }
  value.forEach((item, itemIndex) => {
    if (typeof item !== 'string' || item.length === 0) {
      logError(file, `イベント[${index}]: ${field}[${itemIndex}]は空でない文字列である必要があります`);
    }
  });
}

// 会場名の表記ゆれ（空白・大文字小文字）を正規化して比較する
function normalizeSite(site) {
  return String(site).replace(/\s/g, '').toLowerCase();
}

// 会場マスタ（venues.yml）を読み込み、正規化名 → venue の索引を作る
function loadVenueIndex() {
  const venuesFile = 'src/data/venues.yml';
  const index = new Map();
  if (!existsSync(venuesFile)) {
    logWarn(venuesFile, '会場マスタが見つかりません（siteの解決をスキップ）');
    return index;
  }
  const venues = parse(readFileSync(venuesFile, 'utf-8')) || [];
  const idSet = new Set();
  venues.forEach((venue, i) => {
    if (!venue.id || !venue.name) {
      logError(venuesFile, `会場[${i}]: id と name は必須です`);
      return;
    }
    if (idSet.has(venue.id)) {
      logError(venuesFile, `会場id "${venue.id}" が重複しています`);
    }
    idSet.add(venue.id);
    for (const label of [venue.name, ...(venue.aliases || [])]) {
      const key = normalizeSite(label);
      if (index.has(key) && index.get(key).id !== venue.id) {
        logError(venuesFile, `表記 "${label}" が複数の会場（${index.get(key).id} と ${venue.id}）に解決されます`);
      }
      index.set(key, venue);
    }
  });
  return index;
}

// スケジュールのバリデーション
function validateSchedule(schedule, file, index) {
  const required = ['id', 'slug', 'date', 'title', 'site', 'content'];

  for (const field of required) {
    if (!schedule[field]) {
      logError(file, `イベント[${index}]: 必須フィールド "${field}" がありません`);
    } else if (typeof schedule[field] !== 'string') {
      logError(file, `イベント[${index}]: ${field}は文字列である必要があります`);
    }
  }

  // 日付形式チェック
  if (schedule.date && !isValidDate(schedule.date)) {
    logError(file, `イベント[${index}]: 日付形式が不正です: ${schedule.date}`);
  }

  if (schedule.end && !isValidDate(schedule.end)) {
    logError(file, `イベント[${index}]: 終了日時形式が不正です: ${schedule.end}`);
  }

  if (schedule.date && schedule.end && isValidDate(schedule.date) && isValidDate(schedule.end)
      && new Date(schedule.end).getTime() < new Date(schedule.date).getTime()) {
    logError(file, `イベント[${index}]: 終了日時が開始日時より前です`);
  }

  // slug形式チェック（YYYYMMDD-xxx）
  if (schedule.slug && !/^\d{8}-.+$/.test(schedule.slug)) {
    logError(file, `イベント[${index}]: slug形式が不正です（YYYYMMDD-xxx形式を推奨）: ${schedule.slug}`);
  }

  // images配列チェック
  if (schedule.images !== undefined) validateStringArray(schedule.images, 'images', file, index);

  if (schedule.labels !== undefined) validateStringArray(schedule.labels, 'labels', file, index);

  // acts配列チェック（対バン相手）
  if (schedule.acts !== undefined) validateStringArray(schedule.acts, 'acts', file, index);

  // sources配列チェック（出典URL）
  if (schedule.sources !== undefined) validateStringArray(schedule.sources, 'sources', file, index);

  for (const field of ['time_tbd', 'duplicate_ok']) {
    if (schedule[field] !== undefined && typeof schedule[field] !== 'boolean') {
      logError(file, `イベント[${index}]: ${field}はbooleanである必要があります`);
    }
  }
}

// リリースのバリデーション
function validateRelease(release, file, index) {
  const required = ['id', 'title', 'release_date', 'type'];

  for (const field of required) {
    if (!release[field]) {
      logError(file, `リリース[${index}]: 必須フィールド "${field}" がありません`);
    } else if (typeof release[field] !== 'string') {
      logError(file, `リリース[${index}]: ${field}は文字列である必要があります`);
    }
  }

  // 日付形式チェック
  if (release.release_date && !isValidReleaseDate(release.release_date)) {
    logError(file, `リリース[${index}]: 日付形式が不正です: ${release.release_date}`);
  }

  // type チェック
  const validTypes = ['single', 'album', 'ep'];
  if (release.type && !validTypes.includes(release.type)) {
    logError(file, `リリース[${index}]: typeは "single", "album", "ep" のいずれかである必要があります: ${release.type}`);
  }

  // links配列チェック
  if (release.links !== undefined) {
    if (!Array.isArray(release.links)) {
      logError(file, `リリース[${index}]: linksは配列である必要があります`);
    } else {
      release.links.forEach((link, linkIndex) => {
        if (!link || typeof link.platform !== 'string' || link.platform.length === 0
            || typeof link.url !== 'string' || link.url.length === 0) {
          logError(file, `リリース[${index}]: links[${linkIndex}]にplatformとurlが必要です`);
        }
      });
    }
  }

  // tracks配列チェック
  if (release.tracks !== undefined) {
    if (!Array.isArray(release.tracks)
        || release.tracks.some(track => typeof track !== 'string' || track.length === 0)) {
      logError(file, `リリース[${index}]: tracksは文字列の配列である必要があります`);
    }
  }
}

// スケジュールファイルのチェック
console.log('\n📅 スケジュールファイルをチェック中...\n');

const schedulesDir = 'src/data/schedules';
const allSchedules = [];

if (existsSync(schedulesDir)) {
  const scheduleFiles = readdirSync(schedulesDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

  if (scheduleFiles.length === 0) {
    logError(schedulesDir, 'YAMLファイルが見つかりません');
  }

  scheduleFiles.forEach(file => {
    const filePath = `${schedulesDir}/${file}`;
    try {
      const content = readFileSync(filePath, 'utf-8');
      const schedules = parse(content);

      if (!Array.isArray(schedules)) {
        logError(file, 'YAMLのルートは配列である必要があります');
        return;
      }

      if (schedules.length === 0) {
        logError(file, 'イベントが1件も登録されていません');
        return;
      }

      schedules.forEach((schedule, index) => {
        validateSchedule(schedule, file, index);
        // 重複チェック用に全データを収集
        allSchedules.push({ ...schedule, _file: file, _index: index });
      });

      if (!hasError) {
        logSuccess(file);
      }
    } catch (error) {
      logError(file, `YAMLパースエラー: ${error.message}`);
    }
  });

  // 重複チェック
  console.log('\n🔍 スケジュールのID/Slug重複チェック中...\n');

  const venueIndex = loadVenueIndex();
  const unknownSites = new Map();

  const idMap = new Map();
  const slugMap = new Map();
  const dayVenueMap = new Map();

  allSchedules.forEach(schedule => {
    // ID重複チェック
    if (schedule.id) {
      if (idMap.has(schedule.id)) {
        const prev = idMap.get(schedule.id);
        logError('重複エラー', `ID "${schedule.id}" が重複しています: ${prev._file} と ${schedule._file}`);
      } else {
        idMap.set(schedule.id, schedule);
      }
    }

    // Slug重複チェック
    if (schedule.slug) {
      if (slugMap.has(schedule.slug)) {
        const prev = slugMap.get(schedule.slug);
        logError('重複エラー', `Slug "${schedule.slug}" が重複しています: ${prev._file} と ${schedule._file}`);
      } else {
        slugMap.set(schedule.slug, schedule);
      }
    }

    // 同日・同会場チェック（TimeTree/X/手動と取り込み経路が複数あるため、
    // 同じイベントの二重登録をここで堰き止める）
    // 会場は venues.yml で解決した venue id で比較する（別名表記でも同一会場と見なす）。
    // 本当に別イベント（昼夜2公演など）の場合は duplicate_ok: true を付けて明示する
    if (schedule.date && schedule.site) {
      const normalized = normalizeSite(schedule.site);
      const venue = venueIndex.get(normalized);
      if (venueIndex.size > 0 && !venue && !unknownSites.has(normalized)) {
        unknownSites.set(normalized, schedule);
      }
      if (schedule.duplicate_ok !== true) {
        const day = String(schedule.date).slice(0, 10);
        const key = `${day}|${venue ? venue.id : normalized}`;
        if (dayVenueMap.has(key)) {
          const prev = dayVenueMap.get(key);
          logError('重複エラー', `同日・同会場のイベントがあります（${day} ${schedule.site}）: "${prev.id}" と "${schedule.id}"。同一イベントなら統合、別イベントなら duplicate_ok: true を付けてください`);
        } else {
          dayVenueMap.set(key, schedule);
        }
      }
    }
  });

  // 会場マスタに無い site 表記を警告（エラーにはしない。venues.yml への追記を促す）
  for (const [, schedule] of unknownSites) {
    logWarn(schedule._file, `site "${schedule.site}" が venues.yml に見つかりません（name か aliases に追記してください）`);
  }

  // acts の表記ゆれを警告（正規化すると同一なのに生の表記が違うと、/acts/{名前} の
  // ページは正規名の1つしか生成されず、他表記からのリンクが 404 になるため）
  // 正規化ロジックは src/utils/acts.ts の normalizeAct と揃えること
  const actSpellings = new Map();
  allSchedules.forEach(schedule => {
    if (!Array.isArray(schedule.acts)) return;
    for (const raw of schedule.acts) {
      const key = String(raw).replace(/\s/g, '').toLowerCase();
      if (!key) continue;
      if (!actSpellings.has(key)) actSpellings.set(key, new Map());
      if (!actSpellings.get(key).has(raw)) actSpellings.get(key).set(raw, schedule._file);
    }
  });
  for (const [, spellings] of actSpellings) {
    if (spellings.size > 1) {
      const list = [...spellings.entries()].map(([raw, file]) => `"${raw}"(${file})`).join(' / ');
      logWarn('acts表記ゆれ', `同一アーティストと思われる表記が混在しています: ${list}。データ側を統一してください`);
    }
  }

  if (!hasError) {
    console.log('\x1b[32m✓ 重複なし\x1b[0m');
  }
} else {
  logError(schedulesDir, 'ディレクトリが存在しません');
}

// リリースファイルのチェック
console.log('\n💿 リリースファイルをチェック中...\n');

const releasesFile = 'src/data/releases.yml';
if (existsSync(releasesFile)) {
  try {
    const content = readFileSync(releasesFile, 'utf-8');
    const releases = parse(content);

    if (!Array.isArray(releases)) {
      logError(releasesFile, 'YAMLのルートは配列である必要があります');
    } else {
      if (releases.length === 0) {
        logError(releasesFile, 'リリースが1件も登録されていません');
      }

      releases.forEach((release, index) => {
        validateRelease(release, releasesFile, index);
      });

      // ID重複チェック
      console.log('\n🔍 リリースのID重複チェック中...\n');

      const idMap = new Map();
      releases.forEach((release, index) => {
        if (release.id) {
          if (idMap.has(release.id)) {
            const prevIndex = idMap.get(release.id);
            logError('重複エラー', `ID "${release.id}" が重複しています: リリース[${prevIndex}] と リリース[${index}]`);
          } else {
            idMap.set(release.id, index);
          }
        }
      });

      if (!hasError) {
        logSuccess(releasesFile);
        console.log('\x1b[32m✓ 重複なし\x1b[0m');
      }
    }
  } catch (error) {
    logError(releasesFile, `YAMLパースエラー: ${error.message}`);
  }
} else {
  logError(releasesFile, 'ファイルが存在しません');
}

// 結果出力
console.log('\n' + '='.repeat(50));
if (hasError) {
  console.error('\n\x1b[31m❌ バリデーションエラーが見つかりました\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\n\x1b[32m✅ すべてのYAMLファイルが正常です\x1b[0m\n');
  process.exit(0);
}
