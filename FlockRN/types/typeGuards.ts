import { Prayer, PrayerPoint, PrayerTopic } from '@/types/firebase';
import { PrayerEntityType } from './PrayerSubtypes';

export function getEntityType(obj: unknown): PrayerEntityType | undefined {
  if (typeof obj === 'object' && obj !== null) {
    if ('entityType' in obj && obj.entityType !== undefined) {
      return (obj as { entityType: PrayerEntityType }).entityType;
    }

    // Check based on available properties
    if (!('title' in obj)) {
      return PrayerEntityType.Prayer; // Assuming 'title' means it's a Prayer
    }
    if ('type' in obj) {
      return PrayerEntityType.PrayerPoint;
    }
    if ('journey' in obj) {
      return PrayerEntityType.PrayerTopic;
    }
  }

  // Default return for unhandled cases
  return undefined;
}

export function isPrayer(obj: unknown): obj is Prayer {
  return getEntityType(obj) === PrayerEntityType.Prayer;
}

export function isPrayerPoint(obj: unknown): obj is PrayerPoint {
  return getEntityType(obj) === PrayerEntityType.PrayerPoint;
}

export function isPrayerTopic(obj: unknown): obj is PrayerTopic {
  return getEntityType(obj) === PrayerEntityType.PrayerTopic;
}
