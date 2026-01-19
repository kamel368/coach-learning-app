export default function QCMSelectiveExercise({ block, answer, onAnswer }) {
  const { content } = block;
  const selectedIndices = answer || [];

  const toggleOption = (index) => {
    if (selectedIndices.includes(index)) {
      onAnswer(selectedIndices.filter(i => i !== index));
    } else {
      onAnswer([...selectedIndices, index]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Alert */}
      <div style={{
        padding: '12px 16px',
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#92400e'
      }}>
        ⚠️ <strong>Attention :</strong> Plusieurs bonnes réponses sont possibles. Coche toutes les bonnes réponses !
      </div>

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
        {(content.options || []).map((option, index) => {
          const isSelected = selectedIndices.includes(index);
          
          return (
            <button
              key={index}
              onClick={() => toggleOption(index)}
              style={{
                padding: '16px 20px',
                background: isSelected 
                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
                  : 'white',
                border: '2px solid',
                borderColor: isSelected ? '#8b5cf6' : '#e2e8f0',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left'
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: '2px solid',
                borderColor: isSelected ? 'white' : '#cbd5e1',
                background: isSelected ? 'white' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isSelected && (
                  <div style={{ fontSize: '16px', color: '#8b5cf6' }}>✓</div>
                )}
              </div>

              {/* Lettre */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isSelected 
                  ? 'rgba(255,255,255,0.2)' 
                  : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                color: isSelected ? 'white' : '#64748b',
                flexShrink: 0
              }}>
                {String.fromCharCode(65 + index)}
              </div>

              {/* Texte option */}
              <div style={{
                flex: 1,
                fontSize: '15px',
                fontWeight: '600',
                color: isSelected ? 'white' : '#1e293b'
              }}>
                {option}
              </div>
            </button>
          );
        })}
      </div>

      {/* Compteur */}
      <div style={{
        padding: '12px 16px',
        background: selectedIndices.length > 0 ? '#dbeafe' : '#f1f5f9',
        border: '1px solid',
        borderColor: selectedIndices.length > 0 ? '#3b82f6' : '#e2e8f0',
        borderRadius: '8px',
        fontSize: '14px',
        color: selectedIndices.length > 0 ? '#1e40af' : '#64748b',
        textAlign: 'center',
        fontWeight: '600'
      }}>
        {selectedIndices.length === 0 
          ? 'Aucune réponse sélectionnée' 
          : `${selectedIndices.length} réponse(s) sélectionnée(s)`
        }
      </div>
    </div>
  );
}
