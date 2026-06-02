export const CLUB_CATEGORY_OPTIONS = [
  'Sports',
  'Study',
  'Games',
  'Arts',
  'Technology',
  'Music',
  'Debate',
  'Photography',
  'Theatre',
  'Fitness',
  'Hiking',
  'Movies',
  'Community',
];

const CATEGORY_ALIASES = {
  Sport: 'Sports',
  sport: 'Sports',
  sports: 'Sports',
  Game: 'Games',
  game: 'Games',
  Study: 'Study',
  study: 'Study',
};

export function normalizeClubCategory(category) {
  if (!category) return 'Community';
  const trimmed = category.trim();
  return CATEGORY_ALIASES[trimmed] ?? trimmed;
}
