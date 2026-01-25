import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

// Utilitaire pour timer compatible React StrictMode
const safeTimer = {
  timers: new Map(),
  start: (label) => {
    safeTimer.timers.set(label, performance.now());
  },
  end: (label) => {
    const startTime = safeTimer.timers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`${label}: ${duration.toFixed(2)}ms`);
      safeTimer.timers.delete(label);
    }
  }
};

// ⚡ CONSTANTE : Limite de tentatives par programme pour améliorer les performances
const MAX_ATTEMPTS_PER_PROGRAM = 20;

export function useHistorique(userId) {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [statistics, setStatistics] = useState({
    totalAttempts: 0,
    averageScore: 0,
    bestScore: 0,
    totalTime: 0
  });
  const [programStats, setProgramStats] = useState([]);
  const [filter, setFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // 🚀 CACHE : Évite de recharger les mêmes données plusieurs fois
  const cacheRef = useRef({ 
    programs: {},  // { programId: programName }
    chapters: {},   // { chapterId: chapterName }
    readingProgress: {} // { programId: percentage }
  });

  // 🚀 FONCTION HELPER : Récupérer le nom d'un programme avec cache
  const getProgramName = async (programId) => {
    if (cacheRef.current.programs[programId]) {
      return cacheRef.current.programs[programId];
    }
    
    try {
      // ⚠️ FALLBACK : Utiliser l'ancienne structure (chemin valide avec 2 segments)
      const programDoc = await getDoc(doc(db, 'programs', programId));
      const name = programDoc.exists() ? (programDoc.data().title || programDoc.data().name || 'Programme') : 'Programme';
      cacheRef.current.programs[programId] = name;
      return name;
    } catch (error) {
      console.error('⚠️ Erreur récupération programme:', programId, error);
      return 'Programme';
    }
  };

  // 🚀 FONCTION HELPER : Récupérer le nom d'un chapitre avec cache
  const getModuleName = async (programId, chapterId) => {
    const cacheKey = `${programId}_${chapterId}`;
    if (cacheRef.current.chapters[cacheKey]) {
      return cacheRef.current.chapters[cacheKey];
    }
    
    try {
      // ⚠️ FALLBACK : Utiliser l'ancienne structure (chemin valide avec 4 segments)
      const chapterDoc = await getDoc(doc(db, 'programs', programId, 'chapitres', chapterId));
      const name = chapterDoc.exists() ? (chapterDoc.data().title || 'Chapitre') : 'Chapitre';
      cacheRef.current.chapters[cacheKey] = name;
      return name;
    } catch (error) {
      console.error('⚠️ Erreur récupération chapitre:', chapterId, error);
      return 'Chapitre';
    }
  };

  // 🚀 FONCTION HELPER : Récupérer la progression de lecture avec cache
  const getReadingProgress = async (programId) => {
    if (cacheRef.current.readingProgress[programId] !== undefined) {
      return cacheRef.current.readingProgress[programId];
    }
    
    try {
      // ✅ Nouvelle structure : /userProgress/{userId}__{programId}
      const progressDocId = `${userId}__${programId}`;
      const progressRef = doc(db, 'userProgress', progressDocId);
      const progressSnap = await getDoc(progressRef);
      const progress = progressSnap.exists() ? (progressSnap.data().percentage || 0) : 0;
      cacheRef.current.readingProgress[programId] = progress;
      return progress;
    } catch (error) {
      console.log('Pas de progression pour', programId);
      return 0;
    }
  };

  // 🚀 FONCTION : Charger les évaluations d'un programme
  const loadEvaluationsForProgram = async (programId, programName) => {
    try {
      // ⚠️ FALLBACK : Utiliser l'ancienne structure (chemin valide avec 5 segments)
      const evaluationsRef = collection(db, 'users', userId, 'programs', programId, 'evaluations');
      // ⚡ OPTIMISATION : Limiter le nombre d'évaluations chargées
      const q = query(evaluationsRef, orderBy('completedAt', 'desc'), limit(MAX_ATTEMPTS_PER_PROGRAM));
      const evaluationsSnapshot = await getDocs(q);
      
      console.log('📊 Évaluations trouvées pour', programId, ':', evaluationsSnapshot.size);

      return evaluationsSnapshot.docs.map((evalDoc) => {
        const evalData = evalDoc.data();
        return {
          id: evalDoc.id,
          type: 'evaluation',
          programId: programId,
          programName: programName,
          chapterId: null,
          chapterName: null,
          // ✅ CORRECTION : Inclure tous les champs nécessaires
          score: evalData.earnedPoints || evalData.score || 0,
          maxScore: evalData.totalPoints || evalData.maxScore || 100,
          earnedPoints: evalData.earnedPoints || evalData.score || 0,
          totalPoints: evalData.totalPoints || evalData.maxScore || 100,
          percentage: evalData.score || evalData.percentage || 0,
          duration: evalData.duration || 0,
          completedAt: evalData.completedAt,
          passed: (evalData.score || evalData.percentage || 0) >= 50,
          results: evalData.results || [],
          answers: evalData.answers || {}
        };
      });
    } catch (error) {
      console.error('⚠️ Erreur récupération évaluations pour', programId, ':', error);
      return [];
    }
  };

  // 🚀 FONCTION : Charger les tentatives d'exercices d'un programme
  const loadExercisesForProgram = async (programId, programName) => {
    try {
      // ⚠️ FALLBACK : Utiliser l'ancienne structure (chemin valide avec 3 segments)
      const modulesSnapshot = await getDocs(collection(db, 'programs', programId, 'chapitres'));
      console.log('📘 Chapitres trouvés pour programme', programId, ':', modulesSnapshot.size);
      
      // ⚡ PARALLÉLISATION : Charger toutes les tentatives de chapters en parallèle
      const moduleAttemptsPromises = modulesSnapshot.docs.map(async (chapterDoc) => {
        const chapterName = await getModuleName(programId, chapterDoc.id);
        
        try {
          // ⚠️ FALLBACK : Utiliser l'ancienne structure (chemin valide avec 7 segments)
          const moduleAttemptsRef = collection(db, 'users', userId, 'programs', programId, 'chapitres', chapterDoc.id, 'attempts');
          // ⚡ OPTIMISATION : Limiter le nombre de tentatives par chapitre
          const q = query(moduleAttemptsRef, orderBy('completedAt', 'desc'), limit(MAX_ATTEMPTS_PER_PROGRAM));
          const moduleAttemptsSnapshot = await getDocs(q);
          
          console.log('  📝 Tentatives chapitre', chapterDoc.id, ':', moduleAttemptsSnapshot.size);
          
          return moduleAttemptsSnapshot.docs.map((attemptDoc) => {
            const attemptData = attemptDoc.data();
            return {
              id: attemptDoc.id,
              type: 'exercise',
              programId: programId,
              programName: programName,
              chapterId: chapterDoc.id,
              chapterName: chapterName,
              score: attemptData.earnedPoints || attemptData.score || 0,
              maxScore: attemptData.totalPoints || attemptData.maxScore || 100,
              percentage: attemptData.score || attemptData.percentage || 0,
              duration: attemptData.duration || 0,
              completedAt: attemptData.completedAt,
              passed: (attemptData.score || attemptData.percentage || 0) >= 50,
              results: attemptData.results || []
            };
          });
        } catch (error) {
          console.error('  ⚠️ Erreur récupération tentatives chapitre', chapterDoc.id, ':', error);
          return [];
        }
      });

      const allModuleAttempts = await Promise.all(moduleAttemptsPromises);
      return allModuleAttempts.flat();
    } catch (error) {
      console.error('⚠️ Erreur récupération chapters pour', programId, ':', error);
      return [];
    }
  };

  useEffect(() => {
    async function loadHistorique() {
      if (!userId) {
        console.log('❌ Pas de userId');
        setLoading(false);
        return;
      }

      try {
        console.log('🚀 Chargement historique pour userId:', userId);
        safeTimer.start('⏱️ Temps de chargement total');

        // 1. Récupérer le document utilisateur pour avoir les programmes assignés
        // ⚠️ FALLBACK : Utiliser l'ancienne structure (chemin valide avec 2 segments)
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
          console.log('❌ Utilisateur non trouvé');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const assignedPrograms = userData.assignedPrograms || [];
        console.log('📚 Programmes assignés:', assignedPrograms);

        // ⚡ OPTIMISATION MAJEURE : Charger tous les programmes EN PARALLÈLE
        safeTimer.start('⏱️ Chargement parallèle des tentatives');
        const programResults = await Promise.all(
          assignedPrograms.map(async (programId) => {
            const programName = await getProgramName(programId);
            
            // Pour chaque programme, charger évaluations et exercices EN PARALLÈLE
            const [evaluations, exercises] = await Promise.all([
              loadEvaluationsForProgram(programId, programName),
              loadExercisesForProgram(programId, programName)
            ]);
            
            return { programId, programName, evaluations, exercises };
          })
        );
        safeTimer.end('⏱️ Chargement parallèle des tentatives');

        // Fusionner toutes les tentatives
        const allAttempts = programResults.flatMap(({ evaluations, exercises }) => 
          [...evaluations, ...exercises]
        );

        // 4. Trier par date (plus récent en premier)
        allAttempts.sort((a, b) => {
          // 🔧 Fonction helper pour convertir en timestamp
          const getTimestamp = (completedAt) => {
            if (!completedAt) return 0;
            
            // Cas 1 : Firebase Timestamp avec toDate()
            if (typeof completedAt.toDate === 'function') {
              return completedAt.toDate().getTime();
            }
            
            // Cas 2 : Objet Date JavaScript
            if (completedAt instanceof Date) {
              return completedAt.getTime();
            }
            
            // Cas 3 : Timestamp Firebase avec seconds
            if (completedAt.seconds !== undefined) {
              return completedAt.seconds * 1000;
            }
            
            // Cas 4 : String ISO
            if (typeof completedAt === 'string') {
              return new Date(completedAt).getTime();
            }
            
            // Cas 5 : Nombre (timestamp)
            if (typeof completedAt === 'number') {
              return completedAt;
            }
            
            return 0;
          };
          
          const timestampA = getTimestamp(a.completedAt);
          const timestampB = getTimestamp(b.completedAt);
          
          return timestampB - timestampA; // Plus récent en premier
        });

        console.log('✅ Total tentatives chargées:', allAttempts.length);
        
        // 🐛 DEBUG : Vérifier le tri (afficher les 5 premières dates)
        if (allAttempts.length > 0) {
          console.log('📅 Ordre chronologique (5 premiers):', 
            allAttempts.slice(0, 5).map(a => ({
              type: a.type,
              date: a.completedAt?.toDate?.() || a.completedAt,
              percentage: a.percentage
            }))
          );
        }

        // 5. Calculer les stats globales
        const totalAttempts = allAttempts.length;
        const averageScore = totalAttempts > 0 
          ? Math.round(allAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts)
          : 0;
        const bestScore = totalAttempts > 0
          ? Math.max(...allAttempts.map(a => a.percentage || 0))
          : 0;
        const totalTime = allAttempts.reduce((sum, a) => sum + (a.duration || 0), 0);

        const stats = { totalAttempts, averageScore, bestScore, totalTime };
        console.log('📊 Statistiques calculées:', stats);

        // ⚡ OPTIMISATION : Calculer les stats par programme EN PARALLÈLE
        safeTimer.start('⏱️ Calcul des stats par programme');
        const programStats = await Promise.all(
          assignedPrograms.map(async (programId) => {
            const programName = await getProgramName(programId);
            const readingProgress = await getReadingProgress(programId);
            
            // Filtrer les tentatives de ce programme
            const programAttempts = allAttempts.filter(a => a.programId === programId);
            
            // Calculer le score moyen (0 si aucune tentative)
            const averageExerciseScore = programAttempts.length > 0
              ? Math.round(programAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / programAttempts.length)
              : 0;

            return {
              programId,
              programName,
              readingProgress,
              exerciseScore: averageExerciseScore,
              attemptCount: programAttempts.length
            };
          })
        );
        safeTimer.end('⏱️ Calcul des stats par programme');

        console.log('📊 Stats par programme (tous):', programStats);

        // Vérifier s'il y a potentiellement plus de tentatives
        const maxAttemptsLoaded = allAttempts.length >= MAX_ATTEMPTS_PER_PROGRAM * assignedPrograms.length;
        setHasMore(maxAttemptsLoaded);

        setAttempts(allAttempts);
        setStatistics(stats);
        setProgramStats(programStats);
        setLoading(false);
        
        safeTimer.end('⏱️ Temps de chargement total');
        console.log('🎯 Cache actuel:', {
          programs: Object.keys(cacheRef.current.programs).length,
          chapters: Object.keys(cacheRef.current.chapters).length,
          readingProgress: Object.keys(cacheRef.current.readingProgress).length
        });

      } catch (error) {
        console.error('❌ Erreur chargement historique:', error);
        console.error('❌ Stack:', error.stack);
        setLoading(false);
      }
    }

    loadHistorique();
  }, [userId]);

  // Filtrer les tentatives
  const filteredAttempts = attempts.filter(attempt => {
    if (filter === 'all') return true;
    if (filter === 'exercises') return attempt.type === 'exercise';
    if (filter === 'evaluations') return attempt.type === 'evaluation';
    return true;
  });

  return {
    loading,
    attempts: filteredAttempts,
    allAttempts: attempts,
    statistics,
    programStats,
    filter,
    setFilter,
    hasMore,
    loadingMore,
    // 🚀 BONUS : Exposer les fonctions de cache pour réutilisation
    getProgramName,
    getModuleName,
    getReadingProgress
  };
}
