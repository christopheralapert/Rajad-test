-- Estonia hiking trails database schema (PostgreSQL + PostGIS)

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- provenance
  source text NOT NULL,
  source_id text,

  -- bilingual metadata
  name_et text NOT NULL,
  name_en text NOT NULL,
  -- County/municipality (useful for sorting & filtering)
  county_et text,
  county_en text,
  municipality_et text,
  municipality_en text,
  location_et text,
  location_en text,
  description_et text,
  description_en text,

  length_km numeric,
  duration text,

  difficulty text CHECK (difficulty IS NULL OR difficulty IN ('Easy','Moderate','Hard')),
  steepness text CHECK (steepness IS NULL OR steepness IN ('Flat','Gentle','Moderate','Steep')),
  environment text CHECK (environment IS NULL OR environment IN ('Forest','Coastal','Bog','Mixed','Urban')),

  -- Optional image from the source (e.g., official)
  image_url text,
  -- User-generated cover image (updated from latest reviews with photos)
  cover_image_url text,

  elevation_m numeric,

  highlights_et text[],
  highlights_en text[],

  -- geometry
  start_point geometry(Point, 4326),
  geom geometry(Geometry, 4326),

  raw_props jsonb,

  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backward-compatible migrations for existing databases
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS county_et text;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS county_en text;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS municipality_et text;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS municipality_en text;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Ensure image_url is always set to a track-specific preview by default.
CREATE OR REPLACE FUNCTION set_track_defaults()
RETURNS trigger AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  IF NEW.image_url IS NULL OR btrim(NEW.image_url) = '' THEN
    NEW.image_url := '/api/tracks/' || NEW.id::text || '/preview.svg';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_tracks_defaults') THEN
    CREATE TRIGGER set_tracks_defaults
    BEFORE INSERT ON tracks
    FOR EACH ROW EXECUTE FUNCTION set_track_defaults();
  END IF;
END$$;

-- One source can provide a stable external id; use it for upserts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'tracks_source_source_id_uq'
  ) THEN
    CREATE UNIQUE INDEX tracks_source_source_id_uq ON tracks (source, source_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'tracks_geom_gix'
  ) THEN
    CREATE INDEX tracks_geom_gix ON tracks USING gist (geom);
  END IF;
END$$;

-- Reviews (user feedback)
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  difficulty text CHECK (difficulty IS NULL OR difficulty IN ('Easier','As Expected','Harder')),
  conditions text,
  terrain_type text CHECK (terrain_type IS NULL OR terrain_type IN ('Forest','Coastal','Bog','Mixed','Urban','Mountain')),
  trail_surface text CHECK (trail_surface IS NULL OR trail_surface IN ('Paved','Gravel','Dirt','Rocky','Boardwalk','Mixed')),
  accessibility text CHECK (accessibility IS NULL OR accessibility IN ('Easy','Moderate','Difficult','Very Difficult')),
  best_season text CHECK (best_season IS NULL OR best_season IN ('Spring','Summer','Autumn','Winter','Year-round')),
  images text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add new columns if they don't exist (for existing databases)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS terrain_type text CHECK (terrain_type IS NULL OR terrain_type IN ('Forest','Coastal','Bog','Mixed','Urban','Mountain'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS trail_surface text CHECK (trail_surface IS NULL OR trail_surface IN ('Paved','Gravel','Dirt','Rocky','Boardwalk','Mixed'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS accessibility text CHECK (accessibility IS NULL OR accessibility IN ('Easy','Moderate','Difficult','Very Difficult'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS best_season text CHECK (best_season IS NULL OR best_season IN ('Spring','Summer','Autumn','Winter','Year-round'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'reviews_track_id_idx'
  ) THEN
    CREATE INDEX reviews_track_id_idx ON reviews (track_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'reviews_rating_idx'
  ) THEN
    CREATE INDEX reviews_rating_idx ON reviews (rating);
  END IF;
END$$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_tracks_updated_at') THEN
    CREATE TRIGGER set_tracks_updated_at
    BEFORE UPDATE ON tracks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;
