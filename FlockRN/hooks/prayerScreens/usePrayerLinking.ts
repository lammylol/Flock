// hooks/prayerScreens/usePrayerLinking.ts
import { useState } from 'react';
import {
  FlatPrayerTopicDTO,
  LinkedPrayerEntity,
  PrayerPoint,
} from '@/types/firebase';
import { auth } from '@/firebase/firebaseConfig';
import { complexPrayerOperations } from '@/services/prayer/complexPrayerOperations';

export function usePrayerLinking(prayerPoint: PrayerPoint) {
  const [prayerTopicDTO, setPrayerTopicDTO] =
    useState<FlatPrayerTopicDTO | null>(null);
  const [originPrayer, setOriginPrayer] = useState<LinkedPrayerEntity | null>(
    null,
  );

  const user = auth.currentUser;

  const setLinkedPairs = () => {
    const selectedPairs = {
      prayerPoint,
      originPrayer,
      topicTitle: prayerTopicDTO?.title,
    };
    return selectedPairs;
  };

  // This function is passed to the PrayerPointLinking component
  // and is called when the user selects a prayer point or topic to link to.
  // It updates the selected prayer and the prayer topic DTO.
  const handlePrayerLinkingOnChange = (
    selectedPrayer: LinkedPrayerEntity,
    title?: string,
  ) => {
    if (!selectedPrayer) {
      setOriginPrayer(null);
      setPrayerTopicDTO(null);
    }
    setOriginPrayer(selectedPrayer);
    setPrayerTopicDTO((prev) => ({
      ...prev,
      ...(title != null ? { title } : {}),
    }));
  };

  const linkAndSyncPrayerPoint = async ({
    isNewPrayerPoint,
  }: {
    isNewPrayerPoint: boolean;
  }): Promise<{
    finalPrayerPoint?: PrayerPoint;
    fullOriginPrayer?: LinkedPrayerEntity;
    topicId?: string;
  }> => {
    if (!originPrayer || !prayerTopicDTO || !user) return {};

    return await complexPrayerOperations.linkPrayerPoint(
      prayerPoint,
      originPrayer,
      user,
      isNewPrayerPoint,
      prayerTopicDTO.title,
    );
  };

  return {
    prayerTopicDTO,
    originPrayer,
    selectedPrayerToLinkTo: originPrayer,
    handlePrayerLinkingOnChange,
    linkAndSyncPrayerPoint,
    setLinkedPairs,
  };
}
