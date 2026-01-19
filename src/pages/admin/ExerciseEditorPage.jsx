import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Undo2, Redo2, GripVertical, Trash2, ChevronUp, ChevronDown, BookOpen, CreditCard, CheckCircle2, Circle, ListChecks, ArrowUpDown, Target, Link2, FileText, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useExerciseEditor } from '../../hooks/useExerciseEditor';
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

  const [activeTab, setActiveTab] = useState('exercices');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [editingBlockId, setEditingBlockId] = useState(null);

  // Récupérer le titre du chapitre
  useEffect(() => {
    async function fetchChapterTitle() {
      try {
        const moduleRef = doc(db, 'programs', programId, 'modules', moduleId);
        const moduleSnap = await getDoc(moduleRef);
        if (moduleSnap.exists()) {
          setChapterTitle(moduleSnap.data().title || 'Sans titre');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du titre du chapitre:', error);
      }
    }
    if (programId && moduleId) {
      fetchChapterTitle();
    }
  }, [programId, moduleId]);

  const handleSave = async () => {
    const result = await saveExercises();
    if (result.success) {
      alert('✅ Exercices enregistrés !');
    } else {
      alert('❌ Erreur : ' + result.error);
    }
  };

  const handleAddBlock = (type) => {
    const newBlockId = addBlock(type);
    setActiveTab('exercices');
    setEditingBlockId(newBlockId);
    
    // Scroller vers le nouveau bloc après un court délai
    setTimeout(() => {
      const element = document.getElementById(`block-${newBlockId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    
    const block = blocks[draggedIndex];
    if (draggedIndex < index) {
      moveBlock(block.id, 'down');
    } else {
      moveBlock(block.id, 'up');
    }
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderBlockEditor = (block, index) => {
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
        return null;
    }

    const isEditing = editingBlockId === block.id;
    
    return (
      <div
        id={`block-${block.id}`}
        key={block.id}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        onClick={() => setEditingBlockId(block.id)}
        style={{
          background: 'white',
          borderRadius: '8px',
          border: isEditing ? '2px solid #3b82f6' : '1px solid #e2e8f0',
          marginBottom: '11px',
          overflow: 'hidden',
          opacity: draggedIndex === index ? 0.5 : 1,
          transition: 'all 0.3s ease',
          boxShadow: isEditing ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
          transform: isEditing ? 'scale(1.01)' : 'scale(1)',
          cursor: 'pointer'
        }}
      >
        {/* Header bloc */}
        <div style={{
          padding: '8px 11px',
          background: '#fafbfc',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '7px'
        }}>
          <GripVertical 
            size={13} 
            color="#cbd5e1" 
            style={{ cursor: 'grab', flexShrink: 0 }} 
          />
          
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: blockInfo.color,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: '700',
            flexShrink: 0
          }}>
            {index + 1}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '9px',
              fontWeight: '600',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {blockInfo.icon && <blockInfo.icon size={10} color={blockInfo.color} />}
              <span>{blockInfo.label}</span>
            </div>
          </div>

          <div style={{
            padding: '3px 6px',
            background: '#fef3c7',
            borderRadius: '3px',
            fontSize: '8px',
            fontWeight: '600',
            color: '#92400e'
          }}>
            {block.points} pts
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '1px',
            background: 'white',
            padding: '1px',
            borderRadius: '3px'
          }}>
            <button
              onClick={() => moveBlock(block.id, 'up')}
              disabled={index === 0}
              style={{
                padding: '3px',
                background: 'transparent',
                border: 'none',
                borderRadius: '2px',
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
              <ChevronUp size={10} color="#64748b" />
            </button>

            <button
              onClick={() => moveBlock(block.id, 'down')}
              disabled={index === blocks.length - 1}
              style={{
                padding: '3px',
                background: 'transparent',
                border: 'none',
                borderRadius: '2px',
                cursor: index === blocks.length - 1 ? 'not-allowed' : 'pointer',
                opacity: index === blocks.length - 1 ? 0.3 : 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (index !== blocks.length - 1) e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ChevronDown size={10} color="#64748b" />
            </button>

            <div style={{
              width: '1px',
              height: '13px',
              background: '#e2e8f0',
              margin: '0 1px'
            }} />

            <button
              onClick={() => {
                if (window.confirm('Supprimer cet exercice ?')) {
                  deleteBlock(block.id);
                }
              }}
              style={{
                padding: '3px',
                background: 'transparent',
                border: 'none',
                borderRadius: '2px',
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
              <Trash2 size={10} color="#ef4444" />
            </button>
          </div>
        </div>

        {/* Éditeur */}
        <div style={{ padding: '14px' }}>
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
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '28px',
            height: '28px',
            border: '2px solid #e2e8f0',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            margin: '0 auto 11px',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
            Chargement...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* HEADER FIXE */}
      <div style={{
        flexShrink: 0,
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          padding: '8px 17px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Gauche */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <button
              onClick={() => navigate(`/admin/programs/${programId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 8px',
                background: 'transparent',
                border: 'none',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: '600',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={11} />
              Retour
            </button>

            <div style={{ height: '14px', width: '1px', background: '#e2e8f0' }} />

            <h1 style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              Éditeur d'exercices
            </h1>
          </div>

          {/* Droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              display: 'flex',
              background: '#f8fafc',
              borderRadius: '4px',
              padding: '1px'
            }}>
              <button
                onClick={undo}
                disabled={!canUndo}
                style={{
                  padding: '4px 7px',
                  background: canUndo ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: canUndo ? 'pointer' : 'not-allowed',
                  opacity: canUndo ? 1 : 0.4
                }}
              >
                <Undo2 size={11} color="#64748b" />
              </button>

              <button
                onClick={redo}
                disabled={!canRedo}
                style={{
                  padding: '4px 7px',
                  background: canRedo ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: canRedo ? 'pointer' : 'not-allowed',
                  opacity: canRedo ? 1 : 0.4
                }}
              >
                <Redo2 size={11} color="#64748b" />
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 11px',
                background: saving ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: '600',
                color: 'white',
                cursor: saving ? 'wait' : 'pointer'
              }}
            >
              <Save size={11} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* LAYOUT 2 COLONNES */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* COLONNE GAUCHE - 263px fixe avec scroll indépendant */}
        <div style={{
          width: '263px',
          flexShrink: 0,
          background: 'white',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Onglets */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            gap: 6,
            background: '#f1f5f9',
            padding: 3,
            borderRadius: 8
          }}>
            <button
              onClick={() => setActiveTab('exercices')}
              style={{
                flex: 1,
                padding: '7px 11px',
                background: activeTab === 'exercices' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                  : 'transparent',
                color: activeTab === 'exercices' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: 6,
                fontSize: '9px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                boxShadow: activeTab === 'exercices' 
                  ? '0 3px 8px rgba(59, 130, 246, 0.25)' 
                  : 'none'
              }}
            >
              <FileText size={11} />
              <span>Exercices ({blocks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('blocs')}
              style={{
                flex: 1,
                padding: '7px 11px',
                background: activeTab === 'blocs' 
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                  : 'transparent',
                color: activeTab === 'blocs' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: 6,
                fontSize: '9px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                boxShadow: activeTab === 'blocs' 
                  ? '0 3px 8px rgba(139, 92, 246, 0.25)' 
                  : 'none'
              }}
            >
              <Package size={11} />
              <span>Blocs</span>
            </button>
          </div>

          {/* Contenu onglets - SCROLL INDÉPENDANT */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {activeTab === 'exercices' ? (
              <div style={{ padding: '11px' }}>
                {blocks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 14px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px',
                      margin: '0 auto 8px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.5
                    }}>
                      <Target size={20} color="#64748b" />
                    </div>
                    <p style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '11px' }}>
                      Aucun exercice
                    </p>
                    <button
                      onClick={() => setActiveTab('blocs')}
                      style={{
                        padding: '6px 11px',
                        background: '#3b82f6',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '8px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      Ajouter un bloc
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '8px', color: '#94a3b8', marginBottom: '8px' }}>
                    Glisse pour réorganiser
                  </div>
                )}

                {blocks.map((block, index) => {
                  const blockInfo = BLOCK_LABELS[block.type];
                  const IconComponent = blockInfo.icon;
                  return (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      style={{
                        padding: '7px',
                        marginBottom: '6px',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        cursor: 'grab',
                        opacity: draggedIndex === index ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <GripVertical size={10} color="#cbd5e1" />
                      <div style={{
                        width: '17px',
                        height: '17px',
                        borderRadius: '3px',
                        background: blockInfo.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: '700',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '8px',
                          fontWeight: '600',
                          color: '#1e293b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {IconComponent && <IconComponent size={10} color={blockInfo.color} />}
                          <span>{blockInfo.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '11px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '7px'
                }}>
                  {BLOCK_TYPES.map((blockType) => {
                    const IconComponent = blockType.icon;
                    return (
                      <button
                        key={blockType.type}
                        onClick={() => handleAddBlock(blockType.type)}
                        style={{
                          padding: '11px 8px',
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = blockType.color;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: blockType.color,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {IconComponent && <IconComponent size={18} color="white" />}
                        </div>
                        <div style={{
                          fontSize: '8px',
                          fontWeight: '600',
                          color: '#1e293b'
                        }}>
                          {blockType.label}
                        </div>
                        <div style={{
                          fontSize: '7px',
                          color: '#94a3b8',
                          lineHeight: '1.3'
                        }}>
                          {blockType.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE - SCROLL INDÉPENDANT */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '17px'
        }}>
          <div style={{ maxWidth: '630px', margin: '0 auto' }}>
            {/* Titre du chapitre */}
            {chapterTitle && (
              <div style={{
                marginBottom: '17px',
                padding: '11px 14px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <BookOpen size={14} color="#64748b" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '8px',
                    fontWeight: '600',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.35px',
                    marginBottom: '3px'
                  }}>
                    Chapitre
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#1e293b',
                    lineHeight: '1.3'
                  }}>
                    {chapterTitle}
                  </div>
                </div>
              </div>
            )}

            {blocks.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '42px 28px',
                textAlign: 'center',
                border: '2px dashed #e2e8f0'
              }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px',
                  margin: '0 auto 11px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5
                }}>
                  <Target size={30} color="#64748b" />
                </div>
                <h3 style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '6px'
                }}>
                  Aucun exercice
                </h3>
                <p style={{
                  fontSize: '10px',
                  color: '#64748b',
                  marginBottom: '17px'
                }}>
                  Clique sur "Blocs" pour ajouter des exercices
                </p>
              </div>
            ) : (
              blocks.map((block, index) => renderBlockEditor(block, index))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
