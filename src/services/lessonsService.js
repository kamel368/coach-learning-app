// src/services/lessonsService.js
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Récupérer une leçon
export async function getLesson(lessonId) {
  const ref = doc(db, "lessons", lessonId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Sauvegarder / créer une leçon
export async function saveLesson(lesson) {
  const ref = doc(db, "lessons", lesson.id);
  const payload = {
    ...lesson,
    updatedAt: serverTimestamp(),
    createdAt: lesson.createdAt || serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
}
