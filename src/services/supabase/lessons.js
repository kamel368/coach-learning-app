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
