export default function TrueFalseBlockEditor({ block, onChange }) {
  const { content, points } = block;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Affirmation */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '6px'
        }}>
          Affirmation à valider
        </label>
        <textarea
          value={content.statement}
          onChange={(e) => onChange({
            ...block,
            content: { ...content, statement: e.target.value }
          })}
          placeholder="Ex: 9 × 7 = 63"
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

      {/* Réponse correcte */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '6px'
        }}>
          Réponse correcte
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: '2px solid',
            borderColor: content.correct ? '#10b981' : '#e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            background: content.correct ? '#d1fae5' : 'white'
          }}>
            <input
              type="radio"
              checked={content.correct === true}
              onChange={() => onChange({
                ...block,
                content: { ...content, correct: true }
              })}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '600', color: content.correct ? '#065f46' : '#64748b' }}>
              ✓ Vrai
            </span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: '2px solid',
            borderColor: content.correct === false ? '#ef4444' : '#e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            background: content.correct === false ? '#fee2e2' : 'white'
          }}>
            <input
              type="radio"
              checked={content.correct === false}
              onChange={() => onChange({
                ...block,
                content: { ...content, correct: false }
              })}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '600', color: content.correct === false ? '#991b1b' : '#64748b' }}>
              ✗ Faux
            </span>
          </label>
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
          placeholder="Ex: 9 × 7 = 63 est correct car..."
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
