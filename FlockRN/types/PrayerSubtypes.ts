import { allTags } from './Tag';

export enum PrayerOrPrayerPointType {
  Prayer = 'prayer',
  PrayerPoint = 'prayerPoint',
}

export type PrayerTag = (typeof allTags)[number];
export type PrayerType = 'request' | 'praise' | 'repentance';
export type Privacy = 'public' | 'private';
export type Status = 'open' | 'closed' | null;
