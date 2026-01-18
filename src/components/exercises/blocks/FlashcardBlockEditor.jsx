export default function FlashcardBlockEditor({ block, onChange }) {
  const { content, points } = block;

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
          Question (recto de la carte)
        </label>
        <input
          type="text"
          value={content.question}
          onChange={(e) => onChange({
            ...block,
            content: { ...content, question: e.target.value }
          })}
          placeholder="Ex: Combien font 7 × 8 ?"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Réponse */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '6px'
        }}>
          Réponse (verso de la carte)
        </label>
        <input
          type="text"
          value={content.answer}
          onChange={(e) => onChange({
            ...block,
            content: { ...content, answer: e.target.value }
          })}
          placeholder="Ex: 56"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Indice optionnel */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '6px'
        }}>
          Indice (optionnel)
        </label>
        <input
          type="text"
          value={content.hint || ''}
          onChange={(e) => onChange({
            ...block,
            content: { ...content, hint: e.target.value }
          })}
          placeholder="Ex: 7 × 8 = 7 × (10 - 2)"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px'
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
