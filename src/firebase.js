import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyA9dOJt8kfYoUapqv5tzKuLy-Sht272mFA",
    authDomain: "outil-de-pilotage-innov-hse.firebaseapp.com",
    projectId: "outil-de-pilotage-innov-hse",
    storageBucket: "outil-de-pilotage-innov-hse.firebasestorage.app",
    messagingSenderId: "618994752317",
    appId: "1:618994752317:web:4a40a412c1e8b95d8fc354"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)