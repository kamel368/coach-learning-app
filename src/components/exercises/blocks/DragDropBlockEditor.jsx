import { Plus, X } from 'lucide-react';

export default function DragDropBlockEditor({ block, onChange }) {
  const { content, points } = block;

  const addDropZone = () => {
    const newZones = [
      ...(content.dropZones || []),
      { id: Date.now(), label: '', correctAnswer: '' }
    ];
    onChange({
      ...block,
      content: { ...content, dropZones: newZones }
    });
  };

  const removeDropZone = (index) => {
    const newZones = content.dropZones.filter((_, i) => i !== index);
    onChange({
      ...block,
      content: { ...content, dropZones: newZones }
    });
  };

  const updateDropZone = (index, field, value) => {
    const newZones = [...content.dropZones];
    newZones[index] = { ...newZones[index], [field]: value };
    onChange({
      ...block,
      content: { ...content, dropZones: newZones }
    });
  };

  const addLabel = () => {
    const newLabels = [...(content.labels || []), ''];
    onChange({
      ...block,
      content: { ...content, labels: newLabels }
    });
  };

  const removeLabel = (index) => {
    const newLabels = content.labels.filter((_, i) => i !== index);
    onChange({
      ...block,
      content: { ...content, labels: newLabels }
    });
  };

  const updateLabel = (index, value) => {
    const newLabels = [...content.labels];
    newLabels[index] = value;
    onChange({
      ...block,
      content: { ...content, labels: newLabels }
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
        ℹ️ <strong>Glisser-Déposer :</strong> L'apprenant doit glisser les étiquettes dans les bonnes zones.
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
          placeholder="Ex: Place les bonnes réponses dans les cases"
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

      {/* Zones de drop */}
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
            Zones de dépôt
          </label>
          <button
            onClick={addDropZone}
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
            Ajouter zone
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(content.dropZones || []).map((zone, index) => (
            <div key={zone.id} style={{
              padding: '12px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={zone.label}
                    onChange={(e) => updateDropZone(index, 'label', e.target.value)}
                    placeholder="Label (ex: 7 × 8 = )"
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                  <input
                    type="text"
                    value={zone.correctAnswer}
                    onChange={(e) => updateDropZone(index, 'correctAnswer', e.target.value)}
                    placeholder="Réponse correcte (ex: 56)"
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #10b981',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: '#d1fae5',
                      fontWeight: '600'
                    }}
                  />
                </div>

                <button
                  onClick={() => removeDropZone(index)}
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Étiquettes disponibles */}
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
            Étiquettes disponibles (incluant distracteurs)
          </label>
          <button
            onClick={addLabel}
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
            Ajouter étiquette
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px'
        }}>
          {(content.labels || []).map((label, index) => (
            <div key={index} style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                value={label}
                onChange={(e) => updateLabel(index, e.target.value)}
                placeholder="Étiquette"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
              <button
                onClick={() => removeLabel(index)}
                style={{
                  padding: '8px',
                  background: '#fee2e2',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <X size={14} color="#dc2626" />
              </button>
            </div>
          ))}
        </div>
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
