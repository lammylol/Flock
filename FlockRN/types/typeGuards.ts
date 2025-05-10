import {
  CreatePrayerPointDTO,
  CreatePrayerTopicDTO,
  Prayer,
  PrayerPoint,
  PrayerPointInTopicJourneyDTO,
  PrayerTopic,
  UpdatePrayerPointDTO,
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
export function validateContextFields(
  dto: unknown,
  createOrUpdate: 'create' | 'update',
): boolean {
  if (typeof dto !== 'object' || dto === null) return false;

  const { contextAsEmbeddings, contextAsStrings } = dto as {
    contextAsEmbeddings?: unknown;
    contextAsStrings?: unknown;
  };

  const isDeleteField = (value: unknown) =>
    typeof value === 'object' &&
    value !== null &&
    '_methodName' in value &&
    (value as { _methodName?: unknown })._methodName === 'deleteField';

  // Embeddings validation
  const embeddingsValid =
    contextAsEmbeddings === undefined ||
    (Array.isArray(contextAsEmbeddings) &&
      contextAsEmbeddings.every((item) => typeof item === 'number')) ||
    (createOrUpdate === 'update' && isDeleteField(contextAsEmbeddings));

  // Strings validation
  const stringsValid =
    contextAsStrings === undefined ||
    (typeof contextAsStrings === 'string' && contextAsStrings.trim() !== '') ||
    (createOrUpdate === 'update' && isDeleteField(contextAsStrings));

  return embeddingsValid && stringsValid;
}

// Reusable guard for validating linkedTopics field.
export function validateLinkedTopicField(dto: unknown): boolean {
  if (typeof dto !== 'object' || dto === null) return false;

  const updateDTO = dto as { linkedTopics?: unknown };

  if (!('linkedTopics' in updateDTO)) return true;

  const topics = updateDTO.linkedTopics;

  const hasValidLinkedTopics =
    Array.isArray(topics) &&
    topics.every((item: unknown) => {
      if (typeof item !== 'object' || item === null) return false;
      const topic = item as {
        id?: unknown;
        title?: unknown;
        entityType?: unknown;
      };
      return (
        typeof topic.id === 'string' &&
        topic.id.trim() !== '' &&
        typeof topic.title === 'string' &&
        topic.title.trim() !== '' &&
        (topic.entityType === EntityType.PrayerTopic ||
          topic.entityType === EntityType.PrayerPoint ||
          topic.entityType === EntityType.Prayer)
        // Add any other necessary checks for the topic object here
      );
    });

  return hasValidLinkedTopics;
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

// checks for mandatory fields in prayer topic.
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
    // Validate context fields only if they exist. Not required to exist when first loading because
    // a topic can be created before the prayers are added to journey for context.
    if ('contextAsEmbeddings' in dto || 'contextAsStrings' in dto) {
      if (!validateContextFields(dto, 'create')) {
        return false;
      }
    }
  }

  if ('journey' in createDTO && !validateJourneyField(createDTO.journey)) {
    return false;
  }
  return true;
}

// update topic check to make sure if the fields are added, they are valid.
export function isValidUpdateTopicDTO(
  dto: unknown,
): dto is UpdatePrayerTopicDTO {
  if (typeof dto !== 'object' || dto === null) return false;

  const updateDTO = dto as UpdatePrayerTopicDTO;
  if ('journey' in dto && !validateJourneyField(updateDTO)) {
    return false;
  }

  if ('contextAsEmbeddings' in updateDTO || 'contextAsStrings' in updateDTO) {
    if (!validateContextFields(updateDTO, 'update')) {
      return false; // Return false if validation fails
    }
  }

  return true; // Return true if all validations pass
}

// prayer in journey must have all these fields.
export function isValidPrayerPointInJourneyDTO(
  obj: unknown,
): obj is PrayerPointInTopicJourneyDTO {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as PrayerPointInTopicJourneyDTO).id === 'string' &&
    // (obj as PrayerPointInTopicJourneyDTO).createdAt instanceof Date &&
    typeof (obj as PrayerPointInTopicJourneyDTO).title === 'string' &&
    typeof (obj as PrayerPointInTopicJourneyDTO).content === 'string' &&
    typeof (obj as PrayerPointInTopicJourneyDTO).authorId === 'string' &&
    typeof (obj as PrayerPointInTopicJourneyDTO).authorName === 'string' &&
    typeof (obj as PrayerPointInTopicJourneyDTO).recipientName === 'string'
  );
}

// this checks to make sure prayer point has the right fields.
export function isValidCreatePrayerPointDTO(
  dto: unknown,
): dto is CreatePrayerPointDTO {
  if (typeof dto !== 'object' || dto === null) return false;

  const createDTO = dto as CreatePrayerPointDTO;

  // Validate content if it's provided
  const hasValidContent =
    createDTO.content !== undefined &&
    typeof createDTO.content === 'string' &&
    createDTO.content.trim() !== '';

  // Validate title if it's provided
  const hasValidTitle =
    createDTO.title !== undefined &&
    typeof createDTO.title === 'string' &&
    createDTO.title.trim() !== '';

  // Ensure at least one of content or title is valid
  const hasValidContentOrTitle = hasValidContent || hasValidTitle;

  // Optional: contextAsEmbeddings/contextAsStrings check
  if ('contextAsEmbeddings' in dto || 'contextAsStrings' in dto) {
    if (!validateContextFields(dto, 'create')) {
      return false; // Return false if validation fails
    }
  }

  // Optional: linkedTopics check
  if ('linkedTopics' in dto) {
    if (!validateLinkedTopicField(dto)) {
      return false; // Return false if validation fails
    }
  }

  return hasValidContentOrTitle; // Ensure at least one of content or title is valid
}

export function isValidUpdatePrayerPointDTO(
  dto: UpdatePrayerPointDTO,
): dto is UpdatePrayerPointDTO {
  if ('linkedTopics' in dto) {
    if (!validateLinkedTopicField(dto)) {
      return false; // Return false if validation fails
    }
  }

  if ('contextAsEmbeddings' in dto || 'contextAsStrings' in dto) {
    if (!validateContextFields(dto, 'update')) {
      return false; // Return false if validation fails
    }
  }
  // Return true if all validations pass
  return true;
}
