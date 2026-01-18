import { Plus, X } from 'lucide-react';

export default function QCMBlockEditor({ block, onChange }) {
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
    onChange({
      ...block,
      content: {
        ...content,
        options: newOptions,
        correctIndex: content.correctIndex >= newOptions.length ? 0 : content.correctIndex
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          placeholder="Ex: Combien font 9 × 6 ?"
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
            Options (choix unique)
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
          {content.options.map((option, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="radio"
                checked={content.correctIndex === index}
                onChange={() => onChange({
                  ...block,
                  content: { ...content, correctIndex: index }
                })}
                style={{ cursor: 'pointer' }}
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
                  borderColor: content.correctIndex === index ? '#10b981' : '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: content.correctIndex === index ? '#d1fae5' : 'white'
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
          ))}
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
          placeholder="Ex: La bonne réponse est..."
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
