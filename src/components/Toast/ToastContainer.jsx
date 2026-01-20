import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Trophy, 
  Zap, 
  TrendingUp, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();
  const navigate = useNavigate();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '380px',
      width: '100%',
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {toast.type === 'badge' && (
            <BadgeToast toast={toast} onClose={() => removeToast(toast.id)} navigate={navigate} />
          )}
          {toast.type === 'xp' && (
            <XPToast toast={toast} onClose={() => removeToast(toast.id)} />
          )}
          {toast.type === 'levelup' && (
            <LevelUpToast toast={toast} onClose={() => removeToast(toast.id)} navigate={navigate} />
          )}
          {toast.type === 'success' && (
            <SuccessToast toast={toast} onClose={() => removeToast(toast.id)} />
          )}
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Toast pour badge débloqué - COMPACT
const BadgeToast = ({ toast, onClose, navigate }) => (
  <div style={{
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    borderRadius: '12px',
    padding: '12px 14px',
    color: 'white',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    position: 'relative'
  }}>
    {/* BADGE TOAST - COMPACT */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    }}>
      {/* Icône badge */}
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
      }}>
        {toast.badge?.icon}
      </div>
      
      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '2px'
        }}>
          <Sparkles size={12} color="#fbbf24" />
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#fbbf24',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}>
            Badge débloqué
          </span>
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'white',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {toast.badge?.name}
        </div>
      </div>

      {/* Bouton voir */}
      <button
        onClick={() => { navigate('/apprenant/badges'); onClose(); }}
        style={{
          padding: '8px 12px',
          background: 'rgba(251,191,36,0.15)',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: '8px',
          color: '#fbbf24',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(251,191,36,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(251,191,36,0.15)';
        }}
      >
        Voir
      </button>
    </div>
  </div>
);

// Toast pour XP gagné
const XPToast = ({ toast, onClose }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '14px 18px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Zap size={20} color="white" />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: '16px',
        fontWeight: '700',
        color: '#f59e0b'
      }}>
        +{toast.amount} XP
      </div>
      <div style={{
        fontSize: '12px',
        color: '#64748b'
      }}>
        {toast.action}
      </div>
    </div>
    <button
      onClick={onClose}
      style={{
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer'
      }}
    >
      <X size={16} color="#94a3b8" />
    </button>
  </div>
);

// Toast pour level up
const LevelUpToast = ({ toast, onClose, navigate }) => (
  <div style={{
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    borderRadius: '16px',
    padding: '20px',
    color: 'white',
    boxShadow: '0 10px 40px rgba(139, 92, 246, 0.4)',
    textAlign: 'center',
    position: 'relative'
  }}>
    <button
      onClick={onClose}
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: '6px',
        padding: '4px',
        cursor: 'pointer'
      }}
    >
      <X size={16} color="rgba(255,255,255,0.6)" />
    </button>

    <div style={{
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '10px',
      color: 'rgba(255,255,255,0.8)'
    }}>
      🎉 LEVEL UP !
    </div>

    <div style={{
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      fontWeight: '800',
      margin: '0 auto 12px'
    }}>
      {toast.level?.level}
    </div>

    <div style={{
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '4px'
    }}>
      {toast.level?.title}
    </div>

    <div style={{
      fontSize: '13px',
      color: 'rgba(255,255,255,0.7)'
    }}>
      Tu as atteint le niveau {toast.level?.level} !
    </div>
  </div>
);

// Toast générique succès
const SuccessToast = ({ toast, onClose }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '14px 18px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    border: '1px solid #bbf7d0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }}>
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      background: '#dcfce7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <CheckCircle2 size={20} color="#16a34a" />
    </div>
    <div style={{
      flex: 1,
      fontSize: '14px',
      fontWeight: '500',
      color: '#1e293b'
    }}>
      {toast.message}
    </div>
    <button
      onClick={onClose}
      style={{
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer'
      }}
    >
      <X size={16} color="#94a3b8" />
    </button>
  </div>
);

export default ToastContainer;
