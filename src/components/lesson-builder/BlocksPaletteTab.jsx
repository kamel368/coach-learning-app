import { 
  Type, 
  Image, 
  Video, 
  Info, 
  ChevronDown, 
  Clock, 
  Minus, 
  Link 
} from 'lucide-react';

const BLOCKDEFS = [
  { type: 'text', label: 'Texte', icon: Type },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'video', label: 'Vidéo', icon: Video },
  { type: 'info', label: "Bloc d'info", icon: Info },
  { type: 'toggle', label: 'Cacher/Afficher', icon: ChevronDown },
  { type: 'timeline', label: 'Timeline', icon: Clock },
  { type: 'separator', label: 'Séparateur', icon: Minus },
  { type: 'lessonLink', label: 'Lien leçon', icon: Link },
];

export default function BlocksPaletteTab({ onAddBlock }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', marginBottom: '12px' }}>
        Cliquez sur un bloc pour l'ajouter à cette leçon.
      </p>
      
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
        }}
      >
        {BLOCKDEFS.map((b) => {
          const IconComponent = b.icon;
          return (
            <button
              key={b.type}
              type="button"
              onClick={() => onAddBlock(b.type)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '14px 8px',
                height: '75px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                fontSize: '11px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
                lineHeight: '1.3',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <IconComponent 
                className="w-6 h-6" 
                style={{ color: '#6b7280' }}
              />
              <span style={{ fontSize: '11px', maxWidth: '100%' }}>
                {b.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
