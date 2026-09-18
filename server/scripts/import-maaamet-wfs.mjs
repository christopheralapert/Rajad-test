import 'dotenv/config';
import pg from 'pg';
import crypto from 'node:crypto';

import { VERIFIED_TRAIL_LAYERS } from '../src/verified-trail-layers.mjs';

const { Client } = pg;

const WFS_ENDPOINT = process.env.MAAAMET_POI_WFS || 'https://teenus.maaamet.ee/ows/huviobjektid-poi';

const VERIFIED_TYPENAMES = VERIFIED_TRAIL_LAYERS.map((x) => x.typeName);

const TYPE_NAMES = (process.env.MAAAMET_POI_TYPENAMES || VERIFIED_TYPENAMES.join(','))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOW_UNVERIFIED = String(process.env.ALLOW_UNVERIFIED_LAYERS || '').toLowerCase() === 'true' ||
  String(process.env.ALLOW_UNVERIFIED_LAYERS || '') === '1';

const unverified = TYPE_NAMES.filter((t) => !VERIFIED_TYPENAMES.includes(t));
if (unverified.length && !ALLOW_UNVERIFIED) {
  console.error(
    `Refusing to import unverified layer(s): ${unverified.join(', ')}\n` +
      `Add them to server/src/verified-trail-layers.mjs or set ALLOW_UNVERIFIED_LAYERS=true to override.`,
  );
  process.exit(1);
}

const OUTPUT_FORMAT = 'application/json; subtype=geojson';
const PAGE_SIZE = Number(process.env.WFS_PAGE_SIZE || 5000);

// Maa-amet POI WFS layers may return geometry in EPSG:3301 (L-EST97, metres)
// even when requesting EPSG:4326. Detect by coordinate magnitude.
function detectInputSrid(geometry) {
  try {
    if (!geometry) return 4326;
    const { type, coordinates } = geometry;
    const first =
      type === 'LineString'
        ? coordinates?.[0]
        : type === 'MultiLineString'
          ? coordinates?.[0]?.[0]
          : null;
    if (!Array.isArray(first) || first.length < 2) return 4326;
    const [x, y] = first;
    // If outside lon/lat bounds, assume projected coords (EPSG:3301)
    if (Math.abs(x) > 180 || Math.abs(y) > 90) return 3301;
    return 4326;
  } catch {
    return 4326;
  }
}

// Some WFS/GeoJSON responses may come with axis order swapped (lat,lon instead of lon,lat)
// when using EPSG:4326. Detect Estonia-like ranges and swap coordinates.
function normalizeAxisOrder4326(geometry) {
  if (!geometry) return geometry;
  const swapNeeded = (coord) => {
    if (!Array.isArray(coord) || coord.length < 2) return false;
    const [x, y] = coord;
    // Estonia roughly: lon ~ 21..29, lat ~ 57..60
    // Swapped would look like: x ~ 57..60, y ~ 21..29
    return x >= 50 && x <= 70 && y >= 10 && y <= 40;
  };

  const swap = (coord) => [coord[1], coord[0], ...coord.slice(2)];

  const walk = (obj) => {
    if (!obj) return obj;
    if (obj.type === 'LineString') {
      if (swapNeeded(obj.coordinates?.[0])) {
        return { ...obj, coordinates: obj.coordinates.map(swap) };
      }
      return obj;
    }
    if (obj.type === 'MultiLineString') {
      const first = obj.coordinates?.[0]?.[0];
      if (swapNeeded(first)) {
        return { ...obj, coordinates: obj.coordinates.map((line) => line.map(swap)) };
      }
      return obj;
    }
    if (obj.type === 'GeometryCollection') {
      return { ...obj, geometries: (obj.geometries || []).map(walk) };
    }
    return obj;
  };

  return walk(geometry);
}

function pick(props, keys) {
  for (const k of keys) {
    if (props && props[k] != null && String(props[k]).trim() !== '') return props[k];
  }
  return null;
}

