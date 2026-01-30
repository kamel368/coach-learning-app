import { supabase } from '../../lib/supabase'

/**
 * Récupérer toutes les leçons d'un chapitre
 * @param {string} chapterId - UUID du chapitre
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getLessonsByChapter = async (chapterId) => {
  try {
    console.log('[Supabase Lessons] 📚 Fetching lessons for chapter:', chapterId)
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('hidden', false)
      .order('order', { ascending: true })

    if (error) {
      console.error('[Supabase Lessons] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Lessons] ✅ Fetched', data.length, 'lessons')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Lessons] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Récupérer une leçon par son ID
 * @param {string} lessonId - UUID de la leçon
 * @returns {Promise<{data: Object, error: any}>}
 */
export const getLesson = async (lessonId) => {
  try {
    console.log('[Supabase Lessons] 📖 Fetching lesson:', lessonId)
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()

    if (error) {
      console.error('[Supabase Lessons] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Lessons] ✅ Fetched lesson:', data.title)
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Lessons] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Récupérer les leçons avec leur progression pour un utilisateur
 * @param {string} chapterId - UUID du chapitre
 * @param {string} userId - UUID de l'utilisateur
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getLessonsWithProgress = async (chapterId, userId) => {
  try {
    console.log('[Supabase Lessons] 📊 Fetching lessons with progress')
    
    // Récupérer les leçons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('hidden', false)
      .order('order', { ascending: true })

    if (lessonsError) {
      console.error('[Supabase Lessons] ❌ Error:', lessonsError)
      return { data: null, error: lessonsError }
    }

    // Récupérer la progression pour toutes les leçons
    const lessonIds = lessons.map(l => l.id)
    
    const { data: progressData, error: progressError } = await supabase
      .from('learner_progress')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)

    if (progressError) {
      console.error('[Supabase Lessons] ❌ Error fetching progress:', progressError)
    }

    // Mapper la progression aux leçons
    const lessonsWithProgress = lessons.map(lesson => {
      const progress = progressData?.find(p => p.lesson_id === lesson.id)
      return {
        ...lesson,
        completed: progress?.completed || false,
        reading_progress: progress?.reading_progress || 0,
        completed_at: progress?.completed_at || null
      }
    })

    console.log('[Supabase Lessons] ✅ Fetched', lessonsWithProgress.length, 'lessons with progress')
    return { data: lessonsWithProgress, error: null }
  } catch (error) {
    console.error('[Supabase Lessons] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Créer une nouvelle leçon
 * @param {Object} lessonData - Données de la leçon
 * @param {string} lessonData.chapter_id - UUID du chapitre
 * @param {string} lessonData.title - Titre de la leçon
 * @param {Object} lessonData.editor_data - Contenu JSON de la leçon
 * @param {number} lessonData.order - Ordre d'affichage
 * @param {number} lessonData.duration_minutes - Durée estimée
 * @returns {Promise<{data: Object, error: any}>}
 */
export const createLesson = async (lessonData) => {
  try {
    console.log('[Supabase Lessons] ➕ Creating lesson:', lessonData.title)
    
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        chapter_id: lessonData.chapter_id,
        title: lessonData.title,
        editor_data: lessonData.editor_data || { blocks: [] },
        order: lessonData.order || 1,
        hidden: lessonData.hidden || false,
        duration_minutes: lessonData.duration_minutes || 10,
        reading_time_minutes: lessonData.reading_time_minutes || lessonData.duration_minutes || 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[Supabase Lessons] ❌ Error creating lesson:', error)
      return { data: null, error }
    }

    console.log('[Supabase Lessons] ✅ Lesson created:', data.id)
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Lessons] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Mettre à jour une leçon
 * @param {string} lessonId - UUID de la leçon
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<{data: Object, error: any}>}
 */
export const updateLesson = async (lessonId, updates) => {
  try {
    console.log('[Supabase Lessons] 🔄 Updating lesson:', lessonId)
    
    const { data, error } = await supabase
      .from('lessons')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .select()
      .single()

    if (error) {
      console.error('[Supabase Lessons] ❌ Error updating lesson:', error)
      return { data: null, error }
    }

    console.log('[Supabase Lessons] ✅ Lesson updated')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Lessons] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Supprimer une leçon
 * @param {string} lessonId - UUID de la leçon
 * @returns {Promise<{data: Object, error: any}>}
 */
export const deleteLesson = async (lessonId) => {
  try {
    console.log('[Supabase Lessons] 🗑️ Deleting lesson:', lessonId)
    
    const { data, error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
      .select()
      .single()

    if (error) {
      console.error('[Supabase Lessons] ❌ Error deleting lesson:', error)
      return { data: null, error }
    }

    console.log('[Supabase Lessons] ✅ Lesson deleted')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Lessons] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Réorganiser les leçons (mettre à jour l'ordre)
 * @param {Array} lessonsOrder - Array of {id, order}
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const reorderLessons = async (lessonsOrder) => {
  try {
    console.log('[Supabase Lessons] 🔄 Reordering lessons:', lessonsOrder.length)
    
    const promises = lessonsOrder.map(({ id, order }) =>
      supabase
        .from('lessons')
        .update({ order, updated_at: new Date().toISOString() })
        .eq('id', id)
    )

    const results = await Promise.all(promises)
    
    const hasError = results.some(r => r.error)
    if (hasError) {
      console.error('[Supabase Lessons] ❌ Error reordering lessons')
      return { success: false, error: 'Failed to reorder some lessons' }
    }

    console.log('[Supabase Lessons] ✅ Lessons reordered')
    return { success: true, error: null }
  } catch (error) {
    console.error('[Supabase Lessons] ❌ Exception:', error)
    return { success: false, error }
  }
}
