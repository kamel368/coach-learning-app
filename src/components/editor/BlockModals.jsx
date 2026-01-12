import { useState, useEffect } from 'react';

export default function BlockModal({ blockType, initialData, onSave, onCancel }) {
  const [data, setData] = useState(initialData || {});

  useEffect(() => {
    setData(initialData || {});
  }, [initialData]);

  const handleSave = () => {
    onSave({ type: blockType, ...data });
  };

  if (!blockType) return null;

  return (
    <div className="card mb-3">
      <div className="card-header">
        <strong>Édition : {blockType}</strong>
      </div>
      <div className="card-body">
        {blockType === 'text' && (
          <textarea
            className="form-control"
            rows="5"
            value={data.content || ''}
            onChange={(e) => setData({ ...data, content: e.target.value })}
            placeholder="Contenu texte..."
          />
        )}
        {blockType === 'image' && (
          <>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="URL de l'image"
              value={data.url || ''}
              onChange={(e) => setData({ ...data, url: e.target.value })}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Texte alternatif"
              value={data.alt || ''}
              onChange={(e) => setData({ ...data, alt: e.target.value })}
            />
          </>
        )}
        {blockType === 'video' && (
          <input
            type="text"
            className="form-control"
            placeholder="URL de la vidéo (YouTube, Vimeo...)"
            value={data.url || ''}
            onChange={(e) => setData({ ...data, url: e.target.value })}
          />
        )}
      </div>
      <div className="card-footer d-flex gap-2 justify-content-end">
        <button className="btn btn-sm btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button className="btn btn-sm btn-primary" onClick={handleSave}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}
