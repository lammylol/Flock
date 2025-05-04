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

export default class OpenAiService {
  private static instance: OpenAiService; // Static instance to hold the singleton

  // Private constructor ensures that this class cannot be instantiated directly
  private constructor() { }

  // Method to get the singleton instance
  public static getInstance(): OpenAiService {
    if (!OpenAiService.instance) {
      OpenAiService.instance = new OpenAiService();
    }
    return OpenAiService.instance;
  }

  async analyzePrayerContent(
    content: string,
    hasTranscription: boolean,
    isAiEnabled: boolean,
  ): Promise<AIAnalysis> {
    if (!isAiEnabled) {
      console.warn(
        'AI service is disabled. Please fill in the details manually.',
      );
      return {
        title: '',
        cleanedTranscription: '',
        tags: [],
        prayerPoints: [],
      };
    }
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

    const prayerPointPrompt = `Prayer Points: Generate up to 5 prayer points for the most important things mentioned.
    Each must be a type of either 'request', 'praise', or 'repentance'. Titles should include context and object with a max character limit of 10.
    Content should be clear and at most 50 words.`;

    const jsonFormat = `
    {
      \"title\": \"string\",
      ${hasTranscription ? '\"content\": \"string\",' : ''}
      \"tags\": [\"string\"],
      \"prayerPoints\": [
        {
          \"title\": \"string\",
          \"prayerType\": \"string\",
          \"content\": \"string\"
        }
      ],
    }
  `;

    const rules = `
      - Maintain a respectful and encouraging tone.
      - Do not fabricate details not present in the prayer.
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
          (
            prayerPoint: Omit<PrayerPoint, 'id' | 'createdAt' | 'authorId'>,
          ) => ({
            title: prayerPoint.title.trim(),
            prayerType: prayerPoint.prayerType,
            content: prayerPoint.content.trim(),
          }),
        ),
      };
    } catch (error) {
      this.handleOpenAiError(error, 'AI');
    }
  }

  async getVectorEmbeddings(input: string): Promise<number[]> {
    if (!input?.trim()) {
      throw new Error('No input provided');
    }

    try {
      const completion = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: input,
        encoding_format: 'float',
        dimensions: 250, // adjust as needed
      });

      const embedding = completion.data?.[0]?.embedding;
      if (!embedding)
        throw new Error('Invalid vector embedding response format');

      return embedding;
    } catch (error) {
      this.handleOpenAiError(error, 'vector');
    }
  }

  private handleOpenAiError(error: unknown, context: 'AI' | 'vector'): never {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 429:
          throw new Error(
            `${context} service is temporarily unavailable. Please try again later.`,
          );
        case 401:
          throw new Error(
            `Authentication error with ${context} service. Please try again later.`,
          );
        default:
          throw new Error(`${context} service error. Please try again later.`);
      }
    }
    console.error(`Error in ${context} analysis:`, error);
    throw error;
  }

  // this is mainly for use with ai generation flow.
  async analyzePrayerWithEmbeddings(
    content: string,
    hasTranscription: boolean,
    isAiEnabled: boolean,
  ): Promise<AIAnalysis & { embedding: number[] }> {
    // Initial OpenAI analysis
    const analysis = await this.analyzePrayerContent(
      content,
      hasTranscription,
      isAiEnabled,
    );

    // Use cleaned content for embedding and get embedding.
    const inputForEmbedding = analysis.cleanedTranscription || content.trim();

    const embedding = await this.getVectorEmbeddings(inputForEmbedding);

    return {
      ...analysis,
      embedding,
    };
  }
}
