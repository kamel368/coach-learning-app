import { supabase } from '../../lib/supabase'

/**
 * Récupérer toutes les catégories d'une organisation
 * @param {string} organizationId - ID de l'organisation
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getCategories = async (organizationId) => {
  try {
    console.log('[Supabase Categories] 📂 Fetching categories for org:', organizationId)
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (error) {
      console.error('[Supabase Categories] ❌ Error:', error)
      return { data: null, error }
    }

    console.log('[Supabase Categories] ✅ Fetched', data.length, 'categories')
    return { data, error: null }
  } catch (error) {
    console.error('[Supabase Categories] ❌ Exception:', error)
    return { data: null, error }
  }
}
