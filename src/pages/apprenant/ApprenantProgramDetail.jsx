import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getUserProgramProgress } from '../../services/progressionService';
import { ArrowLeft, BookOpen, TrendingUp, ChevronRight, Lock, PlayCircle } from 'lucide-react';
import { apprenantTheme, cardStyles } from '../../styles/apprenantTheme';

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
        fontSize: apprenantTheme.fontSize.lg,
        color: apprenantTheme.colors.textSecondary
      }}>
        Chargement...
      </div>
    );
  }

  if (!program) {
    return (
      <div style={{
        padding: apprenantTheme.spacing.xl,
        textAlign: 'center'
      }}>
        <p style={{ fontSize: apprenantTheme.fontSize.lg, color: apprenantTheme.colors.textSecondary }}>
          Programme introuvable
        </p>
        <button
          onClick={() => navigate('/apprenant/dashboard')}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: apprenantTheme.gradients.secondary,
            color: 'white',
            border: 'none',
            borderRadius: apprenantTheme.radius.md,
            fontSize: apprenantTheme.fontSize.base,
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
      minHeight: '100%',
      background: apprenantTheme.colors.bgApp
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: apprenantTheme.spacing.lg + ' ' + apprenantTheme.spacing.md,
        paddingBottom: 'clamp(40px, 6vw, 60px)'
      }}>
        
        {/* Bouton retour */}
        <button
          onClick={() => navigate('/apprenant/dashboard')}
          style={{
            background: apprenantTheme.colors.bgPrimary,
            border: `2px solid ${apprenantTheme.colors.border}`,
            color: apprenantTheme.colors.textSecondary,
            padding: apprenantTheme.spacing.sm + ' ' + apprenantTheme.spacing.md,
            borderRadius: apprenantTheme.radius.base,
            fontSize: apprenantTheme.fontSize.sm,
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: apprenantTheme.spacing.md,
            transition: apprenantTheme.transitions.base,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: apprenantTheme.shadows.sm
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = apprenantTheme.colors.secondary;
            e.currentTarget.style.color = apprenantTheme.colors.secondary;
            e.currentTarget.style.boxShadow = apprenantTheme.shadows.md;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = apprenantTheme.colors.bgPrimary;
            e.currentTarget.style.borderColor = apprenantTheme.colors.border;
            e.currentTarget.style.color = apprenantTheme.colors.textSecondary;
            e.currentTarget.style.boxShadow = apprenantTheme.shadows.sm;
          }}
        >
          <ArrowLeft size={16} />
          <span style={{ display: window.innerWidth < 400 ? 'none' : 'inline' }}>
            Retour aux programmes
          </span>
          <span style={{ display: window.innerWidth >= 400 ? 'none' : 'inline' }}>
            Retour
          </span>
        </button>

        {/* Header Programme */}
        <div style={{
          background: apprenantTheme.colors.bgPrimary,
          borderRadius: apprenantTheme.radius.xl,
          padding: apprenantTheme.spacing.xl,
          marginBottom: apprenantTheme.spacing.lg,
          boxShadow: apprenantTheme.shadows.xl
        }}>
          {/* Icône */}
          <div style={{
            width: 'clamp(64px, 15vw, 80px)',
            height: 'clamp(64px, 15vw, 80px)',
            borderRadius: apprenantTheme.radius.lg,
            background: apprenantTheme.gradients.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: apprenantTheme.spacing.md,
            boxShadow: apprenantTheme.shadows.md
          }}>
            <BookOpen size={40} color="white" strokeWidth={2} />
          </div>

          <h1 style={{
            fontSize: apprenantTheme.fontSize['4xl'],
            fontWeight: '700',
            color: apprenantTheme.colors.textPrimary,
            marginBottom: '12px',
            letterSpacing: '-0.5px',
            lineHeight: '1.2'
          }}>
            {program.name}
          </h1>

          {program.description && (
            <p style={{
              fontSize: apprenantTheme.fontSize.lg,
              color: apprenantTheme.colors.textSecondary,
              marginBottom: apprenantTheme.spacing.md,
              lineHeight: '1.6'
            }}>
              {program.description}
            </p>
          )}

          {/* Progression programme */}
          {userProgress && (
            <div style={{
              background: apprenantTheme.gradients.card,
              borderRadius: apprenantTheme.radius.lg,
              padding: apprenantTheme.spacing.md,
              marginTop: apprenantTheme.spacing.md,
              border: `1px solid ${apprenantTheme.colors.border}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: apprenantTheme.fontSize.base,
                  fontWeight: '600',
                  color: apprenantTheme.colors.textPrimary
                }}>
                  <TrendingUp size={18} color={apprenantTheme.colors.secondary} />
                  <span>Votre progression</span>
                </div>
                <span style={{
                  fontSize: apprenantTheme.fontSize['2xl'],
                  fontWeight: '700',
                  color: apprenantTheme.colors.secondary
                }}>
                  {userProgress.percentage || 0}%
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: 'clamp(10px, 2vw, 12px)',
                background: apprenantTheme.colors.bgTertiary,
                borderRadius: apprenantTheme.radius.full,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${userProgress.percentage || 0}%`,
                  height: '100%',
                  background: apprenantTheme.gradients.secondary,
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Liste des modules */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: apprenantTheme.fontSize['2xl'],
            fontWeight: '800',
            color: apprenantTheme.colors.primary,
            marginBottom: apprenantTheme.spacing.md,
            paddingLeft: 'clamp(0px, 2vw, 8px)'
          }}>
            <BookOpen size={24} strokeWidth={2.5} />
            <span>Modules du programme</span>
          </div>

          {modules.length === 0 ? (
            <div style={{
              background: apprenantTheme.colors.bgPrimary,
              borderRadius: apprenantTheme.radius.xl,
              padding: apprenantTheme.spacing.xl,
              textAlign: 'center',
              boxShadow: apprenantTheme.shadows.xl
            }}>
              <p style={{
                fontSize: apprenantTheme.fontSize.lg,
                color: apprenantTheme.colors.textSecondary
              }}>
                Aucun module disponible pour ce programme
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: apprenantTheme.spacing.sm
            }}>
              {modules.map((module, index) => {
                const status = getModuleStatus(module.id);
                const StatusIcon = status.label === 'Non commencé' ? Lock : PlayCircle;

                return (
                  <div
                    key={module.id}
                    style={{
                      background: apprenantTheme.colors.bgPrimary,
                      borderRadius: apprenantTheme.radius.lg,
                      padding: apprenantTheme.spacing.md,
                      cursor: 'pointer',
                      transition: apprenantTheme.transitions.slow,
                      boxShadow: apprenantTheme.shadows.md,
                      border: `2px solid transparent`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: apprenantTheme.spacing.md,
                      flexWrap: window.innerWidth < 500 ? 'wrap' : 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = apprenantTheme.shadows.xl;
                      e.currentTarget.style.borderColor = apprenantTheme.colors.secondary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = apprenantTheme.shadows.md;
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onClick={() => navigate(`/apprenant/programs/${programId}/modules/${module.id}`)}
                  >
                    {/* Numéro module */}
                    <div style={{
                      width: 'clamp(48px, 12vw, 60px)',
                      height: 'clamp(48px, 12vw, 60px)',
                      borderRadius: apprenantTheme.radius.md,
                      background: `${apprenantTheme.colors.secondary}11`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: apprenantTheme.fontSize['2xl'],
                      fontWeight: '700',
                      color: apprenantTheme.colors.secondary,
                      flexShrink: 0,
                      border: `2px solid ${apprenantTheme.colors.secondary}22`
                    }}>
                      {index + 1}
                    </div>

                    {/* Contenu */}
                    <div style={{ 
                      flex: 1,
                      minWidth: window.innerWidth < 500 ? '100%' : 'auto'
                    }}>
                      <h3 style={{
                        fontSize: apprenantTheme.fontSize.xl,
                        fontWeight: '700',
                        color: apprenantTheme.colors.textPrimary,
                        marginBottom: '6px',
                        lineHeight: '1.3'
                      }}>
                        {module.title}
                      </h3>

                      {module.description && (
                        <p style={{
                          fontSize: apprenantTheme.fontSize.sm,
                          color: apprenantTheme.colors.textSecondary,
                          marginBottom: '8px',
                          lineHeight: '1.5',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {module.description}
                        </p>
                      )}

                      <div style={{
                        fontSize: apprenantTheme.fontSize.sm,
                        color: apprenantTheme.colors.textTertiary
                      }}>
                        {module.totalLessons} leçon{module.totalLessons > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: apprenantTheme.spacing.sm + ' ' + apprenantTheme.spacing.md,
                      background: `${apprenantTheme.colors.secondary}11`,
                      borderRadius: apprenantTheme.radius.base,
                      fontSize: apprenantTheme.fontSize.sm,
                      fontWeight: '600',
                      color: apprenantTheme.colors.secondary,
                      flexShrink: 0,
                      whiteSpace: 'nowrap'
                    }}>
                      <StatusIcon size={18} />
                      <span style={{ display: window.innerWidth < 400 ? 'none' : 'inline' }}>
                        {status.label}
                      </span>
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
