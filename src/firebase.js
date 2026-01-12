// src/firebase.js
import { initializeApp, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC-IpCoGFM11pxotPTf5Tyi78vFrSQp4QI",
  authDomain: "coach-learning-app.firebaseapp.com",
  projectId: "coach-learning-app",
  storageBucket: "coach-learning-app.firebasestorage.app",
  messagingSenderId: "510964880802",
  appId: "1:510964880802:web:f4312e4ae06be3b9fc0efb",
  measurementId: "G-RR0ZFX51CD"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Fonction pour créer un utilisateur sans déconnecter l'admin
export async function createUserWithoutSignOut(email, password) {
  let secondaryApp;
  try {
    // Vérifier si l'app secondaire existe déjà
    try {
      secondaryApp = getApp("Secondary");
    } catch {
      secondaryApp = initializeApp(firebaseConfig, "Secondary");
    }

    const secondaryAuth = getAuth(secondaryApp);

    // Créer le nouvel utilisateur
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password
    );

    // Déconnecter l'instance secondaire
    await signOut(secondaryAuth);

    return userCredential.user;
  } catch (error) {
    console.error("Erreur création user:", error);
    throw error;
  }
}
