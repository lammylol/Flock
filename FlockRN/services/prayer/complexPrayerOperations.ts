import {
  FlatPrayerTopicDTO,
  LinkedPrayerEntity,
  PartialLinkedPrayerEntity,
  PrayerPoint,
  PrayerTopic,
} from '@/types/firebase';
import { IPrayerPointsService, prayerPointService } from './prayerPointService';
import { IPrayerService, prayerService } from './prayerService';
import OpenAiService from '@/services/ai/openAIService';
import { User } from 'firebase/auth';
import { prayerLinkingService } from './prayerLinkingService';
import { isValidCreateDTO, isValidUpdateDTO } from '@/types/typeGuards';
import { EntityType } from '@/types/PrayerSubtypes';

export interface IComplexPrayerOperations {
  getEmbeddingsAndFindSimilarPrayerPoints(
    prayerPoint: PrayerPoint,
    userId: string,
    topK: number,
  ): Promise<{
    similarPrayers: PartialLinkedPrayerEntity[];
    prayerPointWithEmbedding: PrayerPoint;
  }>;

  fetchMostSimilarPrayerPoint(
    prayerPoints: PrayerPoint[],
    userId: string,
  ): Promise<{
    arrayOfPointsAndClosestPrayer: {
      prayerEntity: LinkedPrayerEntity;
      similarPrayer: LinkedPrayerEntity;
    }[];
    arrayOfSimilarPrayersExcludingClosestPrayer: LinkedPrayerEntity[];
  }>;

  deletePrayerPointAndUnlinkPrayers(
    prayerPointId: string,
    authorId: string,
  ): Promise<void>;

  linkPrayerPoint(
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    isNewPrayerPoint: boolean,
    topicTitle?: string,
  ): Promise<{
    finalPrayerPoint?: PrayerPoint;
    fullOriginPrayer?: LinkedPrayerEntity;
    topicId?: string;
  }>;
}

class ComplexPrayerOperations implements IComplexPrayerOperations {
  private prayerService: IPrayerService;
  private prayerPointService: IPrayerPointsService;

  constructor(
    prayerService: IPrayerService,
    prayerPointService: IPrayerPointsService,
  ) {
    this.prayerService = prayerService;
    this.prayerPointService = prayerPointService;
  }

  openService = OpenAiService.getInstance();

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
  linkPrayerPoint = async (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    isNewPrayerPoint: boolean,
    topicTitle?: string,
  ): Promise<{
    finalPrayerPoint?: PrayerPoint;
    fullOriginPrayer?: LinkedPrayerEntity;
    topicId?: string;
  }> => {
    try {
      const fullOriginPrayer = (await prayerLinkingService.loadPrayer(
        originPrayer,
      )) as LinkedPrayerEntity;

      if (!fullOriginPrayer || !fullOriginPrayer.id) return {};

      const topicDTO = (await prayerLinkingService.getPrayerTopicDTO({
        prayerPoint,
        selectedPrayer: fullOriginPrayer,
        topicTitle,
        user,
      })) as FlatPrayerTopicDTO;

      if (!topicDTO) return {};

      let updatedPrayerPoint: PrayerPoint;
      let topicId = '';
      const { entityType } = originPrayer;

      if (entityType === EntityType.PrayerTopic && isValidUpdateDTO(topicDTO)) {
        updatedPrayerPoint = await prayerLinkingService.linkToExistingTopic(
          fullOriginPrayer as PrayerTopic,
          topicDTO,
          isNewPrayerPoint,
          prayerPoint,
        );
        topicId = fullOriginPrayer.id;
      } else if (
        entityType === EntityType.PrayerPoint &&
        isValidCreateDTO(topicDTO)
      ) {
        const result = await prayerLinkingService.linkToNewTopic(
          fullOriginPrayer as PrayerPoint,
          topicDTO,
          isNewPrayerPoint,
          prayerPoint,
        );
        updatedPrayerPoint = result.updatedNewPrayer;
        topicId = result.topicId;
      } else {
        return {};
      }

      const finalPrayerPoint =
        prayerLinkingService.removeEmbeddingLocally(updatedPrayerPoint);

      return { finalPrayerPoint, fullOriginPrayer, topicId };
    } catch (err) {
      console.error('Error linking prayer point:', err);
      return {};
    }
  };

