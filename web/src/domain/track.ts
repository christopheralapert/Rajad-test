export type Difficulty = 'Easy' | 'Moderate' | 'Hard';
export type Steepness = 'Flat' | 'Gentle' | 'Moderate' | 'Steep';
export type Environment = 'Forest' | 'Coastal' | 'Bog' | 'Mixed' | 'Urban';

export interface TrackRecord {
  id: string;
  source: string;
  source_id: string | null;
  name_et: string;
  name_en: string;
  county_et: string | null;
  county_en: string | null;
  municipality_et: string | null;
  municipality_en: string | null;
  location_et: string | null;
  location_en: string | null;
  description_et: string | null;
  description_en: string | null;
  length_km: number | null;
  duration: string | null;
  difficulty: Difficulty | null;
  steepness: Steepness | null;
  environment: Environment | null;
  image_url: string | null;
  elevation_m: number | null;
  highlights_et: string[] | null;
  highlights_en: string[] | null;
  start_lat: number | null;
  start_lng: number | null;
  featured: boolean;
  avg_rating: number | null;
  review_count: number;
  cover_image_url: string | null;
}

export interface TrackRecordDetail extends TrackRecord {
  geometry_geojson: any | null;
}

export interface HikingTrackView {
  id: string;
  name: string;
  county: string;
  municipality: string;
  location: string;
  length: number | null;
  duration: string | null;
  difficulty: TrackRecord['difficulty'];
  steepness: TrackRecord['steepness'];
  environment: TrackRecord['environment'];
  description: string;
  image: string | null;
  coordinates: [number, number] | null;
  elevation: number | null;
  highlights: string[];
  featured?: boolean;
  avgRating: number | null;
  reviewCount: number;
  geometry?: any | null;
}

export function toTrackView(record: TrackRecord, lang: 'et' | 'en'): HikingTrackView {
  const isEn = lang === 'en';
  const name = isEn ? record.name_en : record.name_et;
  const county = (isEn ? record.county_en : record.county_et) ?? '';
  const municipality = (isEn ? record.municipality_en : record.municipality_et) ?? '';
  const location = (isEn ? record.location_en : record.location_et) ?? '';
  const description = (isEn ? record.description_en : record.description_et) ?? '';
  const highlights = (isEn ? record.highlights_en : record.highlights_et) ?? [];

  const coordinates = record.start_lat != null && record.start_lng != null
    ? ([record.start_lat, record.start_lng] as [number, number])
    : null;

  return {
    id: record.id,
    name,
    county,
    municipality,
    location,
    length: record.length_km,
    duration: record.duration,
    difficulty: record.difficulty,
    steepness: record.steepness,
    environment: record.environment,
    description,
    image: record.image_url,
    coordinates,
    elevation: record.elevation_m,
    highlights,
    featured: record.featured,
    avgRating: record.avg_rating,
    reviewCount: record.review_count ?? 0,
  };
}

export function toTrackViewDetail(record: TrackRecordDetail, lang: 'et' | 'en'): HikingTrackView {
  const base = toTrackView(record, lang);
  return { ...base, geometry: record.geometry_geojson };
}
