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
