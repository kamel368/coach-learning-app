import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { BookOpen, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  
  const [stats, setStats] = useState({
    programs: 0,
    lessons: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);

  // Charger les statistiques
  useEffect(() => {
    if (!organizationId) return; // Attendre l'organizationId
    
    async function loadStats() {
      try {
        // Charger les programmes depuis l'organisation
        const programsCollection = organizationId
          ? collection(db, 'organizations', organizationId, 'programs')
          : collection(db, 'programs');
        
        const programsSnap = await getDocs(programsCollection);
        const programsCount = programsSnap.size;
        
        console.log('📊 Stats programmes:', programsCount, 'depuis', organizationId ? `/organizations/${organizationId}/programs` : '/programs');

        // Compter les leçons dans tous les chapters de tous les programmes
        let lessonsCount = 0;
        for (const programDoc of programsSnap.docs) {
          const modulesPath = organizationId
            ? `organizations/${organizationId}/programs/${programDoc.id}/chapters`
            : `programs/${programDoc.id}/chapters`;
          
          const modulesSnap = await getDocs(collection(db, modulesPath));
          
          for (const chapterDoc of modulesSnap.docs) {
            const lessonsPath = organizationId
              ? `organizations/${organizationId}/programs/${programDoc.id}/chapitres/${chapterDoc.id}/lessons`
              : `programs/${programDoc.id}/chapitres/${chapterDoc.id}/lessons`;
            
            const lessonsSnap = await getDocs(collection(db, lessonsPath));
            lessonsCount += lessonsSnap.size;
          }
        }
        
        console.log('📊 Stats leçons:', lessonsCount);

        // Charger les utilisateurs/employees depuis l'organisation
        const usersCollection = organizationId
          ? collection(db, 'organizations', organizationId, 'employees')
          : collection(db, 'users');
        
        const usersSnap = await getDocs(usersCollection);
        const usersCount = usersSnap.size;
        
        console.log('📊 Stats utilisateurs:', usersCount, 'depuis', organizationId ? `/organizations/${organizationId}/employees` : '/users');

        setStats({
          programs: programsCount,
          lessons: lessonsCount,
          users: usersCount
        });
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [organizationId]);

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 80px)',
      background: '#f8fafc'
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '6px',
          letterSpacing: '-0.5px'
        }}>
          Bienvenue sur Coach Learning 👋
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          fontWeight: '400'
        }}>
          Visualisez vos formations, catégories et simulations IA.
        </p>
      </div>

      {/* Statistiques - Cards colorées avec gradients */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        
        {/* Stat Programmes - Violet */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          borderRadius: '16px',
          padding: '20px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
          transition: 'transform 0.3s, box-shadow 0.3s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)';
        }}
        onClick={() => navigate('/admin/programs')}
        >
          {/* Icône en fond (watermark) */}
          <div style={{
            position: 'absolute',
            right: -15,
            bottom: -15,
            opacity: 0.15
          }}>
            <BookOpen size={90} color="#ffffff" strokeWidth={1.5} />
          </div>
          
          {/* Contenu */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '38px',
              fontWeight: '700',
              marginBottom: '6px',
              letterSpacing: '-1px'
            }}>
              {loading ? '...' : stats.programs}
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              opacity: 0.95,
              marginBottom: '3px'
            }}>
              Programmes actifs
            </div>
            <div style={{
              fontSize: '13px',
              opacity: 0.8
            }}>
              Parcours de formation créés
            </div>
          </div>
        </div>

        {/* Stat Leçons - Bleu */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '16px',
          padding: '20px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
          transition: 'transform 0.3s, box-shadow 0.3s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)';
        }}
        >
          <div style={{
            position: 'absolute',
            right: -15,
            bottom: -15,
            opacity: 0.15
          }}>
            <BookOpen size={90} color="#ffffff" strokeWidth={1.5} />
          </div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '38px',
              fontWeight: '700',
              marginBottom: '6px',
              letterSpacing: '-1px'
            }}>
              {loading ? '...' : stats.lessons}
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              opacity: 0.95,
              marginBottom: '3px'
            }}>
              Leçons créées
            </div>
            <div style={{
              fontSize: '13px',
              opacity: 0.8
            }}>
              Contenu pédagogique disponible
            </div>
          </div>
        </div>

        {/* Stat Utilisateurs - Rose */}
        <div style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
          borderRadius: '16px',
          padding: '20px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)',
          transition: 'transform 0.3s, box-shadow 0.3s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(236, 72, 153, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(236, 72, 153, 0.3)';
        }}
        onClick={() => navigate('/admin/users')}
        >
          <div style={{
            position: 'absolute',
            right: -15,
            bottom: -15,
            opacity: 0.15
          }}>
            <Users size={90} color="#ffffff" strokeWidth={1.5} />
          </div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '38px',
              fontWeight: '700',
              marginBottom: '6px',
              letterSpacing: '-1px'
            }}>
              {loading ? '...' : stats.users}
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              opacity: 0.95,
              marginBottom: '3px'
            }}>
              Apprenants inscrits
            </div>
            <div style={{
              fontSize: '13px',
              opacity: 0.8
            }}>
              Utilisateurs actifs
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides - Section titre */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1e293b',
          letterSpacing: '-0.5px'
        }}>
          Actions rapides
        </h2>
      </div>

      {/* Cards actions - Grid moderne */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        
        {/* Card Programmes */}
        <div
          onClick={() => navigate('/admin/programs')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '20px',
            cursor: 'pointer',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 32px rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <BookOpen size={24} color="#8b5cf6" strokeWidth={2} />
          </div>
          
          <h3 style={{
            fontSize: '17px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '6px',
            letterSpacing: '-0.3px'
          }}>
            Programmes
          </h3>
          
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            lineHeight: '1.5',
            marginBottom: '12px'
          }}>
            Créez des parcours de formation par thématique.
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#8b5cf6',
            fontWeight: '600'
          }}>
            <span>Gérer les programmes</span>
            <span style={{ fontSize: '16px' }}>→</span>
          </div>
        </div>

        {/* Card Utilisateurs */}
        <div
          onClick={() => navigate('/admin/users')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '20px',
            cursor: 'pointer',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 32px rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <Users size={24} color="#ec4899" strokeWidth={2} />
          </div>
          
          <h3 style={{
            fontSize: '17px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '6px',
            letterSpacing: '-0.3px'
          }}>
            Utilisateurs
          </h3>
          
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            lineHeight: '1.5',
            marginBottom: '12px'
          }}>
            Gérez les apprenants et leurs accès.
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#ec4899',
            fontWeight: '600'
          }}>
            <span>Gérer les utilisateurs</span>
            <span style={{ fontSize: '16px' }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );
}
