import { useViewAs } from '../hooks/useViewAs';

/**
 * Composant bandeau affiché en mode "Voir comme"
 * Indique à l'admin qu'il consulte le compte d'un apprenant
 */
export default function ViewAsBanner() {
  const { isViewingAs, viewAsUserName, viewAsUserEmail, clearViewAs } = useViewAs();
  
  // Ne rien afficher si on n'est pas en mode "Voir comme"
  if (!isViewingAs) return null;
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      color: 'white',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        fontSize: '14px'
      }}>
        <span>👁️</span>
        <span>
          Mode "Voir comme" activé - Vous consultez le compte de{' '}
          <strong>{viewAsUserName || viewAsUserEmail}</strong>
        </span>
      </div>
      <button
        onClick={() => {
          clearViewAs();
          window.close();
        }}
        style={{
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '6px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        }}
      >
        ✕ Quitter
      </button>
    </div>
  );
}
