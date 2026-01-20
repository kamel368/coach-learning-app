import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Target, TrendingUp, Trophy, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useHistorique } from '../../hooks/useHistorique';

// Format date français
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const day = date.getDate();
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${month} ${year}, ${time}`;
};

// Format durée
const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};


export default function ApprenantHistorique() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { attempts, allAttempts, loading, filter, setFilter, statistics, programStats } = useHistorique(user?.uid);

  // States pour l'animation du graphique
  const [animated, setAnimated] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Animation au montage
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Déterminer le style du badge selon le score
  const getBadgeStyle = (percentage) => {
    if (percentage >= 80) {
      return {
        background: '#dcfce7',
        color: '#16a34a',
        label: 'Excellent'
      };
    } else if (percentage >= 50) {
      return {
        background: '#fef3c7',
        color: '#d97706',
        label: 'Bien'
      };
    } else {
      return {
        background: '#fee2e2',
        color: '#dc2626',
        label: 'À améliorer'
      };
    }
  };

  // Naviguer vers les résultats ou le module
  const handleViewDetails = (attempt) => {
    if (attempt.type === 'evaluation') {
      // Pour les évaluations, naviguer vers la page de résultats
      navigate(`/apprenant/program-evaluation/${attempt.programId}/results`, {
        state: {
          results: {
            score: attempt.percentage,
            totalPoints: attempt.maxScore,
            earnedPoints: attempt.score,
            results: attempt.results
          },
          duration: attempt.duration
        }
      });
    } else if (attempt.programId && attempt.chapterId) {
      // Pour les exercices, naviguer vers la page de résultats
      navigate(`/apprenant/programs/${attempt.programId}/modules/${attempt.chapterId}/exercises/results`, {
        state: {
          results: {
            score: attempt.percentage,
            totalPoints: attempt.maxScore,
            earnedPoints: attempt.score,
            results: attempt.results
          },
          duration: attempt.duration
        }
      });
    } else {
      // Si pas d'infos, retour au dashboard
      navigate('/apprenant/dashboard');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
            Chargement de l'historique...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '32px' }}>📊</span>
          Mon Historique
        </h1>

        {/* Statistiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {/* Card Total tentatives */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                Total tentatives
              </span>
              <Target size={20} color="#64748b" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b' }}>
              {statistics.totalAttempts}
            </div>
          </div>

          {/* Card Score moyen */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                Score moyen
              </span>
              <TrendingUp size={20} color="#64748b" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>
              {statistics.averageScore}%
            </div>
          </div>

          {/* Card Meilleur score */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                Meilleur score
              </span>
              <Trophy size={20} color="#64748b" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
              {statistics.bestScore}%
            </div>
          </div>

          {/* Card Temps total */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                Temps total
              </span>
              <Clock size={20} color="#64748b" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#8b5cf6' }}>
              {formatDuration(statistics.totalTime)}
            </div>
          </div>
        </div>

        {/* Graphique à barres - Score moyen par programme */}
        {programStats && programStats.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '24px'
          }}>
            {/* Titre */}
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📊 Performance par programme
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#64748b',
              marginBottom: '24px'
            }}>
              Progression lecture et score exercices par programme
            </p>

            {/* Container du graphique */}
            <div style={{
              position: 'relative',
              paddingLeft: '45px',
              paddingBottom: '60px'
            }}>
              {/* Lignes de grille horizontales + labels Y */}
              {[0, 25, 50, 75, 100].map((value) => (
                <div
                  key={value}
                  style={{
                    position: 'absolute',
                    left: '0',
                    right: '0',
                    bottom: `${(value / 100) * 200 + 60}px`,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <span style={{
                    width: '40px',
                    fontSize: '11px',
                    color: '#94a3b8',
                    fontWeight: '500',
                    textAlign: 'right',
                    paddingRight: '8px'
                  }}>
                    {value}%
                  </span>
                  <div style={{
                    flex: 1,
                    borderTop: value === 0 ? '2px solid #e2e8f0' : '1px dashed #e2e8f0'
                  }} />
                </div>
              ))}

              {/* Zone des barres */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                height: '220px',
                marginLeft: '5px',
                position: 'relative',
                zIndex: 1
              }}>
                {programStats.map((program, index) => {
                  const readingHeight = animated ? (Math.min(program.readingProgress, 100) / 100) * 200 : 0;
                  const exerciseHeight = animated ? (Math.min(program.exerciseScore, 100) / 100) * 200 : 0;
                  const isHovered = hoveredBar === index;
                  
                  return (
                    <div
                      key={program.programId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                        maxWidth: '140px',
                        position: 'relative'
                      }}
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip au hover */}
                      {isHovered && (
                        <div style={{
                          position: 'absolute',
                          bottom: `${Math.max(readingHeight, exerciseHeight) + 45}px`,
                          background: '#1e293b',
                          color: 'white',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                          zIndex: 20
                        }}>
                          <div style={{ fontWeight: '700', marginBottom: '8px', fontSize: '14px' }}>
                            {program.programName}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#3b82f6' }} />
                            <span>Lecture: {Math.min(program.readingProgress, 100)}%</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} />
                            <span>Exercices: {Math.min(program.exerciseScore, 100)}%</span>
                          </div>
                          <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '6px' }}>
                            🎯 {program.attemptCount} tentative{program.attemptCount > 1 ? 's' : ''}
                          </div>
                          {/* Flèche */}
                          <div style={{
                            position: 'absolute',
                            bottom: '-6px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #1e293b'
                          }} />
                        </div>
                      )}

                      {/* Container des 2 barres */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '4px',
                        marginBottom: '8px'
                      }}>
                        {/* Barre Lecture (bleu) */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#3b82f6',
                            marginBottom: '4px',
                            opacity: animated ? 1 : 0,
                            transition: 'opacity 0.5s ease 0.3s'
                          }}>
                            {Math.min(program.readingProgress, 100)}%
                          </div>
                          <div
                            style={{
                              width: isHovered ? '28px' : '24px',
                              height: `${readingHeight}px`,
                              minHeight: program.readingProgress > 0 ? '4px' : '2px',
                              background: program.readingProgress > 0 
                                ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)' 
                                : '#e2e8f0',
                              borderRadius: '4px 4px 0 0',
                              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isHovered && program.readingProgress > 0
                                ? '0 4px 12px rgba(59, 130, 246, 0.4)' 
                                : 'none'
                            }}
                          />
                        </div>

                        {/* Barre Exercices (vert) */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#10b981',
                            marginBottom: '4px',
                            opacity: animated ? 1 : 0,
                            transition: 'opacity 0.5s ease 0.3s'
                          }}>
                            {Math.min(program.exerciseScore, 100)}%
                          </div>
                          <div
                            style={{
                              width: isHovered ? '28px' : '24px',
                              height: `${exerciseHeight}px`,
                              minHeight: program.exerciseScore > 0 ? '4px' : '2px',
                              background: program.exerciseScore > 0 
                                ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' 
                                : '#e2e8f0',
                              borderRadius: '4px 4px 0 0',
                              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isHovered && program.exerciseScore > 0
                                ? '0 4px 12px rgba(16, 185, 129, 0.4)' 
                                : 'none'
                            }}
                          />
                        </div>
                      </div>

                      {/* Label programme (axe X) */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-45px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: isHovered ? '#1e293b' : '#64748b',
                        textAlign: 'center',
                        width: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.2s',
                        transform: 'rotate(-20deg)',
                        transformOrigin: 'top center'
                      }}>
                        {program.programName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Légende mise à jour */}
            <div style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#64748b'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                }} />
                <span>📚 Progression lecture</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#64748b'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                }} />
                <span>📝 Score exercices</span>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '10px 20px',
              background: filter === 'all' ? '#3b82f6' : 'white',
              color: filter === 'all' ? 'white' : '#64748b',
              border: filter === 'all' ? 'none' : '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Tous ({allAttempts?.length || 0})
          </button>

          <button
            onClick={() => setFilter('exercises')}
            style={{
              padding: '10px 20px',
              background: filter === 'exercises' ? '#3b82f6' : 'white',
              color: filter === 'exercises' ? 'white' : '#64748b',
              border: filter === 'exercises' ? 'none' : '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📝 Exercices
          </button>

          <button
            onClick={() => setFilter('evaluations')}
            style={{
              padding: '10px 20px',
              background: filter === 'evaluations' ? '#3b82f6' : 'white',
              color: filter === 'evaluations' ? 'white' : '#64748b',
              border: filter === 'evaluations' ? 'none' : '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🏆 Évaluations
          </button>
        </div>

        {/* Liste des tentatives */}
        {attempts.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '60px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              Aucune tentative pour le moment
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              Commencez par faire des exercices ou des évaluations !
            </p>
            <button
              onClick={() => navigate('/apprenant/dashboard')}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Retour au tableau de bord
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {attempts.map((attempt) => {
              const badgeStyle = getBadgeStyle(attempt.percentage);
              
              return (
                <div
                  key={attempt.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Icône */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: attempt.type === 'evaluation' ? '#fef3c7' : '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0
                  }}>
                    {attempt.type === 'evaluation' ? '🏆' : '📝'}
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '4px'
                    }}>
                      {attempt.programName}
                      {attempt.type === 'evaluation' && (
                        <span style={{ color: '#64748b', fontWeight: '400' }}>
                          {' • '}Évaluation complète
                        </span>
                      )}
                      {attempt.type === 'exercise' && attempt.chapterName && (
                        <span style={{ color: '#64748b', fontWeight: '400' }}>
                          {' • '}{attempt.chapterName}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span>📅 {formatDate(attempt.completedAt)}</span>
                      <span>⏱️ {formatDuration(attempt.duration)}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1e293b'
                      }}>
                        {attempt.percentage}%
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        {attempt.score}/{attempt.maxScore} pts
                      </div>
                    </div>

                    {/* Badge */}
                    <div style={{
                      padding: '6px 12px',
                      background: badgeStyle.background,
                      color: badgeStyle.color,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {badgeStyle.label}
                    </div>
                  </div>

                  {/* Bouton voir détails */}
                  <button
                    onClick={() => handleViewDetails(attempt)}
                    style={{
                      padding: '10px 16px',
                      background: '#f8fafc',
                      color: '#3b82f6',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3b82f6';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#3b82f6';
                    }}
                  >
                    Voir détails
                    <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
