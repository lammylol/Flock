// ramon jiang
// 1/29/25
// set all types for Firebase
import { FieldValue } from 'firebase/firestore';
import {
  EntityType,
  PrayerTag,
  PrayerType,
  Privacy,
  Status,
} from './PrayerSubtypes';

// ===== UserProfiles =====

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

// ===== Friends =====

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

// ===== Prayer Types =====
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
  entityType: EntityType;
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
  prayerType: PrayerType;
  tags?: PrayerType[];
  status?: Status;
  privacy?: Privacy;
  recipientName?: string;
  recipientId?: string;
  embedding?: number[] | FieldValue; // enables delete when removing embedding.
  entityType: EntityType;
}

export interface PrayerTopic {
  id: string;
  title: string;
  content: string; // summary of the prayer topic
  createdAt: Date;
  updatedAt: Date;
  endDate?: Date;
  authorName: string;
  authorId: string;
  prayerTypes?: PrayerType[];
  status?: Status;
  privacy?: Privacy;
  recipientName?: string;
  recipientId?: string;
  journey: PrayerPointInPrayerTopicDTO[];
  contextAsStrings: string;
  contextAsEmbeddings: number[];
  entityType: EntityType;
}

// ===== Other Types =====
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

// ==== DTOs for creating/updating ====
export type CreatePrayerDTO = Omit<
  Prayer,
  'id' | 'createdAt' | 'updatedAt' | 'prayerPoints' | 'entityType'
>;

export type UpdatePrayerDTO = Partial<
  Omit<Prayer, 'id' | 'createdAt' | 'updatedAt' | 'entityType'>
>;

export type CreatePrayerPointDTO = Omit<
  PrayerPoint,
  'id' | 'createdAt' | 'prayerId' | 'updatedAt' | 'entityType'
>;

export type UpdatePrayerPointDTO = Partial<
  Omit<PrayerPoint, 'id' | 'createdAt' | 'updatedAt' | 'entityType'>
>;

export type CreatePrayerTopicDTO = Omit<
  PrayerTopic,
  'id' | 'createdAt' | 'updatedAt' | 'entityType' | 'endDate'
>;

export type UpdatePrayerTopicDTO = Partial<
  Omit<PrayerTopic, 'id' | 'createdAt' | 'updatedAt' | 'entityType' | 'endDate'>
>;

// may want to refactor this in the future if document becomes too large.
export type PrayerPointInPrayerTopicDTO = Pick<
  PrayerPoint,
  | 'id'
  | 'prayerType'
  | 'title'
  | 'content'
  | 'createdAt'
  | 'authorName'
  | 'recipientName'
>;

export interface ServiceResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
}

// ==== AI Analysis Result Type ====
export interface PrayerAnalysisResult {
  title: string;
  cleanedTranscription?: string;
  tags: PrayerTag[];
  prayerPoints: PrayerPoint[];
}
