import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Undo2, Redo2, GripVertical, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useExerciseEditor } from '../../hooks/useExerciseEditor';
import FlashcardBlockEditor from '../../components/exercises/blocks/FlashcardBlockEditor';
import TrueFalseBlockEditor from '../../components/exercises/blocks/TrueFalseBlockEditor';
import QCMBlockEditor from '../../components/exercises/blocks/QCMBlockEditor';
import QCMSelectiveBlockEditor from '../../components/exercises/blocks/QCMSelectiveBlockEditor';
import ReorderBlockEditor from '../../components/exercises/blocks/ReorderBlockEditor';
import DragDropBlockEditor from '../../components/exercises/blocks/DragDropBlockEditor';
import MatchPairsBlockEditor from '../../components/exercises/blocks/MatchPairsBlockEditor';

const BLOCK_TYPES = [
  { type: 'flashcard', icon: '🃏', label: 'Flashcard', desc: 'Question/Réponse simple', color: '#8b5cf6' },
  { type: 'true_false', icon: '✓✗', label: 'Vrai/Faux', desc: 'Affirmation à valider', color: '#3b82f6' },
  { type: 'qcm', icon: '☑', label: 'QCM', desc: 'Choix multiple (1 réponse)', color: '#10b981' },
  { type: 'qcm_selective', icon: '☑☑', label: 'QCM Sélectif', desc: 'Plusieurs bonnes réponses', color: '#f59e0b' },
  { type: 'reorder', icon: '🔢', label: 'Réorganiser', desc: 'Remettre dans l\'ordre', color: '#06b6d4' },
  { type: 'drag_drop', icon: '🎯', label: 'Glisser-Déposer', desc: 'Associer des éléments', color: '#ef4444' },
  { type: 'match_pairs', icon: '🔗', label: 'Paires', desc: 'Relier des paires', color: '#ec4899' }
];

const BLOCK_LABELS = {
  flashcard: { icon: '🃏', label: 'Flashcard', color: '#8b5cf6' },
  true_false: { icon: '✓✗', label: 'Vrai/Faux', color: '#3b82f6' },
  qcm: { icon: '☑', label: 'QCM', color: '#10b981' },
  qcm_selective: { icon: '☑☑', label: 'QCM Sélectif', color: '#f59e0b' },
  reorder: { icon: '🔢', label: 'Réorganiser', color: '#06b6d4' },
  drag_drop: { icon: '🎯', label: 'Glisser-Déposer', color: '#ef4444' },
  match_pairs: { icon: '🔗', label: 'Paires', color: '#ec4899' }
};

