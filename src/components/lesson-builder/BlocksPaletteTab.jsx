const BLOCKDEFS = [
  { type: 'text', label: 'Texte', icon: 'bi-file-text' },
  { type: 'image', label: 'Image', icon: 'bi-image' },
  { type: 'video', label: 'Vidéo', icon: 'bi-play-btn' },
  { type: 'info', label: "Bloc d'info", icon: 'bi-info-circle' },
  { type: 'toggle', label: 'Cacher/Afficher', icon: 'bi-chevron-down' },
  { type: 'timeline', label: 'Timeline', icon: 'bi-clock-history' },
  { type: 'separator', label: 'Séparateur', icon: 'bi-dash-lg' },
  { type: 'lessonLink', label: 'Lien leçon', icon: 'bi-link-45deg' },
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
        {BLOCKDEFS.map((b) => (
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
            <i
              className={`bi ${b.icon}`}
              style={{
                fontSize: '24px',
                color: '#6b7280',
              }}
            ></i>
            <span style={{ fontSize: '11px', maxWidth: '100%' }}>
              {b.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
