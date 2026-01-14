import { ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';

export default function BlockRenderer({ 
  block, 
  onEdit, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast 
}) {
  const renderContent = () => {
    switch (block.type) {
      case 'text':
        return <div dangerouslySetInnerHTML={{ __html: block.content }} />;
      case 'image':
        return <img src={block.url} alt={block.alt || ''} className="img-fluid" />;
      case 'video':
        return (
          <div className="ratio ratio-16x9">
            <iframe src={block.url} allowFullScreen></iframe>
          </div>
        );
      default:
        return <p>Bloc {block.type}</p>;
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        {renderContent()}
      </div>
      <div className="card-footer bg-light d-flex gap-2 justify-content-end">
        {!isFirst && (
          <button className="btn btn-sm btn-outline-secondary" onClick={onMoveUp}>
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
        {!isLast && (
          <button className="btn btn-sm btn-outline-secondary" onClick={onMoveDown}>
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
        <button className="btn btn-sm btn-outline-primary" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </button>
        <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
