import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';

export const reviewsRouter = Router();

const difficultySchema = z.enum(['Easier', 'As Expected', 'Harder']);
const terrainTypeSchema = z.enum(['Forest', 'Coastal', 'Bog', 'Mixed', 'Urban', 'Mountain']);
const trailSurfaceSchema = z.enum(['Paved', 'Gravel', 'Dirt', 'Rocky', 'Boardwalk', 'Mixed']);
const accessibilitySchema = z.enum(['Easy', 'Moderate', 'Difficult', 'Very Difficult']);
const bestSeasonSchema = z.enum(['Spring', 'Summer', 'Autumn', 'Winter', 'Year-round']);

// GET /api/reviews?trackId=<uuid>&rating=5&random=true&limit=5
reviewsRouter.get('/', async (req, res) => {
  const schema = z.object({
    trackId: z.string().uuid().optional(),
    rating: z.string().transform((v) => Number(v)).pipe(z.number().int().min(1).max(5)).optional(),
    random: z.string().optional(),
    limit: z.string().transform((v) => Number(v)).pipe(z.number().int().min(1).max(100)).optional(),
  });

  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query' });
    return;
  }

  const { trackId, rating, random, limit } = parsed.data;
  const isRandom = String(random || '').toLowerCase() === 'true' || String(random || '') === '1';
  const lim = limit ?? 50;

  const where: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (trackId) {
    where.push(`track_id = $${idx++}`);
    params.push(trackId);
  }
  if (rating) {
    where.push(`rating = $${idx++}`);
    params.push(rating);
  }

  params.push(lim);

  const sql = `
    SELECT
      id,
      track_id,
      user_name,
      rating,
      comment,
      difficulty,
      conditions,
      terrain_type,
      trail_surface,
      accessibility,
      best_season,
      images,
      created_at
    FROM reviews
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${isRandom ? 'random()' : 'created_at DESC'}
    LIMIT $${idx}
  `;

  const rows = await query(sql, params);
  res.json(rows);
});

// Aggregated filter data from reviews
reviewsRouter.get('/filter-stats', async (_req, res) => {
  try {
    // Get terrain type counts
    const terrainRows = await query(`
      SELECT terrain_type, COUNT(DISTINCT track_id)::int AS count
      FROM reviews
      WHERE terrain_type IS NOT NULL
      GROUP BY terrain_type
    `);
    
    // Get trail surface counts
    const surfaceRows = await query(`
      SELECT trail_surface, COUNT(DISTINCT track_id)::int AS count
      FROM reviews
      WHERE trail_surface IS NOT NULL
      GROUP BY trail_surface
    `);
    
    // Get accessibility counts
    const accessRows = await query(`
      SELECT accessibility, COUNT(DISTINCT track_id)::int AS count
      FROM reviews
      WHERE accessibility IS NOT NULL
      GROUP BY accessibility
    `);
    
    // Get best season counts
    const seasonRows = await query(`
      SELECT best_season, COUNT(DISTINCT track_id)::int AS count
      FROM reviews
      WHERE best_season IS NOT NULL
      GROUP BY best_season
    `);
    
    // Convert to objects
    const terrain_types: Record<string, number> = {};
    terrainRows.forEach((row: any) => {
      terrain_types[row.terrain_type] = row.count;
    });
    
    const trail_surfaces: Record<string, number> = {};
    surfaceRows.forEach((row: any) => {
      trail_surfaces[row.trail_surface] = row.count;
    });
    
    const accessibility_levels: Record<string, number> = {};
    accessRows.forEach((row: any) => {
      accessibility_levels[row.accessibility] = row.count;
    });
    
    const best_seasons: Record<string, number> = {};
    seasonRows.forEach((row: any) => {
      best_seasons[row.best_season] = row.count;
    });
    
    res.json({
      terrain_types,
      trail_surfaces,
      accessibility_levels,
      best_seasons,
    });
  } catch (err: any) {
    console.error('filter-stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Overall stats for Home page
reviewsRouter.get('/stats', async (_req, res) => {
  const [row] = await query(
    `
    SELECT
      COUNT(*)::int AS review_count,
      CASE WHEN COUNT(*) = 0 THEN NULL ELSE ROUND(AVG(rating)::numeric, 2)::float8 END AS avg_rating
    FROM reviews
    `,
  );
  res.json(row ?? { review_count: 0, avg_rating: null });
});

// POST /api/reviews - create a new review
reviewsRouter.post('/', async (req, res) => {
  const schema = z.object({
    track_id: z.string().uuid(),
    user_name: z.string().min(1).max(80),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1).max(4000),
    difficulty: difficultySchema.optional().nullable(),
    conditions: z.string().max(200).optional().nullable(),
    terrain_type: terrainTypeSchema.optional().nullable(),
    trail_surface: trailSurfaceSchema.optional().nullable(),
    accessibility: accessibilitySchema.optional().nullable(),
    best_season: bestSeasonSchema.optional().nullable(),
    images: z.array(z.string().min(1)).max(10).optional().default([]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    return;
  }

  const b = parsed.data;

  // Insert review
  const [review] = await query(
    `
    INSERT INTO reviews (track_id, user_name, rating, comment, difficulty, conditions, terrain_type, trail_surface, accessibility, best_season, images)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, track_id, user_name, rating, comment, difficulty, conditions, terrain_type, trail_surface, accessibility, best_season, images, created_at
    `,
    [b.track_id, b.user_name, b.rating, b.comment, b.difficulty ?? null, b.conditions ?? null, b.terrain_type ?? null, b.trail_surface ?? null, b.accessibility ?? null, b.best_season ?? null, b.images],
  );

  // Update cover image for the track when photos exist
  if (b.images.length > 0) {
    await query(
      `UPDATE tracks SET cover_image_url = $1 WHERE id = $2`,
      [b.images[0], b.track_id],
    );
  }

  // Return updated track stats for immediate UI refresh if needed
  const [stats] = await query(
    `
    SELECT
      t.id,
      CASE WHEN COUNT(r.*) = 0 THEN NULL ELSE ROUND(AVG(r.rating)::numeric, 2)::float8 END AS avg_rating,
      COUNT(r.*)::int AS review_count,
      t.cover_image_url
    FROM tracks t
    LEFT JOIN reviews r ON r.track_id = t.id
    WHERE t.id = $1
    GROUP BY t.id
    `,
    [b.track_id],
  );

  res.status(201).json({ review, track: stats });
});
