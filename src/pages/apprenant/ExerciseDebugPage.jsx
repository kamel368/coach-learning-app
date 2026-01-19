import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ExerciseDebugPage() {
  const { programId, moduleId } = useParams();
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFirebase() {
      try {
        const exercisesPath = `programs/${programId}/modules/${moduleId}/exercises/main`;
        console.log('🔍 Checking Firebase path:', exercisesPath);
        
        const exercisesRef = doc(db, exercisesPath);
        const exercisesSnap = await getDoc(exercisesRef);
        
        const info = {
          path: exercisesPath,
          exists: exercisesSnap.exists(),
          data: exercisesSnap.exists() ? exercisesSnap.data() : null,
          programId,
          moduleId
        };
        
        console.log('📊 Debug Info:', info);
        setDebugInfo(info);
      } catch (error) {
        console.error('❌ Erreur:', error);
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    }
    
    checkFirebase();
  }, [programId, moduleId]);

  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: 'monospace' }}>
        <h1>🔍 Diagnostic Firebase...</h1>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'monospace',
      background: '#1e293b',
      color: '#e2e8f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#10b981', marginBottom: '20px' }}>
        🔍 DIAGNOSTIC FIREBASE EXERCICES
      </h1>

      {debugInfo.error ? (
        <div style={{
          padding: '20px',
          background: '#ef4444',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2>❌ ERREUR</h2>
          <pre>{debugInfo.error}</pre>
        </div>
      ) : (
        <>
          {/* Chemin */}
          <div style={{
            padding: '20px',
            background: '#334155',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: '#60a5fa' }}>📍 CHEMIN FIREBASE</h2>
            <pre style={{ 
              background: '#1e293b', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              {debugInfo.path}
            </pre>
          </div>

          {/* IDs */}
          <div style={{
            padding: '20px',
            background: '#334155',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: '#60a5fa' }}>🆔 IDENTIFIANTS</h2>
            <div style={{ background: '#1e293b', padding: '10px', borderRadius: '4px' }}>
              <div><strong>Program ID:</strong> {debugInfo.programId}</div>
              <div><strong>Module ID:</strong> {debugInfo.moduleId}</div>
            </div>
          </div>

          {/* Existence */}
          <div style={{
            padding: '20px',
            background: debugInfo.exists ? '#065f46' : '#991b1b',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: 'white' }}>
              {debugInfo.exists ? '✅ DOCUMENT EXISTE' : '❌ DOCUMENT N\'EXISTE PAS'}
            </h2>
            {!debugInfo.exists && (
              <p style={{ margin: '10px 0 0 0' }}>
                Le document "main" n'existe pas dans Firebase pour ce module.
              </p>
            )}
          </div>

          {/* Données */}
          {debugInfo.exists && (
            <div style={{
              padding: '20px',
              background: '#334155',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: '#60a5fa' }}>📦 DONNÉES</h2>
              <pre style={{ 
                background: '#1e293b', 
                padding: '10px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(debugInfo.data, null, 2)}
              </pre>
              
              {debugInfo.data?.blocks && (
                <div style={{ marginTop: '10px' }}>
                  <strong style={{ color: '#10b981' }}>
                    ✅ {debugInfo.data.blocks.length} bloc(s) trouvé(s)
                  </strong>
                  <ul style={{ marginTop: '10px' }}>
                    {debugInfo.data.blocks.map((block, index) => (
                      <li key={index}>
                        {block.type} - {block.points}pts - {block.content?.question || block.content?.statement || 'Sans titre'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Solution */}
          {!debugInfo.exists && (
            <div style={{
              padding: '20px',
              background: '#fbbf24',
              color: '#92400e',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: '#92400e' }}>💡 SOLUTION</h2>
              <ol style={{ margin: '10px 0' }}>
                <li>Va sur <code>/admin/programs/{debugInfo.programId}</code></li>
                <li>Trouve le module <code>{debugInfo.moduleId}</code></li>
                <li>Clique sur "🎯 Exercices"</li>
                <li>Ajoute 2-3 exercices (Flashcard, Vrai/Faux, QCM)</li>
                <li>Clique "Enregistrer"</li>
                <li>Reviens ici et rafraîchis</li>
              </ol>
            </div>
          )}

          {/* Lien builder */}
          <div style={{
            padding: '20px',
            background: '#334155',
            borderRadius: '8px'
          }}>
            <h2 style={{ color: '#60a5fa' }}>🔗 LIENS UTILES</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <a 
                href={`/admin/programs/${debugInfo.programId}`}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}
              >
                📝 Aller au builder admin
              </a>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔄 Rafraîchir le diagnostic
              </button>
              
              <a 
                href={`/apprenant/programs/${debugInfo.programId}/modules/${debugInfo.moduleId}/exercises`}
                style={{
                  padding: '10px 20px',
                  background: '#8b5cf6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}
              >
                🎯 Retour aux exercices
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
