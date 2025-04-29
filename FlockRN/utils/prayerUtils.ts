import { Prayer, PrayerPoint, PrayerTopic } from '@/types/firebase';
import { PrayerType } from '@/types/PrayerSubtypes';

export function getPrayerType(
  prayer: Prayer | PrayerPoint | PrayerTopic,
): PrayerType | undefined {
  if ('prayerType' in prayer) {
    return prayer.prayerType;
  }
  return undefined; // Return undefined if it's not a PrayerPoint
}
