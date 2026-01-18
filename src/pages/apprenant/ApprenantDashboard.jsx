import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getAllUserProgress, calculateGlobalProgress } from '../../services/progressionService';
import { BookOpen, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { apprenantTheme, cardStyles, buttonStyles } from '../../styles/apprenantTheme';

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
        fontSize: apprenantTheme.fontSize.lg,
        color: apprenantTheme.colors.textSecondary
      }}>
        Chargement...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100%',
      background: apprenantTheme.colors.bgApp
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: apprenantTheme.spacing.lg + ' ' + apprenantTheme.spacing.md,
        paddingBottom: 'clamp(40px, 6vw, 60px)'
      }}>
        
        {/* Header de bienvenue */}
        <div style={{
          background: apprenantTheme.colors.bgPrimary,
          borderRadius: apprenantTheme.radius.xl,
          padding: apprenantTheme.spacing.xl,
          marginBottom: apprenantTheme.spacing.lg,
          boxShadow: apprenantTheme.shadows.xl
        }}>
          <h1 style={{
            fontSize: apprenantTheme.fontSize['4xl'],
            fontWeight: '700',
            color: apprenantTheme.colors.textPrimary,
            marginBottom: '12px',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <span>Bonjour {userName} !</span>
            <span style={{
              display: 'inline-block',
              animation: 'wave 2s ease-in-out infinite'
            }}>👋</span>
          </h1>

          <style>
            {`
              @keyframes wave {
                0%, 100% { transform: rotate(0deg); }
                10%, 30% { transform: rotate(14deg); }
                20% { transform: rotate(-8deg); }
                40% { transform: rotate(-4deg); }
                50% { transform: rotate(10deg); }
                60% { transform: rotate(0deg); }
              }
            `}
          </style>

          <p style={{
            fontSize: apprenantTheme.fontSize.lg,
            color: apprenantTheme.colors.textSecondary,
            marginBottom: apprenantTheme.spacing.lg,
            lineHeight: '1.6'
          }}>
            Continuez votre apprentissage là où vous vous êtes arrêté
          </p>

          {/* Progression globale */}
          <div style={{
            background: apprenantTheme.gradients.card,
            borderRadius: apprenantTheme.radius.lg,
            padding: apprenantTheme.spacing.md,
            border: `1px solid ${apprenantTheme.colors.border}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: apprenantTheme.fontSize.base,
                fontWeight: '600',
                color: apprenantTheme.colors.textPrimary
              }}>
                <TrendingUp size={20} color={apprenantTheme.colors.secondary} />
                <span>Progression globale</span>
              </div>
              <span style={{
                fontSize: apprenantTheme.fontSize['3xl'],
                fontWeight: '700',
                color: apprenantTheme.colors.secondary
              }}>
                {globalProgress}%
              </span>
            </div>
            
            <div style={{
              width: '100%',
              height: 'clamp(10px, 2vw, 16px)',
              background: apprenantTheme.colors.bgTertiary,
              borderRadius: apprenantTheme.radius.full,
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${globalProgress}%`,
                height: '100%',
                background: apprenantTheme.gradients.secondary,
                transition: 'width 0.5s ease',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
              }} />
            </div>
          </div>
        </div>

        {/* Section programmes */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: apprenantTheme.fontSize['3xl'],
            fontWeight: '800',
            color: apprenantTheme.colors.primary,
            marginBottom: apprenantTheme.spacing.md,
            paddingLeft: 'clamp(0px, 2vw, 8px)'
          }}>
            <BookOpen size={28} strokeWidth={2.5} />
            <span>Vos programmes de formation</span>
          </div>

          {programs.length === 0 ? (
            <div style={{
              background: apprenantTheme.colors.bgPrimary,
              borderRadius: apprenantTheme.radius.xl,
              padding: 'clamp(32px, 6vw, 60px)',
              textAlign: 'center',
              boxShadow: apprenantTheme.shadows.xl
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                borderRadius: apprenantTheme.radius.full,
                background: apprenantTheme.gradients.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={40} color={apprenantTheme.colors.textTertiary} />
              </div>
              <p style={{
                fontSize: apprenantTheme.fontSize.lg,
                color: apprenantTheme.colors.textSecondary,
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                Aucun programme disponible pour le moment
              </p>
              <p style={{
                fontSize: apprenantTheme.fontSize.sm,
                color: apprenantTheme.colors.textTertiary
              }}>
                Les programmes apparaîtront ici une fois qu'ils seront publiés
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: apprenantTheme.spacing.md
            }}>
              {programs.map((program) => (
                <div
                  key={program.id}
                  style={{
                    ...cardStyles.base,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    background: apprenantTheme.colors.bgPrimary
                  }}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, cardStyles.hover);
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, cardStyles.base);
                    e.currentTarget.style.background = apprenantTheme.colors.bgPrimary;
                  }}
                  onClick={() => navigate(`/apprenant/programs/${program.id}`)}
                >
                  {/* Icône programme */}
                  <div style={{
                    width: 'clamp(56px, 12vw, 72px)',
                    height: 'clamp(56px, 12vw, 72px)',
                    borderRadius: apprenantTheme.radius.lg,
                    background: apprenantTheme.gradients.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: apprenantTheme.spacing.md,
                    boxShadow: apprenantTheme.shadows.md,
                    flexShrink: 0
                  }}>
                    <BookOpen size={32} color="white" strokeWidth={2} />
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: apprenantTheme.fontSize.xl,
                      fontWeight: '700',
                      color: apprenantTheme.colors.textPrimary,
                      marginBottom: '8px',
                      lineHeight: '1.3'
                    }}>
                      {program.name}
                    </h3>

                    {program.description && (
                      <p style={{
                        fontSize: apprenantTheme.fontSize.sm,
                        color: apprenantTheme.colors.textSecondary,
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: apprenantTheme.fontSize.sm,
                      color: apprenantTheme.colors.textTertiary,
                      marginBottom: '16px'
                    }}>
                      <Clock size={14} />
                      <span>{program.totalLessons} leçon{program.totalLessons > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Bouton */}
                  <button
                    style={{
                      ...buttonStyles.primary.base,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, buttonStyles.primary.hover);
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(e.currentTarget.style, buttonStyles.primary.base);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/apprenant/programs/${program.id}`);
                    }}
                  >
                    <span>Commencer</span>
                    <ArrowRight size={18} strokeWidth={2.5} />
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
