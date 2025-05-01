// services/prayerTopicCreationHandler.ts

import { deleteField } from 'firebase/firestore';
import OpenAiService from '@/services/ai/openAIService';
import { prayerService } from './prayerService';
import {
  PrayerPoint,
  PrayerTopic,
  PrayerPointInPrayerTopicDTO,
  CreatePrayerTopicDTO,
  UpdatePrayerPointDTO,
  UpdatePrayerTopicDTO,
} from '@/types/firebase';
import { isPrayerTopic } from '@/types/typeGuards';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { User } from 'firebase/auth';

const maxCharactersPerPrayerContext = 250; // or whatever your constant is
const openAiService = OpenAiService.getInstance();

export const getJourney = (
  prayerPoint: PrayerPoint,
  selectedPrayer: PrayerPoint | PrayerTopic,
): PrayerPointInPrayerTopicDTO[] => {
  // This function either: 1) updates an existing journey for a topic with a new prayer point being created, or
  // 2) creates a net new journey for the prayer point being created linked to an existing prayer point.
  const toDTO = (p: PrayerPoint): PrayerPointInPrayerTopicDTO => ({
    id: p.id,
    prayerType: p.prayerType,
    title: p.title,
    content: p.content,
    createdAt: p.createdAt,
    authorName: p.authorName,
    recipientName: p.recipientName,
  });

  const newDTO = toDTO(prayerPoint);

  if (isPrayerTopic(selectedPrayer) && selectedPrayer.journey) {
    return [...selectedPrayer.journey, newDTO];
  }

  return [toDTO(selectedPrayer as PrayerPoint), newDTO];
};

export const getDistinctPrayerTypes = (
  prayerPoint: PrayerPoint,
  selectedPrayer: PrayerPoint | PrayerTopic,
): PrayerType[] => {
  const types = new Set<PrayerType>();

  if (
    isPrayerTopic(selectedPrayer) &&
    Array.isArray(selectedPrayer.prayerTypes)
  ) {
    selectedPrayer.prayerTypes.forEach((type) => types.add(type));
  }

  if (prayerPoint.prayerType) {
    types.add(prayerPoint.prayerType);
  }

  return Array.from(types);
};

export const setContextAsStringsAndGetEmbeddings = async (
  prayerPoint: PrayerPoint,
  selectedPrayer: PrayerPoint | PrayerTopic,
) => {
  // There is no slice on (selectedPrayer) original content, just the new prayer point.
  // this is for 2 reasons: 1) keep original prayer point intact and
  // to lean more heavily on it when there are few topics. 2) if linking to a prayer topic,
  // we need the full content.
  const contextAsStrings = [
    `${prayerPoint.title} ${prayerPoint.content.slice(0, maxCharactersPerPrayerContext)}`,
    `${selectedPrayer.title} ${selectedPrayer.content ?? ''}`,
  ]
    .join(', ')
    .trim();

  try {
    const embeddings =
      await openAiService.getVectorEmbeddings(contextAsStrings);

    if (!embeddings || embeddings.length === 0) {
      console.error('Failed to generate embeddings');
      return {};
    }

    return {
      contextAsStrings,
      contextAsEmbeddings: embeddings,
    };
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
};

// This function handles all the logic for prayer topics when linking
// either prayer point to prayer point or prayer point to an existing prayer topic.
export const getPrayerTopicDTO = async ({
  prayerPoint,
  selectedPrayer,
  title,
  user,
}: {
  prayerPoint: PrayerPoint;
  selectedPrayer: PrayerPoint | PrayerTopic;
  title: string;
  user: User;
}) => {
  if (!user.uid) {
    console.error('User ID is not available');
    return;
  }

  const journey = getJourney(prayerPoint, selectedPrayer);
  console.log('Journey:', journey);
  if (!journey) {
    console.error('Failed to get journey');
    return;
  }

  const prayerTypes = getDistinctPrayerTypes(prayerPoint, selectedPrayer);

  if (!user?.uid) {
    console.error('Cannot add topic. User ID is not available');
    return;
  }

  const content = `Latest ${prayerPoint.prayerType.trim()}: ${prayerPoint.title.trim()}`;

  // Get context strings + embeddings
  const { contextAsStrings, contextAsEmbeddings } =
    await setContextAsStringsAndGetEmbeddings(prayerPoint, selectedPrayer);

  if (!contextAsStrings || !contextAsEmbeddings) {
    console.error('Missing context or embeddings');
    return;
  }

  const sharedFields = {
    title,
    content,
    journey,
    contextAsStrings,
    contextAsEmbeddings,
    prayerTypes,
  };

  switch (selectedPrayer.entityType) {
    case EntityType.PrayerTopic: {
      const updateTopicData: UpdatePrayerTopicDTO = {
        ...sharedFields,
        authorName: selectedPrayer.authorName,
        authorId: selectedPrayer.authorId,
      };
      return { updateTopicData };
    }

    case EntityType.PrayerPoint:
    default: {
      const createTopicData: CreatePrayerTopicDTO = {
        ...sharedFields,
        authorName: user.displayName || 'Unknown',
        authorId: user.uid,
        status: 'open',
        privacy: 'private',
        recipientName: 'User',
        recipientId: 'Unknown',
      };
      return { createTopicData };
    }
  }
};

export const removeEmbeddingFromExistingPrayerPoints = async (
  prayerPoint: PrayerPoint,
  selectedPrayer: PrayerPoint | PrayerTopic,
) => {
  // 1. Delete the existing embedding from firebase for selected prayer.
  if (selectedPrayer.entityType === EntityType.PrayerPoint) {
    const updateData: UpdatePrayerPointDTO = {
      embedding: deleteField(),
    };
    await prayerService.updatePrayerPoint(selectedPrayer.id, updateData);
  }

  // 2. Delete the embedding from the new prayer point being created.
  const updatedPrayerPoint: PrayerPoint = {
    ...prayerPoint,
    embedding: undefined,
  };

  return updatedPrayerPoint;
};
