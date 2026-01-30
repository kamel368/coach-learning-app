import { supabase } from '../../lib/supabase'

/**
 * Récupérer les programmes assignés à un utilisateur avec leurs détails
 * @param {string} userId - ID de l'utilisateur (UUID Supabase)
 * @param {string} organizationId - ID de l'organisation
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getUserAssignedPrograms = async (userId, organizationId) => {
  try {
    console.log('[Supabase Assignments] 📚 Fetching assigned programs for user:', userId)
    
    // 1. Récupérer l'utilisateur pour obtenir ses programmes assignés
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('assigned_programs')
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single()

    if (userError) {
      console.error('[Supabase Assignments] ❌ Error fetching user:', userError)
      return { data: null, error: userError }
    }

    const assignedProgramIds = userData?.assigned_programs || []
    console.log('[Supabase Assignments] 📋 Assigned program IDs:', assignedProgramIds)

    if (assignedProgramIds.length === 0) {
      console.log('[Supabase Assignments] ℹ️ No programs assigned')
      return { data: [], error: null }
    }

    // 2. Récupérer les détails des programmes assignés
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('*')
      .in('id', assignedProgramIds)
      .eq('organization_id', organizationId)
      .eq('hidden', false) // Uniquement les programmes publiés (hidden=false)

    if (programsError) {
      console.error('[Supabase Assignments] ❌ Error fetching programs:', programsError)
      return { data: null, error: programsError }
    }

    console.log('[Supabase Assignments] ✅ Fetched', programs.length, 'assigned programs')

    // 3. Pour chaque programme, compter les leçons
    const programsWithDetails = await Promise.all(
      programs.map(async (program) => {
        // Compter les chapitres
        const { count: chaptersCount } = await supabase
          .from('chapters')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', program.id)

        // Compter les leçons de tous les chapitres du programme
        const { data: chapters } = await supabase
          .from('chapters')
          .select('id')
          .eq('program_id', program.id)

        let totalLessons = 0
        if (chapters && chapters.length > 0) {
          const chapterIds = chapters.map(ch => ch.id)
          const { count: lessonsCount } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .in('chapter_id', chapterIds)
          
          totalLessons = lessonsCount || 0
        }

        return {
          id: program.id,
          name: program.title,
          title: program.title,
          description: program.description,
          categoryId: program.category_id,
          status: program.hidden ? 'draft' : 'published',
          totalLessons: totalLessons,
          totalChapters: chaptersCount || 0,
          createdAt: { seconds: new Date(program.created_at).getTime() / 1000 },
          updatedAt: { seconds: new Date(program.updated_at).getTime() / 1000 }
        }
      })
    )

    console.log('[Supabase Assignments] ✅ Programs with details:', programsWithDetails)
    return { data: programsWithDetails, error: null }

  } catch (error) {
    console.error('[Supabase Assignments] ❌ Exception:', error)
    return { data: null, error }
  }
}
