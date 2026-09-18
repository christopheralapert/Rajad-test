import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortTracks, filterTracks, sortTracks } from '../pages/filterUtils';
import type { HikingTrackView } from '../domain/track';

function makeTrack(overrides: Partial<HikingTrackView>): HikingTrackView {
  return {
    id: overrides.id ?? 'track',
    name: overrides.name ?? 'Rada',
    county: overrides.county ?? 'Tartu maakond',
    municipality: overrides.municipality ?? '',
    location: overrides.location ?? '',
    length: overrides.length ?? 5,
    duration: overrides.duration ?? '1 h',
    difficulty: overrides.difficulty ?? 'Easy',
    steepness: overrides.steepness ?? 'Gentle',
    environment: overrides.environment ?? 'Forest',
    description: overrides.description ?? '',
    image: overrides.image ?? null,
    coordinates: overrides.coordinates ?? null,
    elevation: overrides.elevation ?? null,
    highlights: overrides.highlights ?? [],
    featured: overrides.featured ?? false,
    avgRating: overrides.avgRating ?? null,
    reviewCount: overrides.reviewCount ?? 0,
  };
}

const tracks = [
  makeTrack({ id: '1', name: 'Taevaskoja matkarada', county: 'Põlva maakond', location: 'Taevaskoja', length: 3.8, description: 'Liivakivipaljandid ja jõgi' }),
  makeTrack({ id: '2', name: 'Viru raba õpperada', county: 'Harju maakond', location: 'Lahemaa', length: 6, description: 'Raba ja laudtee' }),
  makeTrack({ id: '3', name: 'Oandu-Ikla matkatee', county: 'Lääne-Viru maakond', location: 'Oandu', length: 370, description: 'Pikk matkatee' }),
];

describe('filterTracks', () => {
  it('leiab raja nime järgi sõltumata suur- ja väiketähtedest', () => {
    const result = filterTracks(tracks, 'raba', [0, 400]);

    assert.deepEqual(result.map((track) => track.id), ['2']);
  });

  it('leiab raja maakonna või kirjelduse järgi', () => {
    const result = filterTracks(tracks, 'liivakivi', [0, 400]);

    assert.deepEqual(result.map((track) => track.id), ['1']);
  });

  it('filtreerib rajad pikkuse vahemiku järgi', () => {
    const result = filterTracks(tracks, '', [4, 10]);

    assert.deepEqual(result.map((track) => track.id), ['2']);
  });
});

describe('sortTracks', () => {
  it('sordib rajad pikkuse järgi kasvavalt', () => {
    const result = sortTracks(tracks, 'length-asc');

    assert.deepEqual(result.map((track) => track.id), ['1', '2', '3']);
  });

  it('sordib rajad pikkuse järgi kahanevalt', () => {
    const result = sortTracks(tracks, 'length-desc');

    assert.deepEqual(result.map((track) => track.id), ['3', '2', '1']);
  });

  it('ei muuda algset massiivi sortimise käigus', () => {
    const originalOrder = tracks.map((track) => track.id);

    sortTracks(tracks, 'length-desc');

    assert.deepEqual(tracks.map((track) => track.id), originalOrder);
  });
});

describe('filterAndSortTracks', () => {
  it('kombineerib otsingu, pikkusefiltri ja sortimise', () => {
    const result = filterAndSortTracks(tracks, 'rada', [0, 10], 'length-desc');

    assert.deepEqual(result.map((track) => track.id), ['2', '1']);
  });
});
