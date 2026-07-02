import type { APIRoute } from 'astro';
import { loadAllSchedules } from '../../utils/schedules';

// イベントごとに iCalendar ファイルを静的生成する
// （Googleカレンダー以外＝iPhone標準カレンダー等のユーザー向け）

export function getStaticPaths() {
  return loadAllSchedules()
    .filter((s: any) => s.slug)
    .map((schedule: any) => ({
      params: { slug: schedule.slug },
      props: { schedule },
    }));
}

const pad = (n: number) => String(n).padStart(2, '0');

// UTC基準の YYYYMMDDTHHMMSSZ
const toIcsDateTime = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

// JST基準の YYYYMMDD（終日イベント用）
const toIcsDateJst = (d: Date) => {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const pick = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${pick('year')}${pick('month')}${pick('day')}`;
};

// TEXT値のエスケープ（RFC 5545）
const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// 75オクテット制限に合わせた行折り返し（UTF-8のバイト数基準、余裕を見て72）
const foldLine = (line: string) => {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let current = '';
  let bytes = 0;
  const limit = 72;
  for (const ch of line) {
    const chBytes = encoder.encode(ch).length;
    if (bytes + chBytes > limit) {
      chunks.push(current);
      current = ' ' + ch;
      bytes = 1 + chBytes;
    } else {
      current += ch;
      bytes += chBytes;
    }
  }
  chunks.push(current);
  return chunks.join('\r\n');
};

export const GET: APIRoute = ({ props }) => {
  const schedule = props.schedule as any;
  const start = new Date(schedule.date);
  const end = schedule.end
    ? new Date(schedule.end)
    : new Date(start.getTime() + 4 * 60 * 60 * 1000);

  const url = `https://nantyara.com/events/${schedule.slug}`;
  const description = schedule.content
    ? `${schedule.content}\n\nイベント詳細: ${url}`
    : `イベント詳細: ${url}`;

  const dateLines = schedule.time_tbd
    ? [
        // 時間未定は終日イベントとして登録
        `DTSTART;VALUE=DATE:${toIcsDateJst(start)}`,
      ]
    : [
        `DTSTART:${toIcsDateTime(start)}`,
        `DTEND:${toIcsDateTime(end)}`,
      ];

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//nantyara.com//Schedule//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${schedule.slug}@nantyara.com`,
    `DTSTAMP:${toIcsDateTime(start)}`,
    ...dateLines,
    `SUMMARY:${escapeText(schedule.title)}`,
    `LOCATION:${escapeText(schedule.site)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const body = lines.map(foldLine).join('\r\n') + '\r\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${schedule.slug}.ics"`,
    },
  });
};
