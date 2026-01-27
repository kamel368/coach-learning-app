import { useState, useEffect } from 'react';
import { 
  getUserGamification, 
  createUserGamification, 
  addXP,
  incrementStat,
  addBadge
} from '../services/userDataService';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';

// Configuration XP
export const XP_CONFIG = {
  LESSON_COMPLETED: 10,        // XP par leçon (1 fois)
  CHAPTER_COMPLETED: 50,       // Bonus chapitre 100%
  PROGRAM_COMPLETED: 200,      // Mega bonus programme 100%
  EXERCISE_PASSED: 20,
  EXERCISE_EXCELLENT: 40,
  EVALUATION_PASSED: 100,
  DAILY_LOGIN: 5
};

// Configuration Niveaux
export const LEVELS = [
  { level: 1, xpRequired: 0, title: 'Débutant' },
  { level: 2, xpRequired: 100, title: 'Apprenti' },
  { level: 3, xpRequired: 300, title: 'Confirmé' },
  { level: 4, xpRequired: 600, title: 'Avancé' },
  { level: 5, xpRequired: 1000, title: 'Expert' },
  { level: 6, xpRequired: 1500, title: 'Maître' },
  { level: 7, xpRequired: 2500, title: 'Légende' }
];

// Configuration Badges
export const BADGES_CONFIG = {
  first_lesson: {
    id: 'first_lesson',
    name: 'Premier pas',
    description: 'Terminer sa première leçon',
    icon: '👣',
    condition: (stats) => stats.lessonsCompleted >= 1
  },
  reader_10: {
    id: 'reader_10',
    name: 'Lecteur assidu',
    description: 'Lire 10 leçons',
    icon: '📚',
    condition: (stats) => stats.lessonsCompleted >= 10
  },
  reader_50: {
    id: 'reader_50',
    name: 'Bibliophile',
    description: 'Lire 50 leçons',
    icon: '📖',
    condition: (stats) => stats.lessonsCompleted >= 50
  },
  perfect_score: {
    id: 'perfect_score',
    name: 'Perfectionniste',
    description: 'Obtenir 100% à une évaluation',
    icon: '⭐',
    condition: (stats) => stats.perfectScores >= 1
  },
  excellent_5: {
    id: 'excellent_5',
    name: 'Excellence',
    description: 'Obtenir 5 scores ≥ 80%',
    icon: '🏅',
    condition: (stats) => stats.excellentScores >= 5
  },
  program_complete: {
    id: 'program_complete',
    name: 'Expert',
    description: 'Terminer un programme complet',
    icon: '🎓',
    condition: (stats) => stats.programsCompleted >= 1
  },
  all_programs: {
    id: 'all_programs',
    name: 'Maître',
    description: 'Terminer tous les programmes assignés',
    icon: '👑',
    condition: (stats) => stats.allProgramsCompleted
  },
  streak_3: {
    id: 'streak_3',
    name: 'Régulier',
    description: '3 jours consécutifs',
    icon: '🔥',
    condition: (stats) => stats.maxStreak >= 3
  },
  streak_7: {
    id: 'streak_7',
    name: 'Marathonien',
    description: '7 jours consécutifs',
    icon: '💪',
    condition: (stats) => stats.maxStreak >= 7
  },
  streak_30: {
    id: 'streak_30',
    name: 'Inarrêtable',
    description: '30 jours consécutifs',
    icon: '🚀',
    condition: (stats) => stats.maxStreak >= 30
  },
  speed_learner: {
    id: 'speed_learner',
    name: 'Speed learner',
    description: 'Terminer 5 leçons en 1 jour',
    icon: '⚡',
    condition: (stats) => stats.maxLessonsInDay >= 5
  },
  early_bird: {
    id: 'early_bird',
    name: 'Lève-tôt',
    description: 'Étudier avant 8h du matin',
    icon: '🌅',
    condition: (stats) => stats.earlyBird
  }
};

/**
 * Hook pour gérer la gamification d'un utilisateur
 * Utilise la nouvelle structure /gamification/{userId}
 * 
 * @param {string} targetUserId - ID de l'utilisateur (optionnel, sinon utilise user du contexte)
 */
