import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useGamification } from '../../hooks/useGamification';
import { 
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  BarChart3,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  BookOpen
} from 'lucide-react';

export default function ApprenantExercisesResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { programId, moduleId } = useParams();
  
  // States pour le chargement
  const [loadedData, setLoadedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Récupérer les données depuis location.state
  const stateData = location.state || {};
  const fromHistory = stateData.fromHistory || false;
  const attemptFromState = stateData.attempt || null;

  // 🐛 DEBUG : Afficher toutes les données reçues
  console.log('📊 Données reçues ApprenantExercisesResults:', {
    stateData,
    fromHistory,
    attemptFromState,
    score: stateData?.score,
    maxScore: stateData?.maxScore,
    percentage: stateData?.percentage
  });

  // Hook gamification
  const user = auth.currentUser;
  const { onExerciseCompleted, loading: gamifLoading, gamificationData } = useGamification(user?.uid);
  const hasCalledGamification = useRef(false);

  // ✅ useEffect pour charger les données depuis Firebase si nécessaire
  useEffect(() => {
    const loadDataFromFirebase = async () => {
      // Si on a déjà les résultats dans state, pas besoin de charger
      if (stateData.results?.length > 0 || attemptFromState?.results?.length > 0) {
        console.log('📊 Données disponibles dans state avec results');
        console.log('   - stateData.results:', stateData.results?.length || 0, 'exercices');
        console.log('   - attemptFromState.results:', attemptFromState?.results?.length || 0, 'exercices');
        setIsLoading(false);
        return;
      }
      
      // Si on vient de l'historique avec un attempt complet
      if (fromHistory && attemptFromState) {
        console.log('📊 Données de l\'historique:', {
          score: attemptFromState.score,
          maxScore: attemptFromState.maxScore,
          results: attemptFromState.results?.length || 0
        });
        setLoadedData(attemptFromState);
        setIsLoading(false);
        return;
      }
      
      // Sinon, essayer de charger depuis Firebase
      if (user?.uid && programId && moduleId) {
        console.log('📊 Chargement depuis Firebase');
        console.log('   - userId:', user.uid);
        console.log('   - programId:', programId);
        console.log('   - moduleId:', moduleId);
        
        try {
          // Essayer l'ancienne structure
          const attemptDoc = await getDoc(
            doc(db, 'users', user.uid, 'programs', programId, 'modules', moduleId, 'attempts', stateData.attemptId || Date.now().toString())
          );
          
          if (attemptDoc.exists()) {
            const data = attemptDoc.data();
            console.log('✅ Données chargées depuis Firebase:', {
              score: data.score,
              maxScore: data.maxScore,
              results: data.results?.length || 0,
              duration: data.duration
            });
            setLoadedData(data);
          } else {
            console.log('⚠️ Aucune donnée trouvée dans Firebase');
          }
        } catch (error) {
          console.error('❌ Erreur chargement Firebase:', error);
        }
      }
      
      setIsLoading(false);
    };
    
    loadDataFromFirebase();
  }, [user?.uid, stateData.attemptId, stateData.results, fromHistory, attemptFromState, programId, moduleId]);
  
  // ✅ Fusionner les données : priorité à state, puis attemptFromState, puis loadedData
  const attempt = attemptFromState || loadedData || {};
  
  // 📊 Structure attendue depuis useExerciseSession.js :
  // {
  //   score: number,
  //   maxScore: number,
  //   percentage: number,
  //   duration: number,
  //   answers: {...},
  //   results: [{blockId, type, isCorrect, earnedPoints, maxPoints, userAnswer, correctAnswer}]
  // }
  
  // Extraire les blockResults (c'est directement attempt.results)
  const blockResults = attempt.results || stateData.results?.results || stateData.results || [];
  const duration = attempt.duration || stateData.duration || 0;
  
  // Calculer le score
  const score = attempt.score ?? stateData.score ?? 
    (blockResults || []).reduce((total, r) => total + (r?.earnedPoints || 0), 0);
  
  const maxScore = attempt.maxScore ?? stateData.maxScore ?? 
    (blockResults || []).reduce((total, r) => total + (r?.maxPoints || 0), 0);
  
  const resultPercentage = attempt.percentage ?? stateData.percentage;
  
  const calculatedPercentage = maxScore > 0 
    ? Math.round((score / maxScore) * 100) 
    : 0;
  
  const displayPercentage = resultPercentage !== undefined 
    ? resultPercentage 
    : calculatedPercentage;

  console.log('📊 Valeurs finales:', { 
    displayPercentage, 
    score, 
    maxScore,
    resultPercentage,
    calculatedPercentage,
    blockResults: blockResults?.length,
    isLoading
  });

  // 🎮 GAMIFICATION : Appeler une seule fois au chargement des résultats
  // NE PAS ajouter d'XP si on vient de l'historique !
  useEffect(() => {
    if (
      !isLoading &&
      displayPercentage !== undefined && 
      !hasCalledGamification.current && 
      !gamifLoading && 
      gamificationData &&
      !fromHistory  // ← Ne pas ajouter d'XP pour une consultation de l'historique
    ) {
      hasCalledGamification.current = true;
      onExerciseCompleted(displayPercentage);
      console.log('🎮 Gamification: XP ajoutés pour NOUVELLE tentative avec', displayPercentage, '%');
    } else if (fromHistory) {
      console.log('📊 Historique: Consultation d\'un résultat existant, pas d\'XP ajoutés');
    }
  }, [displayPercentage, onExerciseCompleted, gamifLoading, gamificationData, fromHistory, isLoading]);

  // ✅ Affichage du loading pendant le chargement
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ 
          fontSize: '48px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          ⏳
        </div>
        <p style={{ 
          fontSize: '16px', 
          color: '#64748b', 
          fontWeight: '500' 
        }}>
          Chargement des résultats...
        </p>
      </div>
    );
  }

  // ✅ Vérification améliorée : afficher un message si pas de données valides
  const totalQuestions = blockResults?.length || 0;
  const hasValidData = score > 0 || maxScore > 0 || totalQuestions > 0 || attempt.completedAt;
  
  if (!hasValidData) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        gap: '16px',
        padding: '40px'
      }}>
        <div style={{ fontSize: '48px' }}>📊</div>
        <h2 style={{ color: '#1e293b', margin: 0, fontSize: '20px', fontWeight: '700' }}>
          Résultats non disponibles
        </h2>
        <p style={{ color: '#64748b', textAlign: 'center', margin: 0 }}>
          Les détails de cet exercice ne sont plus disponibles.<br/>
          Le score est visible dans l'historique.
        </p>
        <button 
          onClick={() => navigate('/apprenant/historique')}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            marginTop: '8px'
          }}
        >
          Retour à l'historique
        </button>
      </div>
    );
  }
  
  // ✅ Calculer les stats depuis blockResults
  const correctCount = (blockResults || []).filter(r => r?.isCorrect).length;
  const incorrectCount = (blockResults || []).filter(r => !r?.isCorrect).length;
  
  console.log('✅ Stats finales affichage:', {
    displayPercentage,
    score,
    maxScore,
    correctCount,
    incorrectCount,
    totalQuestions: blockResults?.length
  });

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };

  const handleRestart = () => {
    navigate(`/apprenant/programs/${programId}/modules/${moduleId}/exercises`);
  };

  // Icône selon le type d'exercice
  const getExerciseIcon = (type) => {
    switch(type) {
      case 'flashcard': return <Zap size={16} color="#1e293b" />;
      case 'true_false': return <CheckCircle2 size={16} color="#1e293b" />;
      case 'qcm': return <Target size={16} color="#1e293b" />;
      case 'qcm_selective': return <Target size={16} color="#1e293b" />;
      case 'reorder': return <BarChart3 size={16} color="#1e293b" />;
      case 'drag_drop': return <Sparkles size={16} color="#1e293b" />;
      case 'match_pairs': return <Award size={16} color="#1e293b" />;
      default: return <BookOpen size={16} color="#1e293b" />;
    }
  };

  const getExerciseLabel = (type) => {
    const labels = {
      flashcard: 'Flashcard',
      true_false: 'Vrai/Faux',
      qcm: 'QCM',
      qcm_selective: 'QCM Sélectif',
      reorder: 'Réorganiser',
      drag_drop: 'Glisser-Déposer',
      match_pairs: 'Paires'
    };
    return labels[type] || 'Exercice';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Hero Section avec gradient dynamique */}
        <div style={{
          background: displayPercentage >= 80 
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : displayPercentage >= 50 
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          borderRadius: '16px',
          padding: '24px 32px',
          textAlign: 'center',
          color: 'white',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Cercles décoratifs en arrière-plan */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '-20px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)'
          }} />

          {/* Icône dynamique */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            backdropFilter: 'blur(10px)',
            position: 'relative'
          }}>
            {displayPercentage >= 80 ? (
              <Trophy size={28} color="white" />
            ) : displayPercentage >= 50 ? (
              <TrendingUp size={28} color="white" />
            ) : (
              <Zap size={28} color="white" />
            )}
          </div>

          {/* Titre dynamique */}
          <h1 style={{
            fontSize: '22px',
            fontWeight: '700',
            marginBottom: '4px',
            position: 'relative'
          }}>
            {displayPercentage >= 80 ? 'EXCELLENT TRAVAIL !' : displayPercentage >= 50 ? 'BIEN JOUÉ !' : 'CONTINUE TES EFFORTS !'}
          </h1>
          <p style={{
            fontSize: '13px',
            opacity: 0.9,
            position: 'relative'
          }}>
            {displayPercentage >= 80 
              ? 'Tu maîtrises parfaitement ce module !' 
              : displayPercentage >= 50 
                ? 'Tu es sur la bonne voie !' 
                : 'Tu peux recommencer pour améliorer ton score'}
          </p>
        </div>

        {/* Section Score - Layout Horizontal Compact */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Score circulaire - plus petit */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `conic-gradient(
                ${displayPercentage >= 80 ? '#10b981' : displayPercentage >= 50 ? '#f59e0b' : '#3b82f6'} ${displayPercentage * 3.6}deg,
                #f1f5f9 ${displayPercentage * 3.6}deg
              )`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: displayPercentage >= 80 ? '#10b981' : displayPercentage >= 50 ? '#f59e0b' : '#3b82f6',
                  lineHeight: 1
                }}>
                  {displayPercentage}%
                </div>
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '2px'
              }}>
                {score}/{maxScore} points
              </div>
              <div style={{
                fontSize: '13px',
                color: '#64748b'
              }}>
                Score obtenu
              </div>
            </div>
          </div>

          {/* Stats en ligne */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Réussis */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#ecfdf5',
              borderRadius: '10px'
            }}>
              <CheckCircle2 size={18} color="#10b981" />
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981', lineHeight: 1 }}>
                  {correctCount}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Réussis</div>
              </div>
            </div>

            {/* Manqués */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#fef2f2',
              borderRadius: '10px'
            }}>
              <XCircle size={18} color="#ef4444" />
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444', lineHeight: 1 }}>
                  {incorrectCount}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Manqués</div>
              </div>
            </div>

            {/* Durée */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#eff6ff',
              borderRadius: '10px'
            }}>
              <Clock size={18} color="#3b82f6" />
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6', lineHeight: 1 }}>
                  {formatDuration(duration || 0)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Durée</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Détails par exercice */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <BookOpen size={20} color="#3b82f6" />
            Détails par exercice
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* ✅ Protection contre undefined avec valeur par défaut */}
            {blockResults && blockResults.length > 0 ? (
              blockResults.map((result, index) => {
                const isCorrect = result?.isCorrect;

                return (
                  <div
                    key={result?.blockId || index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: isCorrect ? '#f0fdf4' : '#fef2f2',
                      borderRadius: '12px',
                      border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Icône statut */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: isCorrect ? '#10b981' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isCorrect 
                          ? <CheckCircle2 size={20} color="white" />
                          : <XCircle size={20} color="white" />
                        }
                      </div>

                      {/* Infos exercice */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: isCorrect ? '#dcfce7' : '#fee2e2',
                            color: isCorrect ? '#16a34a' : '#dc2626'
                          }}>
                            {getExerciseIcon(result?.type)}
                          </span>
                          {index + 1}. {getExerciseLabel(result?.type)}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: isCorrect ? '#16a34a' : '#dc2626',
                          fontWeight: '500'
                        }}>
                          {isCorrect ? 'Bonne réponse !' : 'Réponse incorrecte'}
                        </div>
                      </div>
                    </div>

                    {/* Points */}
                    <div style={{
                      padding: '8px 14px',
                      background: 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: isCorrect ? '#10b981' : '#ef4444'
                    }}>
                      {Math.round(result?.earnedPoints) || 0}/{result?.maxPoints || 0} pts
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ 
                color: '#64748b', 
                textAlign: 'center', 
                padding: '40px 20px',
                fontSize: '15px'
              }}>
                Aucun détail disponible pour cet exercice.
              </p>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* Retour au module */}
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}/modules/${moduleId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              background: 'white',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.color = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <ArrowLeft size={18} />
            Retour au module
          </button>

          {/* Historique */}
          <button
            onClick={() => navigate('/apprenant/historique')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              background: 'white',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <BarChart3 size={18} />
            Historique
          </button>

          {/* Recommencer */}
          <button
            onClick={handleRestart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            <RotateCcw size={18} />
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}
