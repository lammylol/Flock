import {
  CreatePrayerPointDTO,
  CreatePrayerTopicDTO,
  Prayer,
  PrayerPoint,
  PrayerPointInTopicJourneyDTO,
  PrayerTopic,
  UpdatePrayerTopicDTO,
} from '@/types/firebase';
import { EntityType } from './PrayerSubtypes';

export function getEntityType(obj: unknown): EntityType | undefined {
  if (typeof obj === 'object' && obj !== null) {
    if ('entityType' in obj && obj.entityType !== undefined) {
      return (obj as { entityType: EntityType }).entityType;
    }

    // Check based on available properties
    if (!('title' in obj)) {
      return EntityType.Prayer; // Assuming 'title' means it's a Prayer
    }
    if ('prayerType' in obj) {
      return EntityType.PrayerPoint;
    }
    if ('journey' in obj) {
      return EntityType.PrayerTopic;
    }
  }

  // Default return for unhandled cases
  return undefined;
}

// Reusable guard for validating embeddings and strings
export function validateContextFields(dto: unknown): boolean {
  if (typeof dto !== 'object' || dto === null) return false;

  const updateDTO = dto as {
    contextAsEmbeddings?: unknown;
    contextAsStrings?: unknown;
  };

  // Check contextAsEmbeddings
  const hasEmbeddings =
    'contextAsEmbeddings' in updateDTO &&
    Array.isArray(updateDTO.contextAsEmbeddings) &&
    updateDTO.contextAsEmbeddings.every(
      (item: unknown) => typeof item === 'number',
    );

  // Check contextAsStrings
  const hasStrings =
    'contextAsStrings' in updateDTO &&
    typeof updateDTO.contextAsStrings === 'string' &&
    updateDTO.contextAsStrings.trim() !== '';

  // Only allow valid embeddings or strings if they exist
  const noInvalidEmbedding =
    !('contextAsEmbeddings' in updateDTO) || hasEmbeddings;

  const noInvalidString = !('contextAsStrings' in updateDTO) || hasStrings;

  return noInvalidEmbedding && noInvalidString;
}

// Reusable guard for validating linkedTopics field.
export function validateLinkedTopicField(dto: unknown): boolean {
  if (typeof dto !== 'object' || dto === null) return false;

  const updateDTO = dto as { linkedTopics?: unknown };

  const hasValidLinkedTopics =
    'linkedTopics' in updateDTO &&
    Array.isArray(updateDTO.linkedTopics) &&
    updateDTO.linkedTopics.every(
      (item: unknown) =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'title' in item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string',
    );

  return !('linkedTopics' in updateDTO) || hasValidLinkedTopics;
}

// Reusable guard for validating linkedTopics field.
export function validateJourneyField(dto: unknown): boolean {
  if (typeof dto !== 'object' || dto === null) return false;

  const updateDTO = dto as { linkedTopics?: unknown };

  const hasValidJourneys =
    'journey' in updateDTO &&
    Array.isArray(updateDTO.journey) &&
    updateDTO.journey.every((item: unknown) =>
      isValidPrayerPointInJourneyDTO(item),
    );

  return !('journey' in updateDTO) || hasValidJourneys;
}

export function isPrayer(obj: unknown): obj is Prayer {
  return getEntityType(obj) === EntityType.Prayer;
}

export function isPrayerPoint(obj: unknown): obj is PrayerPoint {
  return getEntityType(obj) === EntityType.PrayerPoint;
}

export function isPrayerTopic(obj: unknown): obj is PrayerTopic {
  return getEntityType(obj) === EntityType.PrayerTopic;
}

export function isValidCreateTopicDTO(
  dto: unknown,
  aiOptIn: boolean,
): dto is CreatePrayerTopicDTO {
  if (typeof dto !== 'object' || dto === null) {
    return false;
  }

  const createDTO = dto as CreatePrayerTopicDTO;

  const hasRequiredFields =
    typeof createDTO.title === 'string' &&
    typeof createDTO.authorId === 'string' &&
    typeof createDTO.status === 'string' &&
    typeof createDTO.privacy === 'string';

  if (!hasRequiredFields) return false;

  if (aiOptIn) {
    const hasValidEmbeddings =
      Array.isArray(createDTO.contextAsEmbeddings) &&
      createDTO.contextAsEmbeddings.every((item) => typeof item === 'number');

    const hasValidStrings =
      typeof createDTO.contextAsStrings === 'string' &&
      createDTO.contextAsStrings.trim() !== '';

    if (!hasValidEmbeddings && !hasValidStrings) return false;
  }

  return validateJourneyField(dto);
}

export function isValidUpdateTopicDTO(
  dto: unknown,
): dto is UpdatePrayerTopicDTO {
  if (typeof dto !== 'object' || dto === null) return false;

  const updateDTO = dto as UpdatePrayerTopicDTO;
  return validateJourneyField(updateDTO) && validateContextFields(updateDTO);
}

export function isValidPrayerPointInJourneyDTO(
  obj: unknown,
): obj is PrayerPointInTopicJourneyDTO {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as PrayerPointInTopicJourneyDTO).id === 'string' &&
    typeof (obj as PrayerPointInTopicJourneyDTO).createdAt === 'string' &&
    typeof (obj as PrayerPointInTopicJourneyDTO).title === 'string' &&
    typeof (obj as PrayerPointInTopicJourneyDTO).content === 'string' &&
    typeof (obj as PrayerPointInTopicJourneyDTO).authorId === 'string' &&
    typeof (obj as PrayerPointInTopicJourneyDTO).authorName === 'string' &&
    typeof (obj as PrayerPointInTopicJourneyDTO).recipientName === 'string'
  );
}

export function isValidCreatePrayerPointDTO(
  dto: unknown,
): dto is CreatePrayerPointDTO {
  if (typeof dto !== 'object' || dto === null) return false;

  const createDTO = dto as CreatePrayerPointDTO;

  const hasValidAuthor =
    typeof createDTO.authorId === 'string' && createDTO.authorId.trim() !== '';

  const hasValidContent =
    typeof createDTO.content === 'string' && createDTO.content.trim() !== '';

  const hasValidTitle =
    typeof createDTO.title === 'string' && createDTO.title.trim() !== '';

  const contextIsValid = validateContextFields(createDTO);
  const linkedTopicsValid = validateLinkedTopicField(createDTO);

  return (
    hasValidAuthor &&
    hasValidContent &&
    hasValidTitle &&
    contextIsValid &&
    linkedTopicsValid
  );
}

export function isValidUpdatePrayerPointDTO(
  dto: unknown,
): dto is CreatePrayerPointDTO {
  // Use the reusable context validation function
  return validateContextFields(dto), validateLinkedTopicField(dto);
}
