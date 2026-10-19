import { initializeApp } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebase_config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let firebase_app: FirebaseApp | null = null

// 설정값이 비어 있어도 사이트가 깨지지 않도록 처음 사용할 때 초기화
const getFirebaseApp = (): FirebaseApp => {
  if (!firebase_app) firebase_app = initializeApp(firebase_config)
  return firebase_app
}

export const getFirestoreDatabase = () => getFirestore(getFirebaseApp())
export const getFirebaseAuth = () => getAuth(getFirebaseApp())
