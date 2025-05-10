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

// ===== Base Type =====
export interface BasePrayerEntity {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  authorName: string;
  privacy: Privacy;
  entityType: EntityType;
}

// ===== Specific Entities =====
export interface Prayer extends BasePrayerEntity {
  prayerPoints?: string[]; // could have no prayer points
  // title is optional already in Base
}

export interface PrayerPoint extends BasePrayerEntity {
  title: string;
  prayerId?: string | string[];
  prayerType: PrayerType;
  tags: PrayerType[];
  linkedTopics?: LinkedTopicInPrayerDTO[] | FieldValue; // linked topics. id/title of topic.
  recipientName: string;
  recipientId?: string;
  embedding?: number[] | FieldValue;
}

export interface PrayerTopic extends BasePrayerEntity {
  title: string;
  endDate?: Date;
  prayerTypes: PrayerType[];
  status: Status;
  recipientName?: string;
  recipientId?: string;
  journey: PrayerPointInTopicJourneyDTO[] | FieldValue; // prayer points in this topic
  contextAsStrings?: string | FieldValue; // context strings - optional without AI
  contextAsEmbeddings?: number[] | FieldValue; // context embeddings - optional without AI
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
  'id' | 'createdAt' | 'updatedAt' | 'entityType'
>;

export type UpdatePrayerPointDTO = Partial<
  Omit<PrayerPoint, 'id' | 'createdAt' | 'updatedAt' | 'entityType'>
>;

export type CreatePrayerTopicDTO = Omit<
  PrayerTopic,
  'id' | 'createdAt' | 'updatedAt' | 'entityType' | 'endDate' | 'journey'
>;

export type UpdatePrayerTopicDTO = Partial<
  Omit<PrayerTopic, 'id' | 'createdAt' | 'updatedAt' | 'entityType' | 'endDate'>
>;

// may want to refactor this in the future if document becomes too large.
export type PrayerPointInTopicJourneyDTO = Pick<
  PrayerPoint,
  | 'id'
  | 'prayerType'
  | 'title'
  | 'content'
  | 'createdAt'
  | 'authorId'
  | 'authorName'
  | 'recipientName'
>;

export type LinkedTopicInPrayerDTO = Pick<PrayerPoint, 'id' | 'title'>;

export type FlatPrayerTopicDTO = CreatePrayerTopicDTO | UpdatePrayerTopicDTO;
export type FlatPrayerPointDTO = CreatePrayerPointDTO | UpdatePrayerPointDTO;
export type AnyPrayerEntity = PrayerTopic | PrayerPoint | Prayer;
export type LinkedPrayerEntity = PrayerTopic | PrayerPoint;
export type PartialLinkedPrayerEntity =
  | (Partial<PrayerPoint> & { similarity?: number })
  | (Partial<PrayerTopic> & { similarity?: number });

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
