import { IPrayerPointsService, prayerPointService } from './prayerPointService';
import { IPrayerService, prayerService } from './prayerService';

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
