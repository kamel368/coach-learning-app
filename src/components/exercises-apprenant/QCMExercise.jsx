export default function QCMExercise({ block, answer, onAnswer }) {
  const { content } = block;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Question */}
      <div style={{
        padding: '20px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '2px solid #e2e8f0'
      }}>
        <div style={{
          fontSize: '17px',
          fontWeight: '600',
          color: '#1e293b',
          lineHeight: '1.6'
        }}>
          {content.question}
        </div>
      </div>

      {/* Options */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {(content.options || []).map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(index)}
            style={{
              padding: '16px 20px',
              background: answer === index 
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                : 'white',
              border: '2px solid',
              borderColor: answer === index ? '#3b82f6' : '#e2e8f0',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}
          >
            {/* Radio button */}
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '2px solid',
              borderColor: answer === index ? 'white' : '#cbd5e1',
              background: answer === index ? 'white' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {answer === index && (
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#3b82f6'
                }} />
              )}
            </div>

            {/* Lettre */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: answer === index 
                ? 'rgba(255,255,255,0.2)' 
                : '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '700',
              color: answer === index ? 'white' : '#64748b',
              flexShrink: 0
            }}>
              {String.fromCharCode(65 + index)}
            </div>

            {/* Texte option */}
            <div style={{
              flex: 1,
              fontSize: '15px',
              fontWeight: '600',
              color: answer === index ? 'white' : '#1e293b'
            }}>
              {option}
            </div>
          </button>
        ))}
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
