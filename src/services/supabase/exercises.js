import { supabase } from '../../lib/supabase';

/**
 * Récupérer tous les exercices d'un chapitre (avec vérification org)
 */
export const getExercises = async (chapterId, organizationId) => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        chapters!inner (
          programs!inner (
            organization_id
          )
        )
      `)
      .eq('chapter_id', chapterId)
      .eq('chapters.programs.organization_id', organizationId)
      .order('order', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Erreur getExercises:', error);
    throw error;
  }
};

/**
 * Récupérer un exercice spécifique (avec vérification org)
 */
export const getExerciseById = async (exerciseId, organizationId) => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        chapters!inner (
          programs!inner (
            organization_id
          )
        )
      `)
      .eq('id', exerciseId)
      .eq('chapters.programs.organization_id', organizationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Erreur getExerciseById:', error);
    throw error;
  }
};

/**
 * Créer un nouvel exercice
 */
export const createExercise = async (exerciseData, organizationId) => {
  try {
    // 1. Vérifier que le chapitre appartient à l'organisation
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select(`
        id,
        programs!inner (
          organization_id
        )
      `)
      .eq('id', exerciseData.chapter_id)
      .single();

    if (chapterError) throw chapterError;
    
    if (chapter?.programs?.organization_id !== organizationId) {
      throw new Error('Unauthorized: Chapter does not belong to your organization');
    }

    // 2. Obtenir le prochain order disponible
    const { data: existingExercises } = await supabase
      .from('exercises')
      .select('order')
      .eq('chapter_id', exerciseData.chapter_id)
      .order('order', { ascending: false })
      .limit(1);

    const nextOrder = existingExercises?.length > 0 
      ? existingExercises[0].order + 1 
      : 1;

    // 3. Créer l'exercice
    const { data, error } = await supabase
      .from('exercises')
      .insert([{
        ...exerciseData,
        order: exerciseData.order || nextOrder
      }])
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Exercice créé:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur createExercise:', error);
    throw error;
  }
};

/**
 * Mettre à jour un exercice
 */
export const updateExercise = async (exerciseId, updates, organizationId) => {
  try {
    // 1. Vérifier que l'exercice appartient à l'organisation
    const { data: exercise, error: checkError } = await supabase
      .from('exercises')
      .select(`
        id,
        chapters!inner (
          programs!inner (
            organization_id
          )
        )
      `)
      .eq('id', exerciseId)
      .single();

    if (checkError) throw checkError;
    
    if (exercise?.chapters?.programs?.organization_id !== organizationId) {
      throw new Error('Unauthorized: Exercise does not belong to your organization');
    }

    // 2. Mettre à jour
    const { data, error } = await supabase
      .from('exercises')
      .update(updates)
      .eq('id', exerciseId)
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Exercice mis à jour:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur updateExercise:', error);
    throw error;
  }
};

/**
 * Supprimer un exercice
 */
export const deleteExercise = async (exerciseId, organizationId) => {
  try {
    // 1. Vérifier appartenance org
    const { data: exercise, error: checkError } = await supabase
      .from('exercises')
      .select(`
        id,
        chapters!inner (
          programs!inner (
            organization_id
          )
        )
      `)
      .eq('id', exerciseId)
      .single();

    if (checkError) throw checkError;
    
    if (exercise?.chapters?.programs?.organization_id !== organizationId) {
      throw new Error('Unauthorized');
    }

    // 2. Supprimer
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) throw error;
    
    console.log('✅ Exercice supprimé:', exerciseId);
  } catch (error) {
    console.error('❌ Erreur deleteExercise:', error);
    throw error;
  }
};

/**
 * Réorganiser l'ordre des exercices
 */
export const reorderExercises = async (exercisesOrder) => {
  try {
    const updates = exercisesOrder.map(({ id, order }) =>
      supabase
        .from('exercises')
        .update({ order })
        .eq('id', id)
    );

    await Promise.all(updates);
    console.log('✅ Exercices réorganisés');
  } catch (error) {
    console.error('❌ Erreur reorderExercises:', error);
    throw error;
  }
};
