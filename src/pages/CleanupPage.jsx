import { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function CleanupPage() {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message, type = 'info') => {
    setLogs((prev) => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const cleanupOldCollections = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog('🧹 Début du nettoyage des anciennes collections...', 'title');

    try {
      // ============================================
      // 1. Supprimer ancienne collection lessons/
      // ============================================
      addLog('📄 Suppression de la collection "lessons"...', 'section');
      const lessonsRef = collection(db, 'lessons');
      const lessonsSnap = await getDocs(lessonsRef);
      addLog(`   → ${lessonsSnap.size} anciennes leçons trouvées`);

      let lessonsDeleted = 0;
      for (const lessonDoc of lessonsSnap.docs) {
        await deleteDoc(doc(db, 'lessons', lessonDoc.id));
        lessonsDeleted++;
        addLog(`   ✅ Leçon ${lessonDoc.id} supprimée (${lessonsDeleted}/${lessonsSnap.size})`);
      }

      addLog(`✅ ${lessonsDeleted} leçons supprimées`, 'success');

      // ============================================
      // 2. Supprimer ancienne collection modules/
      // ============================================
      addLog('📦 Suppression de la collection "modules"...', 'section');
      const modulesRef = collection(db, 'modules');
      const modulesSnap = await getDocs(modulesRef);
      addLog(`   → ${modulesSnap.size} anciens modules trouvés`);

      let modulesDeleted = 0;
      for (const moduleDoc of modulesSnap.docs) {
        await deleteDoc(doc(db, 'modules', moduleDoc.id));
        modulesDeleted++;
        addLog(`   ✅ Module ${moduleDoc.id} supprimé (${modulesDeleted}/${modulesSnap.size})`);
      }

      addLog(`✅ ${modulesDeleted} modules supprimés`, 'success');

      // ============================================
      // 3. Résumé
      // ============================================
      addLog('═══════════════════════════════════════', 'separator');
      addLog('✅ NETTOYAGE TERMINÉ !', 'title');
      addLog('═══════════════════════════════════════', 'separator');
      addLog(`Total supprimé : ${lessonsDeleted + modulesDeleted} documents`, 'success');
      addLog('Structure actuelle : programs/{id}/modules/{id}/lessons/ ✅', 'success');

    } catch (error) {
      addLog(`❌ ERREUR lors du nettoyage: ${error.message}`, 'error');
      console.error('Erreur complète:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        🧹 Nettoyage Firebase
      </h1>
      
      <div style={{ 
        background: '#FEF3C7', 
        border: '2px solid #F59E0B', 
        borderRadius: '8px', 
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>⚠️ ATTENTION</h2>
        <p style={{ marginBottom: '0.5rem' }}>Ce script va supprimer DÉFINITIVEMENT :</p>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
          <li>❌ Collection <code>lessons/</code> (obsolète)</li>
          <li>❌ Collection <code>modules/</code> (obsolète)</li>
        </ul>
        <p style={{ fontWeight: 'bold' }}>Cette action est IRRÉVERSIBLE !</p>
      </div>

      <button
        onClick={cleanupOldCollections}
        disabled={isRunning}
        style={{
          padding: '0.75rem 1.5rem',
          background: isRunning ? '#9CA3AF' : '#EF4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {isRunning ? '⏳ Nettoyage en cours...' : '🗑️ LANCER LE NETTOYAGE'}
      </button>

      <div style={{
        background: '#1F2937',
        color: '#F3F4F6',
        padding: '1rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {logs.length === 0 ? (
          <p style={{ color: '#9CA3AF' }}>En attente...</p>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '0.25rem',
                color: 
                  log.type === 'error' ? '#EF4444' :
                  log.type === 'success' ? '#10B981' :
                  log.type === 'title' ? '#3B82F6' :
                  log.type === 'section' ? '#F59E0B' :
                  '#F3F4F6'
              }}
            >
              <span style={{ color: '#6B7280', marginRight: '0.5rem' }}>[{log.time}]</span>
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
