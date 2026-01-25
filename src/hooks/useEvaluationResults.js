import { useState } from 'react';
import { 
  saveEvaluationResult, 
  getEvaluationResults,
  getAllUserEvaluationResults
} from '../services/userDataService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook pour gérer les résultats d'évaluation
 * Utilise la nouvelle structure /evaluationResults/{resultId}
 */
export function useEvaluationResults() {
  const { user, organizationId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Sauvegarder un résultat d'évaluation
   */
  const saveResult = async (programId, chapterId, score, maxScore, duration, answers) => {
    if (!user || !organizationId) {
      throw new Error('User ou organizationId manquant');
    }
    
    try {
      setSaving(true);
      setError(null);
      
      console.log('💾 Sauvegarde résultat évaluation:', {
        programId,
        chapterId,
        score,
        maxScore,
        percentage: Math.round((score / maxScore) * 100)
      });
      
      const result = await saveEvaluationResult({
        organizationId,
        userId: user.uid,
        programId,
        chapterId,
        score,
        maxScore,
        duration,
        answers
      });
      
      console.log('✅ Résultat sauvegardé:', result);
      return result;
      
    } catch (err) {
      console.error('❌ Erreur sauvegarde résultat:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };
  
  /**
   * Récupérer les résultats d'un chapitre spécifique
   */
  const getResults = async (programId, chapterId) => {
    if (!user) {
      throw new Error('User manquant');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Récupération résultats:', { programId, chapterId });
      
      const results = await getEvaluationResults(user.uid, programId, chapterId);
      
      console.log('✅ Résultats récupérés:', results.length, 'tentative(s)');
      return results;
      
    } catch (err) {
      console.error('❌ Erreur récupération résultats:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Récupérer tous les résultats de l'utilisateur
   */
  const getAllResults = async () => {
    if (!user) {
      throw new Error('User manquant');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Récupération tous les résultats de l\'utilisateur');
      
      const results = await getAllUserEvaluationResults(user.uid);
      
      console.log('✅ Tous les résultats récupérés:', results.length, 'évaluation(s)');
      return results;
      
    } catch (err) {
      console.error('❌ Erreur récupération tous les résultats:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { 
    saveResult, 
    getResults,
    getAllResults,
    saving,
    loading,
    error
  };
}
