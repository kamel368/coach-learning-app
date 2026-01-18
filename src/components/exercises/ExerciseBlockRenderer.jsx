import { ArrowUp, ArrowDown, Trash2, GripVertical } from 'lucide-react';
import FlashcardBlockEditor from './blocks/FlashcardBlockEditor';
import TrueFalseBlockEditor from './blocks/TrueFalseBlockEditor';
import QCMBlockEditor from './blocks/QCMBlockEditor';
import QCMSelectiveBlockEditor from './blocks/QCMSelectiveBlockEditor';
import ReorderBlockEditor from './blocks/ReorderBlockEditor';
import DragDropBlockEditor from './blocks/DragDropBlockEditor';
import MatchPairsBlockEditor from './blocks/MatchPairsBlockEditor';

const BLOCK_LABELS = {
  flashcard: { icon: '🃏', label: 'Flashcard' },
  true_false: { icon: '✓✗', label: 'Vrai/Faux' },
  qcm: { icon: '☑', label: 'QCM' },
  qcm_selective: { icon: '☑☑', label: 'QCM Sélectif' },
  reorder: { icon: '🔢', label: 'Réorganiser' },
  drag_drop: { icon: '🎯', label: 'Glisser-Déposer' },
  match_pairs: { icon: '🔗', label: 'Paires' }
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
  const blockInfo = BLOCK_LABELS[block.type] || { icon: '❓', label: 'Inconnu' };

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
      background: '#f8fafc',
      borderRadius: '12px',
      border: '2px solid #e2e8f0',
      overflow: 'hidden',
      transition: 'all 0.2s'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* Drag handle */}
        <div style={{ cursor: 'grab', color: '#94a3b8' }}>
          <GripVertical size={20} />
        </div>

        {/* Numéro et type */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{blockInfo.icon}</span>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
            {index + 1}. {blockInfo.label}
          </span>
        </div>

        {/* Points */}
        <div style={{
          padding: '4px 10px',
          background: '#fef3c7',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#92400e'
        }}>
          {block.points} pts
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            style={{
              padding: '6px',
              background: index === 0 ? '#f8fafc' : 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: index === 0 ? 'not-allowed' : 'pointer',
              opacity: index === 0 ? 0.5 : 1
            }}
            title="Monter"
          >
            <ArrowUp size={16} color="#64748b" />
          </button>

          <button
            onClick={onMoveDown}
            disabled={index === totalBlocks - 1}
            style={{
              padding: '6px',
              background: index === totalBlocks - 1 ? '#f8fafc' : 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: index === totalBlocks - 1 ? 'not-allowed' : 'pointer',
              opacity: index === totalBlocks - 1 ? 0.5 : 1
            }}
            title="Descendre"
          >
            <ArrowDown size={16} color="#64748b" />
          </button>

          <button
            onClick={() => {
              if (window.confirm('Supprimer cet exercice ?')) {
                onDelete();
              }
            }}
            style={{
              padding: '6px',
              background: 'white',
              border: '1px solid #fee2e2',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            title="Supprimer"
          >
            <Trash2 size={16} color="#dc2626" />
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
