import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEventDescription,
  buildMusicAlbum,
  buildMusicEvent,
  buildMusicGroup,
  buildWebSite,
  stringifyStructuredData,
} from './structured-data.ts';
import { eventYearJa } from './schedules.ts';

const baseEvent = {
  title: 'テストライブ',
  date: '2026-07-12 19:30:00 +0900',
  site: '渋谷ラママ',
  slug: '20260712-lamama',
  description: '2026年07月12日(日) 19:30 @ 渋谷ラママ',
};

test('MusicEvent includes a resolved venue, performers, image, and end date', () => {
  const data = buildMusicEvent(
    {
      ...baseEvent,
      end: '2026-07-12 21:00:00 +0900',
      acts: ['共演A'],
      images: ['/events/test.jpg'],
    },
    {
      id: 'lamama',
      name: '渋谷La.mama',
      address: '東京都渋谷区道玄坂1-15-3',
    },
  );

  assert.equal(data.startDate, '2026-07-12T19:30:00+09:00');
  assert.equal(data.endDate, '2026-07-12T21:00:00+09:00');
  assert.equal((data.location as any).name, '渋谷La.mama');
  assert.equal((data.location as any).address.streetAddress, '東京都渋谷区道玄坂1-15-3');
  assert.deepEqual((data.performer as any[]).map((item) => item.name), ['なんちゃらアイドル', '共演A']);
  assert.equal(data.image, 'https://nantyara.com/events/test.jpg');
});

test('time_tbd emits only the calendar date and omits an end date', () => {
  const data = buildMusicEvent(
    { ...baseEvent, time_tbd: true, end: '2026-07-12 21:00:00 +0900' },
    null,
  );

  assert.equal(data.startDate, '2026-07-12');
  assert.equal('endDate' in data, false);
  assert.deepEqual(data.location, { '@type': 'Place', name: '渋谷ラママ' });
});

test('structured data serialization escapes closing script markup', () => {
  assert.equal(stringifyStructuredData({ value: '</script>' }), '{"value":"\\u003c/script>"}');
});

test('event description includes a bounded performer list', () => {
  assert.equal(
    buildEventDescription('2026年07月12日 19:30 @ 会場', ['A', 'B', 'C', 'D']),
    '2026年07月12日 19:30 @ 会場。出演: A / B / C ほか',
  );
});

test('site and artist data preserve source-provided links and members', () => {
  const group = buildMusicGroup(['https://x.com/example'], ['メンバーA']);
  assert.deepEqual(group.sameAs, ['https://x.com/example']);
  assert.equal(group.member[0].name, 'メンバーA');
  assert.equal(buildWebSite().url, 'https://nantyara.com');
});

test('MusicAlbum links the release to the canonical group', () => {
  const album = buildMusicAlbum({
    id: 'release-001',
    title: 'テスト音源',
    releaseDate: '2026-07-12',
    image: '/releases/test.webp',
    tracks: ['曲A'],
  });
  assert.equal(album.image, 'https://nantyara.com/releases/test.webp');
  assert.equal(album.byArtist['@id'], 'https://nantyara.com/#musicgroup');
  assert.equal(album.track[0].name, '曲A');
});

test('event archive years are derived in Japan time', () => {
  assert.equal(eventYearJa('2018-01-01 00:20:00 +0900'), 2018);
});
