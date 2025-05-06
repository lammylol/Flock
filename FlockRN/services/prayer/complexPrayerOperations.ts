import {
  LinkedPrayerEntity,
  PartialLinkedPrayerEntity,
  PrayerPoint,
} from '@/types/firebase';
import { IPrayerPointsService, prayerPointService } from './prayerPointService';
import { IPrayerService, prayerService } from './prayerService';
import OpenAiService from '@/services/ai/openAIService';

class ComplexPrayerOperations {
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
      // Check if the prayer point already has an embedding
      let embeddingInput = (prayerPoint.embedding as number[]) || undefined;
      if (!embeddingInput) {
        // Generate embedding if not already present
        const input = `${prayerPoint.title} ${prayerPoint.content}`.trim();
        embeddingInput = await this.openService.getVectorEmbeddings(input);
      }
      if (embeddingInput.length === 0) {
        console.error('Empty embedding array');
        return { similarPrayers: [], prayerPointWithEmbedding: prayerPoint }; // Return an empty array if embedding is empty
      }
      // Find similar prayers using the generated embedding
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
      return { similarPrayers: [], prayerPointWithEmbedding: prayerPoint }; // Return an empty array if embedding is empty
    }
  };

  // this function is used to fetch similar prayer points and link them to the topic.
  // it returns an array of objects containing the closest prayer point first, and then the rest are stored
  // in a separate array for use for manual searching.
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

      // If this prayer point is associated with a prayer, update that prayer
      if (deletedPrayerPoint.prayerId) {
        // Handle the case where prayerId could be a string or an array of strings
        const prayerIds = Array.isArray(deletedPrayerPoint.prayerId)
          ? deletedPrayerPoint.prayerId
          : [deletedPrayerPoint.prayerId];

        // Update each associated prayer
        for (const id of prayerIds) {
          const prayer = await this.prayerService.getPrayer(id);
          if (
            prayer &&
            prayer.prayerPoints &&
            prayer.prayerPoints.includes(prayerPointId)
          ) {
            // Remove this prayer point ID from the prayer's prayerPoints array
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
