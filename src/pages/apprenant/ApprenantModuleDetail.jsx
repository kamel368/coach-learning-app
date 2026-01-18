import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';

export default function ApprenantModuleDetail() {
  const { programId, moduleId } = useParams();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState(null);
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [programId, moduleId]);

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
        where('userId', '==', user.uid),
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
        
        {/* Bouton retour */}
        <button
          onClick={() => navigate(`/apprenant/programs/${programId}`)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3vw, 18px)',
            borderRadius: '10px',
            fontSize: 'clamp(13px, 2.5vw, 14px)',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: 'clamp(16px, 3vw, 20px)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          <span>←</span>
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

          <h1 style={{
            fontSize: 'clamp(24px, 6vw, 36px)',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '12px',
            letterSpacing: '-0.5px',
            lineHeight: '1.2'
          }}>
            {module.title}
          </h1>

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
            <h2 style={{
              fontSize: 'clamp(20px, 4vw, 24px)',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 'clamp(16px, 3vw, 20px)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              📚 Leçons
            </h2>

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
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: 'clamp(12px, 2.5vw, 16px)',
                      padding: 'clamp(16px, 3vw, 20px)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                      border: '2px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(8px)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.12)';
                      e.currentTarget.style.borderColor = '#8b5cf6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onClick={() => navigate(`/apprenant/programs/${programId}/modules/${moduleId}/lessons/${lesson.id}`)}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(12px, 3vw, 16px)'
                    }}>
                      {/* Numéro leçon */}
                      <div style={{
                        width: 'clamp(36px, 8vw, 40px)',
                        height: 'clamp(36px, 8vw, 40px)',
                        borderRadius: 'clamp(8px, 2vw, 10px)',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(14px, 3vw, 16px)',
                        fontWeight: '700',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>

                      {/* Contenu */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: 'clamp(15px, 3vw, 18px)',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {lesson.title || `Leçon ${index + 1}`}
                        </h3>
                        
                        <div style={{
                          fontSize: 'clamp(12px, 2.5vw, 13px)',
                          color: '#94a3b8'
                        }}>
                          {lesson.blocks?.length || 0} bloc{lesson.blocks?.length > 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Flèche */}
                      <div style={{
                        fontSize: 'clamp(18px, 4vw, 20px)',
                        color: '#cbd5e1',
                        flexShrink: 0
                      }}>
                        →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colonne QCM */}
          <div style={{
            order: window.innerWidth >= 768 ? 2 : 1
          }}>
            <h2 style={{
              fontSize: 'clamp(20px, 4vw, 24px)',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 'clamp(16px, 3vw, 20px)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              ✅ Évaluation
            </h2>

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
  );
}
