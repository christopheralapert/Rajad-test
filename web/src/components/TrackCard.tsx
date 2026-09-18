import { MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { HikingTrackView } from '../domain/track';

interface TrackCardProps {
  track: HikingTrackView;
  showViewOnMap?: boolean;
}

export function TrackCard({ track, showViewOnMap = false }: TrackCardProps) {
  const { t } = useTranslation();

  const avg = typeof track.avgRating === 'number' ? track.avgRating : null;
  const avgLabel = avg != null ? avg.toFixed(1) : null;

  const difficultyColors: Record<string, string> = {
    Easy: 'bg-green-100 text-green-700',
    Moderate: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <img
          src={track.image ?? `/api/tracks/${encodeURIComponent(track.id)}/preview.svg`}
          alt={track.name}
          className="w-full h-full object-cover"
        />
        {track.featured && (
          <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
            {t('track.featured')}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold">{track.name}</h3>
          {avgLabel && (
            <div className="flex items-center gap-1 text-yellow-600 flex-shrink-0">
              <Star className="size-4 fill-current" />
              <span className="text-sm">{avgLabel}</span>
            </div>
          )}
        </div>

        {track.location && (
          <div className="flex items-center gap-1 text-gray-600 text-sm mb-3">
            <MapPin className="size-4" />
            <span>{track.location}</span>
          </div>
        )}

        {track.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{track.description}</p>}

        <div className="flex flex-wrap gap-2 mb-4">
          {track.difficulty && (
            <span
              className={`px-2 py-1 rounded text-xs ${
                difficultyColors[track.difficulty] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {t(`difficulty.${track.difficulty}`)}
            </span>
          )}
          {track.environment && (
            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">{t(`environment.${track.environment}`)}</span>
          )}
          {track.county && (
            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">{track.county}</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm mb-4">
          <div>
            <div className="text-gray-500">{t('track.length')}</div>
            <div>{track.length != null ? `${track.length} km` : '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('track.duration')}</div>
            <div>{track.duration ?? '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('track.elevation')}</div>
            <div>{track.elevation != null ? `${track.elevation} m` : '—'}</div>
          </div>
        </div>

        {track.reviewCount > 0 && (
          <div className="border-t pt-3 mb-3">
            <div className="text-sm text-gray-600">
              {track.reviewCount} {track.reviewCount === 1 ? t('track.review') : t('track.reviews')}
            </div>
          </div>
        )}

        {showViewOnMap && (
          <Link
            to={`/map?track=${track.id}`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <MapPin className="size-4" />
            {t('track.viewOnMap')}
          </Link>
        )}
      </div>
    </div>
  );
}
