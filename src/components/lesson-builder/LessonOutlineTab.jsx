import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect } from 'react';
import { 
  GripVertical, 
  Type, 
  Info, 
  Image, 
  ChevronDown, 
  Clock, 
  Minus, 
  Video, 
  Link 
} from 'lucide-react';

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
        <GripVertical className="w-4 h-4" style={{ color: '#9ca3af' }} />

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
  const iconStyle = { marginRight: '6px', color: '#6b7280' };
  const iconClass = "w-4 h-4";

  switch (type) {
    case 'text':
      return (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <Type className={iconClass} style={iconStyle} />
          Texte
        </span>
      );
    case 'info':
      return (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <Info className={iconClass} style={iconStyle} />
          Bloc d&apos;info
        </span>
      );
    case 'image':
      return (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <Image className={iconClass} style={iconStyle} />
          Image
        </span>
      );
    case 'toggle':
      return (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <ChevronDown className={iconClass} style={iconStyle} />
          Cacher/Afficher
        </span>
      );
    case 'timeline':
      return (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <Clock className={iconClass} style={iconStyle} />
          Timeline
        </span>
      );
    case 'separator':
      return (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <Minus className={iconClass} style={iconStyle} />
          Séparateur
        </span>
      );
    case 'video':
      return (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <Video className={iconClass} style={iconStyle} />
          Vidéo
        </span>
      );
    case 'lessonLink':
      return (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <Link className={iconClass} style={iconStyle} />
          Lien leçon
        </span>
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
