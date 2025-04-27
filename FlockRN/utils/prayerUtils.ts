import { Prayer, PrayerPoint, PrayerTopic } from '@/types/firebase';
import { PrayerPointType } from '@/types/PrayerSubtypes';

export function getPrayerType(
  prayer: Prayer | PrayerPoint | PrayerTopic,
): PrayerPointType | undefined {
  if ('type' in prayer) {
    return prayer.type;
  }
  return undefined; // Return undefined if it's not a PrayerPoint
}
