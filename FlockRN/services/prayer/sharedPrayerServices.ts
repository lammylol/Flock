import { validateContextFields } from '@/types/typeGuards';
import { deleteField, FieldValue } from 'firebase/firestore';

type ContextFields = {
  contextAsEmbeddings?: number[] | FieldValue;
  contextAsStrings?: string | FieldValue;
};

export function getContextFieldsIfEmbeddingsExist(
  embeddings: number[] | undefined,
  contextString: string | undefined,
): ContextFields {
  if (
    !validateContextFields({
      contextAsEmbeddings: embeddings,
      contextAsStrings: contextString,
    })
  ) {
    return {
      contextAsEmbeddings: deleteField(),
      contextAsStrings: deleteField(),
    };
  }
  return {
    contextAsEmbeddings: embeddings,
    contextAsStrings:
      typeof contextString === 'string' && contextString.trim()
        ? contextString.trim()
        : deleteField(),
  };
}
