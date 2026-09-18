import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, MessageSquare, Mountain, Star, Users } from 'lucide-react';
import { TrackCard } from '../components/TrackCard';
import { FeedbackCard } from '../components/FeedbackCard';
import { useTranslation } from 'react-i18next';
import { useTracks } from '../hooks/useTracks';
import { fetchReviews, fetchReviewStats, type ReviewRecord } from '../api/reviews';

export function HomePage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'et';
  const { data: tracks, loading, error } = useTracks(lang);

  // Use Vite's BASE_URL to properly reference public assets when deployed in a subfolder
  const base = import.meta.env.BASE_URL;
  const heroImg = `${base}images/hero.jpg`;
  const heroVideo = `${base}video/hero.mp4`;

  useEffect(() => {
    if (error) {
      console.error('Error loading tracks:', error);
    }
    if (tracks.length > 0) {
      console.log('Tracks loaded:', tracks.length, tracks.slice(0, 2));
    }
  }, [tracks, error]);

  const [stats, setStats] = useState<{ review_count: number; avg_rating: number | null }>({ review_count: 0, avg_rating: null });
  const [recentFiveStar, setRecentFiveStar] = useState<ReviewRecord[]>([]);

  useEffect(() => {
    fetchReviewStats()
      .then(setStats)
      .catch(() => setStats({ review_count: 0, avg_rating: null }));

    // 3 cards matches the intended homepage layout.
    fetchReviews({ rating: 5, random: true, limit: 3 })
      .then(setRecentFiveStar)
      .catch(() => setRecentFiveStar([]));
  }, []);

  const featuredTracks = useMemo(() => {
    const featured = tracks.filter((t) => t.featured).slice(0, 4);
    // Fallback to showing first 4 tracks if no featured tracks
    return featured.length > 0 ? featured : tracks.slice(0, 4);
  }, [tracks]);
  const trackById = useMemo(() => new Map(tracks.map((tr) => [tr.id, tr])), [tracks]);

  return (
    <div className="min-h-screen">
      {/* Hero with video background */}
      <div className="relative">
        <div className="relative overflow-hidden min-h-[52vh] md:min-h-[68vh]">
          <video
            className="absolute inset-0 w-full h-full object-cover object-[50%_30%]"
            autoPlay
            muted
            loop
            playsInline
            poster={heroImg}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/70 via-emerald-900/55 to-emerald-900/35" />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-16 lg:py-20 text-white">
            <div className="max-w-3xl rounded-2xl bg-emerald-950/45 backdrop-blur-sm p-6 sm:p-8">
              <h1 className="text-4xl sm:text-5xl font-semibold leading-tight mb-3">{t('home.heroTitle')}</h1>
              <p className="text-white/90 text-lg mb-6">{t('home.heroSubtitle')}</p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/map"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white text-green-800 rounded-lg hover:bg-green-50 transition-colors"
                >
                  {t('home.exploreMap')}
                </Link>

                <Link
                  to="/filter"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                >
                  <Compass className="size-5" />
                  {t('home.findYourTrail')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 lg:-mt-10 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/95 backdrop-blur rounded-lg border p-5 shadow-sm">
              <Mountain className="size-6 text-green-600 mb-2" />
              <div className="text-3xl leading-none">{loading ? '…' : tracks.length}</div>
              <div className="text-gray-500 text-sm mt-1">{t('home.statsTrails')}</div>
            </div>
            <div className="bg-white/95 backdrop-blur rounded-lg border p-5 shadow-sm">
              <Users className="size-6 text-green-600 mb-2" />
              <div className="text-3xl leading-none">{stats.review_count}</div>
              <div className="text-gray-500 text-sm mt-1">{t('home.statsReviews')}</div>
            </div>
            <div className="bg-white/95 backdrop-blur rounded-lg border p-5 shadow-sm">
              <Star className="size-6 text-green-600 mb-2" />
              <div className="text-3xl leading-none">{stats.avg_rating != null ? stats.avg_rating.toFixed(1) : '—'}</div>
              <div className="text-gray-500 text-sm mt-1">{t('home.statsAvgRating')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{t('home.errorLoading')} {error}</p>
          </div>
        )}
        
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl mb-1">{t('home.featuredTitle')}</h2>
            <p className="text-gray-600">{t('home.featuredSubtitle')}</p>
          </div>
          <Link to="/filter" className="text-green-700 hover:underline">
            {t('home.viewAll')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-8 text-gray-500">{t('app.loading')}</div>
          ) : featuredTracks.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500">{t('home.noTracks')}</div>
          ) : (
            featuredTracks.map((track) => (
              <TrackCard key={track.id} track={track} showViewOnMap />
            ))
          )}
        </div>
      </div>

      {/* Recent reviews */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl mb-1">{t('home.recentTitle')}</h2>
              <p className="text-gray-600">{t('home.recentSubtitle')}</p>
            </div>
            <Link to="/feedback" className="text-green-700 hover:underline">
              {t('home.viewAllReviews')}
            </Link>
          </div>

          {recentFiveStar.length === 0 ? (
            <div className="bg-white rounded-lg border p-12 text-center">
              <MessageSquare className="size-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">{t('feedback.noFeedbackTitle')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('feedback.noFeedbackSubtitle')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentFiveStar.map((fb) => {
                const track = trackById.get(fb.track_id);
                return (
                  <div key={fb.id}>
                    {track && <div className="mb-2 text-sm text-green-600">{track.name}</div>}
                    <FeedbackCard feedback={fb} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
