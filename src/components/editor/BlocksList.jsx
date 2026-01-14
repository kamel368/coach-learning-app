import { GripVertical } from 'lucide-react';

export default function BlocksList({ blocks, onBlockClick }) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-center text-muted mt-3" style={{ fontSize: '12px' }}>
        <p>Aucun bloc ajouté.</p>
        <p>Allez dans l'onglet "Blocs" pour en ajouter.</p>
      </div>
    );
  }

  return (
    <div>
      <h6 className="mb-2 text-center" style={{ fontSize: '12px', fontWeight: '600' }}>
        Blocs de la leçon
      </h6>
      <ul className="list-group list-group-flush">
        {blocks.map((block, index) => (
          <li
            key={index}
            className="list-group-item list-group-item-action text-center"
            style={{ cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => onBlockClick(index)}
          >
            <GripVertical className="w-4 h-4" />
            <span>{block.type} #{index + 1}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
