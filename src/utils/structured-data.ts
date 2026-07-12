import type { Venue } from './venues';

export interface EventStructuredDataInput {
  title: string;
  date: string;
  end?: string;
  site: string;
  slug: string;
  time_tbd?: boolean;
  acts?: string[];
  images?: string[];
  description: string;
}

const SITE_URL = 'https://nantyara.com';

export function buildEventDescription(
  dateAndVenue: string,
  acts?: string[],
  limit = 3,
): string {
  if (!acts?.length) return dateAndVenue;
  const shown = acts.slice(0, limit).join(' / ');
  return `${dateAndVenue}。出演: ${shown}${acts.length > limit ? ' ほか' : ''}`;
}

function japanDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`Invalid event date: ${value}`);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}+09:00`;
}

export function buildMusicEvent(
  event: EventStructuredDataInput,
  venue: Venue | null,
) {
  const dateOnly = event.date.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (event.time_tbd && !dateOnly) throw new TypeError(`Invalid event date: ${event.date}`);

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: event.title,
    url: `${SITE_URL}/events/${event.slug}`,
    startDate: event.time_tbd ? dateOnly : japanDateTime(event.date),
    location: {
      '@type': 'Place',
      name: venue?.name ?? event.site,
      ...(venue?.address
        ? { address: { '@type': 'PostalAddress', streetAddress: venue.address } }
        : {}),
    },
    performer: [
      { '@type': 'MusicGroup', name: 'なんちゃらアイドル', url: SITE_URL },
      ...(event.acts ?? []).map((name) => ({ '@type': 'MusicGroup', name })),
    ],
    description: event.description,
  };

  if (event.end && !event.time_tbd) data.endDate = japanDateTime(event.end);
  if (event.images?.[0]) data.image = new URL(event.images[0], SITE_URL).href;

  return data;
}

/** Keep JSON-LD safe when embedded in an inline script element. */
export function stringifyStructuredData(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function buildMusicGroup(sameAs: string[], members: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    '@id': `${SITE_URL}/#musicgroup`,
    name: 'なんちゃらアイドル',
    url: SITE_URL,
    foundingDate: '2014-01-26',
    sameAs,
    member: members.map((name) => ({ '@type': 'Person', name })),
  };
}

export function buildWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'なんちゃらアイドル公式サイト',
    url: SITE_URL,
  };
}

export interface ReleaseStructuredDataInput {
  id: string;
  title: string;
  releaseDate: string;
  image?: string;
  tracks?: string[];
}

export function buildMusicAlbum(release: ReleaseStructuredDataInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: release.title,
    url: `${SITE_URL}/releases/${release.id}`,
    datePublished: release.releaseDate,
    byArtist: { '@type': 'MusicGroup', '@id': `${SITE_URL}/#musicgroup`, name: 'なんちゃらアイドル' },
    ...(release.image ? { image: new URL(release.image, SITE_URL).href } : {}),
    ...(release.tracks?.length
      ? { track: release.tracks.map((name) => ({ '@type': 'MusicRecording', name })) }
      : {}),
  };
}
