import { useState, useEffect } from 'react';
import { 
  getUserProgress, 
  createUserProgress, 
  updateUserProgress,
  markLessonComplete 
} from '../services/userDataService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook pour gérer la progression d'un utilisateur dans un programme
 * Utilise la nouvelle structure /userProgress/{userId}__{programId}
 */
export function useUserProgress(programId) {
  const { user, organizationId } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!user || !programId) {
      setLoading(false);
      return;
    }
    
    loadProgress();
  }, [user, programId, organizationId]);
  
  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Chargement progression:', { userId: user.uid, programId });
      
      let prog = await getUserProgress(user.uid, programId);
      
      // Si pas de progression, la créer
      if (!prog) {
        console.log('🆕 Création nouvelle progression');
        prog = await createUserProgress(organizationId, user.uid, programId);
      }
      
      setProgress(prog);
      console.log('✅ Progression chargée:', prog);
      
    } catch (err) {
      console.error('❌ Erreur chargement progression:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const markComplete = async (lessonId) => {
    try {
      console.log('✓ Marquage leçon complétée:', lessonId);
      await markLessonComplete(user.uid, programId, lessonId);
      await loadProgress(); // Recharger pour mettre à jour l'UI
    } catch (err) {
      console.error('❌ Erreur marquage leçon:', err);
      throw err;
    }
  };
  
  const updateProgress = async (updates) => {
    try {
      console.log('📝 Mise à jour progression:', updates);
      await updateUserProgress(user.uid, programId, updates);
      await loadProgress(); // Recharger pour mettre à jour l'UI
    } catch (err) {
      console.error('❌ Erreur mise à jour progression:', err);
      throw err;
    }
  };
  
  return { 
    progress, 
    loading,
    error,
    markComplete, 
    updateProgress,
    refresh: loadProgress
  };
}
