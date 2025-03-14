import OpenAI from 'openai';
import { PrayerTag } from '@/types/firebase';
import { allTags } from '@/types/Tag';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY as string,
  dangerouslyAllowBrowser: true,
});

interface AIAnalysis {
  title: string;
  cleanedTranscription?: string;
  tags: PrayerTag[];
}

export async function analyzePrayerContent(
  content: string,
  hasTranscription: boolean,
): Promise<AIAnalysis> {
  if (!content?.trim()) {
    throw new Error('No prayer content provided');
  }

  const hasTranscriptionPrompt = `, and edits the voice-transcription content to 
       make it as accurate as possible to what the user intended to say`;

  const systemPrompt = `You are an AI that analyzes prayers that are transcribed from a voice recording
       and suggests appropriate titles and tags ${hasTranscription ? hasTranscriptionPrompt : ''}. Available tags are: ${allTags}.
       All prayers should be a praise if it is about a highlight, and a prayer request if there is a need.
       Return only JSON with \'title\' and \'content\' and \'tags\' fields. Choose maximum 2 most relevant tags.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Analyze this prayer: ${content}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('Invalid AI response format');
    }

    let result;
    try {
      result = JSON.parse(completion.choices[0].message.content);
      if (!result.title || !Array.isArray(result.tags)) {
        throw new Error('Invalid response structure');
      }
    } catch {
      throw new Error('Failed to parse AI response');
    }

    return {
      title: result.title.trim(),
      cleanedTranscription: hasTranscription
        ? result.content.trim().replace(/(\r\n|\n|\r)/gm, ' ')
        : undefined,
      tags: result.tags
        .filter((tag: string) => allTags.includes(tag))
        .slice(0, 2),
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 429:
          throw new Error(
            'AI service is temporarily unavailable. Please try again later or fill in the details manually.',
          );
        case 401:
          throw new Error(
            'Authentication error with AI service. Please try again later.',
          );
        default:
          throw new Error(
            'AI service error. Please try again or fill in the details manually.',
          );
      }
    }
    console.error('Error analyzing prayer:', error);
    throw error;
  }
}
