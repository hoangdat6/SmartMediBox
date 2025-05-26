import { app, database } from './firebaseConfig';

// Import this file once at app startup to initialize Firebase
export const initializeFirebase = () => {
  console.log('Firebase initialized successfully');
  return { app, database };
};
