import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { auth } from '../../firebase';
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

export default function ApprenantProgramEvaluationResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { programId } = useParams();
  
  // Récupérer les données soit du state normal, soit de l'historique
  const stateData = location.state;
  const fromHistory = stateData?.fromHistory;
  
  // Si on vient de l'historique, extraire les données de l'attempt
  const results = fromHistory ? stateData?.results : stateData?.results;
  const duration = fromHistory ? stateData?.duration : stateData?.duration;

  // Hook gamification
  const user = auth.currentUser;
  const { onEvaluationCompleted, loading: gamifLoading, gamificationData } = useGamification(user?.uid);
  const hasCalledGamification = useRef(false);

  // Calculer le pourcentage
  const { score, totalPoints, earnedPoints, results: exerciseResults } = results || {};
  const displayPercentage = score || (totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0);

  // 🎮 GAMIFICATION : Appeler une seule fois au chargement des résultats
  // NE PAS ajouter d'XP si on vient de l'historique !
  useEffect(() => {
    if (
      displayPercentage !== undefined && 
      !hasCalledGamification.current && 
      !gamifLoading && 
      gamificationData &&
      !fromHistory  // ← Ne pas ajouter d'XP pour une consultation de l'historique
    ) {
      hasCalledGamification.current = true;
      onEvaluationCompleted(displayPercentage);
      console.log('🎮 Gamification: XP ajoutés pour NOUVELLE évaluation avec', displayPercentage, '%');
    } else if (fromHistory) {
      console.log('📊 Historique: Consultation d\'un résultat existant, pas d\'XP ajoutés');
    }
  }, [displayPercentage, onEvaluationCompleted, gamifLoading, gamificationData, fromHistory]);

  if (!results && !stateData) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        gap: '16px'
      }}>
        <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
          Aucun résultat disponible
        </p>
        <button 
          onClick={() => navigate(fromHistory ? '/apprenant/historique' : `/apprenant/programs/${programId}`)}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {fromHistory ? 'Retour à l\'historique' : 'Retour'}
        </button>
      </div>
    );
  }
  
  // Compter les bonnes/mauvaises réponses
  const correctCount = exerciseResults?.filter(r => r.isCorrect).length || 0;
  const incorrectCount = exerciseResults?.filter(r => !r.isCorrect).length || 0;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };

  const handleRestart = () => {
    navigate(`/apprenant/program-evaluation/${programId}`);
  };

  // Icône selon le type d'exercice
  const getExerciseIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'flashcard': return <Zap size={14} color="#1e293b" />;
      case 'truefalse': return <CheckCircle2 size={14} color="#1e293b" />;
      case 'true_false': return <CheckCircle2 size={14} color="#1e293b" />;
      case 'qcm': return <Target size={14} color="#1e293b" />;
      case 'qcmselective': return <Target size={14} color="#1e293b" />;
      case 'qcm_selective': return <Target size={14} color="#1e293b" />;
      case 'reorder': return <BarChart3 size={14} color="#1e293b" />;
      case 'dragdrop': return <Sparkles size={14} color="#1e293b" />;
      case 'drag_drop': return <Sparkles size={14} color="#1e293b" />;
      case 'matchpairs': return <Award size={14} color="#1e293b" />;
      case 'match_pairs': return <Award size={14} color="#1e293b" />;
      default: return <BookOpen size={14} color="#1e293b" />;
    }
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
        {/* Hero Section - Compact */}
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
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Cercles décoratifs */}
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

          {/* Icône */}
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

          {/* Titre */}
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
            Résultats de l'Évaluation Complète du Programme
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
          {/* Score circulaire - compact */}
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
                {earnedPoints}/{totalPoints} points
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
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <BookOpen size={18} color="#3b82f6" />
            Détails par exercice
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {exerciseResults.map((result, index) => {
              const isCorrect = result.isCorrect;

              return (
                <div
                  key={result.blockId || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: isCorrect ? '#f0fdf4' : '#fef2f2',
                    borderRadius: '10px',
                    border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    {/* Icône statut */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isCorrect ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isCorrect 
                        ? <CheckCircle2 size={18} color="white" />
                        : <XCircle size={18} color="white" />
                      }
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '2px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '22px',
                          height: '22px',
                          borderRadius: '5px',
                          background: isCorrect ? '#dcfce7' : '#fee2e2',
                          color: isCorrect ? '#16a34a' : '#dc2626',
                          flexShrink: 0
                        }}>
                          {getExerciseIcon(result.type)}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Question {index + 1}
                        </span>
                        {result.sourceModuleName && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#94a3b8',
                            fontWeight: '400'
                          }}>
                            • {result.sourceModuleName}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        {isCorrect ? 'Bonne réponse' : 'Réponse incorrecte'}
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div style={{
                    padding: '6px 12px',
                    background: 'white',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: isCorrect ? '#10b981' : '#ef4444',
                    flexShrink: 0,
                    whiteSpace: 'nowrap'
                  }}>
                    {result.earnedPoints || 0}/{result.points || 0} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* Retour au programme */}
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'white',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px',
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
            <ArrowLeft size={16} />
            Retour au programme
          </button>

          {/* Historique */}
          <button
            onClick={() => navigate('/apprenant/historique')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'white',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '10px',
              fontSize: '14px',
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
            <BarChart3 size={16} />
            Historique
          </button>

          {/* Recommencer */}
          <button
            onClick={handleRestart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
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
            <RotateCcw size={16} />
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}
