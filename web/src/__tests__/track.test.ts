import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toTrackView, toTrackViewDetail, type TrackRecord, type TrackRecordDetail } from '../domain/track';

const baseRecord: TrackRecord = {
  id: 'track-1',
  source: 'local',
  source_id: null,
  name_et: 'Taevaskoja matkarada',
  name_en: 'Taevaskoja hiking trail',
  county_et: 'Põlva maakond',
  county_en: 'Põlva County',
  municipality_et: 'Põlva vald',
  municipality_en: 'Põlva Parish',
  location_et: 'Taevaskoja',
  location_en: 'Taevaskoja',
  description_et: 'Ilus liivakivipaljanditega rada.',
  description_en: 'Beautiful trail with sandstone outcrops.',
  length_km: 3.8,
  duration: '1 h',
  difficulty: 'Easy',
  steepness: 'Gentle',
  environment: 'Forest',
  image_url: '/uploads/taevaskoja.jpg',
  elevation_m: 24,
  highlights_et: ['liivakivipaljandid', 'jõgi'],
  highlights_en: ['sandstone outcrops', 'river'],
  start_lat: 58.106,
  start_lng: 27.045,
  featured: true,
  avg_rating: 4.7,
  review_count: 12,
  cover_image_url: null,
};

describe('toTrackView', () => {
  it('teisendab rajakirje eestikeelseks vaateks', () => {
    const view = toTrackView(baseRecord, 'et');

    assert.equal(view.name, 'Taevaskoja matkarada');
    assert.equal(view.county, 'Põlva maakond');
    assert.equal(view.description, 'Ilus liivakivipaljanditega rada.');
    assert.deepEqual(view.highlights, ['liivakivipaljandid', 'jõgi']);
  });

  it('teisendab rajakirje ingliskeelseks vaateks', () => {
    const view = toTrackView(baseRecord, 'en');

    assert.equal(view.name, 'Taevaskoja hiking trail');
    assert.equal(view.county, 'Põlva County');
    assert.equal(view.description, 'Beautiful trail with sandstone outcrops.');
    assert.deepEqual(view.highlights, ['sandstone outcrops', 'river']);
  });

  it('moodustab alguspunkti koordinaadid kujul [lat, lng]', () => {
    const view = toTrackView(baseRecord, 'et');

    assert.deepEqual(view.coordinates, [58.106, 27.045]);
  });

  it('tagastab koordinaatideks null, kui alguspunkt puudub', () => {
    const view = toTrackView({ ...baseRecord, start_lat: null }, 'et');

    assert.equal(view.coordinates, null);
  });

  it('kasutab vaikimisi tühje väärtusi ja reviewCount väärtust 0, kui osa andmeid puudub', () => {
    const view = toTrackView({
      ...baseRecord,
      county_et: null,
      municipality_et: null,
      location_et: null,
      description_et: null,
      highlights_et: null,
      review_count: undefined as unknown as number,
    }, 'et');

    assert.equal(view.county, '');
    assert.equal(view.municipality, '');
    assert.equal(view.location, '');
    assert.equal(view.description, '');
    assert.deepEqual(view.highlights, []);
    assert.equal(view.reviewCount, 0);
  });
});

describe('toTrackViewDetail', () => {
  it('lisab detailvaatele GeoJSON geomeetria', () => {
    const detailRecord: TrackRecordDetail = {
      ...baseRecord,
      geometry_geojson: { type: 'LineString', coordinates: [[27.045, 58.106], [27.047, 58.108]] },
    };

    const view = toTrackViewDetail(detailRecord, 'et');

    assert.deepEqual(view.geometry, detailRecord.geometry_geojson);
  });
});
