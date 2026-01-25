import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { saveEvaluationResult } from '../services/userDataService';

// Types d'exercices évaluables (liste blanche)
// Tout ce qui n'est pas dans cette liste sera ignoré
const EVALUABLE_EXERCISE_TYPES = [
  'flashcard',      // Carte mémoire avec auto-évaluation
  'qcm',            // QCM simple (une seule bonne réponse)
  'true_false',     // Vrai ou Faux
  'qcm_selective',  // QCM multiple (plusieurs bonnes réponses)
  'reorder',        // Réorganiser dans le bon ordre
  'drag_drop',      // Glisser-déposer
  'match_pairs'     // Associer des paires
];

/**
 * Hook pour gérer une évaluation complète de PROGRAMME
 * Mélange TOUS les exercices de TOUS les chapitres de TOUS les chapters
 * @param {string} userId - ID de l'utilisateur
 * @param {string} programId - ID du programme
 * @param {string} organizationId - ID de l'organisation (optionnel)
 */
export function useProgramEvaluation(userId, programId, organizationId = null) {
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

  // Charger tous les exercices de tous les chapitres de tous les chapters
  useEffect(() => {
    async function loadProgramEvaluation() {
      if (!programId) return;

      try {
        setLoading(true);
        console.log('🔍 Chargement évaluation programme:', { programId });
        console.log('🏢 organizationId:', organizationId);
        console.log('👤 userId:', userId);

        // Construire le chemin exact
        const modulesPath = organizationId
          ? `organizations/${organizationId}/programs/${programId}/chapters`
          : `programs/${programId}/chapters`;
        console.log('📍 Chemin chapters:', modulesPath);

        // 1. Récupérer tous les chapters du programme
        const modulesRef = organizationId
          ? collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres')
          : collection(db, 'programs', programId, 'chapitres');
        
        const modulesSnap = await getDocs(modulesRef);
        console.log('📊 Résultat getDocs chapters:', {
          size: modulesSnap.size,
          empty: modulesSnap.empty,
          docs: modulesSnap.docs.map(d => ({ id: d.id, title: d.data().title }))
        });
        
        console.log(`📚 ${modulesSnap.size} chapters trouvés dans le programme`);
        if (organizationId) {
          console.log('🏢 Chargement depuis /organizations/' + organizationId);
        }

        // 2. Pour chaque chapitre, récupérer toutes ses lessons et leurs exercices
        const allBlocks = [];
        
        for (const chapterDoc of modulesSnap.docs) {
          const chapterId = chapterDoc.id;
          const chapterData = chapterDoc.data();
          
          console.log(`\n📘 Chapitre "${chapterData.title}"`);
          
          try {
            // Récupérer toutes les lessons du chapitre
            const lessonsRef = organizationId
              ? collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres', chapterId, 'lessons')
              : collection(db, 'programs', programId, 'chapitres', chapterId, 'lessons');
            
            const lessonsSnap = await getDocs(lessonsRef);
            console.log(`    📊 Résultat getDocs lessons (chapitre ${chapterId}):`, {
              size: lessonsSnap.size,
              empty: lessonsSnap.empty,
              docs: lessonsSnap.docs.map(d => ({ id: d.id, title: d.data().title }))
            });
            console.log(`  📚 ${lessonsSnap.size} lessons trouvées dans ce chapitre`);
            
            // Pour chaque lesson, récupérer ses exercices (directement dans le document lesson)
            for (const lessonDoc of lessonsSnap.docs) {
              const lessonId = lessonDoc.id;
              const lessonData = lessonDoc.data();
              
              console.log(`    📄 Lesson "${lessonData.title || lessonId}"`);
              
              try {
                // Les exercices sont dans le champ "blocks" du document lesson
                console.log(`    🔍 lessonData complet:`, lessonData);
                console.log(`    🔍 lessonData.blocks existe?`, !!lessonData.blocks);
                console.log(`    🔍 Type de lessonData.blocks:`, Array.isArray(lessonData.blocks) ? 'array' : typeof lessonData.blocks);
                
                const allLessonBlocks = lessonData.blocks || [];
                // Filtrer : garder UNIQUEMENT les types d'exercices évaluables
                const blocks = allLessonBlocks.filter(block => {
                  const blockType = block.type || block.data?.type;
                  return blockType && EVALUABLE_EXERCISE_TYPES.includes(blockType);
                });

                console.log(`    🔍 Total blocks:`, allLessonBlocks.length);
                console.log(`    🔍 Blocks exercices (filtrés):`, blocks.length);
                
                if (blocks.length > 0) {
                  console.log(`      ✅ ${blocks.length} exercices trouvés`);
                  
                  // Ajouter la source (chapitre + lesson) à chaque bloc
                  // ET aplatir la structure si le bloc a un champ "data"
                  blocks.forEach((block, index) => {
                    console.log(`      📦 Block ${index}:`, {
                      hasData: !!block.data,
                      blockType: block.type,
                      dataType: block.data?.type,
                      keys: Object.keys(block)
                    });
                    
                    // Aplatir en fusionnant le parent et data
                    // Le type vient du parent, le reste vient de data
                    const flatBlock = block.data 
                      ? { 
                          type: block.type,           // Type du parent
                          ...block.data,              // Contenu de data (html, id, etc.)
                          order: block.order          // Conserver l'ordre si présent
                        }
                      : { ...block };
                    
                    console.log(`      ✨ Flat block ${index}:`, {
                      type: flatBlock.type,
                      id: flatBlock.id,
                      html: flatBlock.html?.substring(0, 50)
                    });
                    
                    allBlocks.push({
                      ...flatBlock,
                      sourceChapterId: chapterId,
                      sourceChapterName: chapterData.title || 'Chapitre sans titre',
                      sourceLessonId: lessonId,
                      sourceLessonName: lessonData.title || 'Lesson sans titre'
                    });
                  });
                } else {
                  console.log(`      ⚠️ Pas de blocks dans cette lesson`);
                }
              } catch (error) {
                console.error(`      ❌ Erreur lesson ${lessonId}:`, error);
              }
            }
          } catch (error) {
            console.error(`  ❌ Erreur chapitre ${chapterId}:`, error);
          }
        }

        console.log('\n🔍 Premier block de allBlocks:', allBlocks[0]);
        console.log('🔍 Structure complète du premier block:', JSON.stringify(allBlocks[0], null, 2));
        console.log(`\n🎯 Total exercices avant mélange: ${allBlocks.length}`);

        if (allBlocks.length === 0) {
          console.warn('⚠️ Aucun exercice trouvé dans ce programme');
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
          programId,
          totalBlocks: shuffledBlocks.length,
          createdAt: new Date().toISOString()
        };

        setEvaluation(evaluationData);
        console.log('✅ Évaluation programme chargée avec succès');
      } catch (error) {
        console.error('❌ Erreur chargement évaluation programme:', error);
        setEvaluation({ blocks: [] });
      } finally {
        setLoading(false);
      }
    }

    loadProgramEvaluation();
  }, [programId, organizationId]);

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
          const correctTF = block.content?.correct !== undefined ? block.content.correct : block.correct;
          isCorrect = answer === correctTF;
          break;
        case 'qcm':
          const correctQCM = block.content?.correctIndex !== undefined ? block.content.correctIndex : block.correctIndex;
          isCorrect = answer === correctQCM;
          break;
        case 'qcm_selective':
          const correctIndices = block.content?.correctIndices || block.correctIndices;
          if (Array.isArray(answer) && Array.isArray(correctIndices)) {
            const sortedAnswer = [...answer].sort();
            const sortedCorrect = [...correctIndices].sort();
            isCorrect = JSON.stringify(sortedAnswer) === JSON.stringify(sortedCorrect);
          }
          break;
        case 'reorder':
          const items = block.content?.items || block.items;
          if (Array.isArray(answer) && Array.isArray(items)) {
            const correctOrder = items.map((_, i) => i);
            isCorrect = JSON.stringify(answer) === JSON.stringify(correctOrder);
          }
          break;
        case 'drag_drop':
          const dropZones = block.content?.dropZones || block.dropZones;
          if (typeof answer === 'object' && Array.isArray(dropZones)) {
            isCorrect = dropZones.every(zone => {
              const zoneId = zone.id || `zone_${dropZones.indexOf(zone)}`;
              return answer[zoneId] === zone.correctAnswer;
            });
          }
          break;
        case 'text':
          // Les exercices text sont toujours considérés comme corrects (lecture uniquement)
          isCorrect = answer?.read === true;
          break;
        case 'match_pairs':
          const pairs = block.content?.pairs || block.pairs;
          if (typeof answer === 'object' && Array.isArray(pairs)) {
            isCorrect = pairs.every((pair, index) => {
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
        sourceChapterName: block.sourceChapterName,
        sourceChapterId: block.sourceChapterId,
        sourceChapterName: block.sourceChapterName
      });
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score, totalPoints, earnedPoints, results };
  }, [evaluation, answers]);

  // Soumettre l'évaluation
  const submitEvaluation = useCallback(async () => {
    if (!userId || !programId || !evaluation || !organizationId) {
      console.error('❌ Paramètres manquants pour soumettre');
      return { success: false };
    }

    try {
      setSubmitting(true);
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime) / 1000); // en secondes

      const results = calculateResults();

      // ✅ Utiliser la nouvelle structure /evaluationResults/{resultId}
      console.log('💾 Sauvegarde résultat évaluation programme avec userDataService');
      
      const resultDoc = await saveEvaluationResult({
        organizationId,
        userId,
        programId,
        chapterId: 'program_full', // Identifiant spécial pour évaluation complète
        score: results.score,
        maxScore: 100,
        duration,
        answers: {
          type: 'program', // Type pour différencier des évaluations de chapitre
          userAnswers: answers,
          results: results.results,
          totalPoints: results.totalPoints,
          earnedPoints: results.earnedPoints
        }
      });

      console.log('✅ Évaluation programme soumise avec succès:', {
        resultId: resultDoc.id,
        score: results.score,
        duration,
        totalBlocks: evaluation.blocks.length
      });

      return { success: true, results, duration };
    } catch (error) {
      console.error('❌ Erreur soumission évaluation programme:', error);
      return { success: false, error: error.message };
    } finally {
      setSubmitting(false);
    }
  }, [userId, programId, organizationId, evaluation, answers, calculateResults, startTime]);

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
  // Gérer structure aplatie (après migration) et structure avec content
  switch (block.type) {
    case 'flashcard':
      return block.content?.answer || block.answer || null;
      
    case 'true_false':
      return block.content?.correct !== undefined 
        ? block.content.correct 
        : (block.correct !== undefined ? block.correct : null);
      
    case 'qcm':
      return block.content?.correctIndex !== undefined
        ? block.content.correctIndex
        : (block.correctIndex !== undefined ? block.correctIndex : null);
      
    case 'qcm_selective':
      return block.content?.correctIndices || block.correctIndices || null;
      
    case 'reorder':
      // Ordre correct = indices dans l'ordre [0, 1, 2, ...]
      const items = block.content?.items || block.items;
      return items ? items.map((_, i) => i) : null;
      
    case 'drag_drop':
      const dropZones = block.content?.dropZones || block.dropZones;
      if (!dropZones) return null;
      return dropZones.reduce((acc, zone, index) => {
        const zoneId = zone.id || `zone_${index}`;
        acc[zoneId] = zone.correctAnswer;
        return acc;
      }, {});
      
    case 'match_pairs':
      const pairs = block.content?.pairs || block.pairs;
      return pairs ? pairs.map((_, i) => i) : null;
      
    default:
      return null;
  }
}
