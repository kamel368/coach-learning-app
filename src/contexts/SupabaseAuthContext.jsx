import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SupabaseAuthContext = createContext({})

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [organizationId, setOrganizationId] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Récupérer les données utilisateur depuis public.users
  const fetchUserData = async (userId) => {
    try {
      console.log('[Supabase Auth] 🔍 Starting fetchUserData for:', userId)
      
      // Créer une Promise avec timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout après 5 secondes')), 5000)
      )
      
      // Créer la requête SANS .single()
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
      
      console.log('[Supabase Auth] 🔍 Executing query with 5s timeout...')
      
      // Race entre la query et le timeout
      const { data, error } = await Promise.race([queryPromise, timeoutPromise])
      
      console.log('[Supabase Auth] 🔍 Query completed!')
      console.log('[Supabase Auth] 🔍 Data:', data)
      console.log('[Supabase Auth] 🔍 Error:', error)

      if (error) {
        console.error('[Supabase Auth] ❌ Error:', error)
        return null
      }

      // data est un array, on prend le premier élément
      const userData = Array.isArray(data) && data.length > 0 ? data[0] : null
      
      if (!userData) {
        console.error('[Supabase Auth] ❌ No user data found')
        return null
      }

      console.log('[Supabase Auth] ✅ User data fetched:', userData)
      return userData
      
    } catch (error) {
      if (error.message === 'Timeout après 5 secondes') {
        console.error('[Supabase Auth] ⏱️ TIMEOUT! La requête a pris plus de 5 secondes')
      } else {
        console.error('[Supabase Auth] ❌ Exception:', error)
      }
      return null
    }
  }

  // Écouter les changements d'authentification
  useEffect(() => {
    console.log('[Supabase Auth] Initializing auth listener')

    // Récupérer la session actuelle
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[Supabase Auth] Initial session:', session?.user?.email || 'No user')
      
      if (session?.user) {
        setUser(session.user)
        const data = await fetchUserData(session.user.id)
        if (data) {
          setUserData(data)
          setOrganizationId(data.organization_id)
        }
      }
      setLoading(false)
    })

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Supabase Auth] Auth state changed:', event, session?.user?.email || 'No user')
        
        if (session?.user) {
          setUser(session.user)
          const data = await fetchUserData(session.user.id)
          if (data) {
            setUserData(data)
            setOrganizationId(data.organization_id)
          }
        } else {
          setUser(null)
          setUserData(null)
          setOrganizationId(null)
        }
        setLoading(false)
      }
    )

    return () => {
      console.log('[Supabase Auth] Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [])

  // Connexion
  const signIn = async (email, password) => {
    try {
      console.log('[Supabase Auth] Signing in:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('[Supabase Auth] Sign in error:', error)
        throw error
      }

      console.log('[Supabase Auth] Sign in successful:', data.user.email)
      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('[Supabase Auth] Sign in exception:', error)
      throw error
    }
  }

  // Inscription
  const signUp = async (email, password, metadata = {}) => {
    try {
      console.log('[Supabase Auth] Signing up:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) {
        console.error('[Supabase Auth] Sign up error:', error)
        throw error
      }

      console.log('[Supabase Auth] Sign up successful:', data.user?.email)
      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('[Supabase Auth] Sign up exception:', error)
      throw error
    }
  }

  // Déconnexion
  const signOut = async () => {
    try {
      console.log('[Supabase Auth] Signing out')
      
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('[Supabase Auth] Sign out error:', error)
        throw error
      }

      console.log('[Supabase Auth] Sign out successful')
      setUser(null)
      setUserData(null)
      setOrganizationId(null)
    } catch (error) {
      console.error('[Supabase Auth] Sign out exception:', error)
      throw error
    }
  }

  const value = {
    user,
    userData,
    organizationId,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <SupabaseAuthContext.Provider value={value}>
      {!loading ? children : <div>Loading...</div>}
    </SupabaseAuthContext.Provider>
  )
}

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext)
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider')
  }
  return context
}
