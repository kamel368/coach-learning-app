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
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '18px', color: '#64748b' }}>
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
            fontSize: '16px',
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
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        
        {/* Bouton retour */}
        <button
          onClick={() => navigate(`/apprenant/programs/${programId}`)}
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
          ← Retour au programme
        </button>

        {/* Header Module */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '32px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
        }}>
          {/* Breadcrumb */}
          {program && (
            <div style={{
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '16px'
            }}>
              {program.name} / Module
            </div>
          )}

          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>
            {module.title}
          </h1>

          {module.description && (
            <p style={{
              fontSize: '18px',
              color: '#64748b',
              lineHeight: '1.6'
            }}>
              {module.description}
            </p>
          )}
        </div>

        {/* Grille : Leçons + QCM */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          
          {/* Colonne gauche : Leçons */}
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '20px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              📚 Leçons
            </h2>

            {lessons.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '16px',
                  color: '#64748b'
                }}>
                  Aucune leçon disponible pour ce module
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '20px',
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
                      gap: '16px'
                    }}>
                      {/* Numéro leçon */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: '700',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>

                      {/* Contenu */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '4px'
                        }}>
                          {lesson.title || `Leçon ${index + 1}`}
                        </h3>
                        
                        <div style={{
                          fontSize: '13px',
                          color: '#94a3b8'
                        }}>
                          {lesson.blocks?.length || 0} bloc{lesson.blocks?.length > 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Flèche */}
                      <div style={{
                        fontSize: '20px',
                        color: '#cbd5e1'
                      }}>
                        →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colonne droite : QCM */}
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '20px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              ✅ Évaluation
            </h2>

            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              position: 'sticky',
              top: '24px'
            }}>
              {quiz ? (
                <>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '8px'
                  }}>
                    {quiz.title || 'QCM du module'}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '16px',
                    lineHeight: '1.5'
                  }}>
                    Score minimum pour validation : <strong>{quiz.passingScore || 80}%</strong>
                  </p>

                  {/* Dernier score */}
                  {lastAttempt && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: lastAttempt.passed ? '#d1fae5' : '#fee2e2',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: lastAttempt.passed ? '#065f46' : '#991b1b',
                        marginBottom: '4px'
                      }}>
                        Dernier score : {lastAttempt.score}%
                      </div>
                      <div style={{
                        fontSize: '13px',
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
                      padding: '14px',
                      background: quizPassed 
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
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
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#64748b',
                        padding: '8px',
                        borderRadius: '8px',
                        background: '#f8fafc'
                      }}>
                        Historique ({quizAttempts.length} tentative{quizAttempts.length > 1 ? 's' : ''})
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
                              fontSize: '13px',
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
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{
                    fontSize: '14px',
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
