import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook pour gérer une évaluation complète de module
 * Mélange TOUS les exercices de TOUS les chapitres du module
 * @param {string} userId - ID de l'utilisateur
 * @param {string} programId - ID du programme
 * @param {string} moduleId - ID du module
 * @param {string} organizationId - ID de l'organisation (optionnel)
 */
export function useModuleEvaluation(userId, programId, moduleId, organizationId = null) {
  const [evaluation, setEvaluation] = useState(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fonction Fisher-Yates pour mélanger un tableau
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Charger tous les exercices de tous les chapitres du module
  useEffect(() => {
    async function loadModuleEvaluation() {
      if (!programId || !moduleId) return;

      try {
        setLoading(true);
        console.log('🔍 Chargement évaluation module:', { programId, moduleId });

        // 1. Récupérer tous les chapitres du module
        const modulesRef = organizationId
          ? collection(db, 'organizations', organizationId, 'programs', programId, 'modules')
          : collection(db, 'programs', programId, 'modules');
        
        const modulesSnap = await getDocs(modulesRef);
        
        console.log(`📚 ${modulesSnap.size} chapitres trouvés dans le programme`);
        if (organizationId) {
          console.log('🏢 Chargement depuis /organizations/' + organizationId);
        }

        // 2. Pour chaque chapitre, récupérer les exercices
        const allBlocks = [];
        
        for (const moduleDoc of modulesSnap.docs) {
          const chapterId = moduleDoc.id;
          const chapterData = moduleDoc.data();
          
          try {
            const exercisesRef = organizationId
              ? doc(db, 'organizations', organizationId, 'programs', programId, 'modules', chapterId, 'exercises', 'main')
              : doc(db, 'programs', programId, 'modules', chapterId, 'exercises', 'main');
            
            const exercisesSnap = await getDoc(exercisesRef);
            
            if (exercisesSnap.exists()) {
              const exerciseData = exercisesSnap.data();
              const blocks = exerciseData.blocks || [];
              
              console.log(`  ✅ Chapitre "${chapterData.title}": ${blocks.length} exercices`);
              
              // Ajouter la source du chapitre à chaque bloc
              blocks.forEach(block => {
                allBlocks.push({
                  ...block,
                  sourceChapterId: chapterId,
                  sourceChapterTitle: chapterData.title
                });
              });
            } else {
              console.log(`  ⚠️ Chapitre "${chapterData.title}": Pas d'exercices`);
            }
          } catch (error) {
            console.error(`  ❌ Erreur chapitre ${chapterId}:`, error);
          }
        }

        console.log(`🎯 Total exercices avant mélange: ${allBlocks.length}`);

        if (allBlocks.length === 0) {
          console.warn('⚠️ Aucun exercice trouvé dans ce module');
          setEvaluation({ blocks: [] });
          setLoading(false);
          return;
        }

        // 3. Mélanger tous les blocs avec Fisher-Yates
        const shuffledBlocks = shuffleArray(allBlocks);
        console.log(`🔀 Exercices mélangés: ${shuffledBlocks.length}`);

        // 4. Créer l'objet évaluation
        const evaluationData = {
          blocks: shuffledBlocks,
          moduleId,
          programId,
          totalBlocks: shuffledBlocks.length,
          createdAt: new Date().toISOString()
        };

        setEvaluation(evaluationData);
        console.log('✅ Évaluation chargée avec succès');
      } catch (error) {
        console.error('❌ Erreur chargement évaluation:', error);
        setEvaluation({ blocks: [] });
      } finally {
        setLoading(false);
      }
    }

    loadModuleEvaluation();
  }, [programId, moduleId, organizationId]);

  // Enregistrer une réponse
  const answerBlock = useCallback((blockId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [blockId]: answer
    }));
  }, []);

  // Aller au bloc suivant
  const goToNext = useCallback(() => {
    if (currentBlockIndex < (evaluation?.blocks?.length || 0) - 1) {
      setCurrentBlockIndex(prev => prev + 1);
    }
  }, [currentBlockIndex, evaluation]);

  // Aller au bloc précédent
  const goToPrevious = useCallback(() => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(prev => prev - 1);
    }
  }, [currentBlockIndex]);

  // Aller à un bloc spécifique
  const goToBlock = useCallback((index) => {
    if (index >= 0 && index < (evaluation?.blocks?.length || 0)) {
      setCurrentBlockIndex(index);
    }
  }, [evaluation]);

  // Calculer les résultats
  const calculateResults = useCallback(() => {
    if (!evaluation || !evaluation.blocks) {
      return { score: 0, totalPoints: 0, earnedPoints: 0, results: [] };
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const results = [];

    evaluation.blocks.forEach(block => {
      const answer = answers[block.id];
      const blockPoints = block.points || 0;
      totalPoints += blockPoints;

      let isCorrect = false;
      const correctAnswer = getCorrectAnswer(block);

      // Vérifier la réponse selon le type
      switch (block.type) {
        case 'flashcard':
          isCorrect = answer?.selfEvaluation === 'correct';
          break;
        case 'true_false':
          isCorrect = answer === block.content.correct;
          break;
        case 'qcm':
          isCorrect = answer === block.content.correctIndex;
          break;
        case 'qcm_selective':
          if (Array.isArray(answer) && Array.isArray(block.content.correctIndices)) {
            const sortedAnswer = [...answer].sort();
            const sortedCorrect = [...block.content.correctIndices].sort();
            isCorrect = JSON.stringify(sortedAnswer) === JSON.stringify(sortedCorrect);
          }
          break;
        case 'reorder':
          if (Array.isArray(answer) && Array.isArray(block.content.items)) {
            const correctOrder = block.content.items.map((_, i) => i);
            isCorrect = JSON.stringify(answer) === JSON.stringify(correctOrder);
          }
          break;
        case 'drag_drop':
          if (typeof answer === 'object' && Array.isArray(block.content.dropZones)) {
            isCorrect = block.content.dropZones.every(zone => {
              const zoneId = zone.id || `zone_${block.content.dropZones.indexOf(zone)}`;
              return answer[zoneId] === zone.correctAnswer;
            });
          }
          break;
        case 'match_pairs':
          if (typeof answer === 'object' && Array.isArray(block.content.pairs)) {
            isCorrect = block.content.pairs.every((pair, index) => {
              return answer[index] === index;
            });
          }
          break;
        default:
          isCorrect = false;
      }

      if (isCorrect) {
        earnedPoints += blockPoints;
      }

      results.push({
        blockId: block.id,
        type: block.type,
        isCorrect,
        points: blockPoints,
        earnedPoints: isCorrect ? blockPoints : 0,
        correctAnswer,
        userAnswer: answer,
        sourceChapterId: block.sourceChapterId,
        sourceChapterTitle: block.sourceChapterTitle
      });
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score, totalPoints, earnedPoints, results };
  }, [evaluation, answers]);

  // Soumettre l'évaluation
  const submitEvaluation = useCallback(async () => {
    if (!userId || !programId || !moduleId || !evaluation) {
      console.error('❌ Paramètres manquants pour soumettre');
      return { success: false };
    }

    try {
      setSubmitting(true);
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime) / 1000); // en secondes

      const results = calculateResults();

      // Sauvegarder dans Firebase
      const evaluationId = `eval_${Date.now()}`;
      const evaluationRef = doc(
        db,
        `users/${userId}/programs/${programId}/modules/${moduleId}/evaluations/${evaluationId}`
      );

      // Préparer les données à sauvegarder
      const evaluationData = {
        evaluationId,
        programId,
        moduleId,
        userId,
        answers,
        results: results.results,
        score: results.score,
        totalPoints: results.totalPoints,
        earnedPoints: results.earnedPoints,
        duration,
        completedAt: Timestamp.now(),
        createdAt: Timestamp.now()
      };

      // Nettoyer les valeurs undefined (Firebase ne les accepte pas)
      const cleanData = JSON.parse(JSON.stringify(evaluationData));

      await setDoc(evaluationRef, cleanData);

      console.log('✅ Évaluation soumise avec succès:', {
        score: results.score,
        duration,
        totalBlocks: evaluation.blocks.length
      });

      return { success: true, results, duration };
    } catch (error) {
      console.error('❌ Erreur soumission évaluation:', error);
      return { success: false, error: error.message };
    } finally {
      setSubmitting(false);
    }
  }, [userId, programId, moduleId, evaluation, answers, calculateResults, startTime]);

  return {
    evaluation,
    currentBlock: evaluation?.blocks?.[currentBlockIndex] || null,
    currentBlockIndex,
    totalBlocks: evaluation?.blocks?.length || 0,
    answers,
    answerBlock,
    goToNext,
    goToPrevious,
    goToBlock,
    submitEvaluation,
    loading,
    submitting,
    isLastBlock: currentBlockIndex === (evaluation?.blocks?.length || 0) - 1,
    progress: evaluation?.blocks?.length
      ? Math.round(((currentBlockIndex + 1) / evaluation.blocks.length) * 100)
      : 0
  };
}

// Helper pour obtenir la réponse correcte d'un bloc
function getCorrectAnswer(block) {
  switch (block.type) {
    case 'flashcard':
      return block.content.answer;
    case 'true_false':
      return block.content.correct;
    case 'qcm':
      return block.content.correctIndex;
    case 'qcm_selective':
      return block.content.correctIndices;
    case 'reorder':
      return block.content.items?.map((_, i) => i);
    case 'drag_drop':
      return block.content.dropZones?.reduce((acc, zone, index) => {
        const zoneId = zone.id || `zone_${index}`;
        acc[zoneId] = zone.correctAnswer;
        return acc;
      }, {});
    case 'match_pairs':
      return block.content.pairs?.map((_, i) => i);
    default:
      return null;
  }
}
