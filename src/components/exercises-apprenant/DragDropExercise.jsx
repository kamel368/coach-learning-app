import { useState } from 'react';

export default function DragDropExercise({ block, answer, onAnswer }) {
  const { content } = block;
  const [droppedAnswers, setDroppedAnswers] = useState(answer || {});
  const [selectedLabel, setSelectedLabel] = useState(null);

  const dropZones = content.dropZones || [];
  const labels = content.labels || [];

  const handleZoneClick = (zoneId) => {
    if (selectedLabel !== null) {
      const newAnswers = { ...droppedAnswers, [zoneId]: selectedLabel };
      setDroppedAnswers(newAnswers);
      onAnswer(newAnswers);
      setSelectedLabel(null);
    }
  };

  const handleRemoveFromZone = (zoneId) => {
    const newAnswers = { ...droppedAnswers };
    delete newAnswers[zoneId];
    setDroppedAnswers(newAnswers);
    onAnswer(newAnswers);
  };

  const usedLabels = Object.values(droppedAnswers);

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
        💡 <strong>Mode d'emploi :</strong> Clique sur une étiquette, puis sur une zone pour l'y placer.
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

      {/* Zones de dépôt */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '4px'
        }}>
          Zones de dépôt
        </h3>

        {dropZones.map((zone, index) => {
          const zoneId = zone.id || `zone_${index}`;
          const hasAnswer = droppedAnswers[zoneId];
          
          return (
            <div
              key={zoneId}
              onClick={() => handleZoneClick(zoneId)}
              style={{
                padding: '16px 20px',
                background: hasAnswer ? '#dbeafe' : 'white',
                border: '2px dashed',
                borderColor: selectedLabel !== null ? '#3b82f6' : '#e2e8f0',
                borderRadius: '10px',
                cursor: selectedLabel !== null ? 'pointer' : 'default',
                transition: 'all 0.2s',
                minHeight: '80px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '8px'
              }}>
                {zone.label}
              </div>

              {hasAnswer ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '2px solid #3b82f6'
                }}>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {hasAnswer}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromZone(zoneId);
                    }}
                    style={{
                      padding: '4px 10px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <div style={{
                  fontSize: '13px',
                  color: '#94a3b8',
                  fontStyle: 'italic'
                }}>
                  {selectedLabel !== null ? 'Clique ici pour placer l\'étiquette' : 'Vide'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Étiquettes disponibles */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '4px'
        }}>
          Étiquettes disponibles
        </h3>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {labels.map((label, index) => {
            const isUsed = usedLabels.includes(label);
            const isSelected = selectedLabel === label;
            
            return (
              <button
                key={index}
                onClick={() => !isUsed && setSelectedLabel(isSelected ? null : label)}
                disabled={isUsed}
                style={{
                  padding: '10px 16px',
                  background: isSelected 
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                    : isUsed 
                    ? '#f1f5f9' 
                    : 'white',
                  border: '2px solid',
                  borderColor: isSelected ? '#3b82f6' : isUsed ? '#e2e8f0' : '#cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isSelected ? 'white' : isUsed ? '#cbd5e1' : '#1e293b',
                  cursor: isUsed ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isUsed ? 0.5 : 1
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compteur */}
      <div style={{
        padding: '12px 16px',
        background: Object.keys(droppedAnswers).length === dropZones.length ? '#d1fae5' : '#f1f5f9',
        border: '1px solid',
        borderColor: Object.keys(droppedAnswers).length === dropZones.length ? '#10b981' : '#e2e8f0',
        borderRadius: '8px',
        fontSize: '14px',
        color: Object.keys(droppedAnswers).length === dropZones.length ? '#065f46' : '#64748b',
        textAlign: 'center',
        fontWeight: '600'
      }}>
        {Object.keys(droppedAnswers).length}/{dropZones.length} zone(s) complétée(s)
        {Object.keys(droppedAnswers).length === dropZones.length && ' ✓'}
      </div>
    </div>
  );
}