  getEmbeddingsAndFindSimilarPrayerPoints = async (
    prayerPoint: PrayerPoint,
    userId: string,
    topK: number,
  ): Promise<{
    similarPrayers: PartialLinkedPrayerEntity[];
    prayerPointWithEmbedding: PrayerPoint;
  }> => {
    try {
      let embeddingInput = (prayerPoint.embedding as number[]) || undefined;
      if (!embeddingInput) {
        const input = `${prayerPoint.title} ${prayerPoint.content}`.trim();
        embeddingInput = await this.openService.getVectorEmbeddings(input);
      }
      if (embeddingInput.length === 0) {
        console.error('Empty embedding array');
        return { similarPrayers: [], prayerPointWithEmbedding: prayerPoint };
      }

      const similarPrayers = await this.prayerService.findRelatedPrayers(
        embeddingInput,
        userId,
        prayerPoint.id,
        topK,
      );

      const prayerPointWithEmbedding = {
        ...prayerPoint,
        ...(embeddingInput && { embedding: embeddingInput }),
      };

      return { similarPrayers, prayerPointWithEmbedding };
    } catch (error) {
      console.error('Error getting related prayer point:', error);
      return { similarPrayers: [], prayerPointWithEmbedding: prayerPoint };
    }
  };

  fetchMostSimilarPrayerPoint = async (
    prayerPoints: PrayerPoint[],
    userId: string,
  ): Promise<{
    arrayOfPointsAndClosestPrayer: {
      prayerEntity: LinkedPrayerEntity;
      similarPrayer: LinkedPrayerEntity;
    }[];
    arrayOfSimilarPrayersExcludingClosestPrayer: LinkedPrayerEntity[];
  }> => {
    const arrayOfPointsAndClosestPrayer: {
      prayerEntity: LinkedPrayerEntity;
      similarPrayer: LinkedPrayerEntity;
    }[] = [];

    const arrayOfSimilarPrayersExcludingClosestPrayer: LinkedPrayerEntity[] =
      [];

    for (const point of prayerPoints) {
      const { similarPrayers, prayerPointWithEmbedding } =
        await complexPrayerOperations.getEmbeddingsAndFindSimilarPrayerPoints(
          point,
          userId || '',
          5,
        );

      if (!similarPrayers.length) continue;

      const [closestPrayer, ...others] = similarPrayers.sort(
        (a, b) => b.similarity - a.similarity,
      ) as LinkedPrayerEntity[];

      arrayOfPointsAndClosestPrayer.push({
        prayerEntity: prayerPointWithEmbedding,
        similarPrayer: closestPrayer,
      });

      arrayOfSimilarPrayersExcludingClosestPrayer.push(
        ...others.filter((prayer) => prayer.id !== closestPrayer.id),
      );
    }

    return {
      arrayOfPointsAndClosestPrayer,
      arrayOfSimilarPrayersExcludingClosestPrayer,
    };
  };

  deletePrayerPointAndUnlinkPrayers = async (
    prayerPointId: string,
    authorId: string,
  ): Promise<void> => {
    try {
      const deletedPrayerPoint =
        await this.prayerPointService.deletePrayerPoint(
          prayerPointId,
          authorId,
        );

      if (deletedPrayerPoint.prayerId) {
        const prayerIds = Array.isArray(deletedPrayerPoint.prayerId)
          ? deletedPrayerPoint.prayerId
          : [deletedPrayerPoint.prayerId];

        for (const id of prayerIds) {
          const prayer = await this.prayerService.getPrayer(id);
          if (
            prayer &&
            prayer.prayerPoints &&
            prayer.prayerPoints.includes(prayerPointId)
          ) {
            const updatedPrayerPoints = prayer.prayerPoints.filter(
              (pid) => pid !== prayerPointId,
            );
            await this.prayerService.updatePrayer(id, {
              prayerPoints: updatedPrayerPoints,
            });
          }
        }
      }
    } catch (error) {
      console.error(
        'Error deleting prayer point and unlinking prayers:',
        error,
      );
      throw error;
    }
  };
}

export const complexPrayerOperations = new ComplexPrayerOperations(
  prayerService,
  prayerPointService,
);
