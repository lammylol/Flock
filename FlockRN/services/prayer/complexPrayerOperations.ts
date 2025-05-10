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
import { isValidCreateTopicDTO, isValidUpdateTopicDTO } from '@/types/typeGuards';
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
        (a, b) => (b.similarity ?? 0) - (a.similarity ?? 0),
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
