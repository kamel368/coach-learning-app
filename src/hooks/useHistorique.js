import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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

  useEffect(() => {
    async function loadHistorique() {
      if (!userId) {
        console.log('❌ Pas de userId');
        setLoading(false);
        return;
      }

      try {
        console.log('🚀 Chargement historique pour userId:', userId);
        const allAttempts = [];

        // 1. Récupérer le document utilisateur pour avoir les programmes assignés
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
          console.log('❌ Utilisateur non trouvé');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const assignedPrograms = userData.assignedPrograms || [];
        console.log('📚 Programmes assignés:', assignedPrograms);

        // 2. Pour chaque programme, récupérer les évaluations
        for (const programId of assignedPrograms) {
          console.log('🔍 Recherche évaluations pour programme:', programId);
          
          // Récupérer le nom du programme
          let programName = 'Programme';
          try {
            const programDoc = await getDoc(doc(db, 'programs', programId));
            if (programDoc.exists()) {
              programName = programDoc.data().name || 'Programme';
            }
          } catch (error) {
            console.error('⚠️ Erreur récupération programme:', programId, error);
          }

          // Récupérer les évaluations
          try {
            const evaluationsRef = collection(db, 'users', userId, 'programs', programId, 'evaluations');
            const evaluationsSnapshot = await getDocs(evaluationsRef);
            
            console.log('📊 Évaluations trouvées pour', programId, ':', evaluationsSnapshot.size);

            evaluationsSnapshot.forEach((evalDoc) => {
              const evalData = evalDoc.data();
              
              // 📝 LOG DEBUG : Données brutes de l'évaluation
              console.log('📝 Données brutes évaluation:', {
                id: evalDoc.id,
                programId: programId,
                type: 'evaluation',
                ...evalData
              });
              
              allAttempts.push({
                id: evalDoc.id,
                type: 'evaluation',
                programId: programId,           // ✅ IMPORTANT : programId présent
                programName: programName,
                moduleId: null,                  // ✅ CORRIGÉ : moduleId au lieu de chapterId
                moduleName: null,                // ✅ CORRIGÉ : moduleName au lieu de chapterName
                score: evalData.earnedPoints || evalData.score || 0,
                maxScore: evalData.totalPoints || evalData.maxScore || 100,
                percentage: evalData.score || evalData.percentage || 0,
                duration: evalData.duration || 0,
                completedAt: evalData.completedAt,
                passed: (evalData.score || evalData.percentage || 0) >= 50,
                results: evalData.results || []
              });
            });
          } catch (error) {
            console.error('⚠️ Erreur récupération évaluations pour', programId, ':', error);
          }

          // 3. Récupérer aussi les tentatives par module si elles existent
          try {
            const modulesSnapshot = await getDocs(collection(db, 'programs', programId, 'modules'));
            
            console.log('📘 Modules trouvés pour programme', programId, ':', modulesSnapshot.size);
            
            for (const moduleDoc of modulesSnapshot.docs) {
              const moduleData = moduleDoc.data();
              const moduleName = moduleData.title || 'Module';
              
              // Vérifier si des tentatives existent pour ce module
              try {
                const moduleAttemptsRef = collection(db, 'users', userId, 'programs', programId, 'modules', moduleDoc.id, 'attempts');
                const moduleAttemptsSnapshot = await getDocs(moduleAttemptsRef);
                
                console.log('  📝 Tentatives module', moduleDoc.id, ':', moduleAttemptsSnapshot.size);
                
                moduleAttemptsSnapshot.forEach((attemptDoc) => {
                  const attemptData = attemptDoc.data();
                  
                  // 📝 LOG DEBUG : Données brutes de la tentative
                  console.log('📝 Données brutes tentative:', {
                    id: attemptDoc.id,
                    moduleId: moduleDoc.id,
                    programId: programId,
                    ...attemptData
                  });
                  
                  allAttempts.push({
                    id: attemptDoc.id,
                    type: 'exercise',
                    programId: programId,
                    programName: programName,
                    moduleId: moduleDoc.id,        // ✅ CORRIGÉ : moduleId au lieu de chapterId
                    moduleName: moduleName,         // ✅ CORRIGÉ : moduleName au lieu de chapterName
                    score: attemptData.earnedPoints || attemptData.score || 0,
                    maxScore: attemptData.totalPoints || attemptData.maxScore || 100,
                    percentage: attemptData.score || attemptData.percentage || 0,
                    duration: attemptData.duration || 0,
                    completedAt: attemptData.completedAt,
                    passed: (attemptData.score || attemptData.percentage || 0) >= 50,
                    results: attemptData.results || []
                  });
                });
              } catch (error) {
                console.error('  ⚠️ Erreur récupération tentatives module', moduleDoc.id, ':', error);
              }
            }
          } catch (error) {
            console.error('⚠️ Erreur récupération modules pour', programId, ':', error);
          }
        }

        // 4. Trier par date (plus récent en premier)
        allAttempts.sort((a, b) => {
          const dateA = a.completedAt?.toDate?.() || a.completedAt || new Date(0);
          const dateB = b.completedAt?.toDate?.() || b.completedAt || new Date(0);
          return dateB - dateA;
        });

        console.log('✅ Total tentatives chargées:', allAttempts.length);
        console.log('📋 Tentatives:', allAttempts);

        // 5. Calculer les stats
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

        // 6. Calculer les stats pour TOUS les programmes assignés (même ceux sans tentatives)
        const programStats = [];

        for (const programId of assignedPrograms) {
          // Récupérer le nom du programme
          let programName = 'Programme';
          try {
            const programDoc = await getDoc(doc(db, 'programs', programId));
            if (programDoc.exists()) {
              programName = programDoc.data().name || 'Programme';
            }
          } catch (error) {
            console.error('⚠️ Erreur récupération nom programme:', programId, error);
          }

          // NOUVEAU: Récupérer la progression de lecture
          let readingProgress = 0;
          try {
            const progressRef = doc(db, 'userProgress', userId, 'programs', programId);
            const progressSnap = await getDoc(progressRef);
            if (progressSnap.exists()) {
              readingProgress = progressSnap.data().percentage || 0;
            }
          } catch (error) {
            console.log('Pas de progression pour', programId);
          }

          // Filtrer les tentatives de ce programme
          const programAttempts = allAttempts.filter(a => a.programId === programId);
          
          // Calculer le score moyen (0 si aucune tentative)
          const averageExerciseScore = programAttempts.length > 0
            ? Math.round(programAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / programAttempts.length)
            : 0;

          programStats.push({
            programId,
            programName,
            readingProgress,      // ← NOUVEAU : progression lecture
            exerciseScore: averageExerciseScore,
            attemptCount: programAttempts.length
          });
        }

        console.log('📊 Stats par programme (tous):', programStats);

        setAttempts(allAttempts);
        setStatistics(stats);
        setProgramStats(programStats);
        setLoading(false);

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
    setFilter
  };
}
