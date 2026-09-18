import { useEffect, useMemo, useState } from 'react';
import { TrackCard } from '../components/TrackCard';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { useTracks } from '../hooks/useTracks';
import { filterAndSortTracks, type TrackSortOption } from './filterUtils';

export function FilterPage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'et';
  const { data: tracks, loading, error } = useTracks(lang);

  const [searchQuery, setSearchQuery] = useState('');
  const [lengthRange, setLengthRange] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState<TrackSortOption>('name-asc');

  const maxLength = useMemo(() => {
    const vals = tracks.map((t) => t.length).filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    if (!vals.length) return 100;
    const max = Math.max(...vals);
    return Math.max(100, Math.min(400, Math.ceil(max / 10) * 10));
  }, [tracks]);

  useEffect(() => {
    if (lengthRange[1] === 100 && maxLength > 100) {
      setLengthRange([0, maxLength]);
    }
  }, [maxLength, lengthRange]);

  const filteredTracks = useMemo(() => {
    return filterAndSortTracks(tracks, searchQuery, lengthRange, sortBy, lang);
  }, [tracks, searchQuery, lengthRange, sortBy, lang]);

  const clearFilters = () => {
    setSearchQuery('');
    setLengthRange([0, maxLength]);
    setSortBy('name-asc');
  };

  const activeFiltersCount = (searchQuery ? 1 : 0) + (lengthRange[0] !== 0 || lengthRange[1] !== maxLength ? 1 : 0);
  const resultsLabel = filteredTracks.length === 1
    ? t('filter.resultsFoundOne', { count: filteredTracks.length })
    : t('filter.resultsFound', { count: filteredTracks.length });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('filter.title')}</h1>
          <p className="text-gray-600">{t('filter.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-5 text-gray-600" />
                  <h2 className="font-semibold">{t('filter.filters')}</h2>
                </div>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="text-sm text-green-600 hover:text-green-700">
                    {t('filter.clear')} ({activeFiltersCount})
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <Label className="mb-2">{t('filter.search')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('filter.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Length */}
              <div className="mb-6">
                <Label className="mb-2">
                  {t('filter.trailLength')}: {lengthRange[0]} - {lengthRange[1]} km
                </Label>
                <Slider
                  min={0}
                  max={maxLength}
                  step={0.5}
                  value={lengthRange}
                  onValueChange={(value) => setLengthRange(value as [number, number])}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="text-gray-600 text-sm">
                {loading ? t('app.loading') : resultsLabel}
                {error && <span className="ml-2 text-red-700">({error})</span>}
              </div>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder={t('filter.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">{t('filter.sort_name_asc')}</SelectItem>
                  <SelectItem value="name-desc">{t('filter.sort_name_desc')}</SelectItem>
                  <SelectItem value="length-asc">{t('filter.sort_length_asc')}</SelectItem>
                  <SelectItem value="length-desc">{t('filter.sort_length_desc')}</SelectItem>
                  <SelectItem value="county-asc">{t('filter.sort_county_asc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!filteredTracks.length && !loading ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <p className="text-gray-600 mb-4">{t('filter.noResults')}</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {t('filter.clearFilters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTracks.map((track) => (
                  <TrackCard key={track.id} track={track} showViewOnMap />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