export default function ExerciseEditorPage() {
  const { programId, moduleId } = useParams();
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
  } = useExerciseEditor(programId, moduleId);

  const [activeTab, setActiveTab] = useState('exercices'); // 'exercices' ou 'blocs'
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleSave = async () => {
    const result = await saveExercises();
    if (result.success) {
      alert('✅ Exercices enregistrés avec succès !');
    } else {
      alert('❌ Erreur : ' + result.error);
    }
  };

  const handleAddBlock = (type) => {
    const newBlockId = addBlock(type);
    setActiveTab('exercices'); // Retour onglet exercices
    // Sélectionner automatiquement le nouveau bloc
    setTimeout(() => {
      if (blocks.length >= 0) {
        const newBlock = blocks[blocks.length];
        if (newBlock) {
          setSelectedBlockId(newBlock.id);
        }
      }
    }, 100);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Déplacer visuellement
    const direction = draggedIndex < index ? 'down' : 'up';
    moveBlock(blocks[draggedIndex].id, direction);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderEditor = () => {
    if (!selectedBlockId) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px',
            opacity: 0.3
          }}>
            👈
          </div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#64748b',
            marginBottom: '8px'
          }}>
            Sélectionne un exercice
          </h3>
          <p style={{
            fontSize: '13px',
            color: '#94a3b8',
            maxWidth: '300px'
          }}>
            Clique sur un exercice dans la liste de gauche pour l'éditer
          </p>
        </div>
      );
    }

    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block) return null;

    const blockInfo = BLOCK_LABELS[block.type] || { icon: '❓', label: 'Inconnu', color: '#64748b' };

    const commonProps = {
      block,
      onChange: (updates) => updateBlock(block.id, updates)
    };

    let EditorComponent;
    switch (block.type) {
      case 'flashcard':
        EditorComponent = FlashcardBlockEditor;
        break;
      case 'true_false':
        EditorComponent = TrueFalseBlockEditor;
        break;
      case 'qcm':
        EditorComponent = QCMBlockEditor;
        break;
      case 'qcm_selective':
        EditorComponent = QCMSelectiveBlockEditor;
        break;
      case 'reorder':
        EditorComponent = ReorderBlockEditor;
        break;
      case 'drag_drop':
        EditorComponent = DragDropBlockEditor;
        break;
      case 'match_pairs':
        EditorComponent = MatchPairsBlockEditor;
        break;
      default:
        return <div>Type inconnu</div>;
    }

    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header bloc sélectionné */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          background: '#fafbfc',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: blockInfo.color,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            {blockInfo.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              {blockInfo.label}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#94a3b8'
            }}>
              Exercice {blocks.findIndex(b => b.id === selectedBlockId) + 1} / {blocks.length}
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Supprimer cet exercice ?')) {
                deleteBlock(block.id);
                setSelectedBlockId(null);
              }
            }}
            style={{
              padding: '6px 12px',
              background: 'white',
              border: '1px solid #fee2e2',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <Trash2 size={14} />
            Supprimer
          </button>
        </div>

        {/* Éditeur scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          background: 'white'
        }}>
          <EditorComponent {...commonProps} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
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
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* HEADER FIXE */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Gauche : Retour + Titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate(`/admin/programs/${programId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#64748b',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowLeft size={16} />
              Retour
            </button>

            <div style={{
              height: '20px',
              width: '1px',
              background: '#e2e8f0'
            }} />

            <h1 style={{
              fontSize: '15px',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              Éditeur d'exercices
            </h1>
          </div>

          {/* Droite : Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Undo/Redo */}
            <div style={{
              display: 'flex',
              background: '#f8fafc',
              borderRadius: '6px',
              padding: '2px'
            }}>
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Annuler (Ctrl+Z)"
                style={{
                  padding: '6px 10px',
                  background: canUndo ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: canUndo ? 'pointer' : 'not-allowed',
                  opacity: canUndo ? 1 : 0.4,
                  transition: 'all 0.2s'
                }}
              >
                <Undo2 size={16} color="#64748b" />
              </button>

              <button
                onClick={redo}
                disabled={!canRedo}
                title="Refaire (Ctrl+Y)"
                style={{
                  padding: '6px 10px',
                  background: canRedo ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: canRedo ? 'pointer' : 'not-allowed',
                  opacity: canRedo ? 1 : 0.4,
                  transition: 'all 0.2s'
                }}
              >
                <Redo2 size={16} color="#64748b" />
              </button>
            </div>

            {/* Bouton Enregistrer */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: saving ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'white',
                cursor: saving ? 'wait' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              <Save size={16} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* LAYOUT 2 COLONNES */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* COLONNE GAUCHE - Onglets */}
        <div style={{
          width: '320px',
          background: 'white',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Onglets */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#fafbfc'
          }}>
            <button
              onClick={() => setActiveTab('exercices')}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === 'exercices' ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'exercices' ? '2px solid #3b82f6' : '2px solid transparent',
                fontSize: '13px',
                fontWeight: '600',
                color: activeTab === 'exercices' ? '#1e293b' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Exercices ({blocks.length})
            </button>

            <button
              onClick={() => setActiveTab('blocs')}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === 'blocs' ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'blocs' ? '2px solid #3b82f6' : '2px solid transparent',
                fontSize: '13px',
                fontWeight: '600',
                color: activeTab === 'blocs' ? '#1e293b' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              + Blocs
            </button>
          </div>

          {/* Contenu onglets */}
          <div style={{
            flex: 1,
            overflowY: 'auto'
          }}>
            {activeTab === 'exercices' ? (
              // ONGLET EXERCICES - Liste glisser-déposer
              <div style={{ padding: '12px' }}>
                {blocks.length === 0 ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '12px',
                      opacity: 0.3
                    }}>
                      📝
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: '#94a3b8',
                      marginBottom: '16px'
                    }}>
                      Aucun exercice créé
                    </p>
                    <button
                      onClick={() => setActiveTab('blocs')}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      Ajouter un bloc
                    </button>
                  </div>
                ) : (
                  blocks.map((block, index) => {
                    const blockInfo = BLOCK_LABELS[block.type] || { icon: '❓', label: 'Inconnu', color: '#64748b' };
                    const isSelected = selectedBlockId === block.id;
                    
                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedBlockId(block.id)}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          background: isSelected ? '#f0f9ff' : 'white',
                          border: '1px solid',
                          borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          opacity: draggedIndex === index ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }
                        }}
                      >
                        <GripVertical size={16} color="#cbd5e1" style={{ cursor: 'grab' }} />
                        
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
                          fontWeight: '700',
                          flexShrink: 0
                        }}>
                          {index + 1}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span>{blockInfo.icon}</span>
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {blockInfo.label}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#94a3b8'
                          }}>
                            {block.points} pts
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              // ONGLET BLOCS - Palette
              <div style={{ padding: '12px' }}>
                <div style={{
                  marginBottom: '12px',
                  padding: '12px',
                  background: '#f0f9ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#1e40af'
                }}>
                  💡 Clique sur un type pour ajouter un exercice
                </div>

                {BLOCK_TYPES.map((blockType) => (
                  <button
                    key={blockType.type}
                    onClick={() => handleAddBlock(blockType.type)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginBottom: '8px',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = blockType.color;
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: blockType.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {blockType.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '2px'
                      }}>
                        {blockType.label}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        lineHeight: '1.4'
                      }}>
                        {blockType.desc}
                      </div>
                    </div>
                    <Plus size={16} color="#94a3b8" style={{ marginTop: '8px' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE - Éditeur */}
        <div style={{
          flex: 1,
          background: '#fafbfc',
          overflow: 'hidden'
        }}>
          {renderEditor()}
        </div>
      </div>

      {/* Animation spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
