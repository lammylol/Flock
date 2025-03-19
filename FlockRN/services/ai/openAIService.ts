import OpenAI from 'openai';
import { PrayerPoint, PrayerTag } from '@/types/firebase';
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
  prayerPoints: PrayerPoint[];
}

export async function analyzePrayerContent(
  content: string,
  hasTranscription: boolean,
): Promise<AIAnalysis> {
  if (!content?.trim()) {
    throw new Error('No prayer content provided');
  }

  const titlePrompt =
    'Title: A concise title for the prayer, with a maximum character limit of 10.';

  const hasTranscriptionPrompt = `Content: I have a transcribed prayer from a voice recording. Since it was transcribed automatically, 
    there are likely errors in punctuation and some words may have been misheard by the transcriber.
    Please clean up the punctuation and correct any clear transcription mistakes while keeping the prayer as
    close to the original as possible, word for word. Do not rephrase, change the meaning, or summarize; only fix clear errors.`;

  const tagPrompt = `Tags: A list of up to 4 relevant tags for the prayer, selected from this list: ${allTags}`;

  const prayerPointPrompt = `Prayer Points: Generate at least 1 and at most 3 prayer points. Each must be a type of either a 'prayer request' or 'praise'. 
  Titles should be concise. Content should be clear and at most 50 words.`;

  const jsonFormat = `
  {
    \"title\": \"string\",
    ${hasTranscription ? '\"content\": \"string\",' : ''}
    \"tags\": [\"string\"],
    \"prayerPoints\": [
      {
        \"title\": \"string\",
        \"type\": \"string\",
        \"content\": \"string\"
      }
    ],
  }
`;

  const rules = `
    - Maintain a respectful and encouraging tone.
    - Do not fabricate details not present in the prayer.
    - Do not exceed the word limits for each field.
    - Return only valid JSON in this format:
    
    ${jsonFormat}
  `;

  const systemPrompt = `You are an AI that analyzes prayers and suggests the following: 
    ${titlePrompt}
    ${tagPrompt}
    ${hasTranscription ? hasTranscriptionPrompt : ''}
    ${prayerPointPrompt}
    ##Rules: 
    ${rules}
  `;

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
      prayerPoints: result.prayerPoints.map(
        (prayerPoint: Omit<PrayerPoint, 'id' | 'createdAt' | 'authorId'>) => ({
          title: prayerPoint.title.trim(),
          type: prayerPoint.type.trim(),
          content: prayerPoint.content.trim(),
        }),
      ),
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
