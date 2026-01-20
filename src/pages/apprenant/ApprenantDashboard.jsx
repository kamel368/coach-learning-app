import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getAllUserProgress, calculateGlobalProgress, getUserAssignedProgramsWithDetails } from '../../services/progressionService';
import { BookOpen, TrendingUp, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
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

      // Récupérer les programmes affectés à l'utilisateur
      console.log('🔍 Fetching assigned programs for user:', user.uid);
      const assignedPrograms = await getUserAssignedProgramsWithDetails(user.uid);
      console.log('✅ Assigned programs:', assignedPrograms);

      // Enrichir chaque programme avec sa progression de lecture
      const programsWithProgress = await Promise.all(
        assignedPrograms.map(async (program) => {
          try {
            const progressRef = doc(db, 'userProgress', user.uid, 'programs', program.id);
            const progressSnap = await getDoc(progressRef);
            
            if (progressSnap.exists()) {
              const data = progressSnap.data();
              return {
                ...program,
                completedLessons: data.completedLessons?.length || 0,
                readingProgress: data.percentage || 0
              };
            }
            return {
              ...program,
              completedLessons: 0,
              readingProgress: 0
            };
          } catch (error) {
            console.error('Erreur récupération progression pour', program.id, error);
            return {
              ...program,
              completedLessons: 0,
              readingProgress: 0
            };
          }
        })
      );

      setPrograms(programsWithProgress);

      // Charger la progression utilisateur
      const allProgress = await getAllUserProgress(user.uid);
      setUserProgress(allProgress);

      // Calculer progression globale pour TOUS les programmes assignés (même ceux à 0%)
      const userDocSnap = await getDoc(doc(db, 'users', user.uid));
      const assignedProgramIds = userDocSnap.exists() ? (userDocSnap.data().assignedPrograms || []) : [];
      
      console.log('📚 Programmes assignés (IDs):', assignedProgramIds);
      
      // Pour CHAQUE programme, récupérer sa progression (0 si pas de document)
      const progressions = await Promise.all(
        assignedProgramIds.map(async (programId) => {
          try {
            const progressRef = doc(db, 'userProgress', user.uid, 'programs', programId);
            const progressSnap = await getDoc(progressRef);
            
            if (progressSnap.exists() && progressSnap.data().percentage !== undefined) {
              return progressSnap.data().percentage;
            }
            return 0; // Programme pas commencé = 0%
          } catch (error) {
            console.error('Erreur récupération progression pour', programId, error);
            return 0;
          }
        })
      );
      
      console.log('📊 Progressions individuelles:', progressions);
      
      // Calculer la MOYENNE (pas la somme !)
      const globalProg = progressions.length > 0
        ? Math.round(progressions.reduce((sum, p) => sum + p, 0) / progressions.length)
        : 0;
      
      console.log('📈 Progression globale calculée:', globalProg);
      
      // Afficher avec protection max 100%
      setGlobalProgress(Math.min(globalProg, 100));

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
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: '700',
            color: apprenantTheme.colors.textPrimary,
            marginBottom: '8px',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
                {Math.min(globalProgress, 100)}%
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
                width: `${Math.min(globalProgress, 100)}%`,
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
                Aucun programme affecté
              </p>
              <p style={{
                fontSize: apprenantTheme.fontSize.sm,
                color: apprenantTheme.colors.textTertiary
              }}>
                Contactez votre administrateur pour accéder à des programmes de formation
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
                  {/* Header : Icône + Infos + Indicateur */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    marginBottom: '16px'
                  }}>
                    {/* Icône programme */}
                    <div style={{
                      width: 'clamp(40px, 8vw, 48px)',
                      height: 'clamp(40px, 8vw, 48px)',
                      borderRadius: apprenantTheme.radius.lg,
                      background: apprenantTheme.gradients.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: apprenantTheme.shadows.md,
                      flexShrink: 0
                    }}>
                      <BookOpen size={22} color="white" strokeWidth={2} />
                    </div>

                    {/* Nom et description */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: 'clamp(14px, 3vw, 15px)',
                        fontWeight: '700',
                        color: apprenantTheme.colors.textPrimary,
                        marginBottom: '4px',
                        lineHeight: '1.3',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {program.name}
                      </h3>
                      {program.description && (
                        <p style={{
                          fontSize: apprenantTheme.fontSize.sm,
                          color: apprenantTheme.colors.textSecondary,
                          lineHeight: '1.4',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {program.description}
                        </p>
                      )}
                    </div>

                    {/* INDICATEUR DISCRET À DROITE */}
                    {(() => {
                      const progress = program.readingProgress || 0;
                      const completed = program.completedLessons || 0;
                      const total = program.totalLessons || 0;

                      // Terminé (100%)
                      if (progress >= 100) {
                        return (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 8px',
                            background: '#dcfce7',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#16a34a',
                            flexShrink: 0
                          }}>
                            <CheckCircle2 size={12} />
                            Terminé
                          </div>
                        );
                      }

                      // En cours (1-99%)
                      if (progress > 0 || completed > 0) {
                        return (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0
                          }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#64748b'
                            }}>
                              {completed}/{total}
                            </span>
                            <div style={{
                              width: '40px',
                              height: '4px',
                              background: '#e2e8f0',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${Math.min(progress, 100)}%`,
                                height: '100%',
                                background: '#3b82f6',
                                borderRadius: '2px'
                              }} />
                            </div>
                          </div>
                        );
                      }

                      // Non commencé (0%)
                      return (
                        <span style={{
                          fontSize: '10px',
                          color: '#cbd5e1',
                          flexShrink: 0
                        }}>
                          Nouveau
                        </span>
                      );
                    })()}
                  </div>

                  {/* Nombre de leçons */}
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
