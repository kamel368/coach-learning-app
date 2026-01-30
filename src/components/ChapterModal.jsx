import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal pour créer ou éditer un chapitre
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {function} onClose - Fonction de fermeture
 * @param {function} onSave - Fonction de sauvegarde (chapterData)
 * @param {Object} chapter - Chapitre à éditer (null pour création)
 * @param {number} defaultOrder - Ordre par défaut pour nouveau chapitre
 */
export default function ChapterModal({ isOpen, onClose, onSave, chapter = null, defaultOrder = 1 }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: defaultOrder
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = chapter !== null;

  // Initialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      if (chapter) {
        // Mode édition
        setFormData({
          title: chapter.title || '',
          description: chapter.description || '',
          order: chapter.order || 1
        });
      } else {
        // Mode création
        setFormData({
          title: '',
          description: '',
          order: defaultOrder
        });
      }
      setError('');
    }
  }, [isOpen, chapter, defaultOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await onSave(formData);
      
      // Fermer le modal après sauvegarde
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
          maxWidth: 600,
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
          borderBottom: '1px solid #e0e0e0'
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#1a1a1a',
            margin: 0
          }}>
            {isEditMode ? 'Modifier le chapitre' : 'Nouveau chapitre'}
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
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f5f7fa'}
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
              Titre du chapitre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Introduction à la sécurité routière"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 15,
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#333',
              marginBottom: 8
            }}>
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Les bases de la conduite"
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 15,
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                outline: 'none',
                transition: 'border-color 0.2s',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Ordre */}
          <div style={{ marginBottom: 24 }}>
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
                width: 120,
                padding: '12px 16px',
                fontSize: 15,
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
            />
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              Les chapitres seront affichés dans cet ordre
            </div>
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
            justifyContent: 'flex-end'
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
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
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
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {saving ? 'Enregistrement...' : isEditMode ? 'Mettre à jour' : 'Créer le chapitre'}
            </button>
          </div>
        </form>
      </div>

      {/* Animations CSS */}
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
