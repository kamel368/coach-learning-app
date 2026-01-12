export default function BlocksSidebar({ onAddBlock }) {
  const blockTypes = [
    { type: 'text', label: 'Texte', icon: 'bi-file-text' },
    { type: 'image', label: 'Image', icon: 'bi-image' },
    { type: 'video', label: 'Vidéo', icon: 'bi-play-circle' },
    { type: 'quiz', label: 'Quiz', icon: 'bi-question-circle' },
    { type: 'code', label: 'Code', icon: 'bi-code-slash' },
    { type: 'file', label: 'Fichier', icon: 'bi-file-earmark' },
  ];

  return (
    <div>
      <p className="text-center text-muted mb-3" style={{ fontSize: '13px' }}>
        Cliquez sur un bloc pour l'ajouter à cette leçon.
      </p>
      <div className="d-grid gap-2">
        {blockTypes.map(block => (
          <button
            key={block.type}
            onClick={() => onAddBlock(block.type)}
            className="btn btn-outline-secondary btn-sm text-center"
            style={{ 
              fontSize: '12px', 
              backgroundColor: '#ffffff',
              border: '1px solid #dee2e6'
            }}
          >
            <i className={`bi ${block.icon} me-2`}></i>
            {block.label}
          </button>
        ))}
      </div>
    </div>
  );
}
