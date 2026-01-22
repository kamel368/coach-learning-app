import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ArrowLeft, BookOpen, CheckCircle, AlertCircle, ChevronRight, Clock, Award } from 'lucide-react';
import { apprenantTheme, buttonStyles } from '../../styles/apprenantTheme';
import { useGamification } from '../../hooks/useGamification';
import { useViewAs } from '../../hooks/useViewAs';
import ViewAsBanner from '../../components/ViewAsBanner';

export default function ApprenantModuleDetail() {
  const { programId, moduleId } = useParams();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState(null);
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);

  // Mode "Voir comme"
  const user = auth.currentUser;
  const { targetUserId } = useViewAs();
  
  // Hook gamification
  const { onModuleCompleted, loading: gamifLoading, gamificationData } = useGamification(targetUserId);
  const moduleCompletionTracked = useRef(new Set());

  useEffect(() => {
    loadData();
    loadProgress();
  }, [programId, moduleId]);

  // 🎮 GAMIFICATION : Détecter quand un module est 100% complété
  useEffect(() => {
    if (lessons.length > 0 && completedLessons.length > 0 && !gamifLoading && gamificationData) {
      const completedInThisModule = completedLessons.filter(id => lessons.find(l => l.id === id)).length;
      const moduleProgress = (completedInThisModule / lessons.length) * 100;
      
      // Si le module est 100% complété et qu'on ne l'a pas encore compté
      if (moduleProgress >= 100 && !moduleCompletionTracked.current.has(moduleId) && onModuleCompleted) {
        moduleCompletionTracked.current.add(moduleId);
        onModuleCompleted();
        console.log('🎮 Gamification: Module complété !', moduleId);
      }
    }
  }, [completedLessons, lessons, moduleId, onModuleCompleted, gamifLoading, gamificationData]);
  
  // Charger la progression des leçons complétées
  async function loadProgress() {
    try {
      const user = auth.currentUser;
      if ((!user && !targetUserId) || !programId) return;
      
      const progressRef = doc(db, 'userProgress', targetUserId, 'programs', programId);
      const progressSnap = await getDoc(progressRef);
      
      if (progressSnap.exists()) {
        setCompletedLessons(progressSnap.data().completedLessons || []);
        console.log('📚 Leçons complétées chargées:', progressSnap.data().completedLessons || []);
      }
    } catch (error) {
      console.error('Erreur chargement progression:', error);
    }
  }

  async function loadData() {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      // Récupérer le programme
      const programDoc = await getDoc(doc(db, 'programs', programId));
      if (programDoc.exists()) {
        setProgram({ id: programDoc.id, ...programDoc.data() });
      }

      // Récupérer le module
      const moduleDoc = await getDoc(
        doc(db, `programs/${programId}/modules/${moduleId}`)
      );
      
      if (!moduleDoc.exists()) {
        navigate(`/apprenant/programs/${programId}`);
        return;
      }
      
      setModule({ id: moduleDoc.id, ...moduleDoc.data() });

      // Récupérer les leçons du module
      const lessonsRef = collection(db, `programs/${programId}/modules/${moduleId}/lessons`);
      const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
      const lessonsSnap = await getDocs(lessonsQuery);
      
      const lessonsData = lessonsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setLessons(lessonsData);

      // Récupérer le QCM du module
      const quizzesSnap = await getDocs(
        collection(db, `programs/${programId}/modules/${moduleId}/quizzes`)
      );
      
      if (!quizzesSnap.empty) {
        const quizDoc = quizzesSnap.docs[0];
        setQuiz({ id: quizDoc.id, ...quizDoc.data() });
      }

      // Récupérer les tentatives QCM de l'utilisateur
      const attemptsRef = collection(db, 'quizAttempts');
      const attemptsQuery = query(
        attemptsRef,
        where('userId', '==', targetUserId),
        where('moduleId', '==', moduleId),
        orderBy('createdAt', 'desc')
      );
      
      const attemptsSnap = await getDocs(attemptsQuery);
      const attemptsData = attemptsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setQuizAttempts(attemptsData);

    } catch (error) {
      console.error('Erreur chargement module:', error);
    } finally {
      setLoading(false);
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

  if (!module) {
    return (
      <div style={{
        padding: 'clamp(24px, 5vw, 40px)',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: 'clamp(16px, 3vw, 18px)', color: '#64748b' }}>
          Module introuvable
        </p>
        <button
          onClick={() => navigate(`/apprenant/programs/${programId}`)}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: 'clamp(14px, 3vw, 16px)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Retour au programme
        </button>
      </div>
    );
  }

  const lastAttempt = quizAttempts.length > 0 ? quizAttempts[0] : null;
  const quizPassed = lastAttempt && lastAttempt.passed;

  return (
    <>
      {/* Bandeau Mode Voir comme */}
      <ViewAsBanner />
      
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
        
        {/* Bouton retour */}
        <button
          onClick={() => navigate(`/apprenant/programs/${programId}`)}
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
            Retour au programme
          </span>
          <span style={{ display: window.innerWidth >= 400 ? 'none' : 'inline' }}>
            Retour
          </span>
        </button>

        {/* Header Module */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 'clamp(12px, 2.5vw, 20px)',
          padding: 'clamp(20px, 4vw, 32px)',
          marginBottom: 'clamp(20px, 3vw, 28px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}>
          {/* Breadcrumb */}
          {program && (
            <div style={{
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              color: '#64748b',
              marginBottom: '16px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {program.name} / Module
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'clamp(12px, 3vw, 16px)',
            marginBottom: '12px'
          }}>
            <h1 style={{
              fontSize: 'clamp(24px, 6vw, 36px)',
              fontWeight: '700',
              color: '#1e293b',
              letterSpacing: '-0.5px',
              lineHeight: '1.2',
              margin: 0
            }}>
              {module.title}
            </h1>

            {/* Badge progression module */}
            {lessons.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 2vw, 12px)'
              }}>
                <span style={{
                  padding: 'clamp(5px, 1.5vw, 6px) clamp(10px, 2.5vw, 12px)',
                  background: completedLessons.filter(id => lessons.find(l => l.id === id)).length === lessons.length ? '#dcfce7' : '#f1f5f9',
                  color: completedLessons.filter(id => lessons.find(l => l.id === id)).length === lessons.length ? '#16a34a' : '#64748b',
                  borderRadius: '20px',
                  fontSize: 'clamp(11px, 2.5vw, 12px)',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  {completedLessons.filter(id => lessons.find(l => l.id === id)).length === lessons.length 
                    ? '✅ Terminé' 
                    : `${completedLessons.filter(id => lessons.find(l => l.id === id)).length}/${lessons.length} lu${completedLessons.filter(id => lessons.find(l => l.id === id)).length > 1 ? 's' : ''}`}
                </span>
                
                {/* Mini barre de progression */}
                <div style={{
                  width: 'clamp(50px, 12vw, 60px)',
                  height: 'clamp(5px, 1.5vw, 6px)',
                  background: '#e2e8f0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${lessons.length > 0 ? Math.round((completedLessons.filter(id => lessons.find(l => l.id === id)).length / lessons.length) * 100) : 0}%`,
                    height: '100%',
                    background: completedLessons.filter(id => lessons.find(l => l.id === id)).length === lessons.length ? '#10b981' : '#3b82f6',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            )}
          </div>

          {module.description && (
            <p style={{
              fontSize: 'clamp(14px, 3vw, 18px)',
              color: '#64748b',
              lineHeight: '1.6'
            }}>
              {module.description}
            </p>
          )}
        </div>

        {/* Grille : Leçons + QCM (responsive) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth >= 768 ? '2fr 1fr' : '1fr',
          gap: 'clamp(20px, 4vw, 24px)',
          alignItems: 'start'
        }}>
          
          {/* Colonne leçons */}
          <div style={{
            order: window.innerWidth >= 768 ? 1 : 2
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: apprenantTheme.fontSize['2xl'],
              fontWeight: '800',
              color: apprenantTheme.colors.primary,
              marginBottom: apprenantTheme.spacing.md
            }}>
              <BookOpen size={24} strokeWidth={2.5} />
              <span>Leçons</span>
            </div>

            {lessons.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: 'clamp(32px, 6vw, 40px)',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  color: '#64748b'
                }}>
                  Aucune leçon disponible pour ce module
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(10px, 2vw, 12px)'
              }}>
                {lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  
                  return (
                    <div
                      key={lesson.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'clamp(14px, 3vw, 16px)',
                        background: isCompleted ? '#f0fdf4' : '#ffffff',
                        borderRadius: 'clamp(10px, 2.5vw, 12px)',
                        border: isCompleted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                        marginBottom: 'clamp(10px, 2vw, 12px)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Partie gauche : Icône + Titre */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'clamp(10px, 2.5vw, 12px)',
                        flex: 1,
                        minWidth: 0
                      }}>
                        {/* Icône statut */}
                        <div style={{
                          width: 'clamp(28px, 7vw, 32px)',
                          height: 'clamp(28px, 7vw, 32px)',
                          borderRadius: '50%',
                          background: isCompleted ? '#10b981' : '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isCompleted ? 'white' : '#94a3b8',
                          fontSize: 'clamp(12px, 3vw, 14px)',
                          fontWeight: '700',
                          flexShrink: 0
                        }}>
                          {isCompleted ? '✓' : (index + 1)}
                        </div>
                        
                        {/* Titre leçon */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 'clamp(13px, 3vw, 15px)',
                            fontWeight: '600',
                            color: '#1e293b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {lesson.title || `Leçon ${index + 1}`}
                          </div>
                          {isCompleted && (
                            <div style={{
                              fontSize: 'clamp(10px, 2.5vw, 12px)',
                              color: '#10b981',
                              fontWeight: '500',
                              marginTop: '2px'
                            }}>
                              ✅ Terminée
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Partie droite : Badge Lu + Bouton */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'clamp(8px, 2vw, 12px)',
                        flexShrink: 0
                      }}>
                        {isCompleted && (
                          <span style={{
                            padding: '4px 10px',
                            background: '#dcfce7',
                            color: '#16a34a',
                            borderRadius: '20px',
                            fontSize: 'clamp(10px, 2.5vw, 11px)',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            display: window.innerWidth > 500 ? 'inline' : 'none'
                          }}>
                            Lu
                          </span>
                        )}
                        
                        <button
                          onClick={() => navigate(`/apprenant/programs/${programId}/modules/${moduleId}/lessons/${lesson.id}`)}
                          style={{
                            padding: 'clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)',
                            background: isCompleted ? 'white' : '#3b82f6',
                            color: isCompleted ? '#3b82f6' : 'white',
                            border: isCompleted ? '1px solid #3b82f6' : 'none',
                            borderRadius: 'clamp(6px, 2vw, 8px)',
                            fontSize: 'clamp(11px, 2.5vw, 13px)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {isCompleted ? 'Relire' : 'Lire'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Section Exercices - NOUVEAU */}
            <div style={{ marginTop: 'clamp(20px, 4vw, 24px)' }}>
              <button
                onClick={() => navigate(`/apprenant/programs/${programId}/modules/${moduleId}/exercises`)}
                style={{
                  width: '100%',
                  padding: 'clamp(20px, 4vw, 24px)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 'clamp(12px, 2.5vw, 16px)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 16px)' }}>
                  <div style={{
                    width: 'clamp(48px, 10vw, 56px)',
                    height: 'clamp(48px, 10vw, 56px)',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(24px, 5vw, 28px)',
                    flexShrink: 0
                  }}>
                    🎯
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontSize: 'clamp(16px, 3.5vw, 20px)',
                      fontWeight: '700',
                      color: 'white',
                      marginBottom: '4px'
                    }}>
                      Passer les exercices
                    </div>
                    <div style={{
                      fontSize: 'clamp(13px, 2.5vw, 14px)',
                      color: 'rgba(255,255,255,0.9)'
                    }}>
                      Teste tes connaissances sur ce module
                    </div>
                  </div>
                </div>
                
                <div style={{
                  padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3vw, 18px)',
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '10px',
                  fontSize: 'clamp(13px, 2.5vw, 14px)',
                  fontWeight: '600',
                  color: 'white',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ display: window.innerWidth < 400 ? 'none' : 'inline' }}>
                    Commencer
                  </span>
                  <ChevronRight size={18} />
                </div>
              </button>
            </div>
          </div>

          {/* Colonne QCM */}
          <div style={{
            order: window.innerWidth >= 768 ? 2 : 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: apprenantTheme.fontSize['2xl'],
              fontWeight: '800',
              color: apprenantTheme.colors.primary,
              marginBottom: apprenantTheme.spacing.md
            }}>
              <Award size={24} strokeWidth={2.5} />
              <span>Évaluation</span>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: 'clamp(10px, 2vw, 14px)',
              padding: 'clamp(18px, 3.5vw, 22px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              position: window.innerWidth >= 768 ? 'sticky' : 'static',
              top: '24px'
            }}>
              {quiz ? (
                <>
                  <h3 style={{
                    fontSize: 'clamp(16px, 3vw, 18px)',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '8px',
                    lineHeight: '1.3'
                  }}>
                    {quiz.title || 'QCM du module'}
                  </h3>

                  <p style={{
                    fontSize: 'clamp(13px, 2.5vw, 14px)',
                    color: '#64748b',
                    marginBottom: '16px',
                    lineHeight: '1.5'
                  }}>
                    Score minimum pour validation : <strong>{quiz.passingScore || 80}%</strong>
                  </p>

                  {/* Dernier score */}
                  {lastAttempt && (
                    <div style={{
                      padding: 'clamp(12px, 3vw, 16px)',
                      borderRadius: '12px',
                      background: lastAttempt.passed ? '#d1fae5' : '#fee2e2',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                        fontWeight: '600',
                        color: lastAttempt.passed ? '#065f46' : '#991b1b',
                        marginBottom: '4px'
                      }}>
                        Dernier score : {lastAttempt.score}%
                      </div>
                      <div style={{
                        fontSize: 'clamp(12px, 2.5vw, 13px)',
                        color: lastAttempt.passed ? '#047857' : '#dc2626'
                      }}>
                        {lastAttempt.passed ? '✅ QCM réussi !' : '❌ Score insuffisant'}
                      </div>
                    </div>
                  )}

                  {/* Bouton passer QCM */}
                  <button
                    onClick={() => navigate(`/apprenant/programs/${programId}/modules/${moduleId}/quiz`)}
                    style={{
                      width: '100%',
                      padding: 'clamp(12px, 2.5vw, 14px)',
                      background: quizPassed 
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {quizPassed ? 'Repasser le QCM' : 'Passer le QCM'}
                  </button>

                  {/* Historique tentatives */}
                  {quizAttempts.length > 0 && (
                    <details style={{
                      marginTop: '16px',
                      cursor: 'pointer'
                    }}>
                      <summary style={{
                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                        fontWeight: '600',
                        color: '#64748b',
                        padding: '8px',
                        borderRadius: '8px',
                        background: '#f8fafc',
                        listStyle: 'none'
                      }}>
                        📊 Historique ({quizAttempts.length} tentative{quizAttempts.length > 1 ? 's' : ''})
                      </summary>
                      
                      <div style={{
                        marginTop: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {quizAttempts.map((attempt, index) => (
                          <div
                            key={attempt.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: '#f8fafc',
                              fontSize: 'clamp(12px, 2.5vw, 13px)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ color: '#64748b' }}>
                              Tentative {quizAttempts.length - index}
                            </span>
                            <span style={{
                              fontWeight: '600',
                              color: attempt.passed ? '#10b981' : '#ef4444'
                            }}>
                              {attempt.score}% {attempt.passed ? '✓' : '✗'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 'clamp(16px, 3vw, 20px)' }}>
                  <p style={{
                    fontSize: 'clamp(13px, 2.5vw, 14px)',
                    color: '#94a3b8'
                  }}>
                    Aucun QCM disponible pour ce module
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
