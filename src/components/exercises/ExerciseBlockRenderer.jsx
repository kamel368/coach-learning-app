import { ArrowUp, ArrowDown, Trash2, GripVertical } from 'lucide-react';
import FlashcardBlockEditor from './blocks/FlashcardBlockEditor';
import TrueFalseBlockEditor from './blocks/TrueFalseBlockEditor';
import QCMBlockEditor from './blocks/QCMBlockEditor';
import QCMSelectiveBlockEditor from './blocks/QCMSelectiveBlockEditor';
import ReorderBlockEditor from './blocks/ReorderBlockEditor';
import DragDropBlockEditor from './blocks/DragDropBlockEditor';
import MatchPairsBlockEditor from './blocks/MatchPairsBlockEditor';

const BLOCK_LABELS = {
  flashcard: { icon: '🃏', label: 'Flashcard', color: '#8b5cf6' },
  true_false: { icon: '✓✗', label: 'Vrai/Faux', color: '#3b82f6' },
  qcm: { icon: '☑', label: 'QCM', color: '#10b981' },
  qcm_selective: { icon: '☑☑', label: 'QCM Sélectif', color: '#f59e0b' },
  reorder: { icon: '🔢', label: 'Réorganiser', color: '#06b6d4' },
  drag_drop: { icon: '🎯', label: 'Glisser-Déposer', color: '#ef4444' },
  match_pairs: { icon: '🔗', label: 'Paires', color: '#ec4899' }
};

export default function ExerciseBlockRenderer({
  block,
  index,
  totalBlocks,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}) {
  const blockInfo = BLOCK_LABELS[block.type] || { icon: '❓', label: 'Inconnu', color: '#64748b' };

  const renderEditor = () => {
    switch (block.type) {
      case 'flashcard':
        return <FlashcardBlockEditor block={block} onChange={onUpdate} />;
      case 'true_false':
        return <TrueFalseBlockEditor block={block} onChange={onUpdate} />;
      case 'qcm':
        return <QCMBlockEditor block={block} onChange={onUpdate} />;
      case 'qcm_selective':
        return <QCMSelectiveBlockEditor block={block} onChange={onUpdate} />;
      case 'reorder':
        return <ReorderBlockEditor block={block} onChange={onUpdate} />;
      case 'drag_drop':
        return <DragDropBlockEditor block={block} onChange={onUpdate} />;
      case 'match_pairs':
        return <MatchPairsBlockEditor block={block} onChange={onUpdate} />;
      default:
        return <div>Type inconnu: {block.type}</div>;
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      transition: 'all 0.2s'
    }}>
      {/* Header - Style cohérent */}
      <div style={{
        background: '#fafbfc',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid #f1f5f9'
      }}>
        {/* Drag handle */}
        <div style={{
          cursor: 'grab',
          color: '#cbd5e1',
          display: 'flex',
          alignItems: 'center'
        }}>
          <GripVertical size={18} />
        </div>

        {/* Badge numéro + type */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flex: 1
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: blockInfo.color,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            {index + 1}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>{blockInfo.icon}</span>
              <span>{blockInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Points */}
        <div style={{
          padding: '4px 10px',
          background: '#fef3c7',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#92400e'
        }}>
          {block.points} pts
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'white',
          padding: '2px',
          borderRadius: '6px'
        }}>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            title="Monter"
            style={{
              padding: '4px 6px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: index === 0 ? 'not-allowed' : 'pointer',
              opacity: index === 0 ? 0.3 : 1,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (index !== 0) e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <ArrowUp size={14} color="#64748b" />
          </button>

          <button
            onClick={onMoveDown}
            disabled={index === totalBlocks - 1}
            title="Descendre"
            style={{
              padding: '4px 6px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: index === totalBlocks - 1 ? 'not-allowed' : 'pointer',
              opacity: index === totalBlocks - 1 ? 0.3 : 1,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (index !== totalBlocks - 1) e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <ArrowDown size={14} color="#64748b" />
          </button>

          <div style={{
            width: '1px',
            height: '20px',
            background: '#e2e8f0',
            margin: '0 2px'
          }} />

          <button
            onClick={() => {
              if (window.confirm('Supprimer cet exercice ?')) {
                onDelete();
              }
            }}
            title="Supprimer"
            style={{
              padding: '4px 6px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Trash2 size={14} color="#ef4444" />
          </button>
        </div>
      </div>

      {/* Éditeur */}
      <div style={{ padding: '20px' }}>
        {renderEditor()}
      </div>
    </div>
  );
}
