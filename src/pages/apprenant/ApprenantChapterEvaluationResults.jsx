import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy, CheckCircle2, XCircle, Clock, Target, RotateCcw } from 'lucide-react';

const BLOCK_LABELS = {
  flashcard: { icon: '🃏', label: 'Flashcard' },
  true_false: { icon: '✓✗', label: 'Vrai/Faux' },
  qcm: { icon: '○', label: 'QCM' },
  qcm_selective: { icon: '☑', label: 'QCM Sélectif' },
  reorder: { icon: '🔢', label: 'Réorganiser' },
  drag_drop: { icon: '🎯', label: 'Glisser-Déposer' },
  match_pairs: { icon: '🔗', label: 'Paires' }
};

export default function ApprenantChapterEvaluationResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { programId, chapterId } = useParams();
  
  const { results, duration } = location.state || {};

  if (!results) {
    return (
      <div style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '28px'
      }}>
        <div style={{
          maxWidth: '420px',
          padding: '28px',
          background: 'white',
          borderRadius: '11px',
          boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '42px', marginBottom: '14px' }}>⚠️</div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '7px' }}>
            Aucun résultat
          </h3>
          <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '17px' }}>
            Les résultats de l'évaluation n'ont pas pu être chargés.
          </p>
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}/chapitres/${chapterId}`)}
            style={{
              padding: '8px 14px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#1e293b',
              cursor: 'pointer'
            }}
          >
            ← Retour au chapitre
          </button>
        </div>
      </div>
    );
  }

  const { score, totalPoints, earnedPoints, results: exerciseResults } = results;
  const passed = score >= 70;
  
  const correctCount = exerciseResults.filter(r => r.isCorrect).length;
  const incorrectCount = exerciseResults.filter(r => !r.isCorrect).length;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} s`;
  };

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      padding: '14px'
    }}>
      <div style={{ maxWidth: '630px', margin: '0 auto' }}>
        {/* Carte principale de résultat */}
        <div style={{
          background: 'white',
          borderRadius: '11px',
          boxShadow: '0 3px 11px rgba(0,0,0,0.06)',
          padding: '21px',
          marginBottom: '14px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            margin: '0 auto 11px',
            borderRadius: '50%',
            background: passed
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: passed
              ? '0 4px 14px rgba(16, 185, 129, 0.3)'
              : '0 4px 14px rgba(245, 158, 11, 0.3)'
          }}>
            <Trophy size={28} color="white" />
          </div>

          <h2 style={{
            fontSize: '17px',
            fontWeight: '700',
            color: passed ? '#10b981' : '#f59e0b',
            marginBottom: '5px'
          }}>
            {passed ? '🎉 BRAVO !' : '💪 CONTINUE TES EFFORTS !'}
          </h2>

          <p style={{
            fontSize: '10px',
            color: '#64748b',
            marginBottom: '14px'
          }}>
            Résultats de l'Évaluation du Chapitre
          </p>

          <div style={{
            fontSize: '35px',
            fontWeight: '700',
            background: passed
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'linear-gradient(135deg, #f59e0b, #d97706)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '14px'
          }}>
            {score}%
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '17px',
            paddingTop: '14px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '17px',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '3px'
              }}>
                {correctCount}
              </div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>
                Réussis
              </div>
            </div>

            <div style={{
              width: '1px',
              background: '#e2e8f0'
            }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '17px',
                fontWeight: '700',
                color: '#ef4444',
                marginBottom: '3px'
              }}>
                {incorrectCount}
              </div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>
                Manqués
              </div>
            </div>

            <div style={{
              width: '1px',
              background: '#e2e8f0'
            }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '17px',
                fontWeight: '700',
                color: '#3b82f6',
                marginBottom: '3px'
              }}>
                {formatTime(duration || 0)}
              </div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>
                Durée
              </div>
            </div>
          </div>
        </div>

        {/* Détails par exercice */}
        <div style={{
          background: 'white',
          borderRadius: '11px',
          boxShadow: '0 3px 11px rgba(0,0,0,0.06)',
          padding: '17px',
          marginBottom: '14px'
        }}>
          <h3 style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Target size={14} color="#64748b" />
            Détails par exercice
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {exerciseResults.map((result, index) => {
              const blockInfo = BLOCK_LABELS[result.type] || { icon: '❓', label: 'Exercice' };
              
              return (
                <div
                  key={result.blockId}
                  style={{
                    padding: '10px',
                    background: result.isCorrect ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${result.isCorrect ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: '7px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: result.isCorrect ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {result.isCorrect ? (
                      <CheckCircle2 size={16} color="white" />
                    ) : (
                      <XCircle size={16} color="white" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span>{blockInfo.icon}</span>
                      <span>{blockInfo.label}</span>
                      {result.sourceChapterTitle && (
                        <>
                          <span style={{ fontSize: '9px', color: '#cbd5e1' }}>•</span>
                          <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                            {result.sourceChapterTitle}
                          </span>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                      Question {index + 1}
                    </div>
                  </div>

                  <div style={{
                    padding: '4px 8px',
                    background: result.isCorrect ? '#dcfce7' : '#fee2e2',
                    borderRadius: '5px',
                    fontSize: '9px',
                    fontWeight: '600',
                    color: result.isCorrect ? '#15803d' : '#b91c1c',
                    whiteSpace: 'nowrap'
                  }}>
                    {result.earnedPoints}/{result.points} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}/chapitres/${chapterId}`)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '10px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#1e293b',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={14} />
            Retour au chapitre
          </button>

          <button
            onClick={() => navigate('/apprenant/historique')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '10px',
              background: 'white',
              border: '2px solid #8b5cf6',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#8b5cf6',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3e8ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <span style={{ fontSize: '14px' }}>📊</span>
            Historique
          </button>

          <button
            onClick={() => navigate(`/apprenant/evaluation/${programId}/${chapterId}`)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '10px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(240, 147, 251, 0.3)'
            }}
          >
            <RotateCcw size={14} />
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}
