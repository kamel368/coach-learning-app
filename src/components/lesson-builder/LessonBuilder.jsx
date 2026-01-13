import { useEffect, useState, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuid } from 'uuid';
import { getLesson, saveLesson } from '../../services/lessonsService';
import LessonOutlineTab from './LessonOutlineTab';
import BlocksPaletteTab from './BlocksPaletteTab';
import LessonEditorView from './LessonEditorView';
import LessonPreview from './LessonPreview';

export default function LessonBuilder({ lessonId, moduleId, onReady }) {
  const [lesson, setLesson] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [activeTab, setActiveTab] = useState('lesson');
  const [viewMode, setViewMode] = useState('edit');
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [hasUnsavedBlock, setHasUnsavedBlock] = useState(false);

  // Configuration des sensors pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    async function load() {
      const existing = await getLesson(lessonId);
      if (existing) {
        setLesson(existing);
      } else {
        const empty = {
          id: lessonId,
          moduleId,
          title: 'Nouvelle leçon',
          status: 'draft',
          blocks: [],
        };
        setLesson(empty);
      }
    }
    load();
  }, [lessonId, moduleId]);

  // Exposer les méthodes et états au parent via onReady
  useEffect(() => {
    if (lesson && onReady) {
      onReady({
        lesson,
        setLesson,
        viewMode,
        setViewMode,
        handleSave,
        handleUndo,
        handleRedo,
        history,
        future,
      });
    }
  }, [lesson, viewMode, history, future]);

  const pushHistory = (nextLesson) => {
    setHistory((prev) => (lesson ? [...prev, lesson] : prev));
    setFuture([]);
    setLesson(nextLesson);
  };

  const handleAddBlock = useCallback(
    (type) => {
      if (!lesson) return;
      const newBlock = createBlock(type);
      const nextLesson = {
        ...lesson,
        blocks: [...lesson.blocks, newBlock],
      };
      pushHistory(nextLesson);
      setSelectedBlockId(newBlock.id);
      setActiveTab('lesson');
    },
    [lesson]
  );

  const handleReorder = (activeId, overId) => {
    if (!lesson || activeId === overId) return;
    
    const oldIndex = lesson.blocks.findIndex((b) => b.id === activeId);
    const newIndex = lesson.blocks.findIndex((b) => b.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newBlocks = arrayMove(lesson.blocks, oldIndex, newIndex);
    pushHistory({ ...lesson, blocks: newBlocks });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => (lesson ? [lesson, ...f] : f));
    setLesson(prev);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => (lesson ? [...h, lesson] : h));
    setLesson(next);
  };

  const handleSave = async () => {
    if (!lesson) return;
    
    // Bloquer si un bloc est en édition
    if (hasUnsavedBlock) {
      alert('❌ Vous avez des blocs non sauvegardés. Veuillez les finaliser avant de sauvegarder la leçon.');
      return;
    }
    
    await saveLesson(lesson);
    alert('Leçon sauvegardée !');
  };

  if (!lesson) return <div style={{ padding: '16px' }}>Chargement de la leçon...</div>;
  
  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#ffffff' }}>
      {/* Sidebar fixe 30% */}
      <div
        style={{
          width: '30%',
          minWidth: '320px',
          maxWidth: '400px',
          height: '100%',
          overflowY: 'auto',
          borderRight: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Onglets Leçon / Blocs */}
        <ul className="nav nav-underline px-3 pt-3">
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'lesson' ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('lesson');
              }}
              style={{ fontSize: '13px', cursor: 'pointer' }}
            >
              <i className="bi bi-file-text me-1"></i> Leçon
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'blocs' ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('blocs');
              }}
              style={{ fontSize: '13px', cursor: 'pointer' }}
            >
              <i className="bi bi-box me-1"></i> Blocs
            </a>
          </li>
        </ul>

        {/* Contenu des tabs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {activeTab === 'lesson' ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                Renseignez le titre de cette leçon
              </p>
              <input
                type="text"
                value={lesson.title}
                onChange={(e) => setLesson((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de la leçon"
                className="form-control form-control-sm mb-3"
                style={{ fontSize: '12px' }}
              />
              <select
                value={lesson.status}
                onChange={(e) => setLesson((prev) => ({ ...prev, status: e.target.value }))}
                className="form-select form-select-sm mb-3"
                style={{ fontSize: '12px' }}
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="disabled">Désactivé</option>
              </select>

              {/* DndContext avec sensors */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={({ active, over }) => {
                  if (over) handleReorder(active.id, over.id);
                }}
              >
                <SortableContext
                  items={lesson.blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <LessonOutlineTab
                    blocks={lesson.blocks}
                    selectedBlockId={selectedBlockId}
                    onSelect={setSelectedBlockId}
                  />
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <BlocksPaletteTab onAddBlock={handleAddBlock} />
          )}
        </div>
      </div>

      {/* Zone de contenu 70% */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Zone d'édition ou preview - SANS header en doublon */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f9fafb' }}>
          {viewMode === 'edit' ? (
            <LessonEditorView
              lesson={lesson}
              setLesson={setLesson}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              pushHistory={pushHistory}
              hasUnsavedBlock={hasUnsavedBlock}
              setHasUnsavedBlock={setHasUnsavedBlock}
            />
          ) : (
            <LessonPreview
              lesson={lesson}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status) {
  if (status === 'published') return '#22c55e';
  if (status === 'disabled') return '#ef4444';
  return '#facc15';
}

// Création de blocs avec valeurs par défaut
function createBlock(type) {
  const id = uuid();
  switch (type) {
    case 'text':
      return { id, type, data: { html: '' } };
    case 'info':
      return { id, type, data: { title: 'Information', body: '', variant: 'info' } };
    case 'image':
      return { id, type, data: { url: '', alt: '', caption: '' } };
    case 'toggle':
      return { id, type, data: { title: 'Détail', body: '', defaultOpen: false } };
    case 'timeline':
      return { id, type, data: { items: [] } };
    case 'separator':
      return { id, type, data: {} };
    case 'video':
      return { id, type, data: { url: '', title: '', description: '' } };
    case 'lessonLink':
      return { id, type, data: { lessonId: '', lessonTitle: '', moduleTitle: '' } };
    default:
      return { id, type: 'text', data: { html: '' } };
  }
}
