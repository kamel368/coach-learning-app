import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../firebase';

// Configuration XP
const XP_CONFIG = {
  LESSON_COMPLETED: 10,
  MODULE_COMPLETED: 50,
  EXERCISE_PASSED: 20,
  EXERCISE_EXCELLENT: 40,
  EVALUATION_PASSED: 100,
  DAILY_LOGIN: 5
};

// Configuration Niveaux
const LEVELS = [
  { level: 1, xpRequired: 0, title: 'Débutant' },
  { level: 2, xpRequired: 100, title: 'Apprenti' },
  { level: 3, xpRequired: 300, title: 'Confirmé' },
  { level: 4, xpRequired: 600, title: 'Avancé' },
  { level: 5, xpRequired: 1000, title: 'Expert' },
  { level: 6, xpRequired: 1500, title: 'Maître' },
  { level: 7, xpRequired: 2500, title: 'Légende' }
];

// Configuration Badges
const BADGES_CONFIG = {
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

export const useGamification = (userId) => {
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newBadges, setNewBadges] = useState([]);

  // Charger les données de gamification
  useEffect(() => {
    if (!userId) return;

    const loadGamification = async () => {
      try {
        const gamifRef = doc(db, 'users', userId, 'gamification', 'data');
        const gamifSnap = await getDoc(gamifRef);

        if (gamifSnap.exists()) {
          setGamificationData(gamifSnap.data());
        } else {
          // Créer les données initiales
          const initialData = {
            xp: 0,
            level: 1,
            currentStreak: 0,
            maxStreak: 0,
            lastActiveDate: null,
            badges: [],
            stats: {
              lessonsCompleted: 0,
              modulesCompleted: 0,
              exercisesCompleted: 0,
              evaluationsCompleted: 0,
              perfectScores: 0,
              excellentScores: 0,
              programsCompleted: 0,
              allProgramsCompleted: false,
              maxLessonsInDay: 0,
              todayLessons: 0,
              earlyBird: false
            },
            history: [],
            createdAt: new Date().toISOString()
          };
          await setDoc(gamifRef, initialData);
          setGamificationData(initialData);
        }
      } catch (error) {
        console.error('Erreur chargement gamification:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGamification();
  }, [userId]);

  // Calculer le niveau à partir des XP
  const calculateLevel = (xp) => {
    let currentLevel = LEVELS[0];
    for (const level of LEVELS) {
      if (xp >= level.xpRequired) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  };

  // Calculer la progression vers le niveau suivant
  const getLevelProgress = (xp) => {
    const currentLevel = calculateLevel(xp);
    const currentLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level);
    const nextLevel = LEVELS[currentLevelIndex + 1];

    if (!nextLevel) return 100; // Max level

    const xpInCurrentLevel = xp - currentLevel.xpRequired;
    const xpNeededForNextLevel = nextLevel.xpRequired - currentLevel.xpRequired;

    return Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);
  };

  // Mettre à jour le streak
  const updateStreak = async () => {
    if (!userId || !gamificationData) return;

    const today = new Date().toISOString().split('T')[0];
    const lastActive = gamificationData.lastActiveDate;

    let newStreak = gamificationData.currentStreak;

    if (!lastActive) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Même jour, pas de changement
        return;
      } else if (diffDays === 1) {
        // Jour consécutif
        newStreak += 1;
      } else {
        // Streak perdu
        newStreak = 1;
      }
    }

    const gamifRef = doc(db, 'users', userId, 'gamification', 'data');
    await updateDoc(gamifRef, {
      currentStreak: newStreak,
      maxStreak: Math.max(newStreak, gamificationData.maxStreak || 0),
      lastActiveDate: today,
      'stats.maxStreak': Math.max(newStreak, gamificationData.stats?.maxStreak || 0)
    });

    setGamificationData(prev => ({
      ...prev,
      currentStreak: newStreak,
      maxStreak: Math.max(newStreak, prev.maxStreak || 0),
      lastActiveDate: today
    }));

    // Vérifier les badges de streak
    checkAndUnlockBadges({ ...gamificationData.stats, maxStreak: newStreak });
  };

  // Ajouter des XP
  const addXP = async (amount, action) => {
    if (!userId || !gamificationData) return;

    const newXP = (gamificationData.xp || 0) + amount;
    const newLevel = calculateLevel(newXP);

    const gamifRef = doc(db, 'users', userId, 'gamification', 'data');
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

    return { newXP, newLevel, levelUp: newLevel.level > gamificationData.level };
  };

  // Mettre à jour une stat
  const updateStat = async (statName, value = 1) => {
    if (!userId) return;

    const gamifRef = doc(db, 'users', userId, 'gamification', 'data');
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
    checkAndUnlockBadges(newStats);
  };

  // Vérifier et débloquer les badges
  const checkAndUnlockBadges = async (stats) => {
    if (!userId || !gamificationData) return;

    const currentBadges = gamificationData.badges || [];
    const newlyUnlocked = [];

    for (const [badgeId, badge] of Object.entries(BADGES_CONFIG)) {
      if (!currentBadges.includes(badgeId) && badge.condition(stats)) {
        newlyUnlocked.push(badge);
      }
    }

    if (newlyUnlocked.length > 0) {
      const gamifRef = doc(db, 'users', userId, 'gamification', 'data');
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
    }
  };

  // Actions spécifiques
  const onLessonCompleted = async () => {
    await updateStreak();
    await addXP(XP_CONFIG.LESSON_COMPLETED, 'lesson_completed');
    await updateStat('lessonsCompleted');

    // Vérifier early bird
    const hour = new Date().getHours();
    if (hour < 8) {
      await updateStat('earlyBird', 1);
    }
  };

  const onModuleCompleted = async () => {
    await addXP(XP_CONFIG.MODULE_COMPLETED, 'module_completed');
    await updateStat('modulesCompleted');
  };

  const onExerciseCompleted = async (percentage) => {
    await updateStreak();
    if (percentage >= 80) {
      await addXP(XP_CONFIG.EXERCISE_EXCELLENT, 'exercise_excellent');
      await updateStat('excellentScores');
    } else if (percentage >= 50) {
      await addXP(XP_CONFIG.EXERCISE_PASSED, 'exercise_passed');
    }
    await updateStat('exercisesCompleted');
    if (percentage === 100) {
      await updateStat('perfectScores');
    }
  };

  const onEvaluationCompleted = async (percentage) => {
    await updateStreak();
    if (percentage >= 80) {
      await addXP(XP_CONFIG.EVALUATION_PASSED, 'evaluation_passed');
      await updateStat('excellentScores');
    }
    await updateStat('evaluationsCompleted');
    if (percentage === 100) {
      await updateStat('perfectScores');
    }
  };

  const onProgramCompleted = async () => {
    await addXP(XP_CONFIG.MODULE_COMPLETED * 2, 'program_completed');
    await updateStat('programsCompleted');
  };

  // Effacer les nouveaux badges (après affichage)
  const clearNewBadges = () => {
    setNewBadges([]);
  };

  return {
    // Data
    gamificationData,
    loading,
    newBadges,

    // Computed
    currentLevel: gamificationData ? calculateLevel(gamificationData.xp) : LEVELS[0],
    levelProgress: gamificationData ? getLevelProgress(gamificationData.xp) : 0,
    allBadges: BADGES_CONFIG,
    unlockedBadges: gamificationData?.badges || [],

    // Actions
    onLessonCompleted,
    onModuleCompleted,
    onExerciseCompleted,
    onEvaluationCompleted,
    onProgramCompleted,
    updateStreak,
    clearNewBadges
  };
};

export { BADGES_CONFIG, LEVELS, XP_CONFIG };
