// ramon jiang
// 1/29/25
// set all types for Firebase

import { allTags } from '@/types/Tag';
import { Timestamp } from '@react-native-firebase/firestore';

export interface UserProfile {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  createdAt: Timestamp;
  friends: string[];
  groups: string[];
  // used for searching
  normalizedUsername: string;
  normalizedFirstName: string;
  normalizedLastName: string;
}

export interface UserProfileResponse extends UserProfile {
  id: string;
}

export interface FriendRequest {
  userId: string;
  username: string;
  displayName: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Timestamp;
}

export interface Group {
  name: string;
  description: string;
  admins: string[];
  members: string[];
  createdAt: Timestamp;
}

export type PrayerTag = (typeof allTags)[number];
export type PrayerType = 'request' | 'praise' | 'repentance';
export type Privacy = 'public' | 'private';
export type Status = 'open' | 'closed' | null;

export interface Prayer {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  privacy: Privacy;
  prayerPoints: string[];
  prayerTypes: PrayerType[];
}

export interface PrayerPoint {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  authorName: string;
  authorId: string;
  prayerId: string[];
  prayerTypes: PrayerType;
  status: Status;
  privacy: Privacy;
  recipientName: string;
  recipientId?: string;
  prayerUpdates: PrayerPointUpdate[];
  tags: PrayerTag[];
}

export interface PrayerPointUpdate {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
}

export interface FeedPrayer {
  prayerId: string;
  addedAt: Timestamp;
}

// DTOs for creating/updating
export type CreatePrayerDTO = Omit<
  Prayer,
  'id' | 'createdAt' | 'updatedAt' | 'prayerPointIds'
>;
export type UpdatePrayerDTO = Partial<
  Omit<Prayer, 'id' | 'createdAt' | 'updatedAt' | 'prayerPointIds'>
>;
export type PrayerPointDTO = Omit<
  PrayerPoint,
  'id' | 'createdAt' | 'updatedAt' | 'prayerId'
>;

export interface ServiceResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
}
