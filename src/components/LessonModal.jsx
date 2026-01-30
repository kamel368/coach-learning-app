import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal pour créer ou éditer une leçon
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {function} onClose - Fonction de fermeture
 * @param {function} onSave - Fonction de sauvegarde (lessonData)
 * @param {Object} lesson - Leçon à éditer (null pour création)
 * @param {number} defaultOrder - Ordre par défaut pour nouvelle leçon
 */
export default function LessonModal({ isOpen, onClose, onSave, lesson = null, defaultOrder = 1 }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    duration_minutes: 10,
    order: defaultOrder,
    hidden: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = lesson !== null;

  useEffect(() => {
    if (isOpen) {
      if (lesson) {
        // Mode édition - extraire le contenu texte de editor_data
        let contentText = '';
        if (lesson.editor_data && lesson.editor_data.blocks) {
          contentText = lesson.editor_data.blocks
            .map(block => block.data?.text || '')
            .join('\n\n');
        }
        
        setFormData({
          title: lesson.title || '',
          content: contentText,
          duration_minutes: lesson.duration_minutes || 10,
          order: lesson.order || 1,
          hidden: lesson.hidden || false
        });
      } else {
        // Mode création
        setFormData({
          title: '',
          content: '',
          duration_minutes: 10,
          order: defaultOrder,
          hidden: false
        });
      }
      setError('');
    }
  }, [isOpen, lesson, defaultOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    if (!formData.content.trim()) {
      setError('Le contenu est obligatoire');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // Convertir le contenu texte en editor_data JSON
      const editorData = {
        blocks: formData.content.split('\n\n').map(paragraph => ({
          type: 'paragraph',
          data: {
            text: paragraph.trim()
          }
        }))
      };

      await onSave({
        title: formData.title,
        editor_data: editorData,
        duration_minutes: formData.duration_minutes,
        reading_time_minutes: formData.duration_minutes,
        order: formData.order,
        hidden: formData.hidden
      });
      
      onClose();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          width: '90%',
          maxWidth: 800,
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 9999,
          animation: 'slideUp 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 16px',
          borderBottom: '1px solid #e0e0e0',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#1a1a1a',
            margin: 0
          }}>
            {isEditMode ? 'Modifier la leçon' : 'Nouvelle leçon'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: '#f5f7fa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} color="#666" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {/* Titre */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#333',
              marginBottom: 8
            }}>
              Titre de la leçon *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Les panneaux de signalisation"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 15,
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Contenu */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#333',
              marginBottom: 8
            }}>
              Contenu de la leçon *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Écrivez le contenu de la leçon ici...

Séparez les paragraphes par une ligne vide."
              required
              rows={12}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 15,
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                lineHeight: 1.6
              }}
            />
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              💡 Astuce : Laissez une ligne vide entre les paragraphes
            </div>
          </div>

          {/* Durée et Ordre */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 16,
            marginBottom: 20 
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#333',
                marginBottom: 8
              }}>
                Durée (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 10 })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 15,
                  border: '2px solid #e0e0e0',
                  borderRadius: 8,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#333',
                marginBottom: 8
              }}>
                Ordre d'affichage
              </label>
              <input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 15,
                  border: '2px solid #e0e0e0',
                  borderRadius: 8,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Masqué */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.hidden}
                onChange={(e) => setFormData({ ...formData, hidden: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 14, color: '#333' }}>
                Masquer cette leçon (brouillon)
              </span>
            </label>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{
              padding: 12,
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: 8,
              color: '#c33',
              fontSize: 14,
              marginBottom: 20
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
            position: 'sticky',
            bottom: 0,
            background: 'white',
            paddingTop: 16,
            borderTop: '1px solid #e0e0e0',
            marginTop: 24
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '12px 24px',
                fontSize: 15,
                fontWeight: 600,
                border: '2px solid #e0e0e0',
                background: 'white',
                color: '#666',
                borderRadius: 8,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 24px',
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                background: saving ? '#ccc' : 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                color: 'white',
                borderRadius: 8,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Enregistrement...' : isEditMode ? 'Mettre à jour' : 'Créer la leçon'}
            </button>
          </div>
        </form>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
