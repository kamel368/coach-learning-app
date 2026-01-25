import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function FlashcardExercise({ block, answer, onAnswer }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Gérer à la fois l'ancienne structure (content) et la nouvelle (aplatie)
  const question = block.content?.question || block.question || '';
  const correctAnswer = block.content?.answer || block.answer || '';
  const hint = block.content?.hint || block.hint || '';

  const handleSelfEvaluation = (evaluation) => {
    onAnswer({ selfEvaluation: evaluation });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hint si présent */}
      {hint && (
        <div style={{
          padding: '12px 16px',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          💡 <strong>Indice :</strong> {hint}
        </div>
      )}

      {/* Carte */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          perspective: '1000px',
          cursor: 'pointer',
          minHeight: '200px'
        }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '200px',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)'
        }}>
          {/* Face avant (Question) */}
          <div style={{
            position: 'absolute',
            width: '100%',
            minHeight: '200px',
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Question
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'white',
              textAlign: 'center'
            }}>
              {question}
            </div>
            <div style={{
              marginTop: '24px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.8)'
            }}>
              👆 Clique pour voir la réponse
            </div>
          </div>

          {/* Face arrière (Réponse) */}
          <div style={{
            position: 'absolute',
            width: '100%',
            minHeight: '200px',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Réponse
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'white',
              textAlign: 'center'
            }}>
              {correctAnswer}
            </div>
            <div style={{
              marginTop: '24px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.8)'
            }}>
              👆 Clique pour retourner
            </div>
          </div>
        </div>
      </div>

      {/* Bouton pour retourner */}
      {isFlipped && (
        <button
          onClick={() => setIsFlipped(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#475569',
            cursor: 'pointer',
            alignSelf: 'center'
          }}
        >
          <RotateCcw size={16} />
          Retourner la carte
        </button>
      )}

      {/* Auto-évaluation */}
      {isFlipped && (
        <div style={{
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            Avais-tu la bonne réponse ?
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleSelfEvaluation('correct')}
              style={{
                flex: 1,
                padding: '14px',
                background: answer?.selfEvaluation === 'correct' 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'white',
                border: '2px solid',
                borderColor: answer?.selfEvaluation === 'correct' ? '#10b981' : '#e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                color: answer?.selfEvaluation === 'correct' ? 'white' : '#1e293b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ✓ Oui, j'avais bon
            </button>

            <button
              onClick={() => handleSelfEvaluation('incorrect')}
              style={{
                flex: 1,
                padding: '14px',
                background: answer?.selfEvaluation === 'incorrect' 
                  ? '#ef4444' 
                  : 'white',
                border: '2px solid',
                borderColor: answer?.selfEvaluation === 'incorrect' ? '#ef4444' : '#e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                color: answer?.selfEvaluation === 'incorrect' ? 'white' : '#1e293b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ✗ Non, je me suis trompé
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