function stableId(typename, feature) {
  const p = feature?.properties || {};
  const raw =
    pick(p, ['tunnus', 'TUNNUS', 'objectid', 'OBJECTID', 'id', 'ID', 'fid', 'FID']) ??
    feature?.id;
  if (raw != null) return `${typename}:${raw}`;
  // fallback: hash geometry + name
  const h = crypto
    .createHash('sha1')
    .update(JSON.stringify(feature?.geometry || {}))
    .update(String(pick(p, ['nimi', 'NIMI', 'name', 'NAME']) || ''))
    .digest('hex');
  return `${typename}:${h}`;
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  console.log(`Importing from WFS: ${WFS_ENDPOINT}`);
  console.log(`TypeNames: ${TYPE_NAMES.join(', ')}`);

  for (const typename of TYPE_NAMES) {
    console.log(`\n==> ${typename}`);

    let startIndex = 0;
    let total = 0;

    try {
      while (true) {
        const url = new URL(WFS_ENDPOINT);
        url.searchParams.set('service', 'WFS');
        url.searchParams.set('version', '2.0.0');
        url.searchParams.set('request', 'GetFeature');
        url.searchParams.set('typeNames', typename);
        // Requesting EPSG:4326 is convenient for GeoJSON, but some layers may still
        // respond in EPSG:3301. We detect and transform on insert.
        url.searchParams.set('srsName', process.env.MAAAMET_SRS || 'EPSG:3301');
        url.searchParams.set('outputFormat', OUTPUT_FORMAT);
        url.searchParams.set('count', String(PAGE_SIZE));
        url.searchParams.set('startIndex', String(startIndex));

        const resp = await fetch(url.toString(), { headers: { 'User-Agent': 'rajad-webapp/1.0' } });
        if (!resp.ok) {
          throw new Error(`WFS request failed (${resp.status}): ${resp.statusText}`);
        }

        const data = await resp.json();
        const features = Array.isArray(data?.features) ? data.features : [];
        if (!features.length) break;

        for (const f of features) {
          const props = f?.properties || {};
          const sourceId = stableId(typename, f);

          const nameEt = String(pick(props, ['nimi', 'NIMI', 'name', 'NAME']) || sourceId);
          const nameEn = String(pick(props, ['name_en', 'NAME_EN', 'nimi_en', 'NIMI_EN']) || nameEt);

          const maakond = pick(props, ['maakond', 'MAAKOND']);
          const omavalitsus = pick(props, ['omavalitsus', 'OMAVALITSUS']);
          const locationEt = [maakond, omavalitsus].filter(Boolean).join(', ') || null;
          const locationEn = locationEt; // No official EN fields in most POI layers

          const descriptionEt = pick(props, ['kirjeldus', 'KIRJELDUS', 'info', 'INFO']);
          const descriptionEn = null;

          const fixedGeometry = (() => {
            const g = f?.geometry ?? null;
            if (!g) return null;
            const srid = detectInputSrid(g);
            if (srid === 4326) return normalizeAxisOrder4326(g);
            return g;
          })();

          const geomJson = fixedGeometry ? JSON.stringify(fixedGeometry) : null;
          const inputSrid = detectInputSrid(fixedGeometry);
          const rawProps = JSON.stringify({ typename, ...props });

          await client.query(
          `
          WITH g AS (
            SELECT
              CASE WHEN $13::text IS NULL THEN NULL
                ELSE ST_CollectionExtract(
                  ST_MakeValid(
                    ST_SetSRID(ST_GeomFromGeoJSON($13::text), $14::int)
                  ),
                  2
                )
              END AS g_in
          )
          INSERT INTO tracks (
            source,
            source_id,
            name_et,
            name_en,
            county_et,
            county_en,
            municipality_et,
            municipality_en,
            location_et,
            location_en,
            description_et,
            description_en,
            length_km,
            start_point,
            geom,
            raw_props
          )
          SELECT
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            CASE WHEN g_in IS NULL THEN NULL ELSE ROUND((ST_Length(ST_Transform(g_in, 4326)::geography) / 1000)::numeric, 2) END,
            CASE WHEN g_in IS NULL THEN NULL ELSE ST_StartPoint(ST_GeometryN(ST_LineMerge(ST_Transform(g_in, 4326)), 1)) END,
            CASE WHEN g_in IS NULL THEN NULL ELSE ST_Transform(g_in, 4326) END,
            $15::jsonb
          FROM g
          ON CONFLICT (source, source_id)
          DO UPDATE SET
            name_et = EXCLUDED.name_et,
            name_en = EXCLUDED.name_en,
            county_et = EXCLUDED.county_et,
            county_en = EXCLUDED.county_en,
            municipality_et = EXCLUDED.municipality_et,
            municipality_en = EXCLUDED.municipality_en,
            location_et = EXCLUDED.location_et,
            location_en = EXCLUDED.location_en,
            description_et = EXCLUDED.description_et,
            description_en = EXCLUDED.description_en,
            length_km = EXCLUDED.length_km,
            start_point = EXCLUDED.start_point,
            geom = EXCLUDED.geom,
            raw_props = EXCLUDED.raw_props;
          `,
          [
            'maaamet_poi_wfs',
            sourceId,
            nameEt,
            nameEn,
            maakond ?? null,
            maakond ?? null,
            omavalitsus ?? null,
            omavalitsus ?? null,
            locationEt,
            locationEn,
            descriptionEt,
            descriptionEn,
            geomJson,
            inputSrid,
            rawProps,
          ],
          );
          total += 1;
        }

        startIndex += features.length;
        console.log(`  +${features.length} (total ${total})`);

        // If the server returns fewer than requested, we likely reached the end.
        if (features.length < PAGE_SIZE) break;
      }

      console.log(`  ✅ Imported ${total} feature(s) from ${typename}`);
    } catch (err) {
      console.error(`  ❌ Failed to import ${typename}:`, err?.message || err);
      console.error('     (Tip: check the layer typeName and WFS endpoint in server/.env)');
    }
  }

  console.log('\n✅ Import finished');
} finally {
  await client.end();
}
