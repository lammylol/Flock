// hooks/prayerScreens/usePrayerLinking.ts

import { useState } from 'react';
import {
  CreatePrayerTopicDTO,
  PrayerPoint,
  PrayerTopic,
  UpdatePrayerTopicDTO,
} from '@/types/firebase';
import { EntityType } from '@/types/PrayerSubtypes';
import { prayerService } from '@/services/prayer/prayerService';
import {
  removeEmbeddingFromExistingPrayerPoints,
  getPrayerTopicDTO,
} from '@/services/prayer/prayerLinkingService';
import { auth } from '@/firebase/firebaseConfig';

export function usePrayerLinking(
  prayerPoint: PrayerPoint,
  handlePrayerPointUpdate: (updated: PrayerPoint) => void,
) {
  const user = auth.currentUser;
  const [prayerTopicDTO, setPrayerTopicDTO] = useState<
    CreatePrayerTopicDTO | UpdatePrayerTopicDTO | null
  >(null);
  const [originPrayer, setOriginPrayer] = useState<
    PrayerTopic | PrayerPoint | null
  >(null);

  const loadOriginPrayer = async () => {
    // will pull in once fetching prayer topics.
    // const contextPrayerTopic = userPrayerTopics.find(
    //   (p) => p.id === originPrayer?.id,
    // );
    // if (contextPrayerTopic) {
    //   setOriginPrayer({ ...contextPrayerTopic });
    //   return;
    try {
      let fetchedPrayer = null;
      switch (originPrayer?.entityType) {
        case EntityType.PrayerPoint:
          // If the origin prayer is a prayer point, fetch the prayer topic from Firebase
          fetchedPrayer = await prayerService.getPrayerPoint(
            originPrayer?.id as PrayerTopic['id'],
          );
          break;
        case EntityType.PrayerTopic:
          // If the origin prayer is a prayer topic, fetch the prayer topic from Firebase
          fetchedPrayer = await prayerService.getPrayerTopic(
            originPrayer?.id as PrayerTopic['id'],
          );
          break;
        default:
          console.warn('Unknown entityType or originPrayer is null');
          return;
      }
      if (fetchedPrayer) {
        return fetchedPrayer;
      }
    } catch (error) {
      console.error('Error fetching prayer point or topic:', error);
    }
  };

  // This function is passed to the PrayerPointLinking component
  // and is called when the user selects a prayer point or topic to link to.
  // It updates the selected prayer and the prayer topic DTO.
  const handlePrayerLinkingOnChange = (
    selectedPrayer: PrayerPoint | PrayerTopic,
    title: string,
  ) => {
    setOriginPrayer(selectedPrayer);
    setPrayerTopicDTO((prev) => ({
      ...prev,
      ...(title && { title }),
    }));
  };

  // === Firebase functions to create or update prayer topics ===
  const createPrayerTopic = async (data: CreatePrayerTopicDTO) => {
    if (!data) return;
    await prayerService.createPrayerTopic(data as CreatePrayerTopicDTO);
  };

  const updatePrayerTopic = async (
    origin: PrayerTopic,
    data: UpdatePrayerTopicDTO,
  ) => {
    if (!origin?.id || !data) {
      console.error('Missing data for updating prayer topic');
      return;
    }
    await prayerService.updatePrayerTopic(
      origin.id,
      data as UpdatePrayerTopicDTO,
    );
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
  const linkAndSyncPrayerPoint = async () => {
    if (!originPrayer || !prayerTopicDTO) return;

    try {
      const fullOriginPrayer = (await loadOriginPrayer()) as
        | PrayerPoint
        | PrayerTopic; // fetch additional values that aren't in the prayer topic or point if exists.
      if (!prayerTopicDTO.title) {
        console.error('Missing title in prayerTopic');
        return;
      }
      const topicDTO = (await getPrayerTopicDTO({
        prayerPoint,
        selectedPrayer: fullOriginPrayer,
        title: prayerTopicDTO.title ?? '',
        user: user,
      })) as CreatePrayerTopicDTO | UpdatePrayerTopicDTO;
      if (!topicDTO) {
        console.error('Failed to build topicDTO');
        return;
      }

      if (originPrayer.entityType === EntityType.PrayerTopic) {
        await updatePrayerTopic(
          originPrayer as PrayerTopic,
          topicDTO as UpdatePrayerTopicDTO,
        );
      } else {
        await createPrayerTopic(topicDTO as CreatePrayerTopicDTO);
      }

      const updatedPrayerPoint = await removeEmbeddingFromExistingPrayerPoints(
        prayerPoint,
        originPrayer,
      );

      handlePrayerPointUpdate(updatedPrayerPoint);
      setOriginPrayer(null);
      setPrayerTopicDTO(null);
    } catch (error) {
      console.error('Error linking and syncing prayer point:', error);
    }
  };

  return {
    prayerTopicDTO,
    selectedPrayerToLinkTo: originPrayer,
    handlePrayerLinkingOnChange,
    linkAndSyncPrayerPoint,
  };
}
