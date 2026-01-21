import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { auth } from '../../firebase';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Menu, X, BookOpen, User, LogOut, BarChart3, Zap, Flame } from 'lucide-react';
import { apprenantTheme } from '../../styles/apprenantTheme';
import { useGamification } from '../../hooks/useGamification';

export default function ApprenantLayout() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Apprenant');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = auth.currentUser;
  
  // 🎮 GAMIFICATION : Charger les données XP et streak
  const { gamificationData, currentLevel, loading: gamifLoading } = useGamification(user?.uid);

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
        background: apprenantTheme.colors.bgSecondary,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <header style={{
          background: apprenantTheme.colors.bgPrimary,
          borderBottom: `1px solid ${apprenantTheme.colors.border}`,
          padding: '16px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: apprenantTheme.shadows.sm
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
                cursor: 'pointer',
                transition: apprenantTheme.transitions.base
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: apprenantTheme.radius.md,
                background: apprenantTheme.gradients.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: apprenantTheme.shadows.md
              }}>
                <BookOpen size={16} color="white" strokeWidth={2.5} />
              </div>
              
              <div style={{
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                fontWeight: '700',
                color: apprenantTheme.colors.textPrimary,
                display: window.innerWidth < 500 ? 'none' : 'block'
              }}>
                Coach Learning
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
                  fontSize: apprenantTheme.fontSize.sm,
                  fontWeight: '600',
                  color: isActive ? apprenantTheme.colors.secondary : apprenantTheme.colors.textSecondary,
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: apprenantTheme.radius.base,
                  background: isActive ? `${apprenantTheme.colors.secondary}11` : 'transparent',
                  transition: apprenantTheme.transitions.base,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                })}
              >
                <BookOpen size={16} />
                <span>Mes programmes</span>
              </NavLink>

              <NavLink
                to="/apprenant/historique"
                style={({ isActive }) => ({
                  fontSize: apprenantTheme.fontSize.sm,
                  fontWeight: '600',
                  color: isActive ? apprenantTheme.colors.secondary : apprenantTheme.colors.textSecondary,
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: apprenantTheme.radius.base,
                  background: isActive ? `${apprenantTheme.colors.secondary}11` : 'transparent',
                  transition: apprenantTheme.transitions.base,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                })}
              >
                <BarChart3 size={16} />
                <span>Historique</span>
              </NavLink>

              {/* 🎮 WIDGET XP/STREAK */}
              {!gamifLoading && gamificationData && (
                <div 
                  onClick={() => navigate('/apprenant/badges')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '6px 12px',
                    borderRadius: apprenantTheme.radius.md,
                    background: apprenantTheme.colors.bgSecondary,
                    border: `1px solid ${apprenantTheme.colors.border}`,
                    cursor: 'pointer',
                    transition: apprenantTheme.transitions.base,
                    marginLeft: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = apprenantTheme.shadows.md;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* XP */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: apprenantTheme.radius.base,
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Zap size={14} color="white" fill="white" strokeWidth={2} />
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: apprenantTheme.colors.textPrimary,
                        lineHeight: '1'
                      }}>
                        {gamificationData.xp || 0}
                      </span>
                      <span style={{
                        fontSize: '8px',
                        fontWeight: '500',
                        color: apprenantTheme.colors.textSecondary,
                        lineHeight: '1',
                        textTransform: 'uppercase'
                      }}>
                        XP
                      </span>
                    </div>
                  </div>

                  {/* Séparateur */}
                  <div style={{
                    width: '1px',
                    height: '24px',
                    background: apprenantTheme.colors.border
                  }} />

                  {/* Streak */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: apprenantTheme.radius.base,
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Flame size={14} color="white" fill="white" strokeWidth={2} />
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: apprenantTheme.colors.textPrimary,
                        lineHeight: '1'
                      }}>
                        {gamificationData.currentStreak || 0}
                      </span>
                      <span style={{
                        fontSize: '8px',
                        fontWeight: '500',
                        color: apprenantTheme.colors.textSecondary,
                        lineHeight: '1',
                        textTransform: 'uppercase'
                      }}>
                        Jours
                      </span>
                    </div>
                  </div>

                  {/* Level badge (optionnel, compact) */}
                  <div style={{
                    padding: '3px 8px',
                    borderRadius: apprenantTheme.radius.base,
                    background: apprenantTheme.gradients.secondary,
                    fontSize: '9px',
                    fontWeight: '700',
                    color: 'white',
                    lineHeight: '1',
                    marginLeft: '4px'
                  }}>
                    Niv. {currentLevel?.level || 1}
                  </div>
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingLeft: '24px',
                borderLeft: `1px solid ${apprenantTheme.colors.border}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: apprenantTheme.fontSize.sm,
                  color: apprenantTheme.colors.textSecondary,
                  padding: '8px 12px',
                  background: apprenantTheme.colors.bgTertiary,
                  borderRadius: apprenantTheme.radius.base
                }}>
                  <User size={16} />
                  <span>{userName}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    background: apprenantTheme.colors.bgTertiary,
                    border: 'none',
                    borderRadius: apprenantTheme.radius.base,
                    fontSize: apprenantTheme.fontSize.sm,
                    fontWeight: '600',
                    color: apprenantTheme.colors.textSecondary,
                    cursor: 'pointer',
                    transition: apprenantTheme.transitions.base,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = apprenantTheme.colors.border;
                    e.currentTarget.style.color = apprenantTheme.colors.error;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = apprenantTheme.colors.bgTertiary;
                    e.currentTarget.style.color = apprenantTheme.colors.textSecondary;
                  }}
                >
                  <LogOut size={16} />
                  <span>Déconnexion</span>
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
                border: `2px solid ${apprenantTheme.colors.border}`,
                borderRadius: apprenantTheme.radius.base,
                cursor: 'pointer',
                color: apprenantTheme.colors.textSecondary,
                transition: apprenantTheme.transitions.base
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = apprenantTheme.colors.secondary;
                e.currentTarget.style.color = apprenantTheme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = apprenantTheme.colors.border;
                e.currentTarget.style.color = apprenantTheme.colors.textSecondary;
              }}
            >
              <Menu size={20} />
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
                borderBottom: `1px solid ${apprenantTheme.colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: apprenantTheme.fontSize.lg,
                  fontWeight: '700',
                  color: apprenantTheme.colors.textPrimary
                }}>
                  Menu
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: apprenantTheme.colors.bgTertiary,
                    border: 'none',
                    borderRadius: apprenantTheme.radius.base,
                    cursor: 'pointer',
                    color: apprenantTheme.colors.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* User info */}
              <div style={{
                padding: '20px',
                borderBottom: `1px solid ${apprenantTheme.colors.border}`
              }}>
                <div style={{
                  fontSize: apprenantTheme.fontSize.sm,
                  color: apprenantTheme.colors.textTertiary,
                  marginBottom: '8px'
                }}>
                  Connecté en tant que
                </div>
                <div style={{
                  fontSize: apprenantTheme.fontSize.base,
                  fontWeight: '600',
                  color: apprenantTheme.colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <User size={18} />
                  <span>{userName}</span>
                </div>
              </div>

              {/* 🎮 WIDGET XP/STREAK (Mobile) */}
              {!gamifLoading && gamificationData && (
                <div 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/apprenant/badges');
                  }}
                  style={{
                    margin: '20px',
                    padding: '16px',
                    borderRadius: apprenantTheme.radius.lg,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    border: `2px solid ${apprenantTheme.colors.border}`,
                    cursor: 'pointer',
                    transition: apprenantTheme.transitions.base
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    gap: '16px'
                  }}>
                    {/* XP */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: apprenantTheme.radius.lg,
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                      }}>
                        <Zap size={24} color="white" fill="white" strokeWidth={2} />
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: '800',
                          color: apprenantTheme.colors.textPrimary
                        }}>
                          {gamificationData.xp || 0}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: apprenantTheme.colors.textSecondary,
                          textTransform: 'uppercase'
                        }}>
                          Points XP
                        </span>
                      </div>
                    </div>

                    {/* Séparateur */}
                    <div style={{
                      width: '2px',
                      height: '60px',
                      background: apprenantTheme.colors.border,
                      borderRadius: '2px'
                    }} />

                    {/* Streak */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: apprenantTheme.radius.lg,
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                      }}>
                        <Flame size={24} color="white" fill="white" strokeWidth={2} />
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: '800',
                          color: apprenantTheme.colors.textPrimary
                        }}>
                          {gamificationData.currentStreak || 0}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: apprenantTheme.colors.textSecondary,
                          textTransform: 'uppercase'
                        }}>
                          Jours de suite
                        </span>
                      </div>
                    </div>

                    {/* Séparateur */}
                    <div style={{
                      width: '2px',
                      height: '60px',
                      background: apprenantTheme.colors.border,
                      borderRadius: '2px'
                    }} />

                    {/* Level */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: apprenantTheme.radius.lg,
                        background: apprenantTheme.gradients.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                      }}>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: '900',
                          color: 'white'
                        }}>
                          {currentLevel?.level || 1}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: apprenantTheme.colors.textSecondary,
                          textTransform: 'uppercase'
                        }}>
                          Niveau
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lien "Voir mes badges" */}
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: apprenantTheme.colors.secondary,
                    borderTop: `1px solid ${apprenantTheme.colors.border}`
                  }}>
                    Touche pour voir mes badges →
                  </div>
                </div>
              )}

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
                    padding: '14px 16px',
                    borderRadius: apprenantTheme.radius.md,
                    background: isActive ? `${apprenantTheme.colors.secondary}11` : apprenantTheme.colors.bgSecondary,
                    color: isActive ? apprenantTheme.colors.secondary : apprenantTheme.colors.textSecondary,
                    textDecoration: 'none',
                    fontSize: apprenantTheme.fontSize.base,
                    fontWeight: '600',
                    transition: apprenantTheme.transitions.base,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  })}
                >
                  <BookOpen size={20} />
                  <span>Mes programmes</span>
                </NavLink>

                <NavLink
                  to="/apprenant/historique"
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    padding: '14px 16px',
                    borderRadius: apprenantTheme.radius.md,
                    background: isActive ? `${apprenantTheme.colors.secondary}11` : apprenantTheme.colors.bgSecondary,
                    color: isActive ? apprenantTheme.colors.secondary : apprenantTheme.colors.textSecondary,
                    textDecoration: 'none',
                    fontSize: apprenantTheme.fontSize.base,
                    fontWeight: '600',
                    transition: apprenantTheme.transitions.base,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  })}
                >
                  <BarChart3 size={20} />
                  <span>Historique</span>
                </NavLink>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  style={{
                    padding: '14px 16px',
                    background: `${apprenantTheme.colors.error}11`,
                    border: 'none',
                    borderRadius: apprenantTheme.radius.md,
                    fontSize: apprenantTheme.fontSize.base,
                    fontWeight: '600',
                    color: apprenantTheme.colors.error,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: apprenantTheme.transitions.base,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <LogOut size={20} />
                  <span>Déconnexion</span>
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
