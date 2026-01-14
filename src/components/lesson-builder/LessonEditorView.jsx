import { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Trash2 } from 'lucide-react';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image', 'code-block', 'blockquote'],
    [{ align: [] }, { color: [] }, { background: [] }],
    ['clean'],
  ],
};

export default function LessonEditorView({ 
  lesson, 
  setLesson, 
  selectedBlockId, 
  onSelectBlock, 
  pushHistory,
  hasUnsavedBlock,
  setHasUnsavedBlock,
}) {
  const [validationError, setValidationError] = useState('');
  const [originalBlockData, setOriginalBlockData] = useState(null);

  const handleBlockChange = (blockId, updater) => {
    const next = {
      ...lesson,
      blocks: lesson.blocks.map((b) => (b.id === blockId ? updater(b) : b)),
    };
    setLesson(next);
    setHasUnsavedBlock(true);
  };

  // Validation selon le type de bloc
  const validateBlock = (block) => {
    switch (block.type) {
      case 'text':
        if (!block.data.html || block.data.html.trim() === '' || block.data.html === '<p><br></p>') {
          return 'Le contenu du texte est obligatoire.';
        }
        break;
      case 'image':
        if (!block.data.url || block.data.url.trim() === '') {
          return "L'URL de l'image est obligatoire.";
        }
        break;
      case 'video':
        if (!block.data.url || block.data.url.trim() === '') {
          return "L'URL de la vidéo est obligatoire.";
        }
        break;
      case 'info':
        if (!block.data.title || block.data.title.trim() === '') {
          return "Le titre du bloc d'information est obligatoire.";
        }
        break;
      case 'toggle':
        if (!block.data.title || block.data.title.trim() === '') {
          return 'Le titre est obligatoire.';
        }
        if (!block.data.body || block.data.body.trim() === '') {
          return 'Le contenu est obligatoire.';
        }
        break;
      case 'timeline':
        if (!block.data.items || block.data.items.length === 0) {
          return 'Au moins une étape est obligatoire.';
        }
        break;
      case 'lessonLink':
        if (!block.data.lessonId || block.data.lessonId.trim() === '') {
          return "L'ID de la leçon est obligatoire.";
        }
        if (!block.data.lessonTitle || block.data.lessonTitle.trim() === '') {
          return 'Le titre de la leçon est obligatoire.';
        }
        break;
      case 'separator':
        // Aucune validation
        break;
    }
    return null;
  };

  // Bouton "Ajouter" ou "Modifier"
  const handleSaveBlock = (blockId) => {
    const block = lesson.blocks.find((b) => b.id === blockId);
    if (!block) return;

    const error = validateBlock(block);
    if (error) {
      setValidationError(error);
      return;
    }

    // Marquer le bloc comme sauvegardé
    const next = {
      ...lesson,
      blocks: lesson.blocks.map((b) =>
        b.id === blockId ? { ...b, isSaved: true } : b
      ),
    };
    pushHistory(next);
    setHasUnsavedBlock(false);
    setValidationError('');
    setOriginalBlockData(null);
    onSelectBlock(null);
  };

  // Bouton "Annuler"
  const handleCancelBlock = (blockId) => {
    const block = lesson.blocks.find((b) => b.id === blockId);
    if (!block) return;

    if (!block.isSaved) {
      // Bloc nouveau → Supprimer
      const next = {
        ...lesson,
        blocks: lesson.blocks.filter((b) => b.id !== blockId),
      };
      pushHistory(next);
    } else if (originalBlockData) {
      // Bloc existant → Revenir à l'état précédent
      const next = {
        ...lesson,
        blocks: lesson.blocks.map((b) =>
          b.id === blockId ? originalBlockData : b
        ),
      };
      setLesson(next);
    }

    setHasUnsavedBlock(false);
    setValidationError('');
    setOriginalBlockData(null);
    onSelectBlock(null);
  };

  // Sauvegarder l'état original quand on sélectionne un bloc
  const handleSelectBlock = (blockId) => {
    const block = lesson.blocks.find((b) => b.id === blockId);
    if (block && block.isSaved) {
      setOriginalBlockData({ ...block });
    }
    onSelectBlock(blockId);
    setValidationError('');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 0' }}>
      {/* Header Notion-like */}
      <div style={{ marginBottom: '24px' }}>
        <input
          style={{
            width: '100%',
            fontSize: '28px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            marginBottom: '8px',
          }}
          value={lesson.title}
          onChange={(e) => setLesson((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Titre de la leçon"
        />
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          {lesson.blocks.length} blocs • statut : {lesson.status}
        </p>
      </div>
      {/* Liste de blocs */}
      {lesson.blocks.map((block) => {
        const isSelected = block.id === selectedBlockId;

        return (
          <div
            key={block.id}
            style={{
              borderRadius: '12px',
              border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              backgroundColor: isSelected ? '#ffffff' : '#f9fafb',
              padding: '16px',
              marginBottom: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => !isSelected && handleSelectBlock(block.id)}
          >
            <div
              style={{
                padding: '8px 0 12px 0',
                fontSize: '11px',
                textTransform: 'uppercase',
                color: '#9ca3af',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{labelForBlockType(block.type)}</span>
              
              {/* Icône corbeille en mode édition */}
              {isSelected && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Supprimer ce bloc ?')) {
                      const next = {
                        ...lesson,
                        blocks: lesson.blocks.filter((b) => b.id !== block.id),
                      };
                      pushHistory(next);
                      setHasUnsavedBlock(false);
                      setValidationError('');
                      onSelectBlock(null);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Supprimer ce bloc"
                >
                  <Trash2 
                    className="w-5 h-5"
                    style={{ 
                      color: '#3b82f6',
                    }}
                  />
                </button>
              )}
            </div>

            <div style={{ padding: '0 0 12px 0' }}>
              {isSelected ? renderBlockEditor(block, handleBlockChange) : renderBlockPreview(block)}
            </div>

            {/* Boutons Annuler / Ajouter-Modifier */}
            {isSelected && (
              <div>
                {validationError && (
                  <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '8px' }}>
                    {validationError}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelBlock(block.id);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '999px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#f9fafb',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveBlock(block.id);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '999px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {block.isSaved ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {lesson.blocks.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            border: '2px dashed #e5e7eb',
            borderRadius: '12px',
            color: '#9ca3af',
            fontSize: '14px',
          }}
        >
          Ajoutez des blocs depuis l'onglet "Blocs" à gauche pour commencer.
        </div>
      )}
    </div>
  );
}
// ÉDITION du bloc sélectionné
function renderBlockEditor(block, handleBlockChange) {
  switch (block.type) {
    case 'text':
      return (
        <ReactQuill
          theme="snow"
          modules={quillModules}
          value={block.data.html}
          onChange={(value) =>
            handleBlockChange(block.id, (b) => ({
              ...b,
              data: { ...b.data, html: value },
            }))
          }
          placeholder="Écris ton contenu ici..."
        />
      );

    case 'info':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
            value={block.data.title}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, title: e.target.value },
              }))
            }
            placeholder="Titre du bloc d'information"
          />
          <textarea
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
              minHeight: '80px',
            }}
            value={block.data.body}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, body: e.target.value },
              }))
            }
            placeholder="Texte du bloc"
          />
          <select
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '14px',
            }}
            value={block.data.variant}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, variant: e.target.value },
              }))
            }
          >
            <option value="info">Info (bleu)</option>
            <option value="warning">Attention (rouge)</option>
            <option value="success">Succès (vert)</option>
          </select>
        </div>
      );

    case 'image':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
            value={block.data.url}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, url: e.target.value },
              }))
            }
            placeholder="URL de l'image"
          />
          <input
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
            value={block.data.alt}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, alt: e.target.value },
              }))
            }
            placeholder="Texte alternatif"
          />
          <input
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
            value={block.data.caption}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, caption: e.target.value },
              }))
            }
            placeholder="Légende (optionnelle)"
          />
        </div>
      );

    case 'toggle':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
            value={block.data.title}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, title: e.target.value },
              }))
            }
            placeholder="Titre de la section"
          />
          <textarea
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
              minHeight: '80px',
            }}
            value={block.data.body}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, body: e.target.value },
              }))
            }
            placeholder="Contenu détaillé"
          />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={block.data.defaultOpen}
              onChange={(e) =>
                handleBlockChange(block.id, (b) => ({
                  ...b,
                  data: { ...b.data, defaultOpen: e.target.checked },
                }))
              }
            />
            Ouvert par défaut
          </label>
        </div>
      );

    case 'timeline':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {block.data.items.map((item, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <input
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '14px',
                }}
                value={item.label}
                onChange={(e) => {
                  const nextItems = [...block.data.items];
                  nextItems[idx] = { ...nextItems[idx], label: e.target.value };
                  handleBlockChange(block.id, (b) => ({
                    ...b,
                    data: { ...b.data, items: nextItems },
                  }));
                }}
                placeholder="Titre de l'étape"
              />
              <textarea
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '14px',
                  minHeight: '60px',
                }}
                value={item.description}
                onChange={(e) => {
                  const nextItems = [...block.data.items];
                  nextItems[idx] = { ...nextItems[idx], description: e.target.value };
                  handleBlockChange(block.id, (b) => ({
                    ...b,
                    data: { ...b.data, items: nextItems },
                  }));
                }}
                placeholder="Description"
              />
              <button
                type="button"
                onClick={() => {
                  const nextItems = block.data.items.filter((_, i) => i !== idx);
                  handleBlockChange(block.id, (b) => ({
                    ...b,
                    data: { ...b.data, items: nextItems },
                  }));
                }}
                style={{
                  alignSelf: 'flex-start',
                  fontSize: '12px',
                  color: '#dc2626',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Supprimer cette étape
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const nextItems = [...block.data.items, { label: 'Nouvelle étape', description: '' }];
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, items: nextItems },
              }));
            }}
            style={{
              fontSize: '13px',
              color: '#3b82f6',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            + Ajouter une étape
          </button>
        </div>
      );

    case 'video':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
            value={block.data.url}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, url: e.target.value },
              }))
            }
            placeholder="URL YouTube / Vimeo"
          />
          <input
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
            value={block.data.title}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, title: e.target.value },
              }))
            }
            placeholder="Titre (optionnel)"
          />
          <textarea
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
              minHeight: '60px',
            }}
            value={block.data.description}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, description: e.target.value },
              }))
            }
            placeholder="Description (optionnelle)"
          />
        </div>
      );

    case 'lessonLink':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
            value={block.data.lessonId}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, lessonId: e.target.value },
              }))
            }
            placeholder="ID de la leçon liée"
          />
          <input
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
            value={block.data.lessonTitle}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, lessonTitle: e.target.value },
              }))
            }
            placeholder="Titre affiché"
          />
          <input
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '14px',
            }}
            value={block.data.moduleTitle}
            onChange={(e) =>
              handleBlockChange(block.id, (b) => ({
                ...b,
                data: { ...b.data, moduleTitle: e.target.value },
              }))
            }
            placeholder="Nom du module"
          />
        </div>
      );

    case 'separator':
      return <p style={{ fontSize: '13px', color: '#9ca3af' }}>Séparateur (aucun paramètre).</p>;

    default:
      return null;
  }
}

