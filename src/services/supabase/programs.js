import { supabase } from '../../lib/supabase'

/**
 * Récupérer tous les programmes d'une organisation
 * @param {string} organizationId - ID de l'organisation
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getPrograms = async (organizationId) => {
  try {
    console.log('[Supabase Programs] 📚 Fetching programs for org:', organizationId)
    
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Supabase Programs] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Programs] ✅ Fetched', data.length, 'programs')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Programs] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Récupérer un programme par son ID
 * @param {string} programId - ID du programme
 * @param {string} organizationId - ID de l'organisation
 * @returns {Promise<{data: Object, error: any}>}
 */
export const getProgram = async (programId, organizationId) => {
  try {
    console.log('[Supabase Programs] 📖 Fetching program:', programId)
    
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('[Supabase Programs] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Programs] ✅ Fetched program:', data.title)
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Programs] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Créer un nouveau programme
 * @param {Object} programData - Données du programme
 * @param {string} organizationId - ID de l'organisation
 * @returns {Promise<{data: Object, error: any}>}
 */
export const createProgram = async (programData, organizationId) => {
  try {
    console.log('[Supabase Programs] ➕ Creating program:', programData.title)
    
    const { data, error } = await supabase
      .from('programs')
      .insert([{
        organization_id: organizationId,
        category_id: programData.categoryId,
        title: programData.name || programData.title,
        description: programData.description,
        duration_minutes: programData.duration_minutes || 0,
        difficulty: programData.difficulty || 'beginner',
        hidden: programData.hidden || false
      }])
      .select()
      .single()

    if (error) {
      console.error('[Supabase Programs] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Programs] ✅ Created program:', data.id)
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Programs] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Mettre à jour un programme
 * @param {string} programId - ID du programme
 * @param {Object} updates - Données à mettre à jour
 * @param {string} organizationId - ID de l'organisation
 * @returns {Promise<{data: Object, error: any}>}
 */
export const updateProgram = async (programId, updates, organizationId) => {
  try {
    console.log('[Supabase Programs] 📝 Updating program:', programId)
    
    const { data, error } = await supabase
      .from('programs')
      .update({
        title: updates.name || updates.title,
        description: updates.description,
        category_id: updates.categoryId,
        difficulty: updates.difficulty,
        hidden: updates.hidden,
        updated_at: new Date().toISOString()
      })
      .eq('id', programId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('[Supabase Programs] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Programs] ✅ Updated program:', programId)
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Programs] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Supprimer un programme
 * @param {string} programId - ID du programme
 * @param {string} organizationId - ID de l'organisation
 * @returns {Promise<{data: any, error: any}>}
 */
export const deleteProgram = async (programId, organizationId) => {
  try {
    console.log('[Supabase Programs] 🗑️ Deleting program:', programId)
    
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('[Supabase Programs] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Programs] ✅ Deleted program:', programId)
    return { data: true, error: null }
  } catch (error) {
    console.error('[Supabase Programs] ❌ Exception:', error)
    return { data: null, error }
  }
}

/**
 * Compter les chapitres d'un programme
 * @param {string} programId - ID du programme
 * @returns {Promise<{count: number, error: any}>}
 */
export const countChapters = async (programId) => {
  try {
    const { count, error } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId)

    if (error) {
      console.error('[Supabase Programs] ❌ Error counting chapters:', error)
      return { count: 0, error }
    }

    return { count, error: null }
  } catch (error) {
    console.error('[Supabase Programs] ❌ Exception:', error)
    return { count: 0, error }
  }
}
