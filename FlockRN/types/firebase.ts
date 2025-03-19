// ramon jiang
// 1/29/25
// set all types for Firebase

import { allTags } from '@/types/Tag';

export interface UserProfile {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  createdAt: Date;
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
  timestamp: Date;
}

export interface Group {
  name: string;
  description: string;
  admins: string[];
  members: string[];
  createdAt: Date;
}

export type PrayerTag = (typeof allTags)[number];

export interface Prayer {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'open' | 'closed'; // can be deprecated later
  privacy: 'public' | 'private'; // can be deprecated later
  isPinned: boolean;
  title: string;
  tags: PrayerTag[];
  prayerPoints: string[];
}

export interface PrayerPoint {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string;
  authorId: string;
  prayerId: string;
  type: 'request' | 'praise';
  status: 'open' | 'closed' | null;
  privacy: 'public' | 'private';
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface FeedPrayer {
  prayerId: string;
  addedAt: Date;
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
