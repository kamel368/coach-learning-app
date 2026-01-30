import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { supabase } from '../lib/supabase'

export default function SupabaseRLSTest() {
  const { user, organizationId, userData } = useSupabaseAuth()
  const [programs, setPrograms] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setLoading(true)

    // Tenter de lire TOUS les programmes (sans filtre organization_id)
    const { data: programsData, error: programsError } = await supabase
      .from('programs')
      .select('*')

    console.log('🔍 Programs query result:', { programsData, programsError })

    // Tenter de lire TOUTES les catégories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')

    console.log('🔍 Categories query result:', { categoriesData, categoriesError })

    setPrograms(programsData || [])
    setCategories(categoriesData || [])
    setLoading(false)
  }

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h1>🔒 Non connecté</h1>
        <p>Connecte-toi d'abord sur /supabase-test</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>🧪 Test RLS - Isolation des données</h1>

      <div style={{
        padding: 20,
        backgroundColor: '#e7f3ff',
        borderRadius: 8,
        marginBottom: 30
      }}>
        <h2>👤 User connecté</h2>
        <p>Email: <code>{user.email}</code></p>
        <p>Organisation ID: <code>{organizationId}</code></p>
        <p>Organisation: <code>{userData?.full_name}</code></p>
      </div>

      {loading ? (
        <p>⏳ Chargement...</p>
      ) : (
        <>
          <div style={{ marginBottom: 40 }}>
            <h2>📚 Catégories visibles ({categories.length})</h2>
            {categories.length === 0 ? (
              <p style={{ color: '#666' }}>Aucune catégorie trouvée</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Nom</th>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Organization ID</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{cat.name}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{cat.description}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>
                        <code style={{ 
                          fontSize: 12,
                          color: cat.organization_id === organizationId ? 'green' : 'red'
                        }}>
                          {cat.organization_id}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <h2>📖 Programmes visibles ({programs.length})</h2>
            {programs.length === 0 ? (
              <p style={{ color: '#666' }}>Aucun programme trouvé</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Titre</th>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                    <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Organization ID</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map(prog => (
                    <tr key={prog.id}>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{prog.title}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{prog.description}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>
                        <code style={{ 
                          fontSize: 12,
                          color: prog.organization_id === organizationId ? 'green' : 'red'
                        }}>
                          {prog.organization_id}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{
            marginTop: 40,
            padding: 20,
            backgroundColor: programs.length === 0 ? '#d4edda' : '#f8d7da',
            borderRadius: 8
          }}>
            <h3>
              {programs.length === 0 ? '✅ RLS FONCTIONNE !' : '❌ PROBLÈME RLS !'}
            </h3>
            {programs.length === 0 ? (
              <p>Aucun programme visible = l'isolation fonctionne correctement</p>
            ) : (
              <p>Des programmes sont visibles alors qu'ils ne devraient pas l'être</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
