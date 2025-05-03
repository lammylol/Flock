// __mocks__/firebase/app.ts
import { db } from './firestore';
import { auth } from './auth';

export const initializeApp = jest.fn();
export const getApp = jest.fn().mockReturnValue({ name: 'mock-app' });
export { db, auth };