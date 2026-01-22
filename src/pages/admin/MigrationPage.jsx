import React, { useState } from 'react';
import { migrationStep1 } from '../../scripts/migration/migrationStep1';
import { migrationStep2 } from '../../scripts/migration/migrationStep2';
import { migrationStep3 } from '../../scripts/migration/migrationStep3';
import { migrationAddEmployeeFields } from '../../scripts/migration/migrationAddEmployeeFields';

const MigrationPage = () => {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const runStep1 = async () => {
    setRunning(true);
    setLogs([]);
    addLog('🚀 Démarrage Migration Step 1...', 'info');
    
    try {
      const result = await migrationStep1();
      if (result.success) {
        addLog('✅ Migration Step 1 terminée avec succès !', 'success');
      } else {
        addLog('❌ Erreur: ' + result.error?.message, 'error');
      }
    } catch (error) {
      addLog('❌ Erreur: ' + error.message, 'error');
    }
    
    setRunning(false);
  };

  const runStep2 = async () => {
    setRunning(true);
    setLogs([]);
    addLog('🚀 Démarrage Migration Step 2 (Users → Employees)...', 'info');
    
    try {
      const result = await migrationStep2();
      if (result.success) {
        addLog(`✅ Migration Step 2 terminée ! ${result.migrated} users migrés.`, 'success');
        if (result.errors > 0) {
          addLog(`⚠️ ${result.errors} erreur(s) rencontrée(s).`, 'error');
        }
      } else {
        addLog('❌ Erreur: ' + result.error?.message, 'error');
      }
    } catch (error) {
      addLog('❌ Erreur: ' + error.message, 'error');
    }
    
    setRunning(false);
  };

  const runStep3 = async () => {
    setRunning(true);
    setLogs([]);
    addLog('🚀 Démarrage Migration Step 3 (Programs)...', 'info');
    
    try {
      const result = await migrationStep3();
      if (result.success) {
        addLog(`✅ Migration Step 3 terminée ! ${result.migrated} programmes migrés.`, 'success');
        if (result.errors > 0) {
          addLog(`⚠️ ${result.errors} erreur(s) rencontrée(s).`, 'error');
        }
      } else {
        addLog('❌ Erreur: ' + result.error?.message, 'error');
      }
    } catch (error) {
      addLog('❌ Erreur: ' + error.message, 'error');
    }
    
    setRunning(false);
  };

  const runAddFields = async () => {
    setRunning(true);
    setLogs([]);
    addLog('🚀 Ajout des champs poste/contrat...', 'info');
    
    try {
      const result = await migrationAddEmployeeFields();
      if (result.success) {
        addLog(`✅ Terminé ! ${result.employees} employees + ${result.users} users mis à jour.`, 'success');
      } else {
        addLog('❌ Erreur: ' + result.error?.message, 'error');
      }
    } catch (error) {
      addLog('❌ Erreur: ' + error.message, 'error');
    }
    
    setRunning(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
        🔧 Migration Firebase
      </h1>
      
      <div style={{ 
        background: '#fef3c7', 
        border: '1px solid #f59e0b', 
        borderRadius: '8px', 
        padding: '16px',
        marginBottom: '24px'
      }}>
        <strong>⚠️ ATTENTION :</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '24px' }}>
          <li>Avant d'exécuter Step 1, modifie les constantes CONFIG dans migrationStep1.js avec ton UID Firebase.</li>
          <li><strong>Ordre d'exécution :</strong> Step 1 → Step 2 → Step 3</li>
          <li>Step 1 : Crée la structure de base (platformSettings, platformAdmins, organizations)</li>
          <li>Step 2 : Migre tous les users vers employees</li>
          <li>Step 3 : Migre tous les programmes vers l'organisation</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={runStep1}
          disabled={running}
          style={{
            padding: '12px 24px',
            background: running ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: running ? 'not-allowed' : 'pointer'
          }}
        >
          {running ? '⏳ En cours...' : '▶️ Exécuter Step 1 (Structure)'}
        </button>

        <button
          onClick={runStep2}
          disabled={running}
          style={{
            padding: '12px 24px',
            background: running ? '#94a3b8' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: running ? 'not-allowed' : 'pointer'
          }}
        >
          {running ? '⏳ En cours...' : '▶️ Exécuter Step 2 (Users)'}
        </button>

        <button
          onClick={runStep3}
          disabled={running}
          style={{
            padding: '12px 24px',
            background: running ? '#94a3b8' : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: running ? 'not-allowed' : 'pointer'
          }}
        >
          {running ? '⏳ En cours...' : '▶️ Exécuter Step 3 (Programs)'}
        </button>

        <button
          onClick={runAddFields}
          disabled={running}
          style={{
            padding: '12px 24px',
            background: running ? '#94a3b8' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: running ? 'not-allowed' : 'pointer'
          }}
        >
          {running ? '⏳ En cours...' : '▶️ Ajouter champs poste/contrat'}
        </button>
      </div>

      <div style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '16px',
        minHeight: '300px',
        fontFamily: 'monospace',
        fontSize: '13px'
      }}>
        {logs.length === 0 ? (
          <span style={{ color: '#64748b' }}>Les logs apparaîtront ici...</span>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index}
              style={{ 
                color: log.type === 'success' ? '#10b981' : log.type === 'error' ? '#ef4444' : '#e2e8f0',
                marginBottom: '4px'
              }}
            >
              <span style={{ color: '#64748b' }}>[{log.time}]</span> {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MigrationPage;
