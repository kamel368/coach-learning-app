import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
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
import { FileText, Package } from 'lucide-react';
import { getLesson, createLesson, updateLesson } from '../../services/supabase/lessons';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import LessonOutlineTab from './LessonOutlineTab';
import BlocksPaletteTab from './BlocksPaletteTab';
import LessonEditorView from './LessonEditorView';
import LessonPreview from './LessonPreview';

export default function LessonBuilder({ lessonId, chapterId, programId, organizationId, onReady }) {
  // ============================================
  // 1. ÉTATS (useState)
  // ============================================
  const [lesson, setLesson] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [activeTab, setActiveTab] = useState('lesson');
  const [viewMode, setViewMode] = useState('edit');
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [hasUnsavedBlock, setHasUnsavedBlock] = useState(false);

  // ============================================
  // Hook Supabase
  // ============================================
  const { user: supabaseUser, organizationId: supabaseOrgId } = useSupabaseAuth();

  // ============================================
  // 2. SENSORS (drag & drop)
  // ============================================
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // ============================================
  // 3. useEffect - CHARGEMENT INITIAL
  // ============================================
  useEffect(() => {
    async function load() {
      console.log('🔍 LessonBuilder: Chargement de la leçon:', lessonId);
      
      // Récupérer la leçon depuis Supabase
      const { data: lessonData, error } = await getLesson(lessonId);
      
      if (error) {
        console.error('❌ Erreur chargement leçon:', error);
        // Créer une nouvelle leçon si elle n'existe pas
        const empty = {
          id: lessonId,
          chapter_id: chapterId,
          title: 'Nouvelle leçon',
          blocks: [],
        };
        setLesson(empty);
        return;
      }
      
      if (lessonData) {
        console.log('✅ Leçon existante trouvée:', lessonData.title);
        
        // Adapter la structure de données
        // Supabase: editor_data.blocks ou editor_data directement
        let blocks = [];
        
        if (lessonData.editor_data) {
          if (Array.isArray(lessonData.editor_data)) {
            // editor_data est directement un array de blocs
            blocks = lessonData.editor_data;
          } else if (lessonData.editor_data.blocks) {
            // editor_data contient { blocks: [...] }
            blocks = lessonData.editor_data.blocks;
          }
        }
        
        console.log('📦 Blocks chargés:', blocks.length);
        
        // Créer l'objet lesson avec la structure attendue par le builder
        setLesson({
          id: lessonData.id,
          chapter_id: lessonData.chapter_id,
          title: lessonData.title || 'Sans titre',
          blocks: blocks,
          order: lessonData.order,
          hidden: lessonData.hidden,
          duration_minutes: lessonData.duration_minutes,
          reading_time_minutes: lessonData.reading_time_minutes,
        });
      } else {
        console.log('📝 Création d\'une nouvelle leçon');
        const empty = {
          id: lessonId,
          chapter_id: chapterId,
          title: 'Nouvelle leçon',
          blocks: [],
        };
        setLesson(empty);
      }
    }
    load();
  }, [lessonId, chapterId]);

  // ============================================
  // 4. FONCTIONS MÉTIER (useCallback)
  // ============================================
  
  const pushHistory = useCallback((nextLesson) => {
    setHistory((prev) => (lesson ? [...prev, lesson] : prev));
    setFuture([]);
    setLesson(nextLesson);
  }, [lesson]);

  const handleAddBlock = useCallback(
    (type) => {
      if (!lesson) return;
      console.log('➕ Adding block of type:', type);
      console.log('📦 Current lesson:', lesson);
      console.log('📦 Current lesson.blocks:', lesson.blocks);
      
      const newBlock = createBlock(type);
      console.log('✨ New block created:', newBlock);
      
      const nextLesson = {
        ...lesson,
        blocks: [...(lesson.blocks || []), newBlock], // ✅ GUARD pour blocks
      };
      console.log('📝 Next lesson:', nextLesson);
      
      pushHistory(nextLesson);
      setSelectedBlockId(newBlock.id);
      setActiveTab('lesson');
    },
    [lesson, pushHistory]
  );

  const handleReorder = useCallback((activeId, overId) => {
    if (!lesson || activeId === overId) return;
    if (!lesson.blocks || lesson.blocks.length === 0) return; // ✅ GUARD pour blocks
    
    const oldIndex = lesson.blocks.findIndex((b) => b.id === activeId);
    const newIndex = lesson.blocks.findIndex((b) => b.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newBlocks = arrayMove(lesson.blocks, oldIndex, newIndex);
    pushHistory({ ...lesson, blocks: newBlocks });
  }, [lesson, pushHistory]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => (lesson ? [lesson, ...f] : f));
    setLesson(prev);
  }, [history, lesson]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => (lesson ? [...h, lesson] : h));
    setLesson(next);
  }, [future, lesson]);

  const handleSave = useCallback(async () => {
    if (!lesson) return;
    
    const toastId = toast.loading('Sauvegarde en cours...');
    
    try {
      // ✅ Finaliser automatiquement les blocs non sauvegardés
      if (hasUnsavedBlock) {
        console.log('🔄 Finalisation automatique des blocs en cours...');
        setHasUnsavedBlock(false);
        
        // Attendre un court instant pour que l'état se propage
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // ✅ Nettoyer les blocs vides avant sauvegarde
      const validBlocks = (lesson.blocks || []).filter(block => {
        // Valider chaque type de bloc
        if (block.type === 'text') {
          return block.data?.html && 
                 block.data.html.trim() !== '' && 
                 block.data.html !== '<p></p>' &&
                 block.data.html !== '<p><br></p>';
        }
        if (block.type === 'image') {
          return block.data?.url && block.data.url.trim() !== '';
        }
        if (block.type === 'video') {
          return block.data?.url && block.data.url.trim() !== '';
        }
        if (block.type === 'quote') {
          return block.data?.content && block.data.content.trim() !== '';
        }
        if (block.type === 'list') {
          return block.data?.items && block.data.items.length > 0;
        }
        if (block.type === 'info') {
          return block.data?.body && block.data.body.trim() !== '';
        }
        if (block.type === 'toggle') {
          return block.data?.body && block.data.body.trim() !== '';
        }
        // Divider, separator, timeline, lessonLink sont toujours valides
        if (block.type === 'divider' || block.type === 'separator' || 
            block.type === 'timeline' || block.type === 'lessonLink') {
          return true;
        }
        return true; // Par défaut, garder le bloc
      });
      
      console.log('💾 Sauvegarde de la leçon:', lesson.id || 'nouvelle');
      console.log('📦 Nombre de blocks valides:', validBlocks.length);
      
      // Préparer les données pour Supabase
      const lessonData = {
        title: lesson.title || 'Sans titre',
        editor_data: validBlocks, // Stocker directement le tableau de blocs
        duration_minutes: lesson.duration_minutes || null,
        reading_time_minutes: lesson.reading_time_minutes || null,
        order: lesson.order || 1,
        hidden: lesson.hidden || false,
      };
      
      let result;
      
      // Si la leçon a déjà un ID et existe dans Supabase
      if (lesson.id && lesson.id !== 'new') {
        // Mise à jour
        console.log('🔄 Mise à jour de la leçon existante:', lesson.id);
        const { data, error } = await updateLesson(lesson.id, lessonData);
        
        if (error) {
          console.error('❌ Erreur mise à jour:', error);
          throw new Error(error.message || 'Erreur lors de la mise à jour');
        }
        
        result = data;
        console.log('✅ Leçon mise à jour avec succès');
      } else {
        // Création
        console.log('➕ Création d\'une nouvelle leçon');
        const { data, error } = await createLesson({
          ...lessonData,
          chapter_id: chapterId,
        });
        
        if (error) {
          console.error('❌ Erreur création:', error);
          throw new Error(error.message || 'Erreur lors de la création');
        }
        
        result = data;
        console.log('✅ Leçon créée avec succès, ID:', result.id);
        
        // Mettre à jour l'ID local après création
        setLesson(prev => ({
          ...prev,
          id: result.id,
        }));
      }
      
      // Mettre à jour l'état local avec les blocs nettoyés
      setLesson(prev => ({
        ...prev,
        blocks: validBlocks,
      }));
      
      setHasUnsavedBlock(false);
      
      toast.success('Leçon sauvegardée avec succès !', {
        id: toastId,
      });
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde', {
        id: toastId,
      });
    }
  }, [lesson, hasUnsavedBlock, chapterId]);

  // ============================================
  // 5. useEffect - EXPOSITION AU PARENT (onReady)
  // ============================================
  // ✅ Appeler onReady seulement quand lesson change ou les callbacks changent
  useEffect(() => {
    if (lesson && onReady) {
      const dataToExpose = {
        lesson,
        setLesson,
        viewMode,
        setViewMode,
        handleSave,
        handleUndo,
        handleRedo,
        history,
        future,
        hasUnsavedChanges: history.length > 0,
        requestExit: (callback) => {
          if (history.length > 0) {
            const confirmed = window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?');
            if (confirmed && callback) callback();
            return confirmed;
          }
          if (callback) callback();
          return true;
        }
      };
      console.log('🔗 LessonBuilder: Appel de onReady avec:', dataToExpose);
      onReady(dataToExpose);
    }
  }, [lesson, viewMode, history, future, onReady, handleSave, handleUndo, handleRedo, setLesson, setViewMode]);


  // ============================================
  // 9. JSX RETURN
  // ============================================
  if (!lesson) return <div style={{ padding: '16px' }}>Chargement de la leçon...</div>;
  
  const blocks = lesson.blocks || [];
  
  return (
    <div style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#f8fafc'
    }}>
      
      {/* ===================================== 
          COLONNE GAUCHE - SIDEBAR (360px)
          ===================================== */}
      <div style={{
        width: '360px',
        minWidth: '320px',
        maxWidth: '400px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        boxShadow: '4px 0 12px rgba(0, 0, 0, 0.03)'
      }}>
        
        {/* Header Sidebar avec onglets */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff'
        }}>
          {/* Onglets Leçon / Blocs */}
          <div style={{
            display: 'flex',
            gap: 8,
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 10
          }}>
            <button
              onClick={() => setActiveTab('lesson')}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: activeTab === 'lesson' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                  : 'transparent',
                color: activeTab === 'lesson' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: activeTab === 'lesson' 
                  ? '0 4px 12px rgba(59, 130, 246, 0.25)' 
                  : 'none'
              }}
            >
              <FileText size={16} />
              Leçon
            </button>
            
            <button
              onClick={() => setActiveTab('blocs')}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: activeTab === 'blocs' 
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                  : 'transparent',
                color: activeTab === 'blocs' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: activeTab === 'blocs' 
                  ? '0 4px 12px rgba(139, 92, 246, 0.25)' 
                  : 'none'
              }}
            >
              <Package size={16} />
              Blocs
            </button>
          </div>
        </div>

        {/* Zone scrollable INDÉPENDANTE */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}>
          {activeTab === 'lesson' ? (
            <div>
              {/* Titre de la leçon */}
              <div style={{ marginBottom: 32 }}>
                <label style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#94a3b8',
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>
                  Titre de la leçon
                </label>
                <input
                  type="text"
                  value={lesson.title}
                  onChange={(e) => setLesson((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Introduction à la prospection"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#1e293b',
                    transition: 'all 0.2s',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Plan de la leçon */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#94a3b8',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>
                  Plan de la leçon ({blocks.length})
                </label>

                {/* DndContext pour réorganiser */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={({ active, over }) => {
                    if (over) handleReorder(active.id, over.id);
                  }}
                >
                  <SortableContext
                    items={blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <LessonOutlineTab
                      blocks={blocks}
                      selectedBlockId={selectedBlockId}
                      onSelect={setSelectedBlockId}
                    />
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          ) : (
            <BlocksPaletteTab onAddBlock={handleAddBlock} />
          )}
        </div>
      </div>

      {/* ===================================== 
          COLONNE DROITE - ÉDITEUR (flex: 1)
          ===================================== */}
      <div style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '32px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9',
        backgroundColor: '#f8fafc'
      }}>
        {/* Wrapper pour centrer le contenu */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto'
        }}>
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

// ============================================
// FONCTIONS UTILITAIRES (hors composant)
// ============================================

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