// APERÇU des blocs non sélectionnés
function renderBlockPreview(block) {
  switch (block.type) {
    case 'text':
      return (
        <div
          style={{
            fontSize: '14px',
            color: '#374151',
            maxHeight: '100px',
            overflow: 'hidden',
          }}
          dangerouslySetInnerHTML={{ __html: block.data.html || '<p>Texte...</p>' }}
        />
      );

    case 'info':
      return (
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            border:
              block.data.variant === 'warning'
                ? '1px solid #fca5a5'
                : block.data.variant === 'success'
                ? '1px solid #86efac'
                : '1px solid #93c5fd',
            backgroundColor:
              block.data.variant === 'warning'
                ? '#fee2e2'
                : block.data.variant === 'success'
                ? '#dcfce7'
                : '#dbeafe',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{block.data.title}</div>
          <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
            {block.data.body}
          </div>
        </div>
      );

    case 'image':
      return (
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          {block.data.url ? `Image: ${block.data.url}` : 'Aucune image définie'}
        </div>
      );

     case 'toggle':
      return (
        <div style={{ fontSize: '14px', color: '#4b5563' }}>
          Section "{block.data.title}" ({block.data.defaultOpen ? 'ouverte' : 'fermée'} par défaut)
        </div>
      );

    case 'timeline':
      return (
        <div style={{ fontSize: '14px', color: '#4b5563' }}>
          {block.data.items.length} étape(s) dans le fil chronologique.
        </div>
      );

    case 'video':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#4b5563' }}>
          {block.data.url ? `Vidéo: ${block.data.title || block.data.url}` : 'Aucune vidéo définie'}
        </div>
      );

    case 'lessonLink':
      return (
        <div style={{ fontSize: '14px', color: '#3b82f6' }}>
          Lien vers "{block.data.lessonTitle || 'Leçon non définie'}"
        </div>
      );

    case 'separator':
      return <hr style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />;

    default:
      return null;
  }
}

// Label du type de bloc
function labelForBlockType(type) {
  switch (type) {
    case 'text':
      return 'Texte';
    case 'info':
      return "Bloc d'information";
    case 'image':
      return 'Image';
    case 'toggle':
      return 'Cacher / afficher';
    case 'timeline':
      return 'Fil chronologique';
    case 'separator':
      return 'Séparateur';
    case 'video':
      return 'Vidéo';
    case 'lessonLink':
      return 'Lien vers une leçon';
    default:
      return type;
  }
}
