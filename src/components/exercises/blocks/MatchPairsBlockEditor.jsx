import { Plus, X } from 'lucide-react';

export default function MatchPairsBlockEditor({ block, onChange }) {
  const { content, points } = block;

  const addPair = () => {
    const newPairs = [
      ...(content.pairs || []),
      { left: '', right: '' }
    ];
    onChange({
      ...block,
      content: { ...content, pairs: newPairs }
    });
  };

  const removePair = (index) => {
    if ((content.pairs || []).length <= 2) {
      alert('Il faut au minimum 2 paires');
      return;
    }
    const newPairs = content.pairs.filter((_, i) => i !== index);
    onChange({
      ...block,
      content: { ...content, pairs: newPairs }
    });
  };

  const updatePair = (index, side, value) => {
    const newPairs = [...content.pairs];
    newPairs[index] = { ...newPairs[index], [side]: value };
    onChange({
      ...block,
      content: { ...content, pairs: newPairs }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Alert */}
      <div style={{
        padding: '12px',
        background: '#dbeafe',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#1e40af'
      }}>
        ℹ️ <strong>Paires :</strong> L'apprenant doit relier les éléments de gauche avec les bons éléments de droite.
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
          Consigne
        </label>
        <textarea
          value={content.question}
          onChange={(e) => onChange({
            ...block,
            content: { ...content, question: e.target.value }
          })}
          placeholder="Ex: Relie les multiplications à leurs résultats"
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

      {/* Paires */}
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
            Paires à associer
          </label>
          <button
            onClick={addPair}
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
            Ajouter paire
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(content.pairs || []).map((pair, index) => (
            <div key={index} style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              padding: '12px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#3b82f6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '13px',
                flexShrink: 0
              }}>
                {index + 1}
              </div>

              <input
                type="text"
                value={pair.left}
                onChange={(e) => updatePair(index, 'left', e.target.value)}
                placeholder="Gauche (ex: 7 × 8)"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />

              <div style={{
                fontSize: '20px',
                color: '#64748b',
                fontWeight: '600'
              }}>
                ━━
              </div>

              <input
                type="text"
                value={pair.right}
                onChange={(e) => updatePair(index, 'right', e.target.value)}
                placeholder="Droite (ex: 56)"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />

              {(content.pairs || []).length > 2 && (
                <button
                  onClick={() => removePair(index)}
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

        {(content.pairs || []).length === 0 && (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            Clique sur "Ajouter paire" pour créer des associations
          </div>
        )}
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
