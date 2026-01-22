import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useGamification, BADGES_CONFIG, LEVELS } from '../../hooks/useGamification';
import { useViewAs } from '../../hooks/useViewAs';
import ViewAsBanner from '../../components/ViewAsBanner';
import { 
  Trophy, 
  Zap, 
  Flame, 
  Lock, 
  CheckCircle2, 
  ArrowLeft,
  Star
} from 'lucide-react';

const ApprenantBadges = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  // Mode "Voir comme"
  const { targetUserId } = useViewAs();
  
  const { 
    gamificationData, 
    currentLevel, 
    levelProgress, 
    unlockedBadges,
    loading 
  } = useGamification(targetUserId);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  const allBadges = Object.values(BADGES_CONFIG);
  const unlockedCount = unlockedBadges.length;
  const totalCount = allBadges.length;

  return (
    <>
      {/* Bandeau Mode Voir comme */}
      <ViewAsBanner />
      
      <div style={{
        minHeight: '100vh',
      background: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/apprenant/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 0',
              marginBottom: '16px'
            }}
          >
            <ArrowLeft size={18} />
            Retour au dashboard
          </button>

          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trophy size={24} color="white" />
            </div>
            Mes Badges
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#64748b'
          }}>
            Débloquez des badges en progressant dans vos formations
          </p>
        </div>

        {/* Stats Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          color: 'white'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '20px'
          }}>
            {/* Niveau */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '800',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
              }}>
                {currentLevel.level}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>
                  {currentLevel.title}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  <Zap size={16} color="#f59e0b" />
                  {gamificationData?.xp || 0} XP
                </div>
              </div>
            </div>

            {/* Badges */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Star size={28} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>
                  {unlockedCount}/{totalCount}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  Badges débloqués
                </div>
              </div>
            </div>

            {/* Streak */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Flame size={28} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>
                  {gamificationData?.currentStreak || 0} jours
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  Série actuelle
                </div>
              </div>
            </div>
          </div>

          {/* Barre progression niveau */}
          <div style={{ marginTop: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '6px'
            }}>
              <span>Progression vers niveau {currentLevel.level + 1}</span>
              <span>{levelProgress}%</span>
            </div>
            <div style={{
              height: '8px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${levelProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Grille des badges */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '20px'
          }}>
            Tous les badges ({unlockedCount}/{totalCount})
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {allBadges.map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '12px',
                    background: isUnlocked ? '#f0fdf4' : '#f8fafc',
                    border: `2px solid ${isUnlocked ? '#86efac' : '#e2e8f0'}`,
                    opacity: isUnlocked ? 1 : 0.7,
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Icône badge */}
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: isUnlocked 
                      ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                      : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    position: 'relative',
                    boxShadow: isUnlocked ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                  }}>
                    {isUnlocked ? (
                      badge.icon
                    ) : (
                      <Lock size={22} color="#94a3b8" />
                    )}

                    {/* Check si débloqué */}
                    {isUnlocked && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white'
                      }}>
                        <CheckCircle2 size={12} color="white" />
                      </div>
                    )}
                  </div>

                  {/* Infos badge */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: isUnlocked ? '#1e293b' : '#64748b',
                      marginBottom: '2px'
                    }}>
                      {badge.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#94a3b8'
                    }}>
                      {badge.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Niveaux */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '20px'
          }}>
            Niveaux
          </h2>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {LEVELS.map((level) => {
              const isCurrentLevel = currentLevel.level === level.level;
              const isUnlocked = currentLevel.level >= level.level;

              return (
                <div
                  key={level.level}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: isCurrentLevel 
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : isUnlocked 
                        ? '#fef3c7' 
                        : '#f1f5f9',
                    border: isCurrentLevel 
                      ? 'none' 
                      : `2px solid ${isUnlocked ? '#fcd34d' : '#e2e8f0'}`
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isCurrentLevel ? 'rgba(255,255,255,0.3)' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: isCurrentLevel ? 'white' : '#f59e0b'
                  }}>
                    {level.level}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isCurrentLevel ? 'white' : '#1e293b'
                    }}>
                      {level.title}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: isCurrentLevel ? 'rgba(255,255,255,0.8)' : '#94a3b8'
                    }}>
                      {level.xpRequired} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ApprenantBadges;
