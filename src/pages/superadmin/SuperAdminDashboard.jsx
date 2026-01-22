import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Users, Building2, Settings } from 'lucide-react';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  // Protéger la page - seuls les Super Admins peuvent y accéder
  if (!isSuperAdmin) {
    navigate('/login');
    return null;
  }

  const cards = [
    {
      title: 'Organisations',
      description: 'Gérer toutes les organisations inscrites',
      icon: Building2,
      path: '/superadmin/organizations',
      color: '#667eea'
    },
    {
      title: 'Utilisateurs',
      description: 'Vue globale de tous les utilisateurs',
      icon: Users,
      path: '/superadmin/users',
      color: '#10b981'
    },
    {
      title: 'Configuration',
      description: 'Paramètres globaux de la plateforme',
      icon: Settings,
      path: '/superadmin/settings',
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <Shield size={36} color="white" />
        </div>
        
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          Bienvenue Super Admin ! 🛡️
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          color: '#64748b',
          maxWidth: '700px'
        }}>
          Vous avez accès à toutes les fonctionnalités de gestion de la plateforme.
          Utilisez le menu latéral pour naviguer entre les différentes sections.
        </p>
      </div>

      {/* Cards de navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginTop: '32px'
      }}>
        {cards.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            style={{
              textDecoration: 'none',
              display: 'block'
            }}
          >
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '28px',
              border: '2px solid #e2e8f0',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = card.color;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.1)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: `${card.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <card.icon size={28} color={card.color} />
              </div>
              
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                {card.title}
              </h3>
              
              <p style={{ 
                fontSize: '14px', 
                color: '#64748b',
                lineHeight: '1.6'
              }}>
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
