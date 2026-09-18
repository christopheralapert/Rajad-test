import { apiGet } from './client';

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
  geometry_geojson: any | null; // GeoJSON geometry (LineString / MultiLineString)
}

export async function fetchTracks(): Promise<TrackRecord[]> {
  return apiGet<TrackRecord[]>('/api/tracks');
}

export async function fetchTrack(id: string): Promise<TrackRecordDetail> {
  return apiGet<TrackRecordDetail>(`/api/tracks/${encodeURIComponent(id)}`);
}
