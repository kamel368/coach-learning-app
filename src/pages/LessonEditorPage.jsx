import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, Edit3, Save, Undo2, Redo2, X } from 'lucide-react';
import LessonBuilder from '../components/lesson-builder/LessonBuilder';
import { useAuth } from '../context/AuthContext';

export default function LessonEditorPage() {
  const { programId, chapterId, lessonId } = useParams();
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  
  const [lessonData, setLessonData] = useState(null);
  const [showQuitModal, setShowQuitModal] = useState(false);

  // ✅ Mémoriser handleReady pour éviter la boucle infinie
  const handleReady = useCallback((data) => {
    console.log('🎯 LessonEditorPage: handleReady appelé avec:', data);
    setLessonData(data);
  }, []);

  // Debug: Observer les changements de lessonData
  useEffect(() => {
    console.log('📊 LessonEditorPage: lessonData a changé:', lessonData);
  }, [lessonData]);

  // ============================================
  // FONCTIONS DE GESTION DU MODAL DE QUITTER
  // ============================================
  
  const handleBack = () => {
    console.log('🖱️ Clic sur Quitter - Affichage du modal');
    setShowQuitModal(true);
  };

  const handleQuitWithSave = async () => {
    console.log('💾 Quitter avec sauvegarde');
    
    const hasChanges = lessonData?.hasUnsavedChanges || false;
    
    if (hasChanges) {
      try {
        if (lessonData?.handleSave) {
          await lessonData.handleSave();
          console.log('✅ Sauvegarde réussie');
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
      }
    }
    
    setShowQuitModal(false);
    navigate(`/admin/programs/${programId}`);
  };

  const handleQuitWithoutSave = () => {
    console.log('🚪 Quitter sans sauvegarder');
    setShowQuitModal(false);
    navigate(`/admin/programs/${programId}`);
  };

  const handleCancelQuit = () => {
    console.log('❌ Annulation - Rester sur la page');
    setShowQuitModal(false);
  };

  // ============================================
  // COMPOSANT MODAL DE CONFIRMATION QUITTER
  // ============================================
  
  const QuitConfirmModal = () => {
    if (!showQuitModal) return null;

    return (
      <>
        {/* Overlay avec blur */}
        <div
          onClick={handleCancelQuit}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9998,
            animation: 'fadeIn 0.2s ease-out'
          }}
        />

        {/* Modal */}
        <div
          style={{
            position: 'fixed',
            top: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            animation: 'modalScaleIn 0.3s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '32px 40px',
              width: '480px',
              maxWidth: '90vw',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Icône d'avertissement */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 20
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32
              }}>
                ⚠️
              </div>
            </div>

            {/* Titre */}
            <h3 style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1e293b',
              textAlign: 'center',
              marginBottom: 12,
              margin: 0
            }}>
              Attention
            </h3>

            {/* Sous-titre */}
            <p style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#64748b',
              textAlign: 'center',
              marginBottom: 20,
              margin: '12px 0 20px 0'
            }}>
              Modifications non sauvegardées
            </p>

            {/* Description */}
            <p style={{
              fontSize: 14,
              color: '#64748b',
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: 32
            }}>
              Vous avez des modifications en cours. Que souhaitez-vous faire ?
            </p>

            {/* Boutons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              {/* Bouton Sauvegarder et quitter (principal) */}
              <button
                onClick={handleQuitWithSave}
                style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                <span style={{ fontSize: 18 }}>💾</span>
                Sauvegarder et quitter
              </button>

              {/* Bouton Quitter sans sauvegarder (danger) */}
              <button
                onClick={handleQuitWithoutSave}
                style={{
                  padding: '14px 24px',
                  background: '#ffffff',
                  color: '#ef4444',
                  border: '2px solid #fecaca',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#fecaca';
                }}
              >
                <span style={{ fontSize: 18 }}>🚪</span>
                Quitter sans sauvegarder
              </button>

              {/* Bouton Annuler (neutre) */}
              <button
                onClick={handleCancelQuit}
                style={{
                  padding: '14px 24px',
                  background: '#f8fafc',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#475569';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

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
          chapterId={chapterId}
          programId={programId}
          organizationId={organizationId}
          onReady={handleReady}
        />
      </div>

      {/* ====================================
          MODAL DE CONFIRMATION QUITTER
          ==================================== */}
      <QuitConfirmModal />
    </div>
  );
}
