import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Undo2, Redo2 } from 'lucide-react';
import { useExerciseEditor } from '../../hooks/useExerciseEditor';
import ExerciseBlockPalette from '../../components/exercises/ExerciseBlockPalette';
import ExerciseBlockRenderer from '../../components/exercises/ExerciseBlockRenderer';

export default function ExerciseEditorPage() {
  const { programId, chapterId } = useParams();
  const navigate = useNavigate();
  
  const {
    blocks,
    loading,
    saving,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    undo,
    redo,
    canUndo,
    canRedo,
    saveExercises
  } = useExerciseEditor(programId, chapterId);

  const handleSave = async () => {
    const result = await saveExercises();
    if (result.success) {
      alert('✅ Exercices enregistrés avec succès !');
    } else {
      alert('❌ Erreur lors de la sauvegarde : ' + result.error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: 24, 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 16, color: '#64748b' }}>
            Chargement des exercices...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Gauche : Retour */}
        <button
          onClick={() => navigate(`/admin/programs/${programId}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
        >
          <ArrowLeft size={18} />
          Retour au programme
        </button>

        {/* Centre : Titre */}
        <h1 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1e293b',
          margin: 0
        }}>
          🎯 Éditeur d'exercices
        </h1>

        {/* Droite : Actions */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            style={{
              padding: '10px 14px',
              background: canUndo ? '#f1f5f9' : '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              opacity: canUndo ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 size={18} color="#475569" />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            style={{
              padding: '10px 14px',
              background: canRedo ? '#f1f5f9' : '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              opacity: canRedo ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
            title="Refaire (Ctrl+Y)"
          >
            <Redo2 size={18} color="#475569" />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.35)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
              }
            }}
          >
            <Save size={18} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Palette de blocs */}
      <ExerciseBlockPalette onAddBlock={addBlock} />

      {/* Liste des blocs */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {blocks.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: '#64748b'
            }}>
              Aucun exercice
            </div>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              Clique sur "+ Ajouter un bloc" ci-dessus pour commencer
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {blocks.map((block, index) => (
              <ExerciseBlockRenderer
                key={block.id}
                block={block}
                index={index}
                totalBlocks={blocks.length}
                onUpdate={(updates) => updateBlock(block.id, updates)}
                onDelete={() => deleteBlock(block.id)}
                onMoveUp={() => moveBlock(block.id, 'up')}
                onMoveDown={() => moveBlock(block.id, 'down')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
