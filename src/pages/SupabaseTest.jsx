import { useState } from 'react'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'

export default function SupabaseTest() {
  const { user, userData, organizationId, loading, signIn, signOut } = useSupabaseAuth()
  const [email, setEmail] = useState('admin@test-org.com')
  const [password, setPassword] = useState('Test123456!')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await signIn(email, password)
      console.log('✅ Connexion Supabase réussie')
    } catch (error) {
      console.error('❌ Erreur connexion Supabase:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      console.log('✅ Déconnexion Supabase réussie')
    } catch (error) {
      console.error('❌ Erreur déconnexion Supabase:', error)
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h1>⏳ Chargement...</h1>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: 40, 
      maxWidth: 600, 
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>🧪 Test Supabase Auth</h1>
      
      <div style={{ 
        padding: 20, 
        backgroundColor: user ? '#d4edda' : '#f8d7da',
        borderRadius: 8,
        marginBottom: 30
      }}>
        <h2>État de connexion Supabase</h2>
        {user ? (
          <>
            <p>✅ <strong>Connecté</strong></p>
            <p>📧 Email: <code>{user.email}</code></p>
            <p>🆔 User ID: <code>{user.id}</code></p>
            {userData && (
              <>
                <p>👤 Nom complet: <code>{userData.full_name}</code></p>
                <p>🏢 Organisation ID: <code>{organizationId}</code></p>
                <p>👔 Rôle: <code>{userData.role}</code></p>
              </>
            )}
            <button 
              onClick={handleSignOut}
              style={{
                marginTop: 20,
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              Se déconnecter
            </button>
          </>
        ) : (
          <p>❌ <strong>Non connecté</strong></p>
        )}
      </div>

      {!user && (
        <form onSubmit={handleSignIn} style={{ marginTop: 30 }}>
          <h2>Connexion Supabase</h2>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '1px solid #ccc',
                borderRadius: 6
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                border: '1px solid #ccc',
                borderRadius: 6
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: 15,
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: 6,
              marginBottom: 20
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: 12,
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 600,
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? '⏳ Connexion...' : 'Se connecter'}
          </button>

          <div style={{
            marginTop: 30,
            padding: 15,
            backgroundColor: '#e7f3ff',
            borderRadius: 6
          }}>
            <h3>👥 Comptes de test</h3>
            <p><strong>Organisation Test:</strong></p>
            <p>📧 admin@test-org.com</p>
            <p>🔑 Test123456!</p>
            
            <p style={{ marginTop: 15 }}><strong>Organisation Demo:</strong></p>
            <p>📧 admin@demo-org.com</p>
            <p>🔑 Test123456!</p>
          </div>
        </form>
      )}
    </div>
  )
}
