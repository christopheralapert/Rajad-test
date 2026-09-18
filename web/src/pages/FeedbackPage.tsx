import { useEffect, useMemo, useRef, useState } from 'react';
import { FeedbackCard } from '../components/FeedbackCard';
import { Star, Upload, X, MessageSquare, Plus } from 'lucide-react';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTracks } from '../hooks/useTracks';
import { createReview, fetchReviews, uploadImage, type DifficultyCompared, type ReviewRecord } from '../api/reviews';
import { invalidateReviews, invalidateTrack, invalidateTracks } from '../lib/invalidate';

type ImageItem = { id: string; file: File; previewUrl: string };

export function FeedbackPage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'et';
  const { data: tracks } = useTracks(lang);

  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyCompared>('As Expected');
  const [conditions, setConditions] = useState('');
  const [terrainType, setTerrainType] = useState('');
  const [trailSurface, setTrailSurface] = useState('');
  const [accessibility, setAccessibility] = useState('');
  const [bestSeason, setBestSeason] = useState('');

  const [images, setImages] = useState<ImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [filterTrackId, setFilterTrackId] = useState<string>('all');
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReviews({ trackId: filterTrackId === 'all' ? undefined : filterTrackId, limit: 100 });
      setReviews(data);
    } catch (e: any) {
      setError(e?.message ?? t('feedback.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTrackId]);

  useEffect(() => {
    const onInvalidate = () => load();
    window.addEventListener('rajad:reviews:invalidate', onInvalidate);
    return () => window.removeEventListener('rajad:reviews:invalidate', onInvalidate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTrackId]);

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;

    setImages((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (next.length >= 10) break;
        next.push({ id: `${Date.now()}-${Math.random()}`, file, previewUrl: URL.createObjectURL(file) });
      }
      return next;
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleAddFiles(e.target.files);
    // allow selecting the same file again
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((x) => x.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTrackId || !userName || rating === 0 || !comment || !conditions) {
      toast.error(t('feedback.requiredError'));
      return;
    }

    const trackId = selectedTrackId;

    try {
      const uploaded: string[] = [];
      for (const img of images) {
        const url = await uploadImage(img.file);
        uploaded.push(url);
      }

      await createReview({
        track_id: trackId,
        user_name: userName,
        rating,
        comment,
        difficulty,
        conditions,
        terrain_type: terrainType || null,
        trail_surface: trailSurface || null,
        accessibility: accessibility || null,
        best_season: bestSeason || null,
        images: uploaded,
      });

      // Reset
      setSelectedTrackId('');
      setUserName('');
      setTerrainType('');
      setTrailSurface('');
      setAccessibility('');
      setBestSeason('');
      setRating(0);
      setComment('');
      setDifficulty('As Expected');
      setConditions('');
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setImages([]);

      // Live UI updates
      invalidateReviews();
      invalidateTracks();
      invalidateTrack(trackId);

      toast.success(t('feedback.thanks'));
    } catch (err: any) {
      toast.error(err?.message ?? t('feedback.submitError'));
    }
  };

  const trackById = useMemo(() => new Map(tracks.map((tr) => [tr.id, tr])), [tracks]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">{t('feedback.title')}</h1>
          <p className="text-gray-600">{t('feedback.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-20">
              <h2 className="text-xl mb-6 flex items-center gap-2">
                <MessageSquare className="size-5" />
                {t('feedback.formTitle')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="track">{t('feedback.trail')} *</Label>
                  <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                    <SelectTrigger id="track">
                      <SelectValue placeholder={t('feedback.selectTrail')} />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="userName">{t('feedback.yourName')} *</Label>
                  <Input
                    id="userName"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder={t('feedback.namePlaceholder')}
                  />
                </div>

                <div>
                  <Label>{t('feedback.rating')} *</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                        <Star
                          className={`size-8 transition-colors ${
                            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="difficulty">{t('feedback.difficultyCompared')}</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easier">{t('feedback.easier')}</SelectItem>
                      <SelectItem value="As Expected">{t('feedback.asExpected')}</SelectItem>
                      <SelectItem value="Harder">{t('feedback.harder')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="conditions">{t('feedback.conditions')} *</Label>
                  <Input
                    id="conditions"
                    type="text"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    placeholder={t('feedback.conditionsPlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="terrainType">Terrain Type</Label>
                  <Select value={terrainType} onValueChange={setTerrainType}>
                    <SelectTrigger id="terrainType">
                      <SelectValue placeholder="Select terrain type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Forest">Forest</SelectItem>
                      <SelectItem value="Coastal">Coastal</SelectItem>
                      <SelectItem value="Bog">Bog</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                      <SelectItem value="Urban">Urban</SelectItem>
                      <SelectItem value="Mountain">Mountain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="trailSurface">Trail Surface</Label>
                  <Select value={trailSurface} onValueChange={setTrailSurface}>
                    <SelectTrigger id="trailSurface">
                      <SelectValue placeholder="Select trail surface..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paved">Paved</SelectItem>
                      <SelectItem value="Gravel">Gravel</SelectItem>
                      <SelectItem value="Dirt">Dirt</SelectItem>
                      <SelectItem value="Rocky">Rocky</SelectItem>
                      <SelectItem value="Boardwalk">Boardwalk</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="accessibility">Accessibility</Label>
                  <Select value={accessibility} onValueChange={setAccessibility}>
                    <SelectTrigger id="accessibility">
                      <SelectValue placeholder="Select accessibility..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Difficult">Difficult</SelectItem>
                      <SelectItem value="Very Difficult">Very Difficult</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bestSeason">Best Season</Label>
                  <Select value={bestSeason} onValueChange={setBestSeason}>
                    <SelectTrigger id="bestSeason">
                      <SelectValue placeholder="Select best season..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spring">Spring</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                      <SelectItem value="Autumn">Autumn</SelectItem>
                      <SelectItem value="Winter">Winter</SelectItem>
                      <SelectItem value="Year-round">Year-round</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="comment">{t('feedback.review')} *</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('feedback.reviewPlaceholder')}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>{t('feedback.uploadPhotos')}</Label>
                  <div className="mt-2 space-y-3">
                    <label
                      htmlFor="images"
                      className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="size-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{t('feedback.clickToUpload')}</span>
                    </label>

                    <input
                      id="images"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={onFileChange}
                      className="hidden"
                    />

                    {images.length > 0 && images.length < 10 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus className="size-4 mr-2" />
                        {t('feedback.addMorePhotos')}
                      </Button>
                    )}

                    {images.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">{t('feedback.photoLimit', { count: images.length })}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {images.map((img) => (
                            <div key={img.id} className="relative">
                              <img src={img.previewUrl} alt="Upload" className="w-full h-20 object-cover rounded" />
                              <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="absolute -top-2 -right-2 size-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {t('feedback.submit')}
                </Button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl">
                {t('feedback.communityReviews')} ({loading ? '…' : reviews.length})
              </h2>

              <Select value={filterTrackId} onValueChange={setFilterTrackId}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder={t('feedback.filterByTrail')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('feedback.allTrails')}</SelectItem>
                  {tracks.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      {track.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

            {!loading && reviews.length === 0 ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <MessageSquare className="size-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">{t('feedback.noFeedbackTitle')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('feedback.noFeedbackSubtitle')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((feedback) => {
                  const track = trackById.get(feedback.track_id);
                  return (
                    <div key={feedback.id}>
                      {track && <div className="mb-2 text-sm text-green-600">{track.name}</div>}
                      <FeedbackCard feedback={feedback} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
