import { Plus } from 'lucide-react';

/**
 * Palette de blocs d'exercices
 * Permet de choisir le type d'exercice à ajouter
 */
export default function ExerciseBlockPalette({ onAddBlock }) {
  const blockTypes = [
    {
      type: 'flashcard',
      label: 'Flashcard',
      emoji: '🗂️',
      description: 'Question/Réponse simple'
    },
    {
      type: 'true_false',
      label: 'Vrai/Faux',
      emoji: '✓✗',
      description: 'Affirmation à valider'
    },
    {
      type: 'qcm',
      label: 'QCM',
      emoji: '☑️',
      description: 'Choix multiple (1 réponse)'
    },
    {
      type: 'qcm_selective',
      label: 'QCM Sélectif',
      emoji: '☑️☑️',
      description: 'Plusieurs bonnes réponses'
    },
    {
      type: 'reorder',
      label: 'Réorganiser',
      emoji: '🔀',
      description: 'Remettre dans l\'ordre'
    },
    {
      type: 'drag_drop',
      label: 'Glisser-Déposer',
      emoji: '🎯',
      description: 'Associer des éléments'
    },
    {
      type: 'match_pairs',
      label: 'Paires',
      emoji: '🔗',
      description: 'Relier des paires'
    }
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1e293b',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Plus size={20} />
          Ajouter un bloc d'exercice
        </h2>
        <div style={{
          fontSize: '13px',
          color: '#64748b',
          fontWeight: '500'
        }}>
          {blockTypes.length} types disponibles
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {blockTypes.map((blockType) => (
          <button
            key={blockType.type}
            onClick={() => onAddBlock(blockType.type)}
            style={{
              padding: '16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              fontSize: '24px',
              marginBottom: '8px'
            }}>
              {blockType.emoji}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '4px'
            }}>
              {blockType.label}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#64748b',
              lineHeight: '1.4'
            }}>
              {blockType.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
