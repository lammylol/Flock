// hooks/prayerScreens/useBatchPrayerLinking.ts
// this is unused for now. Will use for larger batch prayer points.

import { LinkedPrayerEntity, PrayerPoint } from '@/types/firebase';
import { auth } from '@/firebase/firebaseConfig';
import { complexPrayerOperations } from '@/services/prayer/complexPrayerOperations';

export interface UseBatchPrayerLinkingProps {
  isEditMode: boolean;
}

export type SelectedPrayerPair = {
  point: PrayerPoint;
  originPrayer: LinkedPrayerEntity;
  topicTitle?: string;
};

export function useBatchPrayerLinking({
  isEditMode,
}: UseBatchPrayerLinkingProps) {
  const user = auth.currentUser;
  const isNewPrayerPoint = !isEditMode; // new prayer point only if it's not in edit mode.

  // Only used for prayer points that have been linked to a topic or prayer point.
  // This function should only be called when the user submits the prayer + prayer points.
  const linkAndSyncBatchPrayerPoints = async (
    selectedPairs: {
      point: PrayerPoint;
      originPrayer: LinkedPrayerEntity;
      topicTitle?: string;
    }[],
  ): Promise<{
    selectedPairs: {
      finalPrayerPoint?: PrayerPoint;
      fullOriginPrayer?: LinkedPrayerEntity;
      topicId?: string;
    }[];
  }> => {
    if (!selectedPairs || !user) return { selectedPairs: [] };

    // run operations for all linked prayer points.
    const results = await Promise.all(
      selectedPairs.map(({ point, originPrayer, topicTitle }) => {
        if (!point || !originPrayer || !user) return Promise.resolve({});

        return complexPrayerOperations.linkPrayerPoint(
          point,
          originPrayer,
          user,
          isNewPrayerPoint,
          topicTitle,
        );
      }),
    );

    console.log('selectedPairs:', { selectedPairs: results });

    return {
      selectedPairs: results,
    };
  };

  return {
    linkAndSyncBatchPrayerPoints,
  };
}
