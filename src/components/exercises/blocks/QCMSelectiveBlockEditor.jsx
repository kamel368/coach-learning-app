import { Plus, X } from 'lucide-react';

export default function QCMSelectiveBlockEditor({ block, onChange }) {
  const { content, points } = block;

  const addOption = () => {
    onChange({
      ...block,
      content: {
        ...content,
        options: [...content.options, '']
      }
    });
  };

  const removeOption = (index) => {
    if (content.options.length <= 2) {
      alert('Il faut au minimum 2 options');
      return;
    }
    const newOptions = content.options.filter((_, i) => i !== index);
    const newCorrectIndices = content.correctIndices.filter(i => i !== index).map(i => i > index ? i - 1 : i);
    onChange({
      ...block,
      content: {
        ...content,
        options: newOptions,
        correctIndices: newCorrectIndices
      }
    });
  };

  const updateOption = (index, value) => {
    const newOptions = [...content.options];
    newOptions[index] = value;
    onChange({
      ...block,
      content: { ...content, options: newOptions }
    });
  };

  const toggleCorrect = (index) => {
    const currentIndices = content.correctIndices || [];
    const newIndices = currentIndices.includes(index)
      ? currentIndices.filter(i => i !== index)
      : [...currentIndices, index];
    
    onChange({
      ...block,
      content: { ...content, correctIndices: newIndices }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Alert */}
      <div style={{
        padding: '12px',
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#92400e'
      }}>
        ⚠️ <strong>QCM Sélectif :</strong> L'apprenant doit cocher TOUTES les bonnes réponses. Aucune erreur n'est permise.
      </div>

      {/* Question */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '6px'
        }}>
          Question
        </label>
        <textarea
          value={content.question}
          onChange={(e) => onChange({
            ...block,
            content: { ...content, question: e.target.value }
          })}
          placeholder="Ex: Quelles multiplications donnent 56 ?"
          rows={2}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Options */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <label style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#475569'
          }}>
            Options (plusieurs bonnes réponses possibles)
          </label>
          <button
            onClick={addOption}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {content.options.map((option, index) => {
            const isCorrect = (content.correctIndices || []).includes(index);
            return (
              <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={isCorrect}
                  onChange={() => toggleCorrect(index)}
                  style={{ 
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px'
                  }}
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '2px solid',
                    borderColor: isCorrect ? '#10b981' : '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: isCorrect ? '#d1fae5' : 'white',
                    fontWeight: isCorrect ? '600' : 'normal'
                  }}
                />
                {content.options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    style={{
                      padding: '8px',
                      background: '#fee2e2',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} color="#dc2626" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          {(content.correctIndices || []).length} bonne(s) réponse(s) sélectionnée(s)
        </div>
      </div>

      {/* Explication */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '6px'
        }}>
          Explication (optionnelle)
        </label>
        <textarea
          value={content.explanation || ''}
          onChange={(e) => onChange({
            ...block,
            content: { ...content, explanation: e.target.value }
          })}
          placeholder="Ex: Les bonnes réponses sont..."
          rows={2}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Points */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '6px'
        }}>
          Points
        </label>
        <input
          type="number"
          value={points}
          onChange={(e) => onChange({
            ...block,
            points: Number(e.target.value)
          })}
          min={1}
          style={{
            width: '100px',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
      </div>
    </div>
  );
}
