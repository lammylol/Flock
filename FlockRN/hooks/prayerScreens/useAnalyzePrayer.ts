import { useCallback, useState } from 'react';
import uuid from 'react-native-uuid';
import { PrayerPoint } from '@/types/firebase';
import OpenAiService from '@/services/ai/openAIService';

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
  const openAiService = OpenAiService.getInstance();

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

  return {
    isAnalyzing,
    hasAnalyzed,
    analyzeContent,
  };
}
