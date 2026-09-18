export const EVENTS = {
  tracks: 'rajad:tracks:invalidate',
  track: 'rajad:track:invalidate',
  reviews: 'rajad:reviews:invalidate',
} as const;

export function invalidateTracks() {
  window.dispatchEvent(new Event(EVENTS.tracks));
}

export function invalidateTrack(id: string) {
  window.dispatchEvent(new CustomEvent(EVENTS.track, { detail: { id } }));
}

export function invalidateReviews() {
  window.dispatchEvent(new Event(EVENTS.reviews));
}
