import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  HelpCircle, 
  BrainCircuit, 
  UserCog,
  Menu,
  LogOut
} from 'lucide-react';

export const SIDEBAR_WIDTH = 220;
export const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);

const handleLogout = async () => {
  console.log('🚪 Logout clicked!');
  console.log('🔍 logout function:', typeof logout);
  console.log('🔍 user:', user);
  
  try {
    if (!logout) {
      console.error('❌ logout function is undefined!');
      alert('Fonction de déconnexion non disponible');
      return;
    }
    
    console.log('🔄 Attempting logout...');
    await logout();
    console.log('✅ Logout successful');
    navigate('/login');
  } catch (error) {
    console.error('❌ Erreur de déconnexion:', error);
    console.error('❌ Error details:', error.message, error.stack);
    alert('Erreur lors de la déconnexion: ' + error.message);
  }
};


  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/roles-metier', icon: Users, label: 'Rôles Métier' },
    { path: '/admin/programs', icon: BookOpen, label: 'Programmes' },
    { path: '/admin/quizzes', icon: HelpCircle, label: 'Exercices' },
    { path: '/admin/ai-exercises', icon: BrainCircuit, label: 'Exercices IA' },
    { path: '/admin/users', icon: UserCog, label: 'Utilisateurs' },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={isOpen ? 'sidebar-open' : ''}
      onClick={(e) => {
        // Fermer la sidebar si on clique sur l'overlay (< 1024px)
        if (e.target === e.currentTarget && window.innerWidth < 1024) {
          setIsOpen(false);
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: isOpen ? `${SIDEBAR_WIDTH}px` : `${SIDEBAR_WIDTH_COLLAPSED}px`,
        backgroundColor: '#f8f9fa',
        color: '#1f2937',
        padding: isOpen ? '16px 12px' : '16px 8px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.3s ease, padding 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
        borderRight: '1px solid #e5e7eb',
        zIndex: 1000,
      }}
    >
      <div>
        {/* Header avec bouton hamburger */}
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'space-between' : 'center',
          }}
        >
          {isOpen && (
            <div>
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/admin');
                }}
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1f2937',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                🎓 Coach Learning
              </a>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Espace admin
              </div>
            </div>
          )}
          
          {/* BOUTON HAMBURGER */}
          <button
            onClick={() => {
              console.log('🍔 Hamburger clicked! isOpen:', isOpen);
              setIsOpen(!isOpen);
            }}
            style={{
              background: 'transparent',
              border: '1px solid #e5e7eb',
              color: '#374151',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            title={isOpen ? 'Réduire' : 'Ouvrir'}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Label ADMIN */}
        {isOpen && (
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: '8px',
              fontWeight: '600',
            }}
          >
            ADMIN
          </div>
        )}

        {/* Menu items */}
        <nav style={{ marginBottom: '16px' }}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isOpen ? '12px' : '0',
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  padding: '10px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive(item.path) ? '#111827' : '#4b5563',
                  backgroundColor: isActive(item.path) ? '#fbbf24' : 'transparent',
                  fontSize: '14px',
                  fontWeight: isActive(item.path) ? '600' : '400',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <IconComponent className="w-5 h-5" style={{ minWidth: '20px' }} />
                {isOpen && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '24px' }}>
        {user && (
          <span
            style={{
              display: 'block',
              fontSize: isOpen ? '12px' : '10px',
              color: '#6b7280',
              marginBottom: '8px',
              wordBreak: 'break-all',
              textAlign: isOpen ? 'left' : 'center',
              transition: 'all 0.3s',
            }}
          >
            {isOpen ? user.email : '👤'}
          </span>
        )}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: isOpen ? '8px 12px' : '8px 4px',
            background: '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '999px',
            fontSize: isOpen ? '13px' : '18px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
          title={isOpen ? '' : 'Déconnexion'}
        >
          {isOpen ? (
            <>
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </>
          ) : (
            <LogOut className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
