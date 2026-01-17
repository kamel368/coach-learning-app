import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 📊 SERVICE GESTION PROGRESSION APPRENANT
 * 
 * Structure Firestore :
 * userProgress/{userId}/programs/{programId}
 *   - completedLessons: [lessonId1, lessonId2, ...]
 *   - currentLesson: lessonId
 *   - lastAccessedAt: timestamp
 *   - percentage: 0-100
 */

/**
 * Récupérer la progression d'un utilisateur sur un programme
 */
export async function getUserProgramProgress(userId, programId) {
  try {
    const progressRef = doc(db, `userProgress/${userId}/programs/${programId}`);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      return progressSnap.data();
    }
    
    // Première visite du programme
    return {
      completedLessons: [],
      currentLesson: null,
      lastAccessedAt: null,
      percentage: 0
    };
  } catch (error) {
    console.error('Erreur getUserProgramProgress:', error);
    throw error;
  }
}

/**
 * Récupérer toutes les progressions d'un utilisateur
 */
export async function getAllUserProgress(userId) {
  try {
    const programsRef = collection(db, `userProgress/${userId}/programs`);
    const snapshot = await getDocs(programsRef);
    
    const progressMap = {};
    snapshot.forEach(doc => {
      progressMap[doc.id] = doc.data();
    });
    
    return progressMap;
  } catch (error) {
    console.error('Erreur getAllUserProgress:', error);
    throw error;
  }
}

/**
 * Marquer une leçon comme terminée
 */
export async function markLessonCompleted(userId, programId, lessonId, totalLessons) {
  try {
    const progressRef = doc(db, `userProgress/${userId}/programs/${programId}`);
    const progressSnap = await getDoc(progressRef);
    
    let completedLessons = [];
    
    if (progressSnap.exists()) {
      completedLessons = progressSnap.data().completedLessons || [];
    }
    
    // Ajouter la leçon si pas déjà terminée
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
    }
    
    const percentage = Math.round((completedLessons.length / totalLessons) * 100);
    
    await setDoc(progressRef, {
      completedLessons,
      currentLesson: lessonId,
      lastAccessedAt: new Date().toISOString(),
      percentage
    }, { merge: true });
    
    return { completedLessons, percentage };
  } catch (error) {
    console.error('Erreur markLessonCompleted:', error);
    throw error;
  }
}

/**
 * Mettre à jour la leçon en cours
 */
export async function updateCurrentLesson(userId, programId, lessonId) {
  try {
    const progressRef = doc(db, `userProgress/${userId}/programs/${programId}`);
    
    await setDoc(progressRef, {
      currentLesson: lessonId,
      lastAccessedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Erreur updateCurrentLesson:', error);
    throw error;
  }
}

/**
 * Calculer la progression globale d'un utilisateur
 */
export async function calculateGlobalProgress(userId) {
  try {
    const allProgress = await getAllUserProgress(userId);
    
    if (Object.keys(allProgress).length === 0) {
      return 0;
    }
    
    const totalPercentage = Object.values(allProgress)
      .reduce((sum, prog) => sum + (prog.percentage || 0), 0);
    
    return Math.round(totalPercentage / Object.keys(allProgress).length);
  } catch (error) {
    console.error('Erreur calculateGlobalProgress:', error);
    return 0;
  }
}
