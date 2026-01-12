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
            <i className="bi bi-arrow-up"></i>
          </button>
        )}
        {!isLast && (
          <button className="btn btn-sm btn-outline-secondary" onClick={onMoveDown}>
            <i className="bi bi-arrow-down"></i>
          </button>
        )}
        <button className="btn btn-sm btn-outline-primary" onClick={onEdit}>
          <i className="bi bi-pencil"></i>
        </button>
        <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
          <i className="bi bi-trash"></i>
        </button>
      </div>
    </div>
  );
}
