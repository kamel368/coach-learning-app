import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getExerciseById, updateExercise } from '../../services/supabase/exercises';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { ArrowLeft, Save, Trash2, GripVertical, CreditCard, CheckCircle2, Circle, ListChecks, ArrowUpDown, Target, Link2 } from 'lucide-react';
import FlashcardBlockEditor from '../../components/exercises/blocks/FlashcardBlockEditor';
import TrueFalseBlockEditor from '../../components/exercises/blocks/TrueFalseBlockEditor';
import QCMBlockEditor from '../../components/exercises/blocks/QCMBlockEditor';
import QCMSelectiveBlockEditor from '../../components/exercises/blocks/QCMSelectiveBlockEditor';
import ReorderBlockEditor from '../../components/exercises/blocks/ReorderBlockEditor';
import DragDropBlockEditor from '../../components/exercises/blocks/DragDropBlockEditor';
import MatchPairsBlockEditor from '../../components/exercises/blocks/MatchPairsBlockEditor';

const BLOCK_TYPES = [
  { type: 'flashcard', icon: CreditCard, label: 'Flashcard', desc: 'Question/Réponse', color: '#8b5cf6' },
  { type: 'true_false', icon: CheckCircle2, label: 'Vrai/Faux', desc: 'Affirmation', color: '#3b82f6' },
  { type: 'qcm', icon: Circle, label: 'QCM', desc: 'Choix unique', color: '#10b981' },
  { type: 'qcm_selective', icon: ListChecks, label: 'QCM Sélectif', desc: 'Multi-choix', color: '#f59e0b' },
  { type: 'reorder', icon: ArrowUpDown, label: 'Réorganiser', desc: 'Ordre', color: '#06b6d4' },
  { type: 'drag_drop', icon: Target, label: 'Glisser-Déposer', desc: 'Association', color: '#ef4444' },
  { type: 'match_pairs', icon: Link2, label: 'Paires', desc: 'Relier', color: '#ec4899' }
];

const BLOCK_LABELS = {
  flashcard: { icon: CreditCard, label: 'Flashcard', color: '#8b5cf6' },
  true_false: { icon: CheckCircle2, label: 'Vrai/Faux', color: '#3b82f6' },
  qcm: { icon: Circle, label: 'QCM', color: '#10b981' },
  qcm_selective: { icon: ListChecks, label: 'QCM Sélectif', color: '#f59e0b' },
  reorder: { icon: ArrowUpDown, label: 'Réorganiser', color: '#06b6d4' },
  drag_drop: { icon: Target, label: 'Glisser-Déposer', color: '#ef4444' },
  match_pairs: { icon: Link2, label: 'Paires', color: '#ec4899' }
};

