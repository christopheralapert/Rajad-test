import { useEffect, useMemo, useState } from 'react';
import { fetchTracks } from '../api/tracks';
import { toTrackView, type HikingTrackView } from '../domain/track';
import { EVENTS } from '../lib/invalidate';

export function useTracks(lang: 'et' | 'en') {
  const [records, setRecords] = useState<HikingTrackView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchTracks();
        if (cancelled) return;
        console.log('Fetched tracks from API:', rows.length, rows);
        const transformed = rows.map((r) => toTrackView(r, lang));
        console.log('Transformed tracks:', transformed.length, transformed);
        setRecords(transformed);
      } catch (e: unknown) {
        if (cancelled) return;
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error('Error fetching tracks:', errorMsg);
        setError(errorMsg);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    const onInvalidate = () => run();
    window.addEventListener(EVENTS.tracks, onInvalidate);

    run();

    return () => {
      cancelled = true;
      window.removeEventListener(EVENTS.tracks, onInvalidate);
    };
  }, [lang]);

  const data = useMemo(() => records, [records]);
  return { data, loading, error };
}
