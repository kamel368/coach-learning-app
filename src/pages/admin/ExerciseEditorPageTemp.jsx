import { useParams, useNavigate } from 'react-router-dom';

export default function ExerciseEditorPageTemp() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 20 }}>
        Éditeur d'exercice
      </h1>
      
      <div style={{
        padding: 20,
        background: '#eff6ff',
        border: '2px solid #3b82f6',
        borderRadius: 12,
        marginBottom: 20
      }}>
        <p style={{ fontSize: 16, color: '#1f2937', marginBottom: 10 }}>
          <strong>Exercise ID:</strong> {exerciseId}
        </p>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          L'éditeur d'exercice sera implémenté dans le Prompt 3.
        </p>
      </div>

      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '12px 24px',
          background: '#eff6ff',
          border: '2px solid #3b82f6',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 600,
          color: '#3b82f6'
        }}
      >
        ← Retour
      </button>
    </div>
  );
}