export default function ExerciseEditorPageSupabase() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { organizationId } = useSupabaseAuth();
  
  const [exercise, setExercise] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('exercices');
  const [editingBlockId, setEditingBlockId] = useState(null);

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    try {
      console.log('📚 Chargement exercice Supabase:', exerciseId);
      
      const data = await getExerciseById(exerciseId, organizationId);
      
      console.log('✅ Exercice chargé:', data);
      setExercise(data);
      
      // Charger les blocs depuis exercise_data
      if (data.exercise_data?.blocks) {
        setBlocks(data.exercise_data.blocks);
      } else {
        setBlocks([]);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement exercice:', error);
      alert('Erreur lors du chargement de l\'exercice');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Sauvegarde exercice Supabase');
      console.log('📊 Blocs à sauvegarder:', blocks.length);
      
      // Déterminer le type d'exercice (premier bloc ou qcm par défaut)
      const exerciseType = blocks.length > 0 ? blocks[0].type : 'qcm';
      
      await updateExercise(
        exerciseId,
        {
          title: exercise.title,
          exercise_type: exerciseType,
          exercise_data: {
            type: exerciseType,
            blocks: blocks
          }
        },
        organizationId
      );
      
      console.log('✅ Exercice sauvegardé');
      alert('✅ Exercice enregistré avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      order: blocks.length,
      points: getDefaultPoints(type),
      content: getDefaultContent(type)
    };
    
    setBlocks([...blocks, newBlock]);
    setActiveTab('exercices');
    setEditingBlockId(newBlock.id);
  };

  const handleUpdateBlock = (blockId, updates) => {
    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    ));
  };

  const handleDeleteBlock = (blockId) => {
    if (window.confirm('Supprimer ce bloc d\'exercice ?')) {
      setBlocks(blocks.filter(block => block.id !== blockId));
    }
  };

  const handleMoveBlock = (blockId, direction) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    
    // Mettre à jour les order
    newBlocks.forEach((block, i) => {
      block.order = i;
    });
    
    setBlocks(newBlocks);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div style={{ fontSize: 18, color: '#6b7280' }}>
          Chargement de l'exercice...
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Exercice introuvable</h1>
        <button onClick={() => navigate(-1)}>← Retour</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f9fafb' }}>
      {/* Sidebar gauche - Palette */}
      <div style={{
        width: 280,
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
        padding: 20
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1f2937' }}>
          Types d'exercices
        </h2>
        
        {BLOCK_TYPES.map(blockType => {
          const Icon = blockType.icon;
          return (
            <button
              key={blockType.type}
              onClick={() => handleAddBlock(blockType.type)}
              style={{
                width: '100%',
                padding: 16,
                marginBottom: 12,
                background: 'white',
                border: `2px solid ${blockType.color}20`,
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${blockType.color}10`;
                e.currentTarget.style.borderColor = blockType.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = `${blockType.color}20`;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={20} color={blockType.color} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                  {blockType.label}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {blockType.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Zone centrale - Exercices */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 30
        }}>
          <div>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                fontSize: 14,
                marginBottom: 12
              }}
            >
              <ArrowLeft size={16} />
              Retour
            </button>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937' }}>
              {exercise.title}
            </h1>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: saving ? '#9ca3af' : '#3b82f6',
              border: 'none',
              borderRadius: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              color: 'white',
              fontSize: 16,
              fontWeight: 600
            }}
          >
            <Save size={18} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>

        {/* Liste des blocs */}
        {blocks.length === 0 ? (
          <div style={{
            padding: 60,
            textAlign: 'center',
            background: 'white',
            border: '2px dashed #e5e7eb',
            borderRadius: 12
          }}>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 8 }}>
              Aucun exercice pour le moment
            </p>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>
              Cliquez sur un type d'exercice dans le menu de gauche pour commencer
            </p>
          </div>
        ) : (
          blocks.map((block, index) => {
            const blockInfo = BLOCK_LABELS[block.type];
            const BlockIcon = blockInfo?.icon || Circle;

            return (
              <div
                key={block.id}
                id={`block-${block.id}`}
                style={{
                  marginBottom: 20,
                  padding: 20,
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: 12
                }}
              >
                {/* Header du bloc */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <GripVertical size={20} color="#9ca3af" />
                    <BlockIcon size={20} color={blockInfo?.color} />
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                      {blockInfo?.label} #{index + 1}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleMoveBlock(block.id, 'up')}
                      disabled={index === 0}
                      style={{
                        padding: 8,
                        background: 'transparent',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        opacity: index === 0 ? 0.5 : 1
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveBlock(block.id, 'down')}
                      disabled={index === blocks.length - 1}
                      style={{
                        padding: 8,
                        background: 'transparent',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        cursor: index === blocks.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: index === blocks.length - 1 ? 0.5 : 1
                      }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      style={{
                        padding: 8,
                        background: 'transparent',
                        border: '1px solid #fee2e2',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#ef4444'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Éditeur du bloc */}
                {block.type === 'flashcard' && (
                  <FlashcardBlockEditor
                    block={block}
                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                  />
                )}
                {block.type === 'true_false' && (
                  <TrueFalseBlockEditor
                    block={block}
                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                  />
                )}
                {block.type === 'qcm' && (
                  <QCMBlockEditor
                    block={block}
                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                  />
                )}
                {block.type === 'qcm_selective' && (
                  <QCMSelectiveBlockEditor
                    block={block}
                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                  />
                )}
                {block.type === 'reorder' && (
                  <ReorderBlockEditor
                    block={block}
                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                  />
                )}
                {block.type === 'drag_drop' && (
                  <DragDropBlockEditor
                    block={block}
                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                  />
                )}
                {block.type === 'match_pairs' && (
                  <MatchPairsBlockEditor
                    block={block}
                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Helper functions
function getDefaultPoints(type) {
  return 10;
}

function getDefaultContent(type) {
  switch (type) {
    case 'flashcard':
      return { question: '', answer: '' };
    case 'true_false':
      return { statement: '', correct: true, explanation: '' };
    case 'qcm':
      return { question: '', options: ['', '', ''], correctIndex: 0, explanation: '' };
    case 'qcm_selective':
      return { question: '', options: ['', '', ''], correctIndices: [], explanation: '' };
    case 'reorder':
      return { instruction: '', items: ['', '', ''] };
    case 'drag_drop':
      return { instruction: '', items: [], zones: [] };
    case 'match_pairs':
      return { instruction: '', pairs: [] };
    default:
      return {};
  }
}
