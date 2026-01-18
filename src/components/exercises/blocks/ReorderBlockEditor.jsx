import { Plus, X, GripVertical } from 'lucide-react';

export default function ReorderBlockEditor({ block, onChange }) {
  const { content, points } = block;

  const addItem = () => {
    const newItems = [
      ...(content.items || []),
      { id: Date.now(), text: '', correctPosition: (content.items || []).length + 1 }
    ];
    onChange({
      ...block,
      content: { ...content, items: newItems }
    });
  };

  const removeItem = (index) => {
    if ((content.items || []).length <= 2) {
      alert('Il faut au minimum 2 éléments');
      return;
    }
    const newItems = content.items.filter((_, i) => i !== index);
    onChange({
      ...block,
      content: { ...content, items: newItems }
    });
  };

  const updateItem = (index, text) => {
    const newItems = [...content.items];
    newItems[index] = { ...newItems[index], text };
    onChange({
      ...block,
      content: { ...content, items: newItems }
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
        ℹ️ <strong>Réorganiser :</strong> L'apprenant devra remettre ces éléments dans le bon ordre.
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
          placeholder="Ex: Remets dans l'ordre les étapes pour multiplier 23 × 12"
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

      {/* Items */}
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
            Éléments à réorganiser (dans le bon ordre)
          </label>
          <button
            onClick={addItem}
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
          {(content.items || []).map((item, index) => (
            <div key={item.id} style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              padding: '10px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <div style={{ color: '#94a3b8', cursor: 'grab' }}>
                <GripVertical size={20} />
              </div>
              
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#3b82f6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '14px',
                flexShrink: 0
              }}>
                {index + 1}
              </div>

              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={`Étape ${index + 1}`}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />

              {(content.items || []).length > 2 && (
                <button
                  onClick={() => removeItem(index)}
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

        {(content.items || []).length === 0 && (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            Clique sur "Ajouter" pour créer des éléments
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
