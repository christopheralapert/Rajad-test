import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';

export const tracksRouter = Router();

function geometryToSvg(geometry: any, opts?: { width?: number; height?: number }) {
  const width = opts?.width ?? 360;
  const height = opts?.height ?? 180;
  const padding = 12;

  const lines: Array<Array<[number, number]>> = [];

  if (geometry?.type === 'LineString' && Array.isArray(geometry.coordinates)) {
    lines.push(geometry.coordinates as Array<[number, number]>);
  } else if (geometry?.type === 'MultiLineString' && Array.isArray(geometry.coordinates)) {
    for (const part of geometry.coordinates) {
      if (Array.isArray(part)) lines.push(part as Array<[number, number]>);
    }
  }

  const pts = lines.flat();
  if (!pts.length) {
    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="100%" height="100%" fill="#f3f4f6"/>` +
      `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="12" fill="#6b7280">No geometry</text>` +
      `</svg>`
    );
  }

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;

  const scaleX = (width - 2 * padding) / dx;
  const scaleY = (height - 2 * padding) / dy;
  const scale = Math.min(scaleX, scaleY);

  const drawnW = dx * scale;
  const drawnH = dy * scale;
  const offsetX = (width - drawnW) / 2;
  const offsetY = (height - drawnH) / 2;

  function mapPoint([x, y]: [number, number]) {
    const px = offsetX + (x - minX) * scale;
    const py = offsetY + (maxY - y) * scale; // invert Y
    return [px, py] as const;
  }

  const paths = lines
    .filter((l) => l.length >= 2)
    .map((l) => {
      const d = l
        .map((pt, i) => {
          const [px, py] = mapPoint(pt);
          return `${i === 0 ? 'M' : 'L'}${px.toFixed(2)} ${py.toFixed(2)}`;
        })
        .join(' ');
      return `<path d="${d}" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="#f3f4f6"/>` +
    `<g>${paths}</g>` +
    `</svg>`
  );
}

tracksRouter.get('/:id/preview.svg', async (req, res) => {
  const schema = z.object({ id: z.string().min(1) });
  const parsed = schema.safeParse(req.params);
  if (!parsed.success) return res.status(400).send('Invalid id');

  const [row] = await query(
    `
    SELECT CASE WHEN geom IS NULL THEN NULL ELSE (ST_AsGeoJSON(geom)::json) END AS geometry_geojson
    FROM tracks
    WHERE id = $1
    `,
    [parsed.data.id],
  );

  if (!row) return res.status(404).send('Not found');

  const svg = geometryToSvg(row.geometry_geojson);
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

tracksRouter.get('/', async (_req, res) => {
  const rows = await query(
    `
    WITH stats AS (
      SELECT
        track_id,
        CASE WHEN COUNT(*) = 0 THEN NULL ELSE ROUND(AVG(rating)::numeric, 2)::float8 END AS avg_rating,
        COUNT(*)::int AS review_count
      FROM reviews
      GROUP BY track_id
    )
    SELECT
      t.id,
      t.source,
      t.source_id,
      t.name_et,
      t.name_en,
      t.county_et,
      t.county_en,
      t.municipality_et,
      t.municipality_en,
      t.location_et,
      t.location_en,
      t.description_et,
      t.description_en,
      t.length_km::float8 AS length_km,
      t.duration,
      t.difficulty,
      t.steepness,
      t.environment,
      t.image_url,
      t.cover_image_url,
      COALESCE(t.cover_image_url, li.latest_image, t.image_url, '/api/tracks/' || t.id::text || '/preview.svg') AS display_image_url,
      t.elevation_m::float8 AS elevation_m,
      t.highlights_et,
      t.highlights_en,
      CASE WHEN t.start_point IS NULL THEN NULL ELSE ST_Y(t.start_point) END AS start_lat,
      CASE WHEN t.start_point IS NULL THEN NULL ELSE ST_X(t.start_point) END AS start_lng,
      t.featured,
      s.avg_rating,
      COALESCE(s.review_count, 0)::int AS review_count
    FROM tracks t
    LEFT JOIN stats s ON s.track_id = t.id
    LEFT JOIN LATERAL (
      SELECT r.images[1] AS latest_image
      FROM reviews r
      WHERE r.track_id = t.id AND array_length(r.images, 1) >= 1
      ORDER BY r.created_at DESC
      LIMIT 1
    ) li ON true
    ORDER BY t.name_et ASC
    `,
  );

  // Keep backwards compatibility: many front-end components expect `image_url`
  const out = rows.map((r: any) => ({ ...r, image_url: r.display_image_url }));
  res.json(out);
});

tracksRouter.get('/:id', async (req, res) => {
  const schema = z.object({ id: z.string().min(1) });
  const parsed = schema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid id' });

  const [row] = await query(
    `
    WITH stats AS (
      SELECT
        track_id,
        CASE WHEN COUNT(*) = 0 THEN NULL ELSE ROUND(AVG(rating)::numeric, 2)::float8 END AS avg_rating,
        COUNT(*)::int AS review_count
      FROM reviews
      WHERE track_id = $1
      GROUP BY track_id
    )
    SELECT
      t.id,
      t.source,
      t.source_id,
      t.name_et,
      t.name_en,
      t.county_et,
      t.county_en,
      t.municipality_et,
      t.municipality_en,
      t.location_et,
      t.location_en,
      t.description_et,
      t.description_en,
      t.length_km::float8 AS length_km,
      t.duration,
      t.difficulty,
      t.steepness,
      t.environment,
      t.image_url,
      t.cover_image_url,
      COALESCE(t.cover_image_url, li.latest_image, t.image_url, '/api/tracks/' || t.id::text || '/preview.svg') AS display_image_url,
      t.elevation_m::float8 AS elevation_m,
      t.highlights_et,
      t.highlights_en,
      CASE WHEN t.start_point IS NULL THEN NULL ELSE ST_Y(t.start_point) END AS start_lat,
      CASE WHEN t.start_point IS NULL THEN NULL ELSE ST_X(t.start_point) END AS start_lng,
      t.featured,
      COALESCE(s.avg_rating, NULL) AS avg_rating,
      COALESCE(s.review_count, 0)::int AS review_count,
      CASE WHEN t.geom IS NULL THEN NULL ELSE (ST_AsGeoJSON(t.geom)::json) END AS geometry_geojson
    FROM tracks t
    LEFT JOIN stats s ON s.track_id = t.id
    LEFT JOIN LATERAL (
      SELECT r.images[1] AS latest_image
      FROM reviews r
      WHERE r.track_id = t.id AND array_length(r.images, 1) >= 1
      ORDER BY r.created_at DESC
      LIMIT 1
    ) li ON true
    WHERE t.id = $1
    `,
    [parsed.data.id],
  );

  if (!row) return res.status(404).json({ error: 'Not found' });

  const out = { ...row, image_url: (row as any).display_image_url };
  res.json(out);
});
