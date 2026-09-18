import { useEffect, useState } from 'react';
import { fetchTrack } from '../api/tracks';
import { toTrackViewDetail, type HikingTrackView } from '../domain/track';
import { EVENTS } from '../lib/invalidate';

export function useTrack(id: string | null, lang: 'et' | 'en') {
  const [data, setData] = useState<HikingTrackView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const record = await fetchTrack(id);
        if (cancelled) return;
        setData(toTrackViewDetail(record, lang));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Failed to load track');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const onInvalidate = (ev: Event) => {
      const detail = (ev as CustomEvent<any>).detail;
      if (!id) return;
      if (detail?.id === id) run();
    };

    window.addEventListener(EVENTS.track, onInvalidate as any);
    run();

    return () => {
      cancelled = true;
      window.removeEventListener(EVENTS.track, onInvalidate as any);
    };
  }, [id, lang]);

  return { data, loading, error };
}
