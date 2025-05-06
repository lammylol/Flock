import { useCallback, useState } from 'react';
import uuid from 'react-native-uuid';
import { LinkedPrayerEntity, PrayerPoint } from '@/types/firebase';
import OpenAiService from '@/services/ai/openAIService';
import { auth } from '@/firebase/firebaseConfig';
import { complexPrayerOperations } from '@/services/prayer/complexPrayerOperations';

export function useAnalyzePrayer({
  transcription,
  userOptInAI,
  handlePrayerUpdate,
}: {
  transcription: string | null;
  userOptInAI: boolean;
  handlePrayerUpdate: (update: { content: string }) => void;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [arrayOfClosestPrayer, setArrayOfClosestPrayer] = useState<
    { prayerEntity: LinkedPrayerEntity; similarPrayer: LinkedPrayerEntity }[]
  >([]);
  const [arrayOfOtherPrayers, setArrayOfOtherPrayers] = useState<
    LinkedPrayerEntity[]
  >([]);
  const openAiService = OpenAiService.getInstance();
  const user = auth.currentUser;

  const analyzeContent = useCallback(
    async (mergedContent: string): Promise<PrayerPoint[]> => {
      try {
        setIsAnalyzing(true);
        console.log('analyzing content:', mergedContent);

        const analysis = await openAiService.analyzePrayerContent(
          mergedContent,
          !!transcription,
          userOptInAI,
        );

        console.log('AI analysis result:', analysis);
        handlePrayerUpdate({
          content: analysis.cleanedTranscription || mergedContent,
        });

        const updatedPrayerPoints: PrayerPoint[] = analysis.prayerPoints.map(
          (point) => ({
            ...point,
            id: uuid.v4(),
          }),
        );

        return updatedPrayerPoints;
      } catch (error) {
        console.error('Error using AI fill:', error);
        return [];
      } finally {
        setIsAnalyzing(false);
        setHasAnalyzed(true);
      }
    },
    [openAiService, transcription, userOptInAI, handlePrayerUpdate],
  );

  // this function is used to fetch similar prayer points and link them to the topic.
  // it returns an array of objects containing the closest prayer point first, and then the rest are stored
  // in a separate array for use for manual searching.
  const fetchClosestPrayerPointsAndReturnSimilar = useCallback(
    async (prayerPoints: PrayerPoint[]) => {
      try {
        const {
          arrayOfPointsAndClosestPrayer,
          arrayOfSimilarPrayersExcludingClosestPrayer,
        } = await complexPrayerOperations.fetchMostSimilarPrayerPoint(
          prayerPoints,
          user!.uid,
        );

        setArrayOfClosestPrayer(arrayOfPointsAndClosestPrayer);
        setArrayOfOtherPrayers(arrayOfSimilarPrayersExcludingClosestPrayer);
      } catch (error) {
        console.error('Error fetching similar prayer points:', error);
      }
    },
    [user],
  );

  return {
    isAnalyzing,
    hasAnalyzed,
    analyzeContent,
    fetchSimilarPrayerPointsAndLinkTopic:
      fetchClosestPrayerPointsAndReturnSimilar,
    arrayOfClosestPrayer,
    arrayOfOtherPrayers,
  };
}
