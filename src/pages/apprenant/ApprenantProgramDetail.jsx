import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getUserProgramProgress } from '../../services/progressionService';

export default function ApprenantProgramDetail() {
  const { programId } = useParams();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState(null);
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [programId]);

  async function loadData() {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      // Récupérer le programme
      const programDoc = await getDoc(doc(db, 'programs', programId));
      if (!programDoc.exists()) {
        navigate('/apprenant/dashboard');
        return;
      }
      
      const programData = { id: programDoc.id, ...programDoc.data() };
      setProgram(programData);

      // Récupérer les modules du programme
      const modulesRef = collection(db, `programs/${programId}/modules`);
      const modulesQuery = query(modulesRef, orderBy('order', 'asc'));
      const modulesSnap = await getDocs(modulesQuery);
      
      const modulesData = [];
      for (const moduleDoc of modulesSnap.docs) {
        const moduleData = moduleDoc.data();
        
        // Compter les leçons de ce module
        const lessonsSnap = await getDocs(
          collection(db, `programs/${programId}/modules/${moduleDoc.id}/lessons`)
        );
        
        modulesData.push({
          id: moduleDoc.id,
          ...moduleData,
          totalLessons: lessonsSnap.size
        });
      }

      setModules(modulesData);

      // Récupérer la progression utilisateur
      const progress = await getUserProgramProgress(user.uid, programId);
      setUserProgress(progress);

    } catch (error) {
      console.error('Erreur chargement programme:', error);
    } finally {
      setLoading(false);
    }
  }

  function getModuleStatus(moduleId) {
    if (!userProgress || !userProgress.completedLessons) {
      return { icon: '🔒', label: 'Non commencé', color: '#94a3b8' };
    }

    // Vérifier si toutes les leçons du module sont terminées
    const module = modules.find(m => m.id === moduleId);
    if (!module) return { icon: '🔒', label: 'Non commencé', color: '#94a3b8' };

    // Pour l'instant on considère le module commencé si au moins une leçon est faite
    // et terminé si toutes les leçons sont faites
    // (logique simplifiée, on peut améliorer plus tard)
    
    return { icon: '📖', label: 'Commencer', color: '#3b82f6' };
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#64748b'
      }}>
        Chargement...
      </div>
    );
  }

  if (!program) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '18px', color: '#64748b' }}>
          Programme introuvable
        </p>
        <button
          onClick={() => navigate('/apprenant/dashboard')}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Retour au dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        
        {/* Bouton retour */}
        <button
          onClick={() => navigate('/apprenant/dashboard')}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          ← Retour aux programmes
        </button>

        {/* Header Programme */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '32px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
        }}>
          {/* Icône */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            marginBottom: '24px'
          }}>
            {program.icon || '📚'}
          </div>

          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>
            {program.name}
          </h1>

          {program.description && (
            <p style={{
              fontSize: '18px',
              color: '#64748b',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              {program.description}
            </p>
          )}

          {/* Progression programme */}
          {userProgress && (
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '16px',
              padding: '24px',
              marginTop: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Votre progression
                </span>
                <span style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#8b5cf6'
                }}>
                  {userProgress.percentage || 0}%
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '12px',
                background: '#e2e8f0',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${userProgress.percentage || 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Liste des modules */}
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '24px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            📖 Modules du programme
          </h2>

          {modules.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '18px',
                color: '#64748b'
              }}>
                Aucun module disponible pour ce programme
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {modules.map((module, index) => {
                const status = getModuleStatus(module.id);

                return (
                  <div
                    key={module.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      border: '2px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.borderColor = status.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onClick={() => navigate(`/apprenant/programs/${programId}/modules/${module.id}`)}
                  >
                    {/* Numéro module */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      background: `${status.color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: '700',
                      color: status.color,
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#1e293b',
                        marginBottom: '6px'
                      }}>
                        {module.title}
                      </h3>

                      {module.description && (
                        <p style={{
                          fontSize: '14px',
                          color: '#64748b',
                          marginBottom: '8px',
                          lineHeight: '1.5'
                        }}>
                          {module.description}
                        </p>
                      )}

                      <div style={{
                        fontSize: '13px',
                        color: '#94a3b8'
                      }}>
                        {module.totalLessons} leçon{module.totalLessons > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: `${status.color}11`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: status.color,
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '18px' }}>{status.icon}</span>
                      <span>{status.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
