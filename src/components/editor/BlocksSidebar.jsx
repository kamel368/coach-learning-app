import { Type, Image, Video, HelpCircle, Code, FileText } from 'lucide-react';

export default function BlocksSidebar({ onAddBlock }) {
  const blockTypes = [
    { type: 'text', label: 'Texte', icon: Type },
    { type: 'image', label: 'Image', icon: Image },
    { type: 'video', label: 'Vidéo', icon: Video },
    { type: 'quiz', label: 'Quiz', icon: HelpCircle },
    { type: 'code', label: 'Code', icon: Code },
    { type: 'file', label: 'Fichier', icon: FileText },
  ];

  return (
    <div>
      <p className="text-center text-muted mb-3" style={{ fontSize: '13px' }}>
        Cliquez sur un bloc pour l'ajouter à cette leçon.
      </p>
      <div className="d-grid gap-2">
        {blockTypes.map(block => {
          const IconComponent = block.icon;
          return (
            <button
              key={block.type}
              onClick={() => onAddBlock(block.type)}
              className="btn btn-outline-secondary btn-sm text-center"
              style={{ 
                fontSize: '12px', 
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <IconComponent className="w-4 h-4" />
              {block.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
