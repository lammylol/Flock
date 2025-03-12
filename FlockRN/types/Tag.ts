// tag display names. Separate from type.

export const allTags = [
  'current',
  'answered',
  'praise',
  'prayerRequest',
  'family',
  'health',
  'career',
  'friends',
  'personal',
] as const;

export const tagDisplayNames: { [key: string]: string } = {
  family: 'Family',
  friends: 'Friends',
  finances: 'Finances',
  career: 'Career',
  health: 'Health',
  current: 'Current',
  praise: 'Praise',
  prayerRequest: 'Prayer Request',
  answered: 'Answered',
  personal: 'Personal',
};
