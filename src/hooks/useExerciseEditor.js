import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook pour gérer l'édition d'exercices avec système undo/redo
 */
export function useExerciseEditor(programId, moduleId) {
  const [blocks, setBlocks] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: null,
    shuffleBlocks: false,
    showCorrectAnswers: true
  });

  // Charger les exercices existants
  useEffect(() => {
    async function loadExercises() {
      if (!programId || !moduleId) return;
      
      try {
        setLoading(true);
        const exercisesRef = doc(
          db,
          `programs/${programId}/modules/${moduleId}/exercises/main`
        );
        const exercisesSnap = await getDoc(exercisesRef);
        
        if (exercisesSnap.exists()) {
          const data = exercisesSnap.data();
          setBlocks(data.blocks || []);
          setSettings(data.settings || settings);
          
          // Initialiser l'historique
          setHistory([data.blocks || []]);
          setHistoryIndex(0);
        } else {
          // Nouveau document vide
          setBlocks([]);
          setHistory([[]]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Erreur chargement exercices:', error);
        alert('Erreur lors du chargement des exercices');
      } finally {
        setLoading(false);
      }
    }
    
    loadExercises();
  }, [programId, moduleId]);

  // Ajouter à l'historique
  const addToHistory = useCallback((newBlocks) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newBlocks]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Ajouter un bloc
  const addBlock = useCallback((type) => {
    const newBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      order: blocks.length,
      points: getDefaultPoints(type),
      content: getDefaultContent(type)
    };
    
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    addToHistory(newBlocks);
    
    // Retourner l'ID du nouveau bloc
    return newBlock.id;
  }, [blocks, addToHistory]);

  // Mettre à jour un bloc
  const updateBlock = useCallback((blockId, updates) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    setBlocks(newBlocks);
    addToHistory(newBlocks);
  }, [blocks, addToHistory]);

  // Supprimer un bloc
  const deleteBlock = useCallback((blockId) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(newBlocks);
    addToHistory(newBlocks);
  }, [blocks, addToHistory]);

  // Déplacer un bloc
  const moveBlock = useCallback((blockId, direction) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    
    setBlocks(newBlocks);
    addToHistory(newBlocks);
  }, [blocks, addToHistory]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Sauvegarder
  const saveExercises = useCallback(async () => {
    if (!programId || !moduleId) return { success: false };
    
    try {
      setSaving(true);
      const exercisesRef = doc(
        db,
        `programs/${programId}/modules/${moduleId}/exercises/main`
      );
      
      await setDoc(exercisesRef, {
        moduleId,
        programId,
        blocks,
        settings,
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [programId, moduleId, blocks, settings]);

  return {
    blocks,
    settings,
    setSettings,
    loading,
    saving,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    saveExercises
  };
}

// Helpers
function getDefaultPoints(type) {
  const pointsMap = {
    flashcard: 5,
    true_false: 3,
    qcm: 5,
    qcm_selective: 10,
    reorder: 10,
    drag_drop: 15,
    match_pairs: 10
  };
  return pointsMap[type] || 5;
}

function getDefaultContent(type) {
  const contentMap = {
    flashcard: {
      question: '',
      answer: '',
      hint: ''
    },
    true_false: {
      statement: '',
      correct: true,
      explanation: ''
    },
    qcm: {
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: ''
    },
    qcm_selective: {
      question: '',
      options: ['', '', '', ''],
      correctIndices: [],
      explanation: ''
    },
    reorder: {
      question: '',
      items: []
    },
    drag_drop: {
      question: '',
      dropZones: [],
      labels: []
    },
    match_pairs: {
      question: '',
      pairs: []
    }
  };
  return contentMap[type] || {};
}
