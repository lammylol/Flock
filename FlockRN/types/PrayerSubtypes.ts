import { allTags } from './Tag';

export enum PrayerEntityType {
  Prayer = 'prayer',
  PrayerPoint = 'prayerPoint',
  PrayerTopic = 'prayerTopic',
}

export type PrayerTag = (typeof allTags)[number];
export type PrayerPointType = 'request' | 'praise' | 'repentance';
export type Privacy = 'public' | 'private';
export type Status = 'open' | 'closed' | null;
