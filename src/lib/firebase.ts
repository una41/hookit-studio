import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const environmentConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
// Firebase web configuration is public, not a service-account credential.
// Keep a complete default so clean GitHub builds work without local .env files.
const defaultConfig = {
  apiKey: 'AIzaSyAVg2GltjmDRNvsA2d-DUXKr7Z5JpQ-FRI',
  authDomain: 'hookit-studio.firebaseapp.com',
  projectId: 'hookit-studio',
  appId: '1:1080737328594:web:22fc148eba5ccaa6ca6c0b',
};
// An explicitly supplied project must be complete; never mix two projects.
const config = Object.values(environmentConfig).some(Boolean) ? environmentConfig : defaultConfig;
export const firebaseConfigured = Object.values(config).every(Boolean);
export const isDemo =
  import.meta.env.VITE_DEMO_MODE === 'true' || (import.meta.env.DEV && !firebaseConfigured);
const app = firebaseConfigured && !isDemo ? (getApps()[0] ?? initializeApp(config)) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const apiBase = (
  import.meta.env.VITE_API_URL || 'https://hookit-studio.yn8206.workers.dev/api'
).replace(/\/$/, '');
