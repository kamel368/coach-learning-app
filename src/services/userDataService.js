import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// ============================================
// PROGRESSION UTILISATEUR
// ============================================

/**
 * Chemin : /userProgress/{userId}__{programId}
 * Structure :
 * {
 *   organizationId: string,
 *   userId: string,
 *   programId: string,
 *   percentage: number (0-100),
 *   completedLessons: string[],
 *   completedChapters: string[],
 *   lastAccessedAt: Timestamp,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */

export async function getUserProgress(userId, programId) {
  const progressId = `${userId}__${programId}`;
  const progressRef = doc(db, 'userProgress', progressId);
  const progressSnap = await getDoc(progressRef);
  
  if (progressSnap.exists()) {
    return { id: progressSnap.id, ...progressSnap.data() };
  }
  return null;
}

export async function createUserProgress(organizationId, userId, programId) {
  const progressId = `${userId}__${programId}`;
  const progressRef = doc(db, 'userProgress', progressId);
  
  const progressData = {
    organizationId,
    userId,
    programId,
    percentage: 0,
    completedLessons: [],
    completedChapters: [],
    lastAccessedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  await setDoc(progressRef, progressData);
  return progressData;
}

export async function updateUserProgress(userId, programId, updates) {
  const progressId = `${userId}__${programId}`;
  const progressRef = doc(db, 'userProgress', progressId);
  
  await updateDoc(progressRef, {
    ...updates,
    lastAccessedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
}

export async function markLessonComplete(userId, programId, lessonId) {
  const progress = await getUserProgress(userId, programId);
  
  if (!progress) {
    throw new Error('Progression introuvable');
  }
  
  const completedLessons = progress.completedLessons || [];
  
  if (!completedLessons.includes(lessonId)) {
    completedLessons.push(lessonId);
    
    await updateUserProgress(userId, programId, {
      completedLessons
    });
  }
}

// ============================================
// RÉSULTATS D'ÉVALUATION
// ============================================

/**
 * Chemin : /evaluationResults/{resultId}
 * Structure :
 * {
 *   organizationId: string,
 *   userId: string,
 *   programId: string,
 *   chapterId: string,
 *   score: number,
 *   maxScore: number,
 *   percentage: number,
 *   duration: number (secondes),
 *   completedAt: Timestamp,
 *   answers: [{
 *     exerciseId: string,
 *     correct: boolean,
 *     earnedPoints: number
 *   }]
 * }
 */

export async function saveEvaluationResult(resultData) {
  const {
    organizationId,
    userId,
    programId,
    chapterId,
    score,
    maxScore,
    duration,
    answers
  } = resultData;
  
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  const resultsRef = collection(db, 'evaluationResults');
  const resultDoc = {
    organizationId,
    userId,
    programId,
    chapterId,
    score,
    maxScore,
    percentage,
    duration,
    answers,
    completedAt: Timestamp.now()
  };
  
  const docRef = await addDoc(resultsRef, resultDoc);
  return { id: docRef.id, ...resultDoc };
}

export async function getEvaluationResults(userId, programId, chapterId) {
  const resultsRef = collection(db, 'evaluationResults');
  const q = query(
    resultsRef,
    where('userId', '==', userId),
    where('programId', '==', programId),
    where('chapterId', '==', chapterId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAllUserEvaluationResults(userId) {
  const resultsRef = collection(db, 'evaluationResults');
  const q = query(
    resultsRef,
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============================================
// GAMIFICATION
// ============================================

/**
 * Chemin : /gamification/{userId}
 * Structure :
 * {
 *   organizationId: string,
 *   userId: string,
 *   level: number,
 *   xp: number,
 *   badges: string[],
 *   stats: {
 *     lessonsCompleted: number,
 *     exercisesCompleted: number,
 *     evaluationsCompleted: number,
 *     excellentScores: number,
 *     totalTimeSpent: number
 *   },
 *   history: [{
 *     action: string,
 *     date: Timestamp,
 *     xp: number
 *   }],
 *   createdAt: Timestamp
 * }
 */

export async function getUserGamification(userId) {
  const gamifRef = doc(db, 'gamification', userId);
  const gamifSnap = await getDoc(gamifRef);
  
  if (gamifSnap.exists()) {
    return { id: gamifSnap.id, ...gamifSnap.data() };
  }
  return null;
}

export async function createUserGamification(organizationId, userId) {
  const gamifRef = doc(db, 'gamification', userId);
  
  const gamifData = {
    organizationId,
    userId,
    level: 1,
    xp: 0,
    badges: [],
    stats: {
      lessonsCompleted: 0,
      exercisesCompleted: 0,
      evaluationsCompleted: 0,
      excellentScores: 0,
      totalTimeSpent: 0
    },
    history: [],
    createdAt: Timestamp.now()
  };
  
  await setDoc(gamifRef, gamifData);
  return gamifData;
}

export async function addXP(userId, xpAmount, action) {
  let gamif = await getUserGamification(userId);
  
  if (!gamif) {
    throw new Error('Gamification introuvable');
  }
  
  const newXP = gamif.xp + xpAmount;
  const newLevel = Math.floor(newXP / 100) + 1; // 100 XP par niveau
  
  const gamifRef = doc(db, 'gamification', userId);
  
  await updateDoc(gamifRef, {
    xp: newXP,
    level: newLevel,
    history: [
      ...gamif.history,
      {
        action,
        date: Timestamp.now(),
        xp: xpAmount
      }
    ]
  });
}

export async function incrementStat(userId, statName) {
  const gamifRef = doc(db, 'gamification', userId);
  const gamif = await getUserGamification(userId);
  
  if (!gamif) {
    throw new Error('Gamification introuvable');
  }
  
  const stats = gamif.stats || {};
  stats[statName] = (stats[statName] || 0) + 1;
  
  await updateDoc(gamifRef, { stats });
}

export async function addBadge(userId, badgeId) {
  const gamifRef = doc(db, 'gamification', userId);
  const gamif = await getUserGamification(userId);
  
  if (!gamif) {
    throw new Error('Gamification introuvable');
  }
  
  const badges = gamif.badges || [];
  
  if (!badges.includes(badgeId)) {
    badges.push(badgeId);
    await updateDoc(gamifRef, { badges });
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Initialiser toutes les données utilisateur pour un nouveau programme
 */
export async function initializeUserData(organizationId, userId, programId) {
  console.log('🚀 Initialisation données utilisateur:', { organizationId, userId, programId });
  
  try {
    // Vérifier si la progression existe
    let progress = await getUserProgress(userId, programId);
    if (!progress) {
      progress = await createUserProgress(organizationId, userId, programId);
      console.log('✅ Progression créée');
    }
    
    // Vérifier si la gamification existe
    let gamif = await getUserGamification(userId);
    if (!gamif) {
      gamif = await createUserGamification(organizationId, userId);
      console.log('✅ Gamification créée');
    }
    
    return { progress, gamification: gamif };
  } catch (error) {
    console.error('❌ Erreur initialisation données utilisateur:', error);
    throw error;
  }
}

/**
 * Calculer le pourcentage de progression
 */
export function calculateProgressPercentage(completedLessons, totalLessons) {
  if (!totalLessons || totalLessons === 0) return 0;
  return Math.round((completedLessons.length / totalLessons) * 100);
}

/**
 * Calculer le niveau depuis l'XP
 */
export function calculateLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

/**
 * Calculer l'XP requis pour le prochain niveau
 */
export function getXPForNextLevel(currentXP) {
  const currentLevel = calculateLevel(currentXP);
  const nextLevelXP = currentLevel * 100;
  return nextLevelXP - currentXP;
}
