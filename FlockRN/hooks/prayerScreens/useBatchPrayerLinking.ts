// hooks/prayerScreens/useBatchPrayerLinking.ts
import { LinkedPrayerEntity, PrayerPoint } from '@/types/firebase';
import { auth } from '@/firebase/firebaseConfig';
import { prayerLinkingService } from '@/services/prayer/prayerLinkingService';
import { complexPrayerOperations } from '@/services/prayer/complexPrayerOperations';
import { EditMode } from '@/types/ComponentProps';

export interface UsePrayerHandlerProps {
  prayerPoints: PrayerPoint[];
  editMode: EditMode;
}

export function usePrayerLinking({
  prayerPoints,
  editMode,
}: UsePrayerHandlerProps) {
  // const [prayerTopicDTO, setPrayerTopicDTO] =
  //   useState<FlatPrayerTopicDTO | null>(null);
  // const [originPrayer, setOriginPrayer] = useState<LinkedPrayerEntity | null>(
  //   null,
  // );

  const user = auth.currentUser;
  const isNewPrayerPoint = editMode === EditMode.CREATE;

  const linkAndSyncPrayerPoints = async (
    prayerPoints: PrayerPoint[],
  ): Promise<{
    finalPrayerPoint?: PrayerPoint;
    fullOriginPrayer?: LinkedPrayerEntity;
    topicId?: string;
  }> => {
    if (!originPrayer || !prayerTopicDTO || !user) return {};
    const results = await Promise.all(
      selectedPairs.map(({ point, originPrayer, topicDTO }) => {
        if (!originPrayer || !topicDTO || !user) return Promise.resolve({});
        return complexPrayerOperations.linkPrayerPoint({
          prayerPoint: point,
          originPrayer,
          user,
          isNewPrayerPoint,
          topicTitle: topicDTO.title,
        });
      }),
    );

    return results;
  };
  return {
    linkAndSyncPrayerPoints,
  };
}
