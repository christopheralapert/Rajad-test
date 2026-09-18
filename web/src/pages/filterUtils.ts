import type { HikingTrackView } from '../domain/track';

export type TrackSortOption = 'name-asc' | 'name-desc' | 'length-asc' | 'length-desc' | 'county-asc';

export function filterTracks(
  tracks: HikingTrackView[],
  searchQuery: string,
  lengthRange: [number, number]
): HikingTrackView[] {
  const query = searchQuery.trim().toLowerCase();

  return tracks.filter((track) => {
    if (query) {
      const searchableText = [track.name, track.location, track.county, track.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) return false;
    }

    if (track.length != null && (track.length < lengthRange[0] || track.length > lengthRange[1])) {
      return false;
    }

    return true;
  });
}

export function sortTracks(
  tracks: HikingTrackView[],
  sortBy: TrackSortOption,
  lang: 'et' | 'en' = 'et'
): HikingTrackView[] {
  return [...tracks].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name, lang);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name, lang);
    if (sortBy === 'length-asc') return (a.length ?? 999999) - (b.length ?? 999999);
    if (sortBy === 'length-desc') return (b.length ?? 0) - (a.length ?? 0);
    if (sortBy === 'county-asc') {
      const countyA = a.county || '';
      const countyB = b.county || '';
      const countyCompare = countyA.localeCompare(countyB, lang);
      if (countyCompare !== 0) return countyCompare;
      return a.name.localeCompare(b.name, lang);
    }
    return 0;
  });
}

export function filterAndSortTracks(
  tracks: HikingTrackView[],
  searchQuery: string,
  lengthRange: [number, number],
  sortBy: TrackSortOption,
  lang: 'et' | 'en' = 'et'
): HikingTrackView[] {
  return sortTracks(filterTracks(tracks, searchQuery, lengthRange), sortBy, lang);
}
