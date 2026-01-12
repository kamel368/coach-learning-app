import { useNavigate, useParams } from 'react-router-dom';
import LessonBuilder from '../components/lesson-builder/LessonBuilder';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function LessonEditorPage() {
  const { programId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Header fixe en haut (100% largeur) */}
      <nav 
        className="navbar navbar-expand-lg bg-light border-bottom" 
        style={{ 
          width: '100%', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000,
          height: '56px'
        }}
      >
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-2 ms-auto">
            {/* Bouton Fermer */}
            <button 
              onClick={() => navigate(`/admin/programs/${programId}`)} 
              className="btn btn-sm btn-outline-danger"
              title="Retour au programme"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* LessonBuilder avec sidebar intégrée */}
      <div style={{ marginTop: '56px', height: 'calc(100vh - 56px)' }}>
        <LessonBuilder lessonId={lessonId} moduleId={moduleId} />
      </div>
    </div>
  );
}
