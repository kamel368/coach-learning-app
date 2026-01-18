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
    // ✅ Guard de sécurité : vérifier que userProgress existe
    if (!userProgress || !userProgress[programId]) {
      return { label: 'Commencer', color: '#3b82f6' };
    }
    
    const progress = userProgress[programId];
    
    // ✅ Guard de sécurité : vérifier que completedLessons existe
    if (!progress.completedLessons || progress.completedLessons.length === 0) {
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
      minHeight: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(24px, 4vw, 40px) clamp(16px, 3vw, 24px)',
        paddingBottom: 'clamp(40px, 6vw, 60px)'
      }}>
        
        {/* Header de bienvenue */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 'clamp(12px, 2.5vw, 20px)',
          padding: 'clamp(20px, 4vw, 32px)',
          marginBottom: 'clamp(20px, 3vw, 28px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}>
          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>
            Bonjour {userName} ! 👋
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 3vw, 18px)',
            color: '#64748b',
            marginBottom: 'clamp(20px, 4vw, 32px)',
            lineHeight: '1.6'
          }}>
            Continuez votre apprentissage là où vous vous êtes arrêté
          </p>

          {/* Progression globale */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '16px',
            padding: 'clamp(16px, 3vw, 24px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span style={{
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                Progression globale
              </span>
              <span style={{
                fontSize: 'clamp(20px, 4vw, 28px)',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {globalProgress}%
              </span>
            </div>
            
            <div style={{
              width: '100%',
              height: 'clamp(10px, 2vw, 16px)',
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

        {/* Section programmes */}
        <div>
          <h2 style={{
            fontSize: 'clamp(20px, 4vw, 28px)',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: 'clamp(16px, 3vw, 24px)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            paddingLeft: 'clamp(0px, 2vw, 8px)'
          }}>
            📚 Vos programmes de formation
          </h2>

          {programs.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: 'clamp(32px, 6vw, 60px)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 'clamp(48px, 10vw, 64px)',
                marginBottom: '16px'
              }}>
                📚
              </div>
              <p style={{
                fontSize: 'clamp(16px, 3vw, 18px)',
                color: '#64748b',
                marginBottom: '8px'
              }}>
                Aucun programme disponible pour le moment
              </p>
              <p style={{
                fontSize: 'clamp(13px, 2.5vw, 14px)',
                color: '#94a3b8'
              }}>
                Les programmes apparaîtront ici une fois qu'ils seront publiés
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: 'clamp(16px, 3vw, 24px)'
            }}>
              {programs.map((program) => (
                <div
                  key={program.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    padding: 'clamp(20px, 4vw, 28px)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    border: '2px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.borderColor = '#8b5cf6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onClick={() => navigate(`/apprenant/programs/${program.id}`)}
                >
                  {/* Icône */}
                  <div style={{
                    width: 'clamp(56px, 12vw, 72px)',
                    height: 'clamp(56px, 12vw, 72px)',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(28px, 6vw, 36px)',
                    marginBottom: 'clamp(16px, 3vw, 20px)',
                    flexShrink: 0
                  }}>
                    {program.icon || '📚'}
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: 'clamp(18px, 3.5vw, 22px)',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '8px',
                      lineHeight: '1.3'
                    }}>
                      {program.name}
                    </h3>

                    {program.description && (
                      <p style={{
                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                        color: '#64748b',
                        marginBottom: '16px',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {program.description}
                      </p>
                    )}

                    <div style={{
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      color: '#94a3b8',
                      marginBottom: '16px'
                    }}>
                      {program.totalLessons} leçon{program.totalLessons > 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Bouton */}
                  <button
                    style={{
                      width: '100%',
                      padding: 'clamp(12px, 2.5vw, 14px)',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
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
                    <span>Commencer</span>
                    <span style={{ fontSize: 'clamp(16px, 3vw, 18px)' }}>→</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
