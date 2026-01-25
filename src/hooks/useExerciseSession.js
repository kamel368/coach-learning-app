import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook pour gérer une session d'exercices côté apprenant
 * @param {string} userId - ID de l'utilisateur
 * @param {string} programId - ID du programme
 * @param {string} chapterId - ID du chapitre
 * @param {string} organizationId - ID de l'organisation (optionnel)
 */
export function useExerciseSession(userId, programId, chapterId, organizationId = null) {
  const [exercises, setExercises] = useState(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Charger les exercices
  useEffect(() => {
    async function loadExercises() {
      if (!programId || !chapterId) return;
      
      try {
        setLoading(true);
        
        // Charger depuis l'organisation si disponible
        let exercisesSnap;
        if (organizationId) {
          const orgExercisesRef = doc(
            db,
            'organizations', organizationId, 'programs', programId, 'chapitres', chapterId, 'exercises', 'main'
          );
          exercisesSnap = await getDoc(orgExercisesRef);
          console.log('🎯 Exercices depuis /organizations/' + organizationId + '/programs/' + programId + '/chapitres/' + chapterId);
        }
        
        // Fallback vers ancienne structure
        if (!exercisesSnap || !exercisesSnap.exists()) {
          const exercisesRef = doc(
            db,
            'programs', programId, 'chapitres', chapterId, 'exercises', 'main'
          );
          exercisesSnap = await getDoc(exercisesRef);
          console.log('⚠️ Fallback: Exercices depuis /programs/' + programId + '/chapitres/' + chapterId);
        }
        
        if (exercisesSnap.exists()) {
          const data = exercisesSnap.data();
          setExercises(data);
          
          // Initialiser les réponses vides
          const emptyAnswers = {};
          (data.blocks || []).forEach(block => {
            emptyAnswers[block.id] = null;
          });
          setAnswers(emptyAnswers);
        } else {
          setExercises({ blocks: [], settings: {} });
        }
      } catch (error) {
        console.error('Erreur chargement exercices:', error);
        alert('Erreur lors du chargement des exercices');
      } finally {
        setLoading(false);
      }
    }
    
    loadExercises();
  }, [programId, chapterId, organizationId]);

  // Répondre à un exercice
  const answerBlock = useCallback((blockId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [blockId]: answer
    }));
  }, []);

  // Navigation
  const goToNext = useCallback(() => {
    if (!exercises) return;
    if (currentBlockIndex < exercises.blocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
    }
  }, [currentBlockIndex, exercises]);

  const goToPrevious = useCallback(() => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(prev => prev - 1);
    }
  }, [currentBlockIndex]);

  const goToBlock = useCallback((index) => {
    if (!exercises) return;
    if (index >= 0 && index < exercises.blocks.length) {
      setCurrentBlockIndex(index);
    }
  }, [exercises]);

  // Calculer les résultats
  const calculateResults = useCallback(() => {
    if (!exercises) return { score: 0, maxScore: 0, results: [] };

    const blocks = exercises.blocks || [];
    let totalScore = 0;
    let maxScore = 0;
    const results = [];

    blocks.forEach(block => {
      const userAnswer = answers[block.id];
      const points = block.points || 0;
      maxScore += points;

      let isCorrect = false;
      let earnedPoints = 0;

      // Vérifier la réponse selon le type
      switch (block.type) {
        case 'flashcard':
          // Flashcard : toujours correct (auto-évaluation)
          isCorrect = userAnswer?.selfEvaluation === 'correct';
          earnedPoints = isCorrect ? points : 0;
          break;

        case 'true_false':
          isCorrect = userAnswer === block.content.correct;
          earnedPoints = isCorrect ? points : 0;
          break;

        case 'qcm':
          isCorrect = userAnswer === block.content.correctIndex;
          earnedPoints = isCorrect ? points : 0;
          break;

        case 'qcm_selective':
          // Toutes les bonnes réponses doivent être cochées, aucune erreur
          const correctIndices = block.content.correctIndices || [];
          const userIndices = userAnswer || [];
          isCorrect = 
            correctIndices.length === userIndices.length &&
            correctIndices.every(i => userIndices.includes(i));
          earnedPoints = isCorrect ? points : 0;
          break;

        case 'reorder':
          // Vérifier si l'ordre est correct
          const correctOrder = (block.content.items || []).map((_, i) => i);
          const userOrder = userAnswer || [];
          isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userOrder);
          earnedPoints = isCorrect ? points : 0;
          break;

        case 'drag_drop':
          // Vérifier chaque zone de drop
          const zones = block.content.dropZones || [];
          const userDrops = userAnswer || {};
          let correctDrops = 0;
          zones.forEach(zone => {
            if (userDrops[zone.id] === zone.correctAnswer) {
              correctDrops++;
            }
          });
          isCorrect = correctDrops === zones.length;
          earnedPoints = isCorrect ? points : (correctDrops / zones.length) * points;
          break;

        case 'match_pairs':
          // Vérifier chaque paire
          const pairs = block.content.pairs || [];
          const userPairs = userAnswer || {};
          let correctPairs = 0;
          pairs.forEach((pair, index) => {
            if (userPairs[index] === index) {
              correctPairs++;
            }
          });
          isCorrect = correctPairs === pairs.length;
          earnedPoints = isCorrect ? points : (correctPairs / pairs.length) * points;
          break;

        default:
          earnedPoints = 0;
      }

      totalScore += earnedPoints;

      results.push({
        blockId: block.id,
        type: block.type,
        isCorrect,
        earnedPoints,
        maxPoints: points,
        userAnswer,
        correctAnswer: getCorrectAnswer(block)
      });
    });

    return {
      score: Math.round(totalScore),
      maxScore,
      percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
      results
    };
  }, [exercises, answers]);

  // Soumettre la tentative
  const submitAttempt = useCallback(async () => {
    if (!userId || !programId || !chapterId || !exercises) {
      return { success: false, error: 'Données manquantes' };
    }

    try {
      setSubmitting(true);
      
      const resultsData = calculateResults();
      const duration = Math.round((Date.now() - startTime) / 1000); // en secondes

      // Sauvegarder dans Firebase
      const attemptRef = doc(
        db,
        `users/${userId}/programs/${programId}/chapitres/${chapterId}/attempts/${Date.now()}`
      );

      // Préparer les données à sauvegarder
      const attemptData = {
        userId,
        programId,
        chapterId,
        score: resultsData.score,
        maxScore: resultsData.maxScore,
        percentage: resultsData.percentage,
        duration,
        answers,
        results: resultsData.results,
        completedAt: Timestamp.now()
      };

      // Nettoyer les valeurs undefined (Firebase ne les accepte pas)
      const cleanData = JSON.parse(JSON.stringify(attemptData));

      await setDoc(attemptRef, cleanData);

      return { 
        success: true, 
        results: resultsData,
        duration 
      };
    } catch (error) {
      console.error('Erreur soumission:', error);
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setSubmitting(false);
    }
  }, [userId, programId, chapterId, exercises, answers, calculateResults, startTime]);

  return {
    exercises,
    currentBlock: exercises?.blocks?.[currentBlockIndex] || null,
    currentBlockIndex,
    totalBlocks: exercises?.blocks?.length || 0,
    answers,
    answerBlock,
    goToNext,
    goToPrevious,
    goToBlock,
    submitAttempt,
    loading,
    submitting,
    isLastBlock: currentBlockIndex === (exercises?.blocks?.length || 0) - 1,
    progress: exercises?.blocks?.length 
      ? Math.round(((currentBlockIndex + 1) / exercises.blocks.length) * 100)
      : 0
  };
}

// Helper pour extraire la bonne réponse
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
      return (block.content.items || []).map((_, i) => i);
    case 'drag_drop':
      return (block.content.dropZones || []).reduce((acc, zone) => {
        acc[zone.id] = zone.correctAnswer;
        return acc;
      }, {});
    case 'match_pairs':
      return (block.content.pairs || []).reduce((acc, _, i) => {
        acc[i] = i;
        return acc;
      }, {});
    default:
      return null;
  }
}
