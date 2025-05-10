// hooks/usePrayerPointHandler.ts
import { useCallback, useState } from 'react';
import { auth } from '@/firebase/firebaseConfig';
import { PrayerPoint } from '@/types/firebase';
import { EntityType, PrayerType, Privacy } from '@/types/PrayerSubtypes';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { prayerPointService } from '@/services/prayer/prayerPointService';

export interface UsePrayerPointHandlerProps {
  id: string;
  privacy?: Privacy;
}
export function usePrayerPointHandler({
  id,
  privacy = 'private',
}: UsePrayerPointHandlerProps) {
  const { userPrayerPoints } = usePrayerCollection();
  const user = auth.currentUser;

  const [updatedPrayerPoint, setUpdatedPrayerPoint] = useState<PrayerPoint>({
    id: id || '',
    title: '',
    content: '',
    prayerType: PrayerType.Request,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: user?.displayName || 'unknown',
    authorId: user?.uid || 'unknown',
    privacy: privacy,
    recipientName: 'unknown',
    recipientId: 'unknown',
    prayerId: '',
    entityType: EntityType.PrayerPoint,
  });

  const handlePrayerPointUpdate = (data: Partial<PrayerPoint>) => {
    const newUpdated = { ...updatedPrayerPoint, ...data };
    setUpdatedPrayerPoint(newUpdated);
  };

  const loadPrayerPointFromPassingContent = useCallback(
    (data: Partial<PrayerPoint>) => {
      setUpdatedPrayerPoint(data as PrayerPoint);
    },
    [],
  );

  const loadPrayerPoint = useCallback(async () => {
    const contextPrayerPoint = userPrayerPoints.find((p) => p.id === id);
    if (contextPrayerPoint) {
      setUpdatedPrayerPoint({ ...contextPrayerPoint });
      return;
    }
    try {
      const fetchedPrayer = await prayerPointService.getPrayerPoint(id);
      if (fetchedPrayer) {
        setUpdatedPrayerPoint({ ...fetchedPrayer });
      }
    } catch (error) {
      console.error('Error fetching prayer point:', error);
    }
  }, [id, userPrayerPoints]);

  return {
    updatedPrayerPoint,
    setUpdatedPrayerPoint,
    handlePrayerPointUpdate,
    loadPrayerPoint,
    loadPrayerPointFromPassingContent,
  };
}
