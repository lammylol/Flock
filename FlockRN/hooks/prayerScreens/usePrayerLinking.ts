// hooks/prayerScreens/usePrayerLinking.ts

import { useState } from 'react';
import {
  CreatePrayerTopicDTO,
  LinkedTopicInPrayerDTO,
  FlatPrayerTopicDTO,
  LinkedPrayerEntity,
  PrayerPoint,
  PrayerTopic,
  UpdatePrayerTopicDTO,
} from '@/types/firebase';
import { EntityType } from '@/types/PrayerSubtypes';
import {
  getPrayerTopicDTO,
  removeEmbeddingFromFirebase,
  removeEmbeddingLocally,
  updateLinkedPrayerTopic,
} from '@/services/prayer/prayerLinkingService';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { auth } from '@/firebase/firebaseConfig';
import { prayerPointService } from '@/services/prayer/prayerPointService';
import { prayerTopicService } from '@/services/prayer/prayerTopicService';
import { isValidCreateDTO, isValidUpdateDTO } from '@/types/typeGuards';

export function usePrayerLinking(prayerPoint: PrayerPoint) {
  const { updateCollection } = usePrayerCollection();
  const [prayerTopicDTO, setPrayerTopicDTO] =
    useState<FlatPrayerTopicDTO | null>(null);
  const [originPrayer, setOriginPrayer] = useState<LinkedPrayerEntity | null>(
    null,
  );

  const user = auth.currentUser;

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
          fetchedPrayer = await prayerPointService.getPrayerPoint(
            originPrayer.id as PrayerTopic['id'],
          );
          break;
        case EntityType.PrayerTopic:
          // If the origin prayer is a prayer topic, fetch the prayer topic from Firebase
          fetchedPrayer = await prayerTopicService.getPrayerTopic(
            originPrayer.id as PrayerTopic['id'],
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

  // === Firebase functions to create or update prayer topics ===
  const createPrayerTopic = async (data: CreatePrayerTopicDTO) => {
    if (!data) return;
    if (!data.title) {
      console.error('Missing title in prayer topic');
      return;
    }
    return prayerTopicService.createPrayerTopic(data) as Promise<string>;
  };

  const updatePrayerTopic = async (
    origin: PrayerTopic,
    data: UpdatePrayerTopicDTO,
  ) => {
    if (!origin?.id || !data) {
      console.error('Missing data for updating prayer topic');
      return;
    }
    await prayerTopicService.updatePrayerTopic(
      origin.id,
      data as UpdatePrayerTopicDTO,
    );
  };

  // returns the prayer point with the linked topic. If new prayer point, it
  // updates the linked topic in the prayer point locally so that it can be
  // displayed before the prayer point is saved to Firebase.
  // If existing prayer point, it updates the linked topic in the prayer point
  // and updates the prayer point in the collection.
  const updatePrayerPointWithLinkedTopic = async (
    prayerPoint: PrayerPoint,
    topicToModify: LinkedTopicInPrayerDTO,
    isExistingPrayerPoint?: boolean,
  ) => {
    const updated = await updateLinkedPrayerTopic(prayerPoint, topicToModify);
    if (isExistingPrayerPoint) {
      // Update the prayer point in the collection
      if (!prayerPoint.id) {
        console.error(
          'UpdatePrayerPointWithLinkedTopic: Missing prayer point ID',
        );
        return;
      }
      await prayerPointService.updatePrayerPoint(prayerPoint.id, {
        linkedTopic: updated.linkedTopic,
      });

      updateCollection(updated, 'prayerPoint');
    }

    return updated;
  };

  const linkToExistingTopic = async ({
    originTopic,
    topicDTO,
    isNewPrayerPoint,
  }: {
    originTopic: PrayerTopic;
    topicDTO: FlatPrayerTopicDTO;
    isNewPrayerPoint: boolean;
  }): Promise<PrayerPoint> => {
    await updatePrayerTopic(originTopic, topicDTO as UpdatePrayerTopicDTO);

    const linkedTopic = {
      id: originTopic.id,
      title: topicDTO.title,
    };

    const updatedPrayerPoint = await updatePrayerPointWithLinkedTopic(
      prayerPoint,
      linkedTopic,
      !isNewPrayerPoint,
    );

    if (!updatedPrayerPoint) {
      throw new Error('Failed to update prayer point with linked topic');
    }

    return updatedPrayerPoint;
  };

  const linkToNewTopic = async ({
    originPrayerPoint,
    topicDTO,
    isNewPrayerPoint,
  }: {
    originPrayerPoint: PrayerPoint;
    topicDTO: FlatPrayerTopicDTO;
    isNewPrayerPoint: boolean;
  }): Promise<{
    updatedNewPrayer: PrayerPoint;
    topicId: string;
  }> => {
    const topicId = (await createPrayerTopic(
      topicDTO as CreatePrayerTopicDTO,
    )) as string;

    const linkedTopic = {
      id: topicId,
      title: topicDTO.title,
    } as LinkedTopicInPrayerDTO;

    const updatedNewPrayer = await updatePrayerPointWithLinkedTopic(
      prayerPoint,
      linkedTopic,
      !isNewPrayerPoint,
    );

    await updatePrayerPointWithLinkedTopic(
      originPrayerPoint,
      linkedTopic,
      true,
    );

    if (!updatedNewPrayer) {
      throw new Error('Failed to update prayer point with linked topic');
    }

    return { updatedNewPrayer, topicId };
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
      const topicDTO = (await getPrayerTopicDTO({
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
        updatedPrayerPoint = await linkToExistingTopic({
          originTopic: fullOriginPrayer as PrayerTopic,
          topicDTO,
          isNewPrayerPoint,
        });
        topicId = fullOriginPrayer.id;
      } else if (
        entityType === EntityType.PrayerPoint &&
        isValidCreateDTO(topicDTO)
      ) {
        const result = await linkToNewTopic({
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
      const finalPrayerPoint = removeEmbeddingLocally(
        updatedPrayerPoint,
      ) as PrayerPoint;

      if (originPrayer.entityType === EntityType.PrayerPoint) {
        await removeEmbeddingFromFirebase(originPrayer);
      }

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
