// tag display names. Separate from type.

import { PrayerType } from './PrayerSubtypes';

export const allTags = [
  'family',
  'health',
  'finances',
  'career',
  'friends',
  'personal',
];

export const tagDisplayNames: { [key: string]: string } = {
  family: 'Family',
  friends: 'Friends',
  finances: 'Finances',
  career: 'Career',
  health: 'Health',
  personal: 'Personal',
};

export const prayerTags: PrayerType[] = Object.values(PrayerType);

export const prayerTagDisplayNames: { [key: string]: string } = {
  request: 'Prayer Request',
  praise: 'Praise',
  repentance: 'Repentance',
};
