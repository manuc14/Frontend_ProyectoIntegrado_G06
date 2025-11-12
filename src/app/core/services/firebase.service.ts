import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Extend ImportMeta to include env
declare global {
  interface ImportMeta {
    env: {
      [key: string]: string | undefined;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    // Get Firebase configuration from environment variables or fallback values
    const firebaseConfig = {
      apiKey: import.meta.env['VITE_FIREBASE_API_KEY'] || 'AIzaSyBGVl02Ur4bBUGDxfTjAKGtoBOdSQD5VSY',
      authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] || 'esimedia-frontend-g06.firebaseapp.com',
      projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'] || 'esimedia-frontend-g06',
      storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] || 'esimedia-frontend-g06.firebasestorage.app',
      messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] || '665446211711',
      appId: import.meta.env['VITE_FIREBASE_APP_ID'] || '1:665446211711:web:c63e3e1cbe8be276395f4a'
    };

    try {
      // Initialize Firebase
      const app = initializeApp(firebaseConfig);

      // Get Firebase services
      getAuth(app);
      getFirestore(app);
      getStorage(app);

      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }
}
