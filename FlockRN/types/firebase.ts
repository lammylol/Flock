// ramon jiang
// 1/29/25
// set all types for Firebase
import { PrayerTag, PrayerType, Privacy, Status } from './PrayerSubtypes';

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

export interface Prayer {
  id: string;
  content: string;
  title?: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  privacy: Privacy;
  prayerPoints: string[];
  tags?: PrayerType[];
}

export interface PrayerPoint {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string;
  authorId: string;
  prayerId?: string | string[];
  type: PrayerType;
  tags?: PrayerType[];
  status?: Status;
  privacy?: Privacy;
  recipientName?: string;
  recipientId?: string;
  prayerUpdates?: PrayerPointUpdate[];
  embedding?: number[];
  isOrigin: boolean;
}

export interface PrayerPointUpdate {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
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
  'id' | 'createdAt' | 'updatedAt' | 'prayerPoints'
>;

export type UpdatePrayerDTO = Partial<
  Omit<Prayer, 'id' | 'createdAt' | 'updatedAt'>
>;

export type CreatePrayerPointDTO = Omit<
  PrayerPoint,
  'id' | 'prayerId' | 'updatedAt'
>;

export type UpdatePrayerPointDTO = Partial<
  Omit<PrayerPoint, 'id' | 'createdAt' | 'updatedAt'>
>;

export interface ServiceResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
}

// AI Analysis Result Type
export interface PrayerAnalysisResult {
  title: string;
  cleanedTranscription?: string;
  tags: PrayerTag[];
  prayerPoints: PrayerPoint[];
}
