import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getAllUserProgress, calculateGlobalProgress } from '../../services/progressionService';

export default function ApprenantDashboard() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [globalProgress, setGlobalProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      // Récupérer info utilisateur
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserName(userDoc.data().displayName || userDoc.data().name || 'Apprenant');
      }

      // Récupérer tous les programmes publiés
      const programsSnap = await getDocs(collection(db, 'programs'));
      const programsData = [];

      for (const programDoc of programsSnap.docs) {
        const programData = programDoc.data();
        
        // Filtrer uniquement les programmes publiés
        if (programData.status === 'published') {
          // Compter les leçons dans tous les modules
          let totalLessons = 0;
          const modulesSnap = await getDocs(
            collection(db, `programs/${programDoc.id}/modules`)
          );
          
          for (const moduleDoc of modulesSnap.docs) {
            const lessonsSnap = await getDocs(
              collection(db, `programs/${programDoc.id}/modules/${moduleDoc.id}/lessons`)
            );
            totalLessons += lessonsSnap.size;
          }

          programsData.push({
            id: programDoc.id,
            ...programData,
            totalLessons
          });
        }
      }

      setPrograms(programsData);

      // Charger la progression utilisateur
      const allProgress = await getAllUserProgress(user.uid);
      setUserProgress(allProgress);

      // Calculer progression globale
      const globalProg = await calculateGlobalProgress(user.uid);
      setGlobalProgress(globalProg);

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  }

  function getProgramStatus(programId) {
    const progress = userProgress[programId];
    if (!progress) return { label: 'Commencer', color: '#3b82f6' };
    
    if (progress.completedLessons.length === 0) {
      return { label: 'Commencer', color: '#3b82f6' };
    } else if (progress.percentage === 100) {
      return { label: 'Terminé ✓', color: '#10b981' };
    } else {
      return { label: 'Continuer', color: '#8b5cf6' };
    }
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        
        {/* Header Bienvenue */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '32px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>
            Bonjour {userName} ! 👋
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            marginBottom: '24px'
          }}>
            Continuez votre apprentissage là où vous vous êtes arrêté
          </p>

          {/* Progression globale */}
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
                Progression globale
              </span>
              <span style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {globalProgress}%
              </span>
            </div>
            
            {/* Barre de progression */}
            <div style={{
              width: '100%',
              height: '12px',
              background: '#e2e8f0',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${globalProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Section Programmes */}
        <div style={{
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '24px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            📚 Vos programmes de formation
          </h2>

          {programs.length === 0 ? (
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
                Aucun programme disponible pour le moment
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {programs.map(program => {
                const status = getProgramStatus(program.id);
                const progress = userProgress[program.id];
                const progressPercentage = progress ? progress.percentage : 0;

                return (
                  <div
                    key={program.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '28px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      border: '2px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.borderColor = status.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onClick={() => navigate(`/apprenant/programs/${program.id}`)}
                  >
                    {/* Icône programme */}
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${status.color}22 0%, ${status.color}11 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      marginBottom: '20px'
                    }}>
                      {program.icon || '📚'}
                    </div>

                    {/* Titre */}
                    <h3 style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '8px',
                      letterSpacing: '-0.3px'
                    }}>
                      {program.name}
                    </h3>

                    {/* Description */}
                    {program.description && (
                      <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        marginBottom: '16px',
                        lineHeight: '1.5'
                      }}>
                        {program.description}
                      </p>
                    )}

                    {/* Métier */}
                    {program.categoryName && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: '#f1f5f9',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#64748b',
                        marginBottom: '16px'
                      }}>
                        🎭 {program.categoryName}
                      </div>
                    )}

                    {/* Nombre de leçons */}
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      marginBottom: '16px'
                    }}>
                      {program.totalLessons} leçon{program.totalLessons > 1 ? 's' : ''}
                    </p>

                    {/* Barre de progression */}
                    {progress && progressPercentage > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#64748b'
                          }}>
                            Progression
                          </span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: status.color
                          }}>
                            {progressPercentage}%
                          </span>
                        </div>
                        
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#e2e8f0',
                          borderRadius: '999px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${progressPercentage}%`,
                            height: '100%',
                            background: status.color,
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Bouton action */}
                    <button
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: status.color,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = `0 8px 20px ${status.color}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/apprenant/programs/${program.id}`);
                      }}
                    >
                      {status.label}
                      <span style={{ fontSize: '18px' }}>→</span>
                    </button>
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
