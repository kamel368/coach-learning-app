import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, Edit3, Save, Undo2, Redo2, X } from 'lucide-react';
import LessonBuilder from '../components/lesson-builder/LessonBuilder';

export default function LessonEditorPage() {
  const { programId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  
  const [lessonData, setLessonData] = useState(null);

  // ✅ Mémoriser handleReady pour éviter la boucle infinie
  const handleReady = useCallback((data) => {
    console.log('🎯 LessonEditorPage: handleReady appelé avec:', data);
    setLessonData(data);
  }, []);

  // Debug: Observer les changements de lessonData
  useEffect(() => {
    console.log('📊 LessonEditorPage: lessonData a changé:', lessonData);
  }, [lessonData]);

  const handleBack = useCallback(() => {
    console.log('🚪 LessonEditorPage: handleBack appelé');
    if (lessonData?.requestExit) {
      const canExit = lessonData.requestExit(() => {
        navigate(`/admin/programs/${programId}`);
      });
      if (canExit) {
        navigate(`/admin/programs/${programId}`);
      }
    } else {
      navigate(`/admin/programs/${programId}`);
    }
  }, [lessonData, navigate, programId]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#f8fafc'
    }}>
      
      {/* ====================================
          HEADER UNIQUE EN HAUT
          ==================================== */}
      <div style={{
        height: '72px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        zIndex: 100
      }}>
        
        {/* Section Gauche */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          
          {/* Toggle Éditer/Aperçu */}
          <div style={{
            display: 'flex',
            gap: 4,
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 10
          }}>
            <button
              onClick={() => {
                if (lessonData?.setViewMode) lessonData.setViewMode('edit');
              }}
              style={{
                padding: '8px 16px',
                background: lessonData?.viewMode === 'edit' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                  : 'transparent',
                color: lessonData?.viewMode === 'edit' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: lessonData?.viewMode === 'edit' 
                  ? '0 4px 12px rgba(59, 130, 246, 0.25)' 
                  : 'none'
              }}
            >
              <Edit3 size={16} />
              Éditer
            </button>
            
            <button
              onClick={() => {
                if (lessonData?.setViewMode) lessonData.setViewMode('preview');
              }}
              style={{
                padding: '8px 16px',
                background: lessonData?.viewMode === 'preview' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                  : 'transparent',
                color: lessonData?.viewMode === 'preview' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: lessonData?.viewMode === 'preview' 
                  ? '0 4px 12px rgba(59, 130, 246, 0.25)' 
                  : 'none'
              }}
            >
              <Eye size={16} />
              Aperçu
            </button>
          </div>

          {/* Divider */}
          <div style={{
            width: 1,
            height: 32,
            background: '#e2e8f0'
          }} />

          {/* Undo/Redo */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => lessonData?.handleUndo?.()}
              disabled={!lessonData?.history || lessonData.history.length === 0}
              style={{
                padding: '8px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: (!lessonData?.history || lessonData.history.length === 0) 
                  ? 'not-allowed' 
                  : 'pointer',
                opacity: (!lessonData?.history || lessonData.history.length === 0) 
                  ? 0.5 
                  : 1,
                transition: 'all 0.2s'
              }}
              title="Annuler"
            >
              <Undo2 size={16} color="#64748b" />
            </button>
            
            <button
              onClick={() => lessonData?.handleRedo?.()}
              disabled={!lessonData?.future || lessonData.future.length === 0}
              style={{
                padding: '8px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: (!lessonData?.future || lessonData.future.length === 0) 
                  ? 'not-allowed' 
                  : 'pointer',
                opacity: (!lessonData?.future || lessonData.future.length === 0) 
                  ? 0.5 
                  : 1,
                transition: 'all 0.2s'
              }}
              title="Refaire"
            >
              <Redo2 size={16} color="#64748b" />
            </button>
          </div>

          {/* Divider */}
          <div style={{
            width: 1,
            height: 32,
            background: '#e2e8f0'
          }} />

          {/* Statut avec pastille */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Pastille de couleur */}
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: 
                lessonData?.lesson?.status === 'published' ? '#10b981' :
                lessonData?.lesson?.status === 'disabled' ? '#ef4444' :
                '#f59e0b',
              display: 'inline-block',
              flexShrink: 0
            }} />
            
            {/* Select */}
            <select
              value={lessonData?.lesson?.status || 'draft'}
              onChange={(e) => {
                if (lessonData?.setLesson) {
                  lessonData.setLesson(prev => ({ ...prev, status: e.target.value }));
                }
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: '#1e293b',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="disabled">Désactivé</option>
            </select>
          </div>
        </div>

        {/* Section Droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          
          {/* Bouton Sauvegarder VERT avec icône */}
          <button
            onClick={() => {
              console.log('💾 Bouton Sauvegarder cliqué');
              console.log('📦 lessonData:', lessonData);
              console.log('🔧 handleSave:', lessonData?.handleSave);
              if (lessonData?.handleSave) {
                lessonData.handleSave();
              } else {
                console.error('❌ handleSave non disponible !');
              }
            }}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
            }}
          >
            <Save size={16} />
            Sauvegarder
          </button>

          {/* Bouton Voir la page */}
          <button
            onClick={() => {
              // TODO: Implémenter la vue apprenant
              console.log('Voir la page apprenant');
            }}
            style={{
              padding: '10px 20px',
              background: '#ffffff',
              color: '#3b82f6',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#eff6ff';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            Voir la page
          </button>

          {/* Bouton Quitter (X rouge) */}
          <button
            onClick={() => {
              console.log('❌ Bouton Quitter cliqué');
              handleBack();
            }}
            style={{
              minWidth: 36,
              minHeight: 36,
              padding: 6,
              background: '#ffffff',
              border: '1px solid #fecaca',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
            title="Quitter"
          >
            <X 
              size={18} 
              color="#ef4444" 
              strokeWidth={1.5}
              style={{ display: 'block' }}
            />
          </button>
        </div>
      </div>

      {/* ====================================
          ZONE CONTENU (2 COLONNES)
          ==================================== */}
      <div style={{
        flex: 1,
        overflow: 'hidden'
      }}>
        <LessonBuilder
          lessonId={lessonId}
          moduleId={moduleId}
          programId={programId}
          onReady={handleReady}
        />
      </div>
    </div>
  );
}
