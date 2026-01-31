import { supabase } from '../../lib/supabase';

/**
 * Récupérer toutes les tentatives d'un user sur un exercice
 */
export const getExerciseHistory = async (exerciseId, userId) => {
  try {
    const { data, error } = await supabase
      .from('exercise_history')
      .select('*')
      .eq('exercise_id', exerciseId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erreur getExerciseHistory:', error);
    throw error;
  }
};

/**
 * Récupérer la dernière tentative d'un user
 */
export const getLastAttempt = async (exerciseId, userId) => {
  try {
    const { data, error } = await supabase
      .from('exercise_history')
      .select('*')
      .eq('exercise_id', exerciseId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = "No rows found" (pas d'erreur, juste vide)
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error('❌ Erreur getLastAttempt:', error);
    throw error;
  }
};

/**
 * Enregistrer une nouvelle tentative
 */
export const saveExerciseAttempt = async (attemptData) => {
  try {
    const { data, error } = await supabase
      .from('exercise_history')
      .insert([{
        user_id: attemptData.user_id,
        exercise_id: attemptData.exercise_id,
        answers: attemptData.answers,
        score: attemptData.score,
        completed_at: attemptData.completed_at || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Tentative enregistrée:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur saveExerciseAttempt:', error);
    throw error;
  }
};

/**
 * Statistiques globales d'un apprenant
 */
export const getUserExerciseStats = async (userId, organizationId) => {
  try {
    const { data, error } = await supabase
      .from('exercise_history')
      .select(`
        *,
        exercises!inner (
          chapters!inner (
            programs!inner (
              organization_id
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('exercises.chapters.programs.organization_id', organizationId);

    if (error) throw error;

    // Calculer stats
    const totalAttempts = data.length;
    const avgScore = data.length > 0
      ? data.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / data.length
      : 0;

    return {
      totalAttempts,
      avgScore: Math.round(avgScore * 10) / 10,
      attempts: data
    };
  } catch (error) {
    console.error('❌ Erreur getUserExerciseStats:', error);
    throw error;
  }
};
