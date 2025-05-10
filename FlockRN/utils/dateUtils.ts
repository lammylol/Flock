import { Timestamp } from 'firebase/firestore';

// Support Firestore Timestamp-like plain objects
type TimestampLike = {
  seconds: number;
  nanoseconds: number;
};

const isTimestampLike = (input: unknown): input is TimestampLike =>
  typeof input === 'object' &&
  input !== null &&
  'seconds' in input &&
  'nanoseconds' in input &&
  typeof (input as TimestampLike).seconds === 'number' &&
  typeof (input as TimestampLike).nanoseconds === 'number';

const normalizeDate = (
  input: Date | Timestamp | TimestampLike | string | number | null | undefined,
): Date => {
  if (input instanceof Date) return input;

  if (input instanceof Timestamp) {
    return input.toDate();
  }

  if (isTimestampLike(input)) {
    return new Date(input.seconds * 1000 + input.nanoseconds / 1e6);
  }

  const date = new Date(input ?? Date.now());
  return isNaN(date.getTime()) ? new Date() : date;
};

// Converts Firestore Timestamp to a formatted string (just the date).
const getDateString = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return 'Unknown Date'; // Handle case if Timestamp is undefined

  // Normalize the timestamp into a Date object if it's a Timestamp
  const date =
    timestamp instanceof Timestamp
      ? timestamp.toDate()
      : normalizeDate(timestamp);

  // Format it into just a string with the date part (no time)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export { normalizeDate, getDateString };
