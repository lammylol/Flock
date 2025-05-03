import { allTags } from './Tag';

export enum EntityType {
  Prayer = 'prayer',
  PrayerPoint = 'prayerPoint',
  PrayerTopic = 'prayerTopic',
}

export enum PrayerType {
  Request = 'request',
  Praise = 'praise',
  Repentance = 'repentance',
}

export type PrayerTag = (typeof allTags)[number];
export type Privacy = 'public' | 'private';
export type Status = 'open' | 'closed' | null;
