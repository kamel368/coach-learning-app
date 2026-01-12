import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect } from 'react';

function SortableBlockItem({ block, selectedBlockId, onSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  useEffect(() => {
    console.log('🟢 SortableBlockItem mounted for block:', block.id);
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: '8px',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

  const isSelected = selectedBlockId === block.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          console.log('🖱️ Click on block:', block.id);
          onSelect(block.id);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          borderRadius: '6px',
          border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
          cursor: 'grab',
          fontSize: '12px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <i
          className="bi bi-grip-vertical"
          style={{ fontSize: '16px', color: '#9ca3af' }}
        ></i>

        <span
          style={{
            fontWeight: '600',
            color: '#374151',
            marginRight: '4px',
          }}
        >
          {labelForBlockType(block.type)}
        </span>

        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#6b7280',
          }}
        >
          {previewForBlock(block)}
        </span>
      </div>
    </div>
  );
}

export default function LessonOutlineTab({ blocks, selectedBlockId, onSelect }) {
  // ✅ sécurité pour éviter l'erreur "reading 'length'"
  if (!blocks) {
    return null; // ou un petit loader si tu préfères
  }

  useEffect(() => {
    console.log('🟢 LessonOutlineTab mounted with blocks:', blocks.length);
  }, [blocks]);

  if (!blocks || blocks.length === 0) {
    return (
      <p
        style={{
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center',
          marginTop: '16px',
        }}
      >
        Aucun bloc pour l&apos;instant. Ajoutez un bloc depuis l&apos;onglet
        &quot;Blocs&quot;.
      </p>
    );
  }

  return (
    <div>
      {blocks.map((block) => (
        <SortableBlockItem
          key={block.id}
          block={block}
          selectedBlockId={selectedBlockId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function labelForBlockType(type) {
  const iconStyle = { fontSize: '14px', marginRight: '6px', color: '#6b7280' };

  switch (type) {
    case 'text':
      return (
        <>
          <i className="bi bi-file-text" style={iconStyle}></i>
          Texte
        </>
      );
    case 'info':
      return (
        <>
          <i className="bi bi-info-circle" style={iconStyle}></i>
          Bloc d&apos;info
        </>
      );
    case 'image':
      return (
        <>
          <i className="bi bi-image" style={iconStyle}></i>
          Image
        </>
      );
    case 'toggle':
      return (
        <>
          <i className="bi bi-chevron-down" style={iconStyle}></i>
          Cacher/Afficher
        </>
      );
    case 'timeline':
      return (
        <>
          <i className="bi bi-clock-history" style={iconStyle}></i>
          Timeline
        </>
      );
    case 'separator':
      return (
        <>
          <i className="bi bi-dash-lg" style={iconStyle}></i>
          Séparateur
        </>
      );
    case 'video':
      return (
        <>
          <i className="bi bi-play-btn" style={iconStyle}></i>
          Vidéo
        </>
      );
    case 'lessonLink':
      return (
        <>
          <i className="bi bi-link-45deg" style={iconStyle}></i>
          Lien leçon
        </>
      );
    default:
      return type;
  }
}

function previewForBlock(block) {
  if (!block || !block.data) return '';

  if (block.type === 'text') return 'Bloc texte';
  if (block.type === 'info') return block.data.title || "Bloc d'info";
  if (block.type === 'video') return block.data.title || block.data.url || 'Vidéo';
  if (block.type === 'image') return block.data.alt || block.data.url || 'Image';
  if (block.type === 'lessonLink') return block.data.lessonTitle || 'Lien vers leçon';
  if (block.type === 'toggle') return block.data.title || 'Détail';

  return '';
}
