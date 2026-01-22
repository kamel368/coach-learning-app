import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Search } from 'lucide-react';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllUsers();
  }, []);

  async function loadAllUsers() {
    setLoading(true);
    try {
      // Charger tous les utilisateurs de toutes les organisations
      const orgsSnapshot = await getDocs(collection(db, 'organizations'));
      let allUsers = [];

      for (const orgDoc of orgsSnapshot.docs) {
        const employeesSnapshot = await getDocs(
          collection(db, 'organizations', orgDoc.id, 'employees')
        );
        
        employeesSnapshot.docs.forEach(empDoc => {
          const data = empDoc.data();
          allUsers.push({
            id: empDoc.id,
            orgId: orgDoc.id,
            orgName: orgDoc.data().name || orgDoc.data().info?.name || orgDoc.id,
            ...data.profile
          });
        });
      }

      setUsers(allUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
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
          Utilisateurs
        </h1>
        <p style={{ color: '#64748b' }}>
          Vue globale de tous les utilisateurs de la plateforme
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Chargement...
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Utilisateur</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Organisation</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Rôle</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={`${user.orgId}-${user.id}`} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500', color: '#1e293b' }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {user.email}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>
                    {user.orgName}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: user.role === 'admin' ? '#fef3c7' : user.role === 'trainer' ? '#dbeafe' : '#dcfce7',
                      color: user.role === 'admin' ? '#92400e' : user.role === 'trainer' ? '#1e40af' : '#166534'
                    }}>
                      {user.role === 'admin' ? 'Admin' : user.role === 'trainer' ? 'Formateur' : 'Apprenant'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: user.status === 'active' ? '#10b981' : '#ef4444'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: user.status === 'active' ? '#10b981' : '#ef4444'
                      }} />
                      {user.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}
