import { useState } from 'react';
import { GripVertical } from 'lucide-react';

export default function ReorderExercise({ block, answer, onAnswer }) {
  const { content } = block;
  const items = content.items || [];
  
  const [orderedItems, setOrderedItems] = useState(() => {
    // Si déjà répondu, utiliser la réponse sauvegardée
    if (answer && answer.length > 0) {
      return answer;
    }
    
    // Sinon, créer un ordre mélangé aléatoirement
    const indices = items.map((_, i) => i);
    
    // Algorithme Fisher-Yates pour mélange vraiment aléatoire
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return indices;
  });

  const moveItem = (fromIndex, toIndex) => {
    const newOrder = [...orderedItems];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setOrderedItems(newOrder);
    onAnswer(newOrder);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Alert */}
      <div style={{
        padding: '12px 16px',
        background: '#dbeafe',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1e40af'
      }}>
        ℹ️ <strong>Consigne :</strong> Réorganise les éléments dans le bon ordre en cliquant sur les flèches.
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

      {/* Items à réorganiser */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {orderedItems.map((itemIndex, position) => {
          const item = items[itemIndex];
          if (!item) return null;
          
          return (
            <div
              key={itemIndex}
              style={{
                padding: '16px 20px',
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s'
              }}
            >
              {/* Drag handle */}
              <div style={{
                color: '#94a3b8',
                cursor: 'grab',
                flexShrink: 0
              }}>
                <GripVertical size={20} />
              </div>

              {/* Numéro de position */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                color: '#64748b',
                flexShrink: 0
              }}>
                {position + 1}
              </div>

              {/* Texte */}
              <div style={{
                flex: 1,
                fontSize: '15px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                {item.text}
              </div>

              {/* Boutons flèches */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => moveItem(position, position - 1)}
                  disabled={position === 0}
                  style={{
                    padding: '6px 10px',
                    background: position === 0 ? '#f1f5f9' : '#3b82f6',
                    color: position === 0 ? '#cbd5e1' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: position === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveItem(position, position + 1)}
                  disabled={position === orderedItems.length - 1}
                  style={{
                    padding: '6px 10px',
                    background: position === orderedItems.length - 1 ? '#f1f5f9' : '#3b82f6',
                    color: position === orderedItems.length - 1 ? '#cbd5e1' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: position === orderedItems.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicateur */}
      {answer && (
        <div style={{
          padding: '12px 16px',
          background: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1e40af',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          ✓ Ordre enregistré
        </div>
      )}
    </div>
  );
}
