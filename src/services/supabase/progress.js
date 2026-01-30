import { supabase } from '../../lib/supabase'

/**
 * Récupérer la progression d'un utilisateur sur un programme
 * En rejoignant lessons → chapters → programs
 */
export const getProgramProgress = async (userId, programId) => {
  try {
    console.log('[Supabase Progress] 📊 Fetching progress for program:', programId)
    
    // Récupérer toutes les leçons du programme avec leur progression
    const { data, error } = await supabase
      .from('learner_progress')
      .select(`
        *,
        lessons!inner (
          id,
          title,
          chapter_id,
          chapters!inner (
            id,
            program_id
          )
        )
      `)
      .eq('user_id', userId)
      .eq('lessons.chapters.program_id', programId)

    if (error) {
      console.error('[Supabase Progress] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Progress] ✅ Fetched', data?.length || 0, 'progress records')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Progress] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Marquer une leçon comme complétée
 */
export const markLessonCompleted = async (userId, lessonId) => {
  try {
    console.log('[Supabase Progress] ✅ Marking lesson completed:', lessonId)
    
    const { data, error } = await supabase
      .from('learner_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
        reading_progress: 100,
        xp_earned: 50,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      })
      .select()
      .single()

    if (error) {
      console.error('[Supabase Progress] ❌ Error marking completed:', error)
      return { data: null, error }
    }

    console.log('[Supabase Progress] ✅ Lesson marked completed')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Progress] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Calculer le % de complétion d'un programme
 */
export const calculateProgramCompletion = async (userId, programId) => {
  try {
    console.log('[Supabase Progress] 📊 Calculating completion for program:', programId)
    
    // 1. Récupérer tous les chapitres du programme
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('id')
      .eq('program_id', programId)

    if (chaptersError) {
      console.error('[Supabase Progress] ❌ Error fetching chapters:', chaptersError)
      return 0
    }

    if (!chapters || chapters.length === 0) {
      console.log('[Supabase Progress] ℹ️ No chapters found')
      return 0
    }

    const chapterIds = chapters.map(ch => ch.id)

    // 2. Compter le total de leçons (non cachées)
    const { count: totalLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .in('chapter_id', chapterIds)
      .eq('hidden', false)

    if (lessonsError) {
      console.error('[Supabase Progress] ❌ Error counting lessons:', lessonsError)
      return 0
    }

    if (!totalLessons || totalLessons === 0) {
      console.log('[Supabase Progress] ℹ️ No lessons found')
      return 0
    }

    // 3. Récupérer les IDs de toutes les leçons du programme
    const { data: allLessons, error: allLessonsError } = await supabase
      .from('lessons')
      .select('id')
      .in('chapter_id', chapterIds)
      .eq('hidden', false)

    if (allLessonsError) {
      console.error('[Supabase Progress] ❌ Error fetching lesson IDs:', allLessonsError)
      return 0
    }

    const lessonIds = allLessons.map(l => l.id)

    // 4. Compter les leçons complétées par l'utilisateur
    const { count: completedLessons, error: progressError } = await supabase
      .from('learner_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)
      .eq('completed', true)

    if (progressError) {
      console.error('[Supabase Progress] ❌ Error counting progress:', progressError)
      return 0
    }

    // 5. Calculer le pourcentage
    const percentage = Math.round(((completedLessons || 0) / totalLessons) * 100)

    console.log(`[Supabase Progress] 📊 ${completedLessons || 0}/${totalLessons} = ${percentage}%`)
    return percentage

  } catch (error) {
    console.error('[Supabase Progress] ❌ Exception calculating completion:', error)
    return 0
  }
}

/**
 * Récupérer toute la progression d'un utilisateur
 */
export const getAllUserProgress = async (userId) => {
  try {
    console.log('[Supabase Progress] 📊 Fetching all progress for user:', userId)
    
    const { data, error } = await supabase
      .from('learner_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('[Supabase Progress] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Progress] ✅ Fetched', data.length, 'total progress records')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Progress] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Mettre à jour la progression de lecture d'une leçon
 */
export const updateReadingProgress = async (userId, lessonId, progressPercentage) => {
  try {
    console.log('[Supabase Progress] 🔄 Updating reading progress:', lessonId, progressPercentage + '%')
    
    const { data, error } = await supabase
      .from('learner_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        reading_progress: progressPercentage,
        completed: progressPercentage >= 100,
        completed_at: progressPercentage >= 100 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      })
      .select()
      .single()

    if (error) {
      console.error('[Supabase Progress] ❌ Error updating reading progress:', error)
      return { data: null, error }
    }

    console.log('[Supabase Progress] ✅ Reading progress updated')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Progress] ❌ Exception:', error)
    return { data: null, error }
  }
}
