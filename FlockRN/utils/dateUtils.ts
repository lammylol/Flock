import { Timestamp } from 'firebase/firestore';

const normalizeDate = (input: any): Date => {
  if (input instanceof Date) return input;
  if (input?.seconds != null && input?.nanoseconds != null) {
    // Assume it's a Firestore Timestamp-like object
    return new Date(input.seconds * 1000 + input.nanoseconds / 1e6);
  }
  if (Timestamp && input instanceof Timestamp) {
    // Optional: Handle real Firestore Timestamp instances
    return input.toDate();
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
