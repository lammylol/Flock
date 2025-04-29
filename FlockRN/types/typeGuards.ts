import { Prayer, PrayerPoint, PrayerTopic } from '@/types/firebase';
import { EntityType } from './PrayerSubtypes';

export function getEntityType(obj: unknown): EntityType | undefined {
  if (typeof obj === 'object' && obj !== null) {
    if ('entityType' in obj && obj.entityType !== undefined) {
      return (obj as { entityType: EntityType }).entityType;
    }

    // Check based on available properties
    if (!('title' in obj)) {
      return EntityType.Prayer; // Assuming 'title' means it's a Prayer
    }
    if ('prayerType' in obj) {
      return EntityType.PrayerPoint;
    }
    if ('journey' in obj) {
      return EntityType.PrayerTopic;
    }
  }

  // Default return for unhandled cases
  return undefined;
}

export function isPrayer(obj: unknown): obj is Prayer {
  return getEntityType(obj) === EntityType.Prayer;
}

export function isPrayerPoint(obj: unknown): obj is PrayerPoint {
  return getEntityType(obj) === EntityType.PrayerPoint;
}

export function isPrayerTopic(obj: unknown): obj is PrayerTopic {
  return getEntityType(obj) === EntityType.PrayerTopic;
}
