type FirebaseFirestoreErrorCode =
  | 'firestore/permission-denied'
  | 'firestore/unavailable'
  | 'firestore/not-found'
  | 'firestore/canceled'
  | 'firestore/unknown'
  | 'firestore/invalid-argument';

export interface FirebaseFirestoreError extends Error {
  code: FirebaseFirestoreErrorCode;
  message: string;
  name: string;
}

type FirebaseStorageErrorCode =
  | 'storage/unknown'
  | 'storage/object-not-found'
  | 'storage/bucket-not-found'
  | 'storage/project-not-found'
  | 'storage/quota-exceeded'
  | 'storage/unauthenticated'
  | 'storage/unauthorized'
  | 'storage/retry-limit-exceeded'
  | 'storage/invalid-checksum'
  | 'storage/canceled'
  | 'storage/invalid-event-name'
  | 'storage/invalid-url'
  | 'storage/invalid-argument'
  | 'storage/no-default-bucket'
  | 'storage/cannot-slice-blob'
  | 'storage/server-file-wrong-size';

export interface FirebaseStorageError extends Error {
  code: FirebaseStorageErrorCode;
  message: string;
  name: string;
}
