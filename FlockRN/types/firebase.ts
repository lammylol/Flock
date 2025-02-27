// ramon jiang
// 1/29/25
// set all types for Firebase

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: Date;
}

export type PrayerTag = 'Family' | 'Friends' | 'Finances' | 'Career' | 'Health';

export interface Prayer {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'Current' | 'Answered' | 'No Longer Needed';
  privacy: 'public' | 'private';
  isPinned: boolean;
  title: string;
  tags: PrayerTag[];  // New field
}

export interface PrayerUpdate {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  type: 'update' | 'answer';
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
export type CreatePrayerDTO = Omit<Prayer, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePrayerDTO = Partial<
  Omit<Prayer, 'id' | 'createdAt' | 'updatedAt'>
>;
