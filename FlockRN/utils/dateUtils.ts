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

export default normalizeDate;
