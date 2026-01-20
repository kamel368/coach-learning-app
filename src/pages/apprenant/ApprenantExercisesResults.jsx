import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Trophy, CheckCircle, XCircle, ArrowLeft, RotateCcw } from 'lucide-react';

const BLOCK_LABELS = {
  flashcard: { icon: '🃏', label: 'Flashcard' },
  true_false: { icon: '✓✗', label: 'Vrai/Faux' },
  qcm: { icon: '☑', label: 'QCM' },
  qcm_selective: { icon: '☑☑', label: 'QCM Sélectif' },
  reorder: { icon: '🔢', label: 'Réorganiser' },
  drag_drop: { icon: '🎯', label: 'Glisser-Déposer' },
  match_pairs: { icon: '🔗', label: 'Paires' }
};

export default function ApprenantExercisesResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { programId, moduleId } = useParams();
  
  const { results, duration } = location.state || {};

  if (!results) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#64748b' }}>
          Aucun résultat disponible
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Retour
        </button>
      </div>
    );
  }

  const { score, maxScore, percentage, results: blockResults } = results;
  const isPassed = percentage >= 70;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '17px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header - Résultat global */}
        <div style={{
          background: 'white',
          borderRadius: '11px',
          padding: '28px',
          marginBottom: '17px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          {/* Icône */}
          <div style={{
            fontSize: '56px',
            marginBottom: '11px'
          }}>
            {isPassed ? '🎉' : '💪'}
          </div>

          {/* Titre */}
          <h1 style={{
            fontSize: '22px',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '6px'
          }}>
            {isPassed ? 'BRAVO !' : 'CONTINUE TES EFFORTS !'}
          </h1>

          <div style={{
            fontSize: '11px',
            color: '#64748b',
            marginBottom: '17px'
          }}>
            {isPassed 
              ? 'Tu as réussi les exercices avec succès !'
              : 'Tu peux recommencer pour améliorer ton score'
            }
          </div>

          {/* Score principal */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '11px',
            padding: '14px 28px',
            background: isPassed 
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '11px',
            marginBottom: '17px'
          }}>
            <Trophy size={28} color="white" />
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: '34px',
                fontWeight: '800',
                color: 'white',
                lineHeight: '1'
              }}>
                {percentage}%
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.9)',
                fontWeight: '600'
              }}>
                {score} / {maxScore} points
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '17px',
            justifyContent: 'center',
            paddingTop: '17px',
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#10b981' }}>
                {blockResults.filter(r => r.isCorrect).length}
              </div>
              <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>
                Réussis
              </div>
            </div>
            
            <div style={{
              width: '1px',
              background: '#e2e8f0'
            }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#ef4444' }}>
                {blockResults.filter(r => !r.isCorrect).length}
              </div>
              <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>
                Manqués
              </div>
            </div>

            <div style={{
              width: '1px',
              background: '#e2e8f0'
            }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#3b82f6' }}>
                {formatDuration(duration)}
              </div>
              <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>
                Durée
              </div>
            </div>
          </div>
        </div>

        {/* Détails par exercice */}
        <div style={{
          background: 'white',
          borderRadius: '11px',
          padding: '17px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '17px'
        }}>
          <h2 style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '11px'
          }}>
            Détails par exercice
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {blockResults.map((result, index) => {
              const blockInfo = BLOCK_LABELS[result.type] || { icon: '❓', label: 'Exercice' };
              
              return (
                <div
                  key={result.blockId}
                  style={{
                    padding: '11px',
                    background: result.isCorrect ? '#f0fdf4' : '#fef2f2',
                    border: '1px solid',
                    borderColor: result.isCorrect ? '#bbf7d0' : '#fecaca',
                    borderRadius: '7px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {/* Icône résultat */}
                  <div style={{
                    width: '25px',
                    height: '25px',
                    borderRadius: '50%',
                    background: result.isCorrect ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {result.isCorrect ? (
                      <CheckCircle size={14} color="white" />
                    ) : (
                      <XCircle size={14} color="white" />
                    )}
                  </div>

                  {/* Info exercice */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '1px'
                    }}>
                      {blockInfo.icon} {index + 1}. {blockInfo.label}
                    </div>
                    <div style={{
                      fontSize: '8px',
                      color: '#64748b'
                    }}>
                      {result.isCorrect ? 'Bonne réponse !' : 'Réponse incorrecte'}
                    </div>
                  </div>

                  {/* Points */}
                  <div style={{
                    padding: '4px 8px',
                    background: 'white',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: '700',
                    color: result.isCorrect ? '#10b981' : '#ef4444'
                  }}>
                    {Math.round(result.earnedPoints)}/{result.maxPoints} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}/modules/${moduleId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#1e293b',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={13} />
            Retour au module
          </button>

          <button
            onClick={() => navigate('/apprenant/historique')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'white',
              border: '2px solid #8b5cf6',
              borderRadius: '7px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#8b5cf6',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3e8ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <span style={{ fontSize: '13px' }}>📊</span>
            Historique
          </button>

          <button
            onClick={() => navigate(`/apprenant/programs/${programId}/modules/${moduleId}/exercises`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '7px',
              fontSize: '10px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(59,130,246,0.3)',
              transition: 'all 0.2s'
            }}
          >
            <RotateCcw size={13} />
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}
