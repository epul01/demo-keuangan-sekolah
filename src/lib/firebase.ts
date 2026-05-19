/**
 * Firebase Configuration Module
 * 
 * Firebase Firestore sebagai database cloud alternative untuk Prisma/SQLite.
 * 
 * CARA SETUP FIREBASE:
 * 
 * 1. Buka https://console.firebase.google.com/
 * 2. Klik "Create a project" atau "Add project"
 * 3. Beri nama project (misal: "keuangan-sekolah")
 * 4. Aktifkan Google Analytics (opsional)
 * 5. Setelah project dibuat, klik ikon Web (</>) untuk menambahkan app
 * 6. Beri nama app dan daftarkan
 * 7. Salin konfigurasi firebaseConfig yang diberikan
 * 8. Buka Firestore Database → Create database → Start in test mode
 * 9. Buat file .env.local dan isi dengan konfigurasi Firebase
 * 
 * Environment Variables yang diperlukan:
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 * - DATABASE_MODE=firebase  (untuk beralih ke Firebase, default: prisma)
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  )
}

// Singleton Firebase App instance
let app: FirebaseApp | null = null
let db: Firestore | null = null

export function getFirebaseApp(): FirebaseApp {
  if (app) return app
  
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase belum dikonfigurasi. Silakan isi environment variables di .env.local.\n' +
      'Lihat panduan di src/lib/firebase.ts untuk cara setup.'
    )
  }

  if (getApps().length > 0) {
    app = getApp()
  } else {
    app = initializeApp(firebaseConfig)
  }

  return app
}

export function getFirebaseDb(): Firestore {
  if (db) return db
  
  const firebaseApp = getFirebaseApp()
  db = getFirestore(firebaseApp)
  return db
}

// Database mode: 'prisma' (default, local SQLite) or 'firebase' (cloud Firestore)
export function getDatabaseMode(): 'prisma' | 'firebase' {
  const mode = process.env.DATABASE_MODE || 'prisma'
  if (mode === 'firebase' && !isFirebaseConfigured()) {
    console.warn('⚠️ DATABASE_MODE=firebase tapi Firebase belum dikonfigurasi. Menggunakan Prisma.')
    return 'prisma'
  }
  return mode as 'prisma' | 'firebase'
}
