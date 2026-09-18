import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, X, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../components/ui/drawer';

import { useTracks } from '../hooks/useTracks';
import { useTrack } from '../hooks/useTrack';
import type { HikingTrackView } from '../domain/track';

// Fix Leaflet default marker icons in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapAutoResize() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => requestAnimationFrame(() => map.invalidateSize({ animate: false }));

    const t1 = window.setTimeout(invalidate, 0);
    const t2 = window.setTimeout(invalidate, 250);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => invalidate()) : null;
    if (ro) ro.observe(map.getContainer());

    window.addEventListener('orientationchange', invalidate);
    window.addEventListener('resize', invalidate);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (ro) ro.disconnect();
      window.removeEventListener('orientationchange', invalidate);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);

  return null;
}

function FitToGeometry({ track }: { track: HikingTrackView | null }) {
  const map = useMap();

  useEffect(() => {
    if (!track) return;

    if (track.geometry) {
      try {
        const layer = L.geoJSON(track.geometry as any);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.15), { animate: true, duration: 0.7 });
          return;
        }
      } catch {
        // fall back to start point
      }
    }

    if (track.coordinates) {
      map.flyTo(track.coordinates, Math.max(map.getZoom(), 11), { duration: 0.7 });
    }
  }, [track, map]);

  return null;
}

function ratingLabel(avg: number | null | undefined) {
  if (typeof avg !== 'number' || !Number.isFinite(avg)) return null;
  return avg.toFixed(1);
}

function ratingColor(avg: number | null | undefined) {
  if (typeof avg !== 'number' || !Number.isFinite(avg)) return '#e5e7eb'; // gray-200
  if (avg >= 4.5) return '#fbbf24'; // amber-400
  if (avg >= 4.0) return '#f59e0b'; // amber-500
  if (avg >= 3.0) return '#fde68a'; // amber-200
  return '#e5e7eb';
}

