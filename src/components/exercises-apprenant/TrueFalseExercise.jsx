export default function TrueFalseExercise({ block, answer, onAnswer }) {
  const { content } = block;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Affirmation */}
      <div style={{
        padding: '24px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '2px solid #e2e8f0'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1e293b',
          lineHeight: '1.6'
        }}>
          {content.statement}
        </div>
      </div>

      {/* Choix */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
      }}>
        {/* Vrai */}
        <button
          onClick={() => onAnswer(true)}
          style={{
            padding: '20px',
            background: answer === true 
              ? 'linear-gradient(135deg, #10b981, #059669)' 
              : 'white',
            border: '3px solid',
            borderColor: answer === true ? '#10b981' : '#e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div style={{
            fontSize: '48px'
          }}>
            ✓
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: answer === true ? 'white' : '#1e293b'
          }}>
            VRAI
          </div>
        </button>

        {/* Faux */}
        <button
          onClick={() => onAnswer(false)}
          style={{
            padding: '20px',
            background: answer === false 
              ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
              : 'white',
            border: '3px solid',
            borderColor: answer === false ? '#ef4444' : '#e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div style={{
            fontSize: '48px'
          }}>
            ✗
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: answer === false ? 'white' : '#1e293b'
          }}>
            FAUX
          </div>
        </button>
      </div>

      {/* Message si répondu */}
      {answer !== null && answer !== undefined && (
        <div style={{
          padding: '12px 16px',
          background: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1e40af',
          textAlign: 'center'
        }}>
          ✓ Réponse enregistrée
        </div>
      )}
    </div>
  );
}
