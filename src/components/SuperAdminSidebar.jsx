import { NavLink, useNavigate } from 'react-router-dom';
import { Building2, Users, Settings, LogOut, Shield, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/superadmin/dashboard'
    },
    {
      label: 'Organisations',
      icon: Building2,
      path: '/superadmin/organizations'
    },
    {
      label: 'Utilisateurs',
      icon: Users,
      path: '/superadmin/users'
    },
    {
      label: 'Configuration',
      icon: Settings,
      path: '/superadmin/settings'
    }
  ];

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      {/* Logo et titre */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '700', 
              color: 'white' 
            }}>
              Coach Learning
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#94a3b8' 
            }}>
              Super Admin
            </div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <nav style={{ 
        flex: 1, 
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              background: isActive 
                ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                : 'transparent',
              color: isActive ? 'white' : '#94a3b8',
            })}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Accès Admin Organisation */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <NavLink
          to="/admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '500',
            background: 'rgba(99, 102, 241, 0.1)',
            color: '#818cf8',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}
        >
          <LayoutDashboard size={18} />
          Accéder à Admin Org
        </NavLink>
      </div>

      {/* User info et déconnexion */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              SA
            </div>
            <div>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                color: 'white',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                Super Admin
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#64748b' 
              }}>
                Plateforme
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Déconnexion"
          >
            <LogOut size={18} color="#ef4444" />
          </button>
        </div>
      </div>
    </div>
  );
}
