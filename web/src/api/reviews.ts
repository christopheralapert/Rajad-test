import { apiGet, apiPostJson, apiPostRaw, resolveApiUrl } from './client';

export type DifficultyCompared = 'Easier' | 'As Expected' | 'Harder';
export type TerrainType = 'Forest' | 'Coastal' | 'Bog' | 'Mixed' | 'Urban' | 'Mountain';
export type TrailSurface = 'Paved' | 'Gravel' | 'Dirt' | 'Rocky' | 'Boardwalk' | 'Mixed';
export type Accessibility = 'Easy' | 'Moderate' | 'Difficult' | 'Very Difficult';
export type BestSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Year-round';

export interface ReviewRecord {
  id: string;
  track_id: string;
  user_name: string;
  rating: number;
  comment: string;
  difficulty: DifficultyCompared | null;
  conditions: string | null;
  terrain_type: TerrainType | null;
  trail_surface: TrailSurface | null;
  accessibility: Accessibility | null;
  best_season: BestSeason | null;
  images: string[];
  created_at: string; // ISO
}

export interface ReviewStats {
  review_count: number;
  avg_rating: number | null;
}

export async function fetchReviews(params?: {
  trackId?: string;
  rating?: number;
  random?: boolean;
  limit?: number;
}): Promise<ReviewRecord[]> {
  const sp = new URLSearchParams();
  if (params?.trackId) sp.set('trackId', params.trackId);
  if (params?.rating) sp.set('rating', String(params.rating));
  if (params?.random) sp.set('random', 'true');
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return apiGet<ReviewRecord[]>(`/api/reviews${qs ? `?${qs}` : ''}`);
}

export async function fetchReviewStats(): Promise<ReviewStats> {
  return apiGet<ReviewStats>('/api/reviews/stats');
}

// ✅ ainult see üks
export async function uploadImage(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const res = await apiPostRaw<{ url: string }>(
    '/api/uploads',
    buf,
    file.type || 'image/jpeg'
  );
  return resolveApiUrl(res.url);
}

export async function createReview(body: {
  track_id: string;
  user_name: string;
  rating: number;
  comment: string;
  difficulty?: DifficultyCompared | null;
  conditions?: string | null;
  terrain_type?: TerrainType | null;
  trail_surface?: TrailSurface | null;
  accessibility?: Accessibility | null;
  best_season?: BestSeason | null;
  images?: string[];
}): Promise<{
  review: ReviewRecord;
  track: { id: string; avg_rating: number | null; review_count: number; cover_image_url: string | null };
}> {
  return apiPostJson('/api/reviews', body);
}
