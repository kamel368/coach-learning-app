import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getUserProgramProgress } from '../../services/progressionService';
import { ArrowLeft, BookOpen, TrendingUp, ChevronRight, Lock, PlayCircle } from 'lucide-react';
import { apprenantTheme, cardStyles } from '../../styles/apprenantTheme';
import { useViewAs } from '../../hooks/useViewAs';
import ViewAsBanner from '../../components/ViewAsBanner';
import { useAuth } from '../../context/AuthContext';

export default function ApprenantProgramDetail() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Ajout pour détecter les changements de navigation
  
  // Mode "Voir comme"
  const { targetUserId } = useViewAs();
  const { organizationId } = useAuth();
  
  const [program, setProgram] = useState(null);
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetOrgId, setTargetOrgId] = useState(null);

  // Charger l'organizationId de l'utilisateur cible (pour mode "Voir comme")
  useEffect(() => {
    const loadTargetOrgId = async () => {
      const userId = targetUserId;
      if (userId) {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setTargetOrgId(userDoc.data().organizationId || organizationId);
        } else {
          setTargetOrgId(organizationId);
        }
      } else {
        setTargetOrgId(organizationId);
      }
    };
    loadTargetOrgId();
  }, [targetUserId, organizationId]);

  // ✅ Recharger les données à chaque changement de location (navigation)
  useEffect(() => {
    if (programId && targetOrgId) {
      console.log('🔄 Rechargement du programme (navigation détectée)', {
        programId,
        targetOrgId,
        targetUserId,
        locationKey: location.key,
        pathname: location.pathname
      });
      loadData();
    }
  }, [programId, targetOrgId, targetUserId, location.pathname, location.key]); // ✅ Ajout de targetUserId, pathname ET key
  
  // ✅ NOUVEAU: Recharger aussi quand la page redevient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && programId && targetOrgId) {
        console.log('👁️ Page programme visible, rechargement des données');
        loadData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [programId, targetOrgId]);

  async function loadData() {
    try {
      const user = auth.currentUser;
      if (!user && !targetUserId) {
        navigate('/login');
        return;
      }

      const effectiveOrgId = targetOrgId || organizationId;
      console.log('📚 Chargement programme depuis org:', effectiveOrgId);

      // Récupérer le programme
      let programDoc;
      if (effectiveOrgId) {
        programDoc = await getDoc(doc(db, 'organizations', effectiveOrgId, 'programs', programId));
        console.log('✅ Programme depuis /organizations/' + effectiveOrgId + '/programs/' + programId);
      } else {
        programDoc = await getDoc(doc(db, 'programs', programId));
        console.log('⚠️ Fallback: Programme depuis /programs/' + programId);
      }

      if (!programDoc.exists()) {
        navigate('/apprenant/dashboard');
        return;
      }
      
      const programData = { id: programDoc.id, ...programDoc.data() };
      setProgram(programData);

      // Récupérer les modules du programme
      const modulesRef = effectiveOrgId
        ? collection(db, 'organizations', effectiveOrgId, 'programs', programId, 'modules')
        : collection(db, 'programs', programId, 'modules');
      
      const modulesQuery = query(modulesRef, orderBy('order', 'asc'));
      const modulesSnap = await getDocs(modulesQuery);
      
      const modulesData = [];
      for (const moduleDoc of modulesSnap.docs) {
        const moduleData = moduleDoc.data();
        
        // Compter les leçons de ce module
        const lessonsRef = effectiveOrgId
          ? collection(db, 'organizations', effectiveOrgId, 'programs', programId, 'modules', moduleDoc.id, 'lessons')
          : collection(db, 'programs', programId, 'modules', moduleDoc.id, 'lessons');
        
        const lessonsSnap = await getDocs(lessonsRef);
        
        modulesData.push({
          id: moduleDoc.id,
          ...moduleData,
          totalLessons: lessonsSnap.size
        });
      }

      setModules(modulesData);

      // Récupérer la progression utilisateur (utiliser targetUserId en mode viewAs)
      const progress = await getUserProgramProgress(targetUserId, programId);
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
    <>
      {/* Bandeau Mode Voir comme */}
      <ViewAsBanner />
      
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
            width: 'clamp(48px, 10vw, 56px)',
            height: 'clamp(48px, 10vw, 56px)',
            borderRadius: apprenantTheme.radius.lg,
            background: apprenantTheme.gradients.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: apprenantTheme.spacing.md,
            boxShadow: apprenantTheme.shadows.md
          }}>
            <BookOpen size={26} color="white" strokeWidth={2} />
          </div>

          <h1 style={{
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: '700',
            color: apprenantTheme.colors.textPrimary,
            marginBottom: '8px',
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
                  {Math.min(userProgress.percentage || 0, 100)}%
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
                  width: `${Math.min(userProgress.percentage || 0, 100)}%`,
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

          {/* 🏆 BOUTON ÉVALUATION COMPLÈTE DU PROGRAMME */}
          {modules.length > 0 && (
            <div style={{
              marginTop: apprenantTheme.spacing.xl,
              padding: 'clamp(20px, 4vw, 28px)',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: apprenantTheme.radius.xl,
              boxShadow: '0 8px 24px rgba(240, 147, 251, 0.35), 0 0 0 3px rgba(240, 147, 251, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => navigate(`/apprenant/program-evaluation/${programId}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(240, 147, 251, 0.45), 0 0 0 4px rgba(240, 147, 251, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(240, 147, 251, 0.35), 0 0 0 3px rgba(240, 147, 251, 0.15)';
            }}
            >
              {/* Effet de fond animé */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none'
              }} />

              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(16px, 3vw, 24px)',
                flexWrap: window.innerWidth < 600 ? 'wrap' : 'nowrap'
              }}>
                {/* Icône trophy */}
                <div style={{
                  width: 'clamp(64px, 15vw, 80px)',
                  height: 'clamp(64px, 15vw, 80px)',
                  borderRadius: apprenantTheme.radius.xl,
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(32px, 7vw, 40px)',
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }}>
                  🏆
                </div>

                {/* Contenu */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: 'clamp(18px, 4vw, 24px)',
                    fontWeight: '700',
                    color: 'white',
                    marginBottom: '8px',
                    textShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    Évaluation Complète du Programme
                  </h3>
                  <p style={{
                    fontSize: 'clamp(13px, 2.5vw, 15px)',
                    color: 'rgba(255,255,255,0.95)',
                    marginBottom: '12px',
                    lineHeight: '1.5'
                  }}>
                    Testez vos connaissances sur l'ensemble du programme avec tous les exercices mélangés
                  </p>
                  
                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      padding: '6px 12px',
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      borderRadius: apprenantTheme.radius.base,
                      fontSize: 'clamp(11px, 2vw, 13px)',
                      fontWeight: '600',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>📚</span>
                      <span>{modules.length} module{modules.length > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div style={{
                      padding: '6px 12px',
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      borderRadius: apprenantTheme.radius.base,
                      fontSize: 'clamp(11px, 2vw, 13px)',
                      fontWeight: '600',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>⏱️</span>
                      <span>Durée estimée : {Math.ceil(modules.length * 10)} min</span>
                    </div>
                  </div>
                </div>

                {/* Bouton d'action */}
                <div style={{
                  padding: 'clamp(10px, 2vw, 14px) clamp(20px, 4vw, 28px)',
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: apprenantTheme.radius.lg,
                  fontSize: 'clamp(14px, 2.5vw, 16px)',
                  fontWeight: '700',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  flexShrink: 0
                }}>
                  <span style={{ display: window.innerWidth < 500 ? 'none' : 'inline' }}>
                    Démarrer l'évaluation
                  </span>
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
