import { Star, User, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReviewRecord } from '../api/reviews';

interface FeedbackCardProps {
  feedback: ReviewRecord;
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'et-EE';

  const difficultyColors: Record<string, string> = {
    Easier: 'bg-green-100 text-green-700',
    'As Expected': 'bg-blue-100 text-blue-700',
    Harder: 'bg-red-100 text-red-700',
  };

  const difficultyLabel =
    feedback.difficulty === 'Easier'
      ? t('feedback.easier')
      : feedback.difficulty === 'Harder'
        ? t('feedback.harder')
        : feedback.difficulty
          ? t('feedback.asExpected')
          : null;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="size-5 text-gray-600" />
          </div>
          <div>
            <div className="font-medium">{feedback.user_name}</div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="size-3" />
              {new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(
                new Date(feedback.created_at),
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-yellow-600">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`size-4 ${i < feedback.rating ? 'fill-current' : ''}`} />
          ))}
        </div>
      </div>

      <p className="text-gray-700 mb-3">{feedback.comment}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {difficultyLabel && (
          <span
            className={`px-2 py-1 rounded text-xs ${difficultyColors[feedback.difficulty as any] ?? 'bg-gray-100 text-gray-700'}`}
          >
            {difficultyLabel}
          </span>
        )}
        {feedback.conditions && <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">{feedback.conditions}</span>}
      </div>

      {feedback.images?.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {feedback.images.slice(0, 9).map((img, idx) => (
            <img key={idx} src={img} alt={`Feedback image ${idx + 1}`} className="w-full h-24 object-cover rounded" />
          ))}
        </div>
      )}
    </div>
  );
}
