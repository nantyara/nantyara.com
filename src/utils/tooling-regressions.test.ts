import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';
import test from 'node:test';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function writeFixture(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

test('sync-timetree follows pagination and safely serializes external text', () => {
  const root = mkdtempSync(join(tmpdir(), 'nantyara-sync-'));
  const binDir = join(root, 'bin');
  const toolsDir = join(root, 'tools');
  mkdirSync(binDir, { recursive: true });
  mkdirSync(toolsDir, { recursive: true });

  const tool = readFileSync(join(repoRoot, 'tools/sync-timetree'), 'utf8');
  writeFileSync(join(toolsDir, 'sync-timetree'), tool);
  chmodSync(join(toolsDir, 'sync-timetree'), 0o755);

  const firstPage = JSON.stringify({
    paging: { next: true, next_cursor: 'page2' },
    public_events: [{
      id: 'event-id-00000001',
      title: '企画: 夏祭り #1',
      note: '詳細未定',
      link_url: '',
      start_at: Date.parse('2026-07-15T19:00:00+09:00'),
      public_calendar_label: { name: 'ソロ: 特別' },
      images: { cover: [{ url: 'https://example.test/not-an-image.jpg' }] },
    }],
  });
  const secondPage = JSON.stringify({
    paging: { next: false, next_cursor: null },
    public_events: [{
      id: 'event-id-00000002',
      title: '二件目',
      note: '',
      link_url: '',
      start_at: Date.parse('2026-07-16T19:00:00+09:00'),
      public_calendar_label: null,
      images: { cover: [] },
    }],
  });

  const fakeCurl = `#!/bin/bash
out=""
url=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    -*) shift ;;
    *) url="$1"; shift ;;
  esac
done
if [[ "$url" == *not-an-image.jpg ]]; then
  printf 'not an image' > "$out"
elif [[ "$url" == *cursor=page2* ]]; then
  printf '%s' '${secondPage}'
else
  printf '%s' '${firstPage}'
fi
`;
  writeFileSync(join(binDir, 'curl'), fakeCurl);
  chmodSync(join(binDir, 'curl'), 0o755);

  const result = spawnSync('bash', [join(toolsDir, 'sync-timetree'), '--from', '2026-07-01', '--months', '1'], {
    cwd: root,
    env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Total events fetched: 2/);

  const schedules = parse(readFileSync(join(root, 'src/data/schedules/2026-07.yml'), 'utf8'));
  assert.equal(schedules.length, 2);
  assert.equal(schedules[0].title, '企画: 夏祭り #1');
  assert.deepEqual(schedules[0].labels, ['ソロ: 特別']);
  assert.equal('images' in schedules[0], false, 'invalid image responses must not be referenced');
});

test('validate-yaml rejects fields that would crash schedule rendering', () => {
  const root = mkdtempSync(join(tmpdir(), 'nantyara-validation-'));
  writeFixture(join(root, 'src/data/schedules/2026-07.yml'), `- id: event-20260715-test
  slug: 20260715-test
  date: 2026-02-30 19:00:00 +2460
  title: test
  site: test venue
  labels: not-an-array
`);
  writeFixture(join(root, 'src/data/venues.yml'), '- id: test\n  name: test venue\n');
  writeFixture(join(root, 'src/data/releases.yml'), `- id: release-test
  title: test
  release_date: 2026-07-15
  type: single
  links: ""
  tracks: ""
- id: release-empty-link
  title: empty link
  release_date: 2026-02-29
  type: single
  links:
    - platform: ""
      url: ""
`);

  const result = spawnSync(process.execPath, [join(repoRoot, 'scripts/validate-yaml.js')], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /content/);
  assert.match(result.stderr, /labels/);
  assert.match(result.stderr, /日付形式/);
  assert.match(result.stderr, /linksは配列/);
  assert.match(result.stderr, /tracksは文字列の配列/);
  assert.match(result.stderr, /platformとurl/);
});

test('image validation replaces corrupt JPEGs and rejects extension mismatches', () => {
  const root = mkdtempSync(join(tmpdir(), 'nantyara-images-'));
  const binDir = join(root, 'bin');
  const target = join(root, 'event.jpg');
  mkdirSync(binDir, { recursive: true });
  writeFileSync(target, 'corrupt image');

  const fakeCurl = `#!/bin/bash
out=""
url=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    -*) shift ;;
    *) url="$1"; shift ;;
  esac
done
if [[ "$url" == *valid-jpeg* ]]; then
  cp "$TEST_JPEG" "$out"
else
  cp "$TEST_PNG" "$out"
fi
`;
  writeFileSync(join(binDir, 'curl'), fakeCurl);
  chmodSync(join(binDir, 'curl'), 0o755);

  const tool = join(repoRoot, 'tools/sync-timetree');
  const env = {
    ...process.env,
    PATH: `${binDir}:${process.env.PATH}`,
    TEST_JPEG: join(repoRoot, 'public/events/20251220-timetree-15615745.jpg'),
    TEST_PNG: join(repoRoot, 'public/pwa-icons/favicon-32x32.png'),
  };
  const replace = spawnSync('bash', ['-c', 'source "$1"; ensure_image https://example.test/valid-jpeg "$2"', '_', tool, target], {
    cwd: root,
    env,
    encoding: 'utf8',
  });
  assert.equal(replace.status, 0, replace.stderr || replace.stdout);
  assert.deepEqual(readFileSync(target), readFileSync(env.TEST_JPEG));

  const rejectTarget = join(root, 'wrong-extension.jpg');
  const reject = spawnSync('bash', ['-c', 'source "$1"; ensure_image https://example.test/png "$2"', '_', tool, rejectTarget], {
    cwd: root,
    env,
    encoding: 'utf8',
  });
  assert.notEqual(reject.status, 0);
  assert.equal(existsSync(rejectTarget), false);
});

test('breadcrumbs reserve a full row inside the flex main layout', () => {
  const source = readFileSync(join(repoRoot, 'src/components/Breadcrumbs.astro'), 'utf8');
  assert.match(source, /\.breadcrumbs\s*\{[^}]*flex:\s*0\s+0\s+100%/s);
});
