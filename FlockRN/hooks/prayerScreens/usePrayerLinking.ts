// hooks/prayerScreens/usePrayerLinking.ts
import { useState } from 'react';
import {
  FlatPrayerTopicDTO,
  LinkedPrayerEntity,
  PrayerPoint,
  PrayerTopic,
} from '@/types/firebase';
import { EntityType } from '@/types/PrayerSubtypes';
import { auth } from '@/firebase/firebaseConfig';
import { prayerLinkingService } from '@/services/prayer/prayerLinkingService';
import { isValidCreateDTO, isValidUpdateDTO } from '@/types/typeGuards';

export function usePrayerLinking(prayerPoint: PrayerPoint) {
  const [prayerTopicDTO, setPrayerTopicDTO] =
    useState<FlatPrayerTopicDTO | null>(null);
  const [originPrayer, setOriginPrayer] = useState<LinkedPrayerEntity | null>(
    null,
  );

  const user = auth.currentUser;

  const loadOriginPrayer = async () => {
    if (!originPrayer) {
      console.error('No origin prayer to load');
      return null;
    }
    return prayerLinkingService.loadPrayer(originPrayer);
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

  // This function links the selected prayer point to the new prayer point or topic.
  // If the selected prayer point is a prayer topic:
  // 1) updates the context and embeddings for the prayer topic.
  // 2) deletes the embedding from the original prayer point.
  // 3) removes the embedding from the new prayer point.

  // If the selected prayer point is a prayer point:
  // 1) gets the context and embeddings for the new prayer topic.
  // 2) creates the prayer topic in Firebase.
  // 3) deletes the embedding from the original prayer point.
  // 4) removes the embedding from the new prayer point.
  const linkAndSyncPrayerPoint = async ({
    isNewPrayerPoint,
  }: {
    isNewPrayerPoint: boolean;
  }): Promise<{
    finalPrayerPoint?: PrayerPoint;
    fullOriginPrayer?: LinkedPrayerEntity;
    topicId?: string;
  }> => {
    if (!originPrayer || !prayerTopicDTO)
      return {
        finalPrayerPoint: undefined,
        fullOriginPrayer: undefined,
      };

    try {
      // Load the full origin prayer topic or prayer point from Firebase
      const fullOriginPrayer = (await loadOriginPrayer()) as LinkedPrayerEntity;
      if (!fullOriginPrayer) {
        return {};
      }
      if (!fullOriginPrayer.id) {
        console.error('Missing ID for full origin prayer');
        return {};
      }

      // Create the prayer topic DTO
      const topicDTO = (await prayerLinkingService.getPrayerTopicDTO({
        prayerPoint,
        selectedPrayer: fullOriginPrayer,
        topicTitle: prayerTopicDTO.title,
        user: user!,
      })) as FlatPrayerTopicDTO;

      if (!topicDTO) return {};

      // Update the prayer topic if linking to topic.
      let updatedPrayerPoint: PrayerPoint;
      let topicId: string = '';
      const { entityType } = originPrayer;

      if (entityType === EntityType.PrayerTopic && isValidUpdateDTO(topicDTO)) {
        updatedPrayerPoint = await prayerLinkingService.linkToExistingTopic({
          prayerPoint,
          originTopic: fullOriginPrayer as PrayerTopic,
          topicDTO,
          isNewPrayerPoint,
        });
        topicId = fullOriginPrayer.id;
      } else if (
        entityType === EntityType.PrayerPoint &&
        isValidCreateDTO(topicDTO)
      ) {
        const result = await prayerLinkingService.linkToNewTopic({
          prayerPoint,
          originPrayerPoint: fullOriginPrayer as PrayerPoint,
          topicDTO,
          isNewPrayerPoint,
        });
        updatedPrayerPoint = result.updatedNewPrayer;
        topicId = result.topicId;
      } else {
        console.warn(
          'Invalid state: originPrayer or topicDTO did not match expected types.',
        );
        return {};
      }

      // Remove embeddings and finalize
      const finalPrayerPoint = prayerLinkingService.removeEmbeddingLocally(
        updatedPrayerPoint,
      ) as PrayerPoint;

      setOriginPrayer(null);
      setPrayerTopicDTO(null);
      return { finalPrayerPoint, fullOriginPrayer, topicId };
    } catch (error) {
      console.error('Error linking and syncing prayer point:', error);
      return {};
    }
  };

  return {
    prayerTopicDTO,
    originPrayer,
    selectedPrayerToLinkTo: originPrayer,
    handlePrayerLinkingOnChange,
    linkAndSyncPrayerPoint,
  };
}
