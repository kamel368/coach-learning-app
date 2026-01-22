import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Building2, Users, Calendar } from 'lucide-react';

export default function SuperAdminOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    setLoading(true);
    try {
      const orgsSnapshot = await getDocs(collection(db, 'organizations'));
      const orgsData = await Promise.all(
        orgsSnapshot.docs.map(async (orgDoc) => {
          const orgData = orgDoc.data();
          
          // Compter les employés
          const employeesSnapshot = await getDocs(
            collection(db, 'organizations', orgDoc.id, 'employees')
          );
          
          return {
            id: orgDoc.id,
            name: orgData.name || orgData.info?.name || orgDoc.id,
            slug: orgData.slug || '',
            status: orgData.status || 'active',
            createdAt: orgData.createdAt,
            employeeCount: employeesSnapshot.size
          };
        })
      );

      setOrganizations(orgsData);
    } catch (error) {
      console.error('Erreur chargement organisations:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          Organisations
        </h1>
        <p style={{ color: '#64748b' }}>
          Toutes les organisations inscrites sur la plateforme
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Chargement...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {organizations.map(org => (
            <div
              key={org.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Building2 size={28} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {org.name}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#64748b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {org.slug}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Users size={16} color="#64748b" />
                  <span style={{ fontSize: '14px', color: '#64748b' }}>
                    {org.employeeCount} {org.employeeCount > 1 ? 'employés' : 'employé'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Calendar size={16} color="#64748b" />
                  <span style={{ fontSize: '14px', color: '#64748b' }}>
                    Créée le{' '}
                    {org.createdAt?.toDate 
                      ? new Date(org.createdAt.toDate()).toLocaleDateString('fr-FR')
                      : 'Date inconnue'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: org.status === 'active' ? '#10b981' : '#ef4444'
                  }} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: org.status === 'active' ? '#10b981' : '#ef4444'
                  }}>
                    {org.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && organizations.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '60px',
          textAlign: 'center'
        }}>
          <Building2 size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', color: '#94a3b8' }}>
            Aucune organisation trouvée
          </p>
        </div>
      )}
    </div>
  );
}
