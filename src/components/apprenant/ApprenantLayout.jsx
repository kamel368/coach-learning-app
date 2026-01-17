import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { auth } from '../../firebase';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ApprenantLayout() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Apprenant');

  useEffect(() => {
    async function loadUserName() {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data().displayName || userDoc.data().name || 'Apprenant');
          }
        }
      } catch (error) {
        console.error('Erreur chargement nom utilisateur:', error);
      }
    }
    loadUserName();
  }, []);

  async function handleLogout() {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc'
    }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <div 
            onClick={() => navigate('/apprenant/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              🎓 Coach Learning
            </div>
          </div>

          {/* Navigation */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}>
            <NavLink
              to="/apprenant/dashboard"
              style={({ isActive }) => ({
                fontSize: '14px',
                fontWeight: '600',
                color: isActive ? '#8b5cf6' : '#64748b',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                background: isActive ? '#f3e8ff' : 'transparent',
                transition: 'all 0.2s'
              })}
            >
              Mes programmes
            </NavLink>

            {/* User menu */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingLeft: '24px',
              borderLeft: '1px solid #e2e8f0'
            }}>
              <span style={{
                fontSize: '14px',
                color: '#64748b'
              }}>
                👤 {userName}
              </span>
              
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                }}
              >
                Déconnexion
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Contenu */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
