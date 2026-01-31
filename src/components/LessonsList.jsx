import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Pencil, Copy, Trash2 } from 'lucide-react';

export default function LessonsList({ 
  chapterId, 
  lessons, 
  programId,
  onReorder, 
  onEdit, 
  onDuplicate, 
  onDelete 
}) {
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    onReorder(result, chapterId);
  };

  return (
    <div style={{
      marginTop: 24,
      paddingTop: 16,
      borderTop: '1px solid #e5e7eb'
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 600,
        color: '#6b7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        📖 LEÇONS ({lessons.length})
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={chapterId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minHeight: 50,
                background: snapshot.isDraggingOver ? '#f0f9ff' : 'transparent',
                padding: snapshot.isDraggingOver ? 8 : 0,
                borderRadius: 8,
                transition: 'all 0.2s ease'
              }}
            >
              {lessons
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((lesson, index) => (
                  <Draggable
                    key={lesson.id}
                    draggableId={lesson.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                          padding: '12px 16px',
                          background: snapshot.isDragging ? '#dbeafe' : 'white',
                          border: `2px solid ${snapshot.isDragging ? '#3b82f6' : '#e5e7eb'}`,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          transition: snapshot.isDragging ? 'none' : 'all 0.2s ease',
                          boxShadow: snapshot.isDragging ? '0 8px 16px rgba(59, 130, 246, 0.3)' : 'none',
                          transform: snapshot.isDragging 
                            ? provided.draggableProps.style?.transform 
                            : 'none',
                          cursor: 'default'
                        }}
                      >
                        {/* DRAG HANDLE - IMPORTANT : doit être séparé */}
                        <div
                          {...provided.dragHandleProps}
                          style={{
                            cursor: 'grab',
                            color: '#9ca3af',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                            margin: '-4px 0',
                            borderRadius: 4,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#9ca3af';
                          }}
                        >
                          ⋮⋮
                        </div>
                        
                        {/* Icône leçon */}
                        <div style={{
                          width: 32,
                          height: 32,
                          background: snapshot.isDragging ? '#3b82f6' : '#eff6ff',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}>
                          {snapshot.isDragging ? '📘' : '📖'}
                        </div>
                        
                        {/* Titre */}
                        <div style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: 600,
                          color: snapshot.isDragging ? '#1e40af' : '#1f2937',
                          transition: 'color 0.2s ease'
                        }}>
                          {lesson.title}
                        </div>
                        
                        {/* Boutons d'action */}
                        <div style={{
                          display: 'flex',
                          gap: 4,
                          opacity: snapshot.isDragging ? 0.5 : 1,
                          transition: 'opacity 0.2s ease'
                        }}>
                          <button
                            onClick={() => onEdit(lesson.id)}
                            disabled={snapshot.isDragging}
                            style={{
                              width: 32,
                              height: 32,
                              padding: 0,
                              background: 'transparent',
                              border: 'none',
                              cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => !snapshot.isDragging && (e.currentTarget.style.background = '#f3f4f6')}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Éditer"
                          >
                            <Pencil size={16} color="#6b7280" />
                          </button>
                          
                          <button
                            onClick={() => onDuplicate(lesson, chapterId)}
                            disabled={snapshot.isDragging}
                            style={{
                              width: 32,
                              height: 32,
                              padding: 0,
                              background: 'transparent',
                              border: 'none',
                              cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => !snapshot.isDragging && (e.currentTarget.style.background = '#f3f4f6')}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Dupliquer"
                          >
                            <Copy size={16} color="#6b7280" />
                          </button>
                          
                          <button
                            onClick={() => onDelete(lesson.id)}
                            disabled={snapshot.isDragging}
                            style={{
                              width: 32,
                              height: 32,
                              padding: 0,
                              background: 'transparent',
                              border: 'none',
                              cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => !snapshot.isDragging && (e.currentTarget.style.background = '#fef2f2')}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Supprimer"
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