export function useGamification(targetUserId) {
  const { user: contextUser, organizationId } = useAuth();
  const userId = targetUserId || contextUser?.uid;
  
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  
  const { showBadgeUnlocked, showXPGained, showLevelUp } = useToast();
  
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    loadGamification();
  }, [userId, organizationId]);
  
  const loadGamification = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎮 Chargement gamification:', { userId });
      
      let gamif = await getUserGamification(userId);
      
      // Si pas de gamification, la créer
      if (!gamif) {
        console.log('🆕 Création nouvelle gamification');
        gamif = await createUserGamification(organizationId, userId);
      }
      
      setGamificationData(gamif);
      console.log('✅ Gamification chargée: nouvelle structure');
      
    } catch (err) {
      console.error('❌ Erreur chargement gamification:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculer le niveau actuel basé sur l'XP
  const calculateLevel = (xp) => {
    let currentLevel = LEVELS[0];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].xpRequired) {
        currentLevel = LEVELS[i];
        break;
      }
    }
    return currentLevel;
  };
  
  // Calculer la progression vers le niveau suivant
  const getLevelProgress = (xp) => {
    const currentLevel = calculateLevel(xp);
    const currentLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level);
    
    if (currentLevelIndex === LEVELS.length - 1) {
      return 100; // Niveau max atteint
    }
    
    const nextLevel = LEVELS[currentLevelIndex + 1];
    const xpInCurrentLevel = xp - currentLevel.xpRequired;
    const xpNeededForNextLevel = nextLevel.xpRequired - currentLevel.xpRequired;
    
    return Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);
  };
  
  // Mettre à jour le streak
  const updateStreak = async () => {
    if (!userId || !gamificationData) {
      console.warn('⚠️ updateStreak appelé avant chargement des données');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const lastActiveDate = gamificationData.lastActiveDate;
    
    if (lastActiveDate === today) {
      return; // Déjà actif aujourd'hui
    }
    
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = 1;
    
    if (lastActiveDate === yesterday) {
      newStreak = (gamificationData.currentStreak || 0) + 1;
    }
    
    const gamifRef = doc(db, 'gamification', userId);
    await updateDoc(gamifRef, {
      currentStreak: newStreak,
      maxStreak: Math.max(newStreak, gamificationData.maxStreak || 0),
      lastActiveDate: today
    });
    
    setGamificationData(prev => ({
      ...prev,
      currentStreak: newStreak,
      maxStreak: Math.max(newStreak, prev.maxStreak || 0),
      lastActiveDate: today
    }));
  };
  
  // Ajouter de l'XP
  const addXPAction = async (amount, action) => {
    if (!userId || !gamificationData) {
      console.warn('⚠️ addXP appelé avant chargement des données');
      return null;
    }
    
    const oldLevel = calculateLevel(gamificationData.xp);
    const newXP = gamificationData.xp + amount;
    const newLevel = calculateLevel(newXP);
    
    const gamifRef = doc(db, 'gamification', userId);
    await updateDoc(gamifRef, {
      xp: newXP,
      level: newLevel.level,
      history: arrayUnion({
        action,
        xp: amount,
        date: new Date().toISOString()
      })
    });
    
    setGamificationData(prev => ({
      ...prev,
      xp: newXP,
      level: newLevel.level
    }));
    
    // Afficher le toast XP
    showXPGained(amount);
    
    // Vérifier si level up
    if (newLevel.level > oldLevel.level) {
      showLevelUp(newLevel);
    }
    
    return { newXP, newLevel, levelUp: newLevel.level > oldLevel.level };
  };
  
  // Mettre à jour une stat
  const updateStat = async (statName, value = 1) => {
    if (!userId || !gamificationData) {
      console.warn('⚠️ updateStat appelé avant chargement des données');
      return;
    }
    
    const gamifRef = doc(db, 'gamification', userId);
    await updateDoc(gamifRef, {
      [`stats.${statName}`]: increment(value)
    });
    
    const newStats = {
      ...gamificationData.stats,
      [statName]: (gamificationData.stats?.[statName] || 0) + value
    };
    
    setGamificationData(prev => ({
      ...prev,
      stats: newStats
    }));
    
    // Vérifier les badges
    await checkAndUnlockBadges(newStats);
  };
  
  // Vérifier et débloquer les badges
  const checkAndUnlockBadges = async (stats) => {
    if (!userId || !gamificationData) {
      console.warn('⚠️ checkAndUnlockBadges appelé avant chargement des données');
      return [];
    }
    
    const currentBadges = gamificationData.badges || [];
    const newlyUnlocked = [];
    
    for (const [badgeId, badge] of Object.entries(BADGES_CONFIG)) {
      if (!currentBadges.includes(badgeId) && badge.condition(stats)) {
        newlyUnlocked.push(badge);
      }
    }
    
    if (newlyUnlocked.length > 0) {
      const gamifRef = doc(db, 'gamification', userId);
      
      await updateDoc(gamifRef, {
        badges: arrayUnion(...newlyUnlocked.map(b => b.id)),
        history: arrayUnion(...newlyUnlocked.map(b => ({
          action: 'badge_unlocked',
          badge: b.id,
          date: new Date().toISOString()
        })))
      });
      
      setGamificationData(prev => ({
        ...prev,
        badges: [...(prev.badges || []), ...newlyUnlocked.map(b => b.id)]
      }));
      
      setNewBadges(newlyUnlocked);
      
      // 🎉 Afficher un toast pour chaque nouveau badge débloqué
      newlyUnlocked.forEach(badge => {
        showBadgeUnlocked(badge);
      });
    }
    
    return newlyUnlocked;
  };
  
  // Actions spécifiques
  const onLessonCompleted = async (lessonId) => {
    if (!userId || !gamificationData) {
      console.warn('⚠️ onLessonCompleted appelé avant chargement des données');
      return null;
    }
    
    // ✅ VÉRIFICATION : lessonId obligatoire
    if (!lessonId) {
      console.warn('⚠️ onLessonCompleted appelé sans lessonId');
      return null;
    }
    
    // ✅ Vérifier si leçon déjà récompensée
    const rewardedActions = gamificationData.rewardedActions || {};
    const rewardedLessons = rewardedActions.lessons || [];
    
    if (rewardedLessons.includes(lessonId)) {
      console.log('ℹ️ Leçon déjà récompensée:', lessonId);
      return null;
    }
    
    console.log('✅ Nouvelle leçon complétée:', lessonId);
    
    await updateStreak();
    const result = await addXPAction(XP_CONFIG.LESSON_COMPLETED, 'lesson_completed');
    await updateStat('lessonsCompleted');
    
    // Early bird
    const hour = new Date().getHours();
    if (hour < 8) {
      await updateStat('earlyBird', 1);
    }
    
    // ✅ Marquer leçon comme récompensée
    const gamifRef = doc(db, 'gamification', userId);
    await updateDoc(gamifRef, {
      'rewardedActions.lessons': arrayUnion(lessonId)
    });
    
    console.log('💾 Leçon récompensée et sauvegardée:', lessonId);
    
    await loadGamification();
    return result;
  };
  
  const onChapterCompleted = async (chapterId) => {
    if (!userId || !gamificationData) {
      console.warn('⚠️ onChapterCompleted appelé avant chargement des données');
      return null;
    }
    
    // ✅ VÉRIFICATION : chapterId obligatoire
    if (!chapterId) {
      console.warn('⚠️ onChapterCompleted appelé sans chapterId');
      return null;
    }
    
    // ✅ Vérifier si chapitre déjà récompensé
    const rewardedActions = gamificationData.rewardedActions || {};
    const rewardedChapters = rewardedActions.chapters || [];
    
    if (rewardedChapters.includes(chapterId)) {
      console.log('ℹ️ Chapitre déjà récompensé:', chapterId);
      return null;
    }
    
    console.log('🏆 Chapitre complété:', chapterId);
    
    const result = await addXPAction(XP_CONFIG.CHAPTER_COMPLETED, 'chapter_completed');
    await updateStat('chaptersCompleted');
    
    // ✅ Marquer chapitre comme récompensé
    const gamifRef = doc(db, 'gamification', userId);
    await updateDoc(gamifRef, {
      'rewardedActions.chapters': arrayUnion(chapterId)
    });
    
    console.log('💾 Chapitre récompensé et sauvegardé:', chapterId);
    
    await loadGamification();
    return result;
  };
  
  const onExerciseCompleted = async (percentage, attemptId) => {
    if (!userId || !gamificationData) {
      console.warn('⚠️ onExerciseCompleted appelé avant chargement des données');
      return null;
    }
    
    // Vérifier si déjà récompensé
    const rewardedExercises = gamificationData.rewardedActions?.exercises || [];
    if (attemptId && rewardedExercises.includes(attemptId)) {
      console.log('ℹ️ Exercice déjà récompensé:', attemptId);
      return null;
    }
    
    await updateStreak();
    
    if (percentage >= 80) {
      await addXPAction(XP_CONFIG.EXERCISE_EXCELLENT, 'exercise_excellent');
      await updateStat('excellentScores');
    } else if (percentage >= 50) {
      await addXPAction(XP_CONFIG.EXERCISE_PASSED, 'exercise_passed');
    }
    
    await updateStat('exercisesCompleted');
    
    if (percentage === 100) {
      await updateStat('perfectScores');
    }
    
    // Marquer comme récompensé
    if (attemptId) {
      const gamifRef = doc(db, 'gamification', userId);
      await updateDoc(gamifRef, {
        'rewardedActions.exercises': arrayUnion(attemptId)
      });
    }
    
    await loadGamification();
    return { percentage };
  };
  
  const onEvaluationCompleted = async (percentage, evaluationId) => {
    if (!userId || !gamificationData) {
      console.warn('⚠️ onEvaluationCompleted appelé avant chargement des données');
      return null;
    }
    
    // Vérifier si déjà récompensé
    const rewardedEvaluations = gamificationData.rewardedActions?.evaluations || [];
    if (evaluationId && rewardedEvaluations.includes(evaluationId)) {
      console.log('ℹ️ Évaluation déjà récompensée:', evaluationId);
      return null;
    }
    
    await updateStreak();
    
    if (percentage >= 80) {
      await addXPAction(XP_CONFIG.EVALUATION_PASSED, 'evaluation_passed');
      await updateStat('excellentScores');
    }
    
    await updateStat('evaluationsCompleted');
    
    if (percentage === 100) {
      await updateStat('perfectScores');
    }
    
    // Marquer comme récompensé
    if (evaluationId) {
      const gamifRef = doc(db, 'gamification', userId);
      await updateDoc(gamifRef, {
        'rewardedActions.evaluations': arrayUnion(evaluationId)
      });
    }
    
    await loadGamification();
    return { percentage };
  };
  
  const onProgramCompleted = async (programId) => {
    if (!userId || !gamificationData) {
      console.warn('⚠️ onProgramCompleted appelé avant chargement des données');
      return null;
    }
    
    // ✅ VÉRIFICATION : programId obligatoire
    if (!programId) {
      console.warn('⚠️ onProgramCompleted appelé sans programId');
      return null;
    }
    
    // ✅ Vérifier si programme déjà récompensé
    const rewardedActions = gamificationData.rewardedActions || {};
    const rewardedPrograms = rewardedActions.programs || [];
    
    if (rewardedPrograms.includes(programId)) {
      console.log('ℹ️ Programme déjà récompensé:', programId);
      return null;
    }
    
    console.log('🎓 Programme complété:', programId);
    
    const result = await addXPAction(XP_CONFIG.PROGRAM_COMPLETED, 'program_completed');
    await updateStat('programsCompleted');
    
    // ✅ Marquer programme comme récompensé
    const gamifRef = doc(db, 'gamification', userId);
    await updateDoc(gamifRef, {
      'rewardedActions.programs': arrayUnion(programId)
    });
    
    console.log('💾 Programme récompensé et sauvegardé:', programId);
    
    await loadGamification();
    return result;
  };
  
  // Effacer les nouveaux badges (après affichage)
  const clearNewBadges = () => {
    setNewBadges([]);
  };
  
  return {
    // Data
    gamificationData,
    loading,
    error,
    newBadges,
    
    // Computed
    currentLevel: gamificationData ? calculateLevel(gamificationData.xp) : LEVELS[0],
    levelProgress: gamificationData ? getLevelProgress(gamificationData.xp) : 0,
    allBadges: BADGES_CONFIG,
    unlockedBadges: gamificationData?.badges || [],
    
    // Actions
    onLessonCompleted,
    onChapterCompleted,     // ✅ CHANGÉ
    onExerciseCompleted,
    onEvaluationCompleted,
    onProgramCompleted,
    updateStreak,
    clearNewBadges,
    refresh: loadGamification
  };
}
