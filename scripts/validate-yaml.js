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

// 日付形式チェック（ISO 8601形式 with timezone）
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// スケジュールのバリデーション
function validateSchedule(schedule, file, index) {
  const required = ['id', 'slug', 'date', 'title', 'site'];

  for (const field of required) {
    if (!schedule[field]) {
      logError(file, `イベント[${index}]: 必須フィールド "${field}" がありません`);
    }
  }

  // 日付形式チェック
  if (schedule.date && !isValidDate(schedule.date)) {
    logError(file, `イベント[${index}]: 日付形式が不正です: ${schedule.date}`);
  }

  if (schedule.end && !isValidDate(schedule.end)) {
    logError(file, `イベント[${index}]: 終了日時形式が不正です: ${schedule.end}`);
  }

  // slug形式チェック（YYYYMMDD-xxx）
  if (schedule.slug && !/^\d{8}-.+$/.test(schedule.slug)) {
    logError(file, `イベント[${index}]: slug形式が不正です（YYYYMMDD-xxx形式を推奨）: ${schedule.slug}`);
  }

  // images配列チェック
  if (schedule.images && !Array.isArray(schedule.images)) {
    logError(file, `イベント[${index}]: imagesは配列である必要があります`);
  }
}

// リリースのバリデーション
function validateRelease(release, file, index) {
  const required = ['id', 'title', 'release_date', 'type'];

  for (const field of required) {
    if (!release[field]) {
      logError(file, `リリース[${index}]: 必須フィールド "${field}" がありません`);
    }
  }

  // 日付形式チェック
  if (release.release_date && !isValidDate(release.release_date)) {
    logError(file, `リリース[${index}]: 日付形式が不正です: ${release.release_date}`);
  }

  // type チェック
  const validTypes = ['single', 'album', 'ep'];
  if (release.type && !validTypes.includes(release.type)) {
    logError(file, `リリース[${index}]: typeは "single", "album", "ep" のいずれかである必要があります: ${release.type}`);
  }

  // links配列チェック
  if (release.links) {
    if (!Array.isArray(release.links)) {
      logError(file, `リリース[${index}]: linksは配列である必要があります`);
    } else {
      release.links.forEach((link, linkIndex) => {
        if (!link.platform || !link.url) {
          logError(file, `リリース[${index}]: links[${linkIndex}]にplatformとurlが必要です`);
        }
      });
    }
  }

  // tracks配列チェック
  if (release.tracks && !Array.isArray(release.tracks)) {
    logError(file, `リリース[${index}]: tracksは配列である必要があります`);
  }
}

// スケジュールファイルのチェック
console.log('\n📅 スケジュールファイルをチェック中...\n');

const schedulesDir = 'src/data/schedules';
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
      });

      if (!hasError) {
        logSuccess(file);
      }
    } catch (error) {
      logError(file, `YAMLパースエラー: ${error.message}`);
    }
  });
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

      if (!hasError) {
        logSuccess(releasesFile);
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
