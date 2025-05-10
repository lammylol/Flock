import { deleteField, FieldValue } from 'firebase/firestore';

type ContextFields = {
  contextAsEmbeddings?: number[] | FieldValue;
  contextAsStrings?: string | FieldValue;
};

export function getContextFieldsIfEmbeddingsExist(
  embeddings: number[] | undefined,
  contextString: string | undefined,
  isNewPrayerPoint: boolean,
): ContextFields {
  if (embeddings == undefined || embeddings.length === 0) {
    return {
      // deleteField() is used to remove the field from Firestore. if not, undefined doesn't load anything.
      contextAsEmbeddings: isNewPrayerPoint ? undefined : deleteField(),
      contextAsStrings: isNewPrayerPoint ? undefined : deleteField(),
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
