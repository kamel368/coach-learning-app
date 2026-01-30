import { supabase } from '../../lib/supabase'

/**
 * Récupérer tous les chapitres d'un programme
 * @param {string} programId - UUID du programme
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getChaptersByProgram = async (programId) => {
  try {
    console.log('[Supabase Chapters] 📚 Fetching chapters for program:', programId)
    
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('program_id', programId)
      .order('order', { ascending: true })

    if (error) {
      console.error('[Supabase Chapters] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Chapters] ✅ Fetched', data.length, 'chapters')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Chapters] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Récupérer un chapitre par son ID
 * @param {string} chapterId - UUID du chapitre
 * @returns {Promise<{data: Object, error: any}>}
 */
export const getChapter = async (chapterId) => {
  try {
    console.log('[Supabase Chapters] 📖 Fetching chapter:', chapterId)
    
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single()

    if (error) {
      console.error('[Supabase Chapters] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Chapters] ✅ Fetched chapter:', data.title)
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Chapters] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Compter les leçons d'un chapitre
 * @param {string} chapterId - UUID du chapitre
 * @returns {Promise<{count: number, error: any}>}
 */
export const countLessonsByChapter = async (chapterId) => {
  try {
    const { count, error } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId)
      .eq('hidden', false)

    if (error) {
      console.error('[Supabase Chapters] ❌ Error counting lessons:', error)
      return { count: 0, error }
    }

    return { count, error: null }
  } catch (error) {
    console.error('[Supabase Chapters] ❌ Exception:', error)
    return { count: 0, error }
  }
}

/**
 * Créer un nouveau chapitre
 * @param {Object} chapterData - Données du chapitre
 * @param {string} chapterData.program_id - UUID du programme
 * @param {string} chapterData.title - Titre du chapitre
 * @param {string} chapterData.description - Description
 * @param {number} chapterData.order - Ordre d'affichage
 * @returns {Promise<{data: Object, error: any}>}
 */
export const createChapter = async (chapterData) => {
  try {
    console.log('[Supabase Chapters] ➕ Creating chapter:', chapterData.title)
    
    const { data, error } = await supabase
      .from('chapters')
      .insert({
        program_id: chapterData.program_id,
        title: chapterData.title,
        description: chapterData.description || '',
        order: chapterData.order || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[Supabase Chapters] ❌ Error creating chapter:', error)
      return { data: null, error }
    }

    console.log('[Supabase Chapters] ✅ Chapter created:', data.id)
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Chapters] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Mettre à jour un chapitre
 * @param {string} chapterId - UUID du chapitre
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<{data: Object, error: any}>}
 */
export const updateChapter = async (chapterId, updates) => {
  try {
    console.log('[Supabase Chapters] 🔄 Updating chapter:', chapterId)
    
    const { data, error } = await supabase
      .from('chapters')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', chapterId)
      .select()
      .single()

    if (error) {
      console.error('[Supabase Chapters] ❌ Error updating chapter:', error)
      return { data: null, error }
    }

    console.log('[Supabase Chapters] ✅ Chapter updated')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Chapters] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Supprimer un chapitre
 * @param {string} chapterId - UUID du chapitre
 * @returns {Promise<{data: Object, error: any}>}
 */
export const deleteChapter = async (chapterId) => {
  try {
    console.log('[Supabase Chapters] 🗑️ Deleting chapter:', chapterId)
    
    const { data, error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId)
      .select()
      .single()

    if (error) {
      console.error('[Supabase Chapters] ❌ Error deleting chapter:', error)
      return { data: null, error }
    }

    console.log('[Supabase Chapters] ✅ Chapter deleted')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Chapters] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Réorganiser les chapitres (mettre à jour l'ordre)
 * @param {Array} chaptersOrder - Array of {id, order}
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const reorderChapters = async (chaptersOrder) => {
  try {
    console.log('[Supabase Chapters] 🔄 Reordering chapters:', chaptersOrder.length)
    
    // Mettre à jour chaque chapitre avec son nouvel ordre
    const promises = chaptersOrder.map(({ id, order }) =>
      supabase
        .from('chapters')
        .update({ order, updated_at: new Date().toISOString() })
        .eq('id', id)
    )

    const results = await Promise.all(promises)
    
    const hasError = results.some(r => r.error)
    if (hasError) {
      console.error('[Supabase Chapters] ❌ Error reordering chapters')
      return { success: false, error: 'Failed to reorder some chapters' }
    }

    console.log('[Supabase Chapters] ✅ Chapters reordered')
    return { success: true, error: null }
  } catch (error) {
    console.error('[Supabase Chapters] ❌ Exception:', error)
    return { success: false, error }
  }
}
