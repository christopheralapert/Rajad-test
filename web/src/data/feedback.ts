export interface TrackFeedback {
  id: string;
  trackId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  images: string[];
  date: string;
  difficulty: 'Easier' | 'As Expected' | 'Harder';
  conditions: string; // trail conditions
}

export const feedbackData: TrackFeedback[] = [
  {
    id: 'fb1',
    trackId: '1',
    userName: 'Mari K.',
    rating: 5,
    comment: 'Absolutely stunning trail! The boardwalks are well-maintained and the ancient forest is breathtaking. Perfect for families.',
    images: [],
    date: '2026-01-28',
    difficulty: 'As Expected',
    conditions: 'Excellent - dry and clear',
  },
  {
    id: 'fb2',
    trackId: '2',
    userName: 'Toomas L.',
    rating: 5,
    comment: 'The bog landscape is otherworldly. Great for photography, especially early morning with the mist.',
    images: [],
    date: '2026-01-25',
    difficulty: 'As Expected',
    conditions: 'Good - some ice on boardwalk',
  },
  {
    id: 'fb3',
    trackId: '3',
    userName: 'Elena S.',
    rating: 4,
    comment: 'Beautiful coastal views and the glacial boulders are impressive. Can be windy near the shore.',
    images: [],
    date: '2026-01-20',
    difficulty: 'Easier',
    conditions: 'Good - rocky in places',
  },
  {
    id: 'fb4',
    trackId: '5',
    userName: 'Jüri P.',
    rating: 5,
    comment: 'The sandstone cliffs are amazing! The trail along the river is scenic. Some sections can be muddy after rain.',
    images: [],
    date: '2026-01-15',
    difficulty: 'Harder',
    conditions: 'Fair - muddy sections',
  },
  {
    id: 'fb5',
    trackId: '1',
    userName: 'Anna V.',
    rating: 4,
    comment: 'Great trail for a peaceful walk. Saw several deer! The information stands are very educational.',
    images: [],
    date: '2026-01-10',
    difficulty: 'As Expected',
    conditions: 'Excellent',
  },
];
