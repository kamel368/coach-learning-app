import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState } from 'react';
import LessonBuilder from '../components/lesson-builder/LessonBuilder';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Undo2, Redo2, Eye, Pencil, X } from 'lucide-react';

export default function LessonEditorPage() {
  const { programId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTitle = location.state?.initialTitle || null;

  // États partagés pour le header
  const [builderRef, setBuilderRef] = useState(null);

  const getStatusColor = (status) => {
    if (status === 'published') return '#22c55e';
    if (status === 'disabled') return '#ef4444';
    return '#facc15';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Header fixe en haut avec TOUS les boutons */}
      <nav
        className="navbar navbar-expand-lg bg-light border-bottom"
        style={{
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: '56px',
        }}
      >
        <div className="container-fluid">
          {/* Titre leçon (si disponible) */}
          {builderRef?.lesson && (
            <span
              style={{
                fontSize: '14px',
                fontWeight: '500',
                marginRight: '16px',
              }}
            >
              {builderRef.lesson.title || 'Sans titre'}
            </span>
          )}

          <div className="d-flex align-items-center gap-2 ms-auto">
            {/* Undo / Redo */}
            {builderRef && (
              <>
                <button
                  onClick={builderRef.handleUndo}
                  className="btn btn-sm btn-outline-secondary"
                  title="Annuler"
                  disabled={builderRef.history.length === 0}
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={builderRef.handleRedo}
                  className="btn btn-sm btn-outline-secondary"
                  title="Rétablir"
                  disabled={builderRef.future.length === 0}
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Toggle vue apprenant / édition */}
            {builderRef &&
              (builderRef.viewMode === 'edit' ? (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => builderRef.setViewMode('preview')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Eye className="w-4 h-4" /> Voir la page
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => builderRef.setViewMode('edit')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Pencil className="w-4 h-4" /> Mode édition
                </button>
              ))}

            {/* Statut avec pastille */}
            {builderRef?.lesson && (
              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(
                      builderRef.lesson.status || 'draft'
                    ),
                    display: 'inline-block',
                  }}
                ></span>
                <select
                  value={builderRef.lesson.status || 'draft'}
                  onChange={(e) =>
                    builderRef.setLesson((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="form-select form-select-sm"
                  style={{ width: 'auto', fontSize: '13px' }}
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="disabled">Désactivé</option>
                </select>
              </div>
            )}

            {/* Bouton sauvegarder */}
            {builderRef && (
              <button
                onClick={builderRef.handleSave}
                className="btn btn-sm btn-warning fw-bold"
                style={{ minWidth: '100px' }}
              >
                Sauvegarder
              </button>
            )}

            {/* Fermer */}
            <button
              onClick={() => navigate(`/admin/programs/${programId}`)}
              className="btn btn-sm btn-outline-danger"
              title="Retour au programme"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* LessonBuilder sans header interne */}
      <div style={{ marginTop: '56px', height: 'calc(100vh - 56px)' }}>
        <LessonBuilder
          lessonId={lessonId}
          moduleId={moduleId}
          initialTitle={initialTitle}
          onReady={setBuilderRef}
        />
      </div>
    </div>
  );
}