function markerSvg(opts: { fill: string; label: string | null; badgeFill: string }) {
  const { fill, label, badgeFill } = opts;
  const safeLabel = label ?? '';
  // A simple pin + badge.
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
  <path d="M18 45c8.5-11.3 13-18.9 13-26C31 8.7 25.2 3 18 3S5 8.7 5 19c0 7.1 4.5 14.7 13 26z" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
  <circle cx="18" cy="18" r="11" fill="${badgeFill}" stroke="#ffffff" stroke-width="2"/>
  <text x="18" y="22" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="11" font-weight="700" fill="#111827">${safeLabel}</text>
</svg>`;
}

function makeMarkerIcon(track: HikingTrackView, isSelected: boolean) {
  const fill = isSelected ? '#16a34a' : '#ef4444'; // green-600 / red-500
  const label = ratingLabel(track.avgRating);
  const badgeFill = isSelected ? '#86efac' : ratingColor(track.avgRating); // green-300 / rating
  const html = markerSvg({ fill, label, badgeFill });
  return L.divIcon({
    className: '',
    html,
    iconSize: [36, 46],
    iconAnchor: [18, 45],
    popupAnchor: [0, -40],
  });
}

const difficultyPills: Record<string, string> = {
  Easy: 'bg-green-100 text-green-700',
  Moderate: 'bg-yellow-100 text-yellow-700',
  Hard: 'bg-red-100 text-red-700',
};

type SortId = 'name-asc' | 'name-desc' | 'length-asc' | 'length-desc' | 'county-asc';

function TrackList({
  title,
  subtitle,
  tracks,
  loading,
  error,
  selectedId,
  searchQuery,
  onSearch,
  sortBy,
  onSort,
  onSelect,
  t,
  lang,
  showHeader = true,
}: {
  title: string;
  subtitle: string;
  tracks: HikingTrackView[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  searchQuery: string;
  onSearch: (v: string) => void;
  sortBy: SortId;
  onSort: (v: SortId) => void;
  onSelect: (id: string) => void;
  t: (k: string, vars?: any) => string;
  lang: 'et' | 'en';
  showHeader?: boolean;
}) {
  return (
    <div className="h-full flex flex-col">
      {showHeader && (
        <div className="p-4 border-b bg-white">
          <div className="font-semibold text-lg leading-tight">{title}</div>
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        </div>
      )}

      <div className="p-4 space-y-3 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
          <Input
            placeholder={t('map.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSort(e.target.value as SortId)}
          className="w-full border rounded-md px-3 py-2 text-sm bg-white"
          aria-label={t('filter.sortBy')}
        >
          <option value="name-asc">{t('filter.sort_name_asc')}</option>
          <option value="name-desc">{t('filter.sort_name_desc')}</option>
          <option value="length-asc">{t('filter.sort_length_asc')}</option>
          <option value="length-desc">{t('filter.sort_length_desc')}</option>
          <option value="county-asc">{t('filter.sort_county_asc')}</option>
        </select>
      </div>

      <ScrollArea className="flex-1 bg-gray-50">
        <div className="p-3 space-y-2">
          {loading && (
            <div className="text-center py-10 text-gray-500 text-sm">{t('app.loading')}</div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          {!loading && !tracks.length && (
            <div className="text-center py-10 text-gray-500 text-sm">{t('map.noTracks')}</div>
          )}

          {tracks.map((track) => {
            const isSelected = track.id === selectedId;
            const avg = ratingLabel(track.avgRating);
            return (
              <button
                key={track.id}
                onClick={() => onSelect(track.id)}
                className={
                  `w-full text-left p-3 rounded-xl border transition-all ` +
                  (isSelected
                    ? 'bg-green-50 border-green-400 shadow-sm'
                    : 'bg-white hover:shadow-md hover:scale-[1.01]')
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm leading-snug line-clamp-2">{track.name}</div>
                  {avg && (
                    <div className="flex items-center gap-1 text-yellow-600 flex-shrink-0">
                      <Star className="size-4 fill-current" />
                      <span className="text-xs font-semibold">{avg}</span>
                    </div>
                  )}
                </div>

                {track.location && (
                  <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                    <MapPin className="size-3" />
                    <span className="line-clamp-1">{track.location}</span>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {track.difficulty && (
                    <span
                      className={
                        `px-2 py-1 rounded-full text-[11px] ` +
                        (difficultyPills[track.difficulty] ?? 'bg-gray-100 text-gray-700')
                      }
                    >
                      {t(`difficulty.${track.difficulty}`)}
                    </span>
                  )}

                  {track.length != null && (
                    <span className="px-2 py-1 rounded-full text-[11px] bg-gray-100 text-gray-700">
                      {track.length} km
                    </span>
                  )}

                  {track.reviewCount > 0 && (
                    <span className="px-2 py-1 rounded-full text-[11px] bg-gray-100 text-gray-700">
                      {track.reviewCount}{' '}
                      {track.reviewCount === 1 ? t('track.review') : t('track.reviews')}
                    </span>
                  )}

                  {track.county && (
                    <span className="px-2 py-1 rounded-full text-[11px] bg-gray-100 text-gray-700">
                      {track.county}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export function MapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'et';

  const { data: tracks, loading, error } = useTracks(lang);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortId>('name-asc');

  const urlParams = new URLSearchParams(location.search);
  const trackId = urlParams.get('track');

  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((tr) => [tr.name, tr.location, tr.county, tr.description].some((s) => (s ?? '').toLowerCase().includes(q)));
  }, [tracks, searchQuery]);

  const sortedTracks = useMemo(() => {
    const list = [...filteredTracks];
    list.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, lang);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name, lang);
      if (sortBy === 'length-asc') return (a.length ?? Number.POSITIVE_INFINITY) - (b.length ?? Number.POSITIVE_INFINITY);
      if (sortBy === 'length-desc') return (b.length ?? Number.NEGATIVE_INFINITY) - (a.length ?? Number.NEGATIVE_INFINITY);
      if (sortBy === 'county-asc') {
        const c = (a.county ?? '').localeCompare(b.county ?? '', lang);
        if (c !== 0) return c;
        return a.name.localeCompare(b.name, lang);
      }
      return 0;
    });
    return list;
  }, [filteredTracks, sortBy, lang]);

  const selectedTrack = useMemo(() => {
    if (!trackId) return null;
    return tracks.find((tr) => tr.id === trackId) ?? null;
  }, [tracks, trackId]);

  const { data: selectedTrackDetail } = useTrack(trackId, lang);
  const effectiveSelected = selectedTrackDetail ?? selectedTrack;

  const onSelect = (id: string) => {
    navigate({ pathname: '/map', search: `?track=${encodeURIComponent(id)}` }, { replace: false });
  };

  const clearSelection = () => {
    navigate({ pathname: '/map', search: '' }, { replace: false });
  };

  const mapCenter: [number, number] = selectedTrack?.coordinates ?? [58.7, 25.0];

  const markerTracks = useMemo(() => {
    // Keep the map light if the dataset grows.
    return sortedTracks.filter((tr) => tr.coordinates).slice(0, 400);
  }, [sortedTracks]);

  const markerIcons = useMemo(() => {
    const m = new Map<string, L.DivIcon>();
    for (const tr of markerTracks) {
      m.set(tr.id, makeMarkerIcon(tr, tr.id === trackId));
    }
    return m;
  }, [markerTracks, trackId]);

  const title = t('map.allTrailsTitle');
  const subtitle = t('map.trailsInEstonia', { count: tracks.length });

  return (
    <div className="w-full flex overflow-hidden h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-[360px] bg-white border-r shadow-sm">
        <TrackList
          title={title}
          subtitle={subtitle}
          tracks={sortedTracks}
          loading={loading}
          error={error}
          selectedId={trackId}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          sortBy={sortBy}
          onSort={setSortBy}
          onSelect={onSelect}
          t={t}
          lang={lang}
        />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={selectedTrack ? 11 : 7}
          scrollWheelZoom
          zoomControl
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" maxZoom={19} />

          <MapAutoResize />
          <FitToGeometry track={effectiveSelected} />

          {effectiveSelected?.geometry ? (
            <GeoJSON
              key={effectiveSelected.id}
              data={effectiveSelected.geometry}
              pathOptions={{ weight: 4, opacity: 0.9, color: '#16a34a' }}
            />
          ) : null}

          {markerTracks.map((tr) => (
            <Marker
              key={tr.id}
              position={tr.coordinates as [number, number]}
              icon={markerIcons.get(tr.id)}
              eventHandlers={{
                click: () => onSelect(tr.id),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-semibold mb-1 text-sm">{tr.name}</div>
                  {tr.location && <div className="text-xs text-gray-600 mb-2">{tr.location}</div>}
                  <button
                    onClick={() => onSelect(tr.id)}
                    className="text-xs text-green-700 hover:underline"
                  >
                    {t('map.openDetails')}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Mobile: bottom sheet list */}
        <div className="lg:hidden absolute top-3 right-3 z-[1000]">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary" className="shadow bg-white/95 backdrop-blur">
                <List className="size-4 mr-2" />
                {t('map.openList')}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="pb-2">
                <DrawerTitle>{title}</DrawerTitle>
                <div className="text-xs text-gray-500">{subtitle}</div>
              </DrawerHeader>
              <div className="h-[75vh]">
                <TrackList
                  title={title}
                  subtitle={subtitle}
                  tracks={sortedTracks}
                  loading={loading}
                  error={error}
                  selectedId={trackId}
                  searchQuery={searchQuery}
                  onSearch={setSearchQuery}
                  sortBy={sortBy}
                  onSort={setSortBy}
                  onSelect={(id) => onSelect(id)}
                  t={t}
                  lang={lang}
                  showHeader={false}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Map legend */}
        <div className="absolute top-3 left-3 lg:left-auto lg:right-3 z-[500]">
          <div className="bg-white/95 backdrop-blur rounded-xl border shadow-sm px-3 py-2 text-xs">
            <div className="font-semibold text-sm mb-2">{t('map.legendTitle')}</div>
            <div className="space-y-1 text-gray-700">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                <span>{t('map.legendTrailLocation')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#16a34a' }} />
                <span>{t('map.legendSelectedTrail')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#fbbf24' }} />
                <span>{t('map.legendAverageRating')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected trail card */}
        {effectiveSelected && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[800] w-[min(860px,calc(100%-1.5rem))]">
            <div className="bg-white rounded-2xl border shadow-lg overflow-hidden">
              <div className="flex items-stretch">
                <div className="hidden sm:block w-56">
                  <img
                    src={effectiveSelected.image ?? `/api/tracks/${encodeURIComponent(effectiveSelected.id)}/preview.svg`}
                    alt={effectiveSelected.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold leading-tight">{effectiveSelected.name}</div>
                      {effectiveSelected.location && (
                        <div className="mt-1 text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="size-4" />
                          <span className="line-clamp-1">{effectiveSelected.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {ratingLabel(effectiveSelected.avgRating) && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="size-5 fill-current" />
                          <span className="font-semibold">{ratingLabel(effectiveSelected.avgRating)}</span>
                        </div>
                      )}
                      <button
                        onClick={clearSelection}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label={t('map.closeDetails')}
                      >
                        <X className="size-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {effectiveSelected.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{effectiveSelected.description}</p>
                  )}

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">{t('track.length')}</div>
                      <div className="font-medium">{effectiveSelected.length != null ? `${effectiveSelected.length} km` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">{t('track.duration')}</div>
                      <div className="font-medium">{effectiveSelected.duration ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">{t('map.difficulty')}</div>
                      <div className="font-medium">
                        {effectiveSelected.difficulty ? t(`difficulty.${effectiveSelected.difficulty}`) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">{t('track.elevation')}</div>
                      <div className="font-medium">{effectiveSelected.elevation != null ? `${effectiveSelected.elevation} m` : '—'}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {effectiveSelected.difficulty && (
                      <span className={`px-2 py-1 rounded-full text-[11px] ${difficultyPills[effectiveSelected.difficulty] ?? 'bg-gray-100 text-gray-700'}`}>
                        {t(`difficulty.${effectiveSelected.difficulty}`)}
                      </span>
                    )}
                    {effectiveSelected.environment && (
                      <span className="px-2 py-1 rounded-full text-[11px] bg-gray-100 text-gray-700">
                        {t(`environment.${effectiveSelected.environment}`)}
                      </span>
                    )}
                    {effectiveSelected.reviewCount > 0 && (
                      <span className="px-2 py-1 rounded-full text-[11px] bg-gray-100 text-gray-700">
                        {effectiveSelected.reviewCount}{' '}
                        {effectiveSelected.reviewCount === 1 ? t('track.review') : t('track.reviews')}
                      </span>
                    )}
                  </div>

                  {effectiveSelected.highlights?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {effectiveSelected.highlights.slice(0, 6).map((h) => (
                        <span key={h} className="px-2 py-1 rounded-full text-[11px] bg-green-50 text-green-700 border border-green-100">
                          {h}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attribution */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur rounded px-2 py-1 text-[10px] text-gray-600 shadow pointer-events-none">
          © OpenStreetMap
        </div>
      </div>
    </div>
  );
}
