import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { auth } from '../../firebase';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ApprenantLayout() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Apprenant');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .mobile-menu-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              z-index: 998;
              animation: fadeIn 0.2s ease;
            }
            
            .mobile-menu {
              position: fixed;
              top: 0;
              right: 0;
              width: 280px;
              height: 100vh;
              background: white;
              box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
              z-index: 999;
              animation: slideInRight 0.3s ease;
              overflow-y: auto;
            }
            
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          }
        `}
      </style>

      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <header style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 20px',
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
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                fontSize: 'clamp(18px, 4vw, 24px)',
                fontWeight: '700',
                color: '#1e293b'
              }}>
                🎓 <span style={{ display: window.innerWidth < 500 ? 'none' : 'inline' }}>Coach Learning</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav style={{
              display: window.innerWidth >= 768 ? 'flex' : 'none',
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: window.innerWidth < 768 ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: '#64748b'
              }}
            >
              ☰
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && window.innerWidth < 768 && (
          <>
            <div 
              className="mobile-menu-overlay"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <div className="mobile-menu">
              {/* Header du menu */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1e293b'
                }}>
                  Menu
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#64748b'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* User info */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                  marginBottom: '4px'
                }}>
                  Connecté en tant que
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  👤 {userName}
                </div>
              </div>

              {/* Navigation */}
              <div style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <NavLink
                  to="/apprenant/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: isActive ? '#f3e8ff' : '#f8fafc',
                    color: isActive ? '#8b5cf6' : '#64748b',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  })}
                >
                  📚 Mes programmes
                </NavLink>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  style={{
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#dc2626',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  🚪 Déconnexion
                </button>
              </div>
            </div>
          </>
        )}

        {/* Main content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
