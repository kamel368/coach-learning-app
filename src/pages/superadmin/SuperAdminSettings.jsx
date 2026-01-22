import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Settings, Save } from 'lucide-react';

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState({
    appName: '',
    version: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      // Essayer platform/settings
      let settingsDoc = await getDoc(doc(db, 'platform', 'settings'));
      
      if (!settingsDoc.exists()) {
        // Essayer platformSettings/config
        settingsDoc = await getDoc(doc(db, 'platformSettings', 'config'));
      }
      
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Erreur chargement settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Mettre à jour platform/settings
      await setDoc(doc(db, 'platform', 'settings'), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Aussi mettre à jour platformSettings pour compatibilité
      try {
        await setDoc(doc(db, 'platformSettings', 'config'), {
          ...settings,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.log('Compatibilité platformSettings:', e);
      }
      
      alert('✅ Configuration sauvegardée !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
        Chargement...
      </div>
    );
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          Configuration
        </h1>
        <p style={{ color: '#64748b' }}>
          Paramètres globaux de la plateforme
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        maxWidth: '600px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Nom de l'application
          </label>
          <input
            type="text"
            value={settings.appName || ''}
            onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '2px solid #e5e7eb',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Version
          </label>
          <input
            type="text"
            value={settings.version || ''}
            onChange={(e) => setSettings({ ...settings, version: e.target.value })}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '2px solid #e5e7eb',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: saving ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          <Save size={18} />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
