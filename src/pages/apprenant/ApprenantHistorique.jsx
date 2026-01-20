import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Trophy, 
  Clock, 
  Target, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight,
  Calendar,
  Award,
  Zap
} from 'lucide-react';
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
        <div style={{
          marginBottom: '32px'
        }}>
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
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={24} color="white" />
            </div>
            Mon Historique
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#64748b'
          }}>
            Suivez votre progression et vos performances
          </p>
        </div>

        {/* Statistiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            {
              icon: Target,
              label: 'Total tentatives',
              value: statistics.totalAttempts,
              color: '#3b82f6',
              bgGradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
            },
            {
              icon: TrendingUp,
              label: 'Score moyen',
              value: `${statistics.averageScore}%`,
              color: '#8b5cf6',
              bgGradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
            },
            {
              icon: Trophy,
              label: 'Meilleur score',
              value: `${statistics.bestScore}%`,
              color: '#10b981',
              bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
            },
            {
              icon: Clock,
              label: 'Temps total',
              value: formatDuration(statistics.totalTime),
              color: '#f59e0b',
              bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
            }
          ].map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div
                key={index}
                style={{
                  background: card.bgGradient,
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {card.label}
                  </span>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <IconComponent size={18} color={card.color} />
                  </div>
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: card.color
                }}>
                  {card.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Container des 2 graphiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Graphique à barres - Score moyen par programme */}
          {programStats && programStats.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              {/* Titre */}
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <BarChart3 size={20} color="#3b82f6" />
                Performance par programme
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
                          maxWidth: '160px',
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
                          gap: '8px',
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
                                width: isHovered ? '48px' : '40px',
                                height: `${readingHeight}px`,
                                minHeight: program.readingProgress > 0 ? '4px' : '2px',
                                background: program.readingProgress > 0 
                                  ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)' 
                                  : '#e2e8f0',
                                borderRadius: '6px 6px 0 0',
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
                                width: isHovered ? '48px' : '40px',
                                height: `${exerciseHeight}px`,
                                minHeight: program.exerciseScore > 0 ? '4px' : '2px',
                                background: program.exerciseScore > 0 
                                  ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' 
                                  : '#e2e8f0',
                                borderRadius: '6px 6px 0 0',
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
                  <BookOpen size={14} />
                  <span>Progression lecture</span>
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
                  <Zap size={14} />
                  <span>Score exercices</span>
                </div>
              </div>
            </div>
          )}

          {/* NOUVEAU : Graphique courbe évolution */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <TrendingUp size={20} color="#8b5cf6" />
              Courbe de Progression
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#64748b',
              marginBottom: '24px'
            }}>
              Évolution de vos scores aux évaluations
            </p>

            {/* Zone du graphique courbe */}
            <div style={{
              position: 'relative',
              height: '250px',
              paddingLeft: '45px',
              paddingBottom: '40px',
              paddingRight: '20px'
            }}>
              {/* Lignes de grille horizontales + labels Y */}
              {[0, 25, 50, 75, 100].map((value) => (
                <div
                  key={value}
                  style={{
                    position: 'absolute',
                    left: '0',
                    right: '20px',
                    bottom: `${(value / 100) * 200 + 40}px`,
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

              {/* Zone verte de réussite (80-100%) - CORRIGÉE */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '45px',
                right: '20px',
                height: '20%', // 20% du haut = zone 80-100%
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.08) 100%)',
                borderBottom: '2px dashed rgba(16, 185, 129, 0.5)',
                pointerEvents: 'none',
                borderRadius: '8px 8px 0 0',
                zIndex: 0
              }} />

              {/* Label zone verte */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '25px',
                fontSize: '11px',
                color: '#10b981',
                fontWeight: '600',
                background: 'rgba(255,255,255,0.9)',
                padding: '3px 8px',
                borderRadius: '4px',
                zIndex: 5
              }}>
                Zone de réussite
              </div>

              {/* SVG pour la courbe */}
              {(() => {
                const evaluations = attempts
                  .filter(a => a.type === 'evaluation')
                  .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
                  .slice(-15);

                if (evaluations.length === 0) {
                  return (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '200px',
                      color: '#94a3b8'
                    }}>
                      <Target size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p style={{ fontSize: '14px' }}>Aucune évaluation pour le moment</p>
                    </div>
                  );
                }

                const chartWidth = 100; // pourcentage
                const chartHeight = 200; // pixels
                const padding = 5;

                // Calculer les positions des points
                const pointsData = evaluations.map((ev, index) => {
                  const xPercent = evaluations.length > 1 
                    ? padding + (index / (evaluations.length - 1)) * (chartWidth - padding * 2)
                    : 50;
                  const yPercent = 100 - ev.percentage; // inversé car Y=0 est en haut
                  return { xPercent, yPercent, ...ev };
                });

                // Créer le path SVG pour la ligne
                const linePath = pointsData
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.xPercent} ${p.yPercent}`)
                  .join(' ');

                return (
                  <div style={{
                    position: 'relative',
                    height: `${chartHeight}px`,
                    marginTop: '20px'
                  }}>
                    {/* SVG avec viewBox carré pour éviter la déformation */}
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '45px',
                        right: '20px',
                        height: '100%',
                        width: 'calc(100% - 65px)',
                        overflow: 'visible'
                      }}
                    >
                      {/* LIGNE UNIQUEMENT - PAS D'AIRE */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {/* Zones de hover pour les tooltips */}
                    {pointsData.map((point, index) => (
                      <div
                        key={point.id || index}
                        style={{
                          position: 'absolute',
                          left: `calc(45px + (${point.xPercent} / 100) * (100% - 65px))`,
                          top: `${point.yPercent}%`,
                          transform: 'translate(-50%, -50%)',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          zIndex: 10,
                          borderRadius: '50%'
                        }}
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.querySelector('.curve-tooltip');
                          if (tooltip) {
                            tooltip.style.opacity = '1';
                            tooltip.style.visibility = 'visible';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const tooltip = e.currentTarget.querySelector('.curve-tooltip');
                          if (tooltip) {
                            tooltip.style.opacity = '0';
                            tooltip.style.visibility = 'hidden';
                          }
                        }}
                      >
                        {/* Point visible au hover */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '8px',
                          height: '8px',
                          background: '#8b5cf6',
                          borderRadius: '50%',
                          border: '2px solid white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />

                        {/* Tooltip */}
                        <div
                          className="curve-tooltip"
                          style={{
                            opacity: 0,
                            visibility: 'hidden',
                            position: 'absolute',
                            bottom: '30px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#1e293b',
                            color: 'white',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                            transition: 'all 0.2s ease',
                            zIndex: 30
                          }}
                        >
                          <div style={{ 
                            fontSize: '18px',
                            fontWeight: '700', 
                            marginBottom: '4px',
                            color: point.percentage >= 80 ? '#10b981' : point.percentage >= 50 ? '#f59e0b' : '#ef4444'
                          }}>
                            {point.percentage}%
                          </div>
                          <div style={{ opacity: 0.8, fontSize: '11px' }}>
                            {new Date(point.completedAt?.seconds * 1000 || point.completedAt).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div style={{ opacity: 0.6, fontSize: '10px', marginTop: '2px' }}>
                            {point.programName}
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
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Dates en bas (axe X) */}
              {(() => {
                const evaluations = attempts
                  .filter(a => a.type === 'evaluation')
                  .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
                  .slice(-15);

                if (evaluations.length === 0) return null;

                // Afficher seulement quelques dates pour éviter le chevauchement
                const step = Math.max(1, Math.floor(evaluations.length / 5));
                const displayDates = evaluations.filter((_, i) => i % step === 0 || i === evaluations.length - 1);

                return displayDates.map((ev, index) => {
                  const originalIndex = evaluations.indexOf(ev);
                  const padding = 5;
                  const x = evaluations.length > 1 
                    ? padding + (originalIndex / (evaluations.length - 1)) * (100 - padding * 2)
                    : 50;

                  return (
                    <div
                      key={ev.id}
                      style={{
                        position: 'absolute',
                        left: `calc(45px + ${x}% * (100% - 65px) / 100)`,
                        bottom: '10px',
                        transform: 'translateX(-50%)',
                        fontSize: '10px',
                        color: '#94a3b8',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {new Date(ev.completedAt?.seconds * 1000 || ev.completedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                  );
                });
              })()}

              {/* Ligne moyenne */}
              {(() => {
                const evaluations = attempts.filter(a => a.type === 'evaluation');
                if (evaluations.length === 0) return null;

                const average = Math.round(
                  evaluations.reduce((sum, ev) => sum + ev.percentage, 0) / evaluations.length
                );
                const yPercent = 100 - average; // inversé car Y=0 est en haut

                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: '45px',
                      right: '20px',
                      top: `${yPercent}%`,
                      borderTop: '2px dashed #f59e0b',
                      opacity: 0.6
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      right: '0',
                      top: '-20px',
                      fontSize: '11px',
                      color: '#f59e0b',
                      fontWeight: '600',
                      background: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      Moy: {average}%
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Légende */}
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              flexWrap: 'wrap',
              fontSize: '12px',
              color: '#64748b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '20px',
                  height: '3px',
                  background: '#8b5cf6',
                  borderRadius: '2px'
                }} />
                Score évaluation
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '20px',
                  height: '12px',
                  background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.1) 100%)',
                  borderRadius: '2px',
                  border: '1px solid rgba(16, 185, 129, 0.5)'
                }} />
                Réussite (≥80%)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '20px',
                  height: '2px',
                  borderTop: '2px dashed #f59e0b'
                }} />
                Moyenne
              </div>
            </div>
          </div>
        </div>

        {/* Filtres modernisés */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          width: 'fit-content'
        }}>
          {[
            { key: 'all', label: 'Tous', icon: BarChart3 },
            { key: 'exercises', label: 'Exercices', icon: BookOpen },
            { key: 'evaluations', label: 'Évaluations', icon: Award }
          ].map((filterOption) => {
            const isActive = filter === filterOption.key;
            const IconComponent = filterOption.icon;
            return (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: isActive ? 'white' : 'transparent',
                  color: isActive ? '#3b82f6' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                <IconComponent size={16} />
                {filterOption.label}
                {filterOption.key === 'all' && ` (${allAttempts?.length || 0})`}
              </button>
            );
          })}
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
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <BarChart3 size={40} color="#3b82f6" />
            </div>
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
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => handleViewDetails(attempt)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  {/* Icône type */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: attempt.type === 'evaluation' 
                      ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                      : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {attempt.type === 'evaluation' 
                      ? <Trophy size={20} color="#f59e0b" />
                      : <BookOpen size={20} color="#3b82f6" />
                    }
                  </div>
                  
                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {attempt.programName}
                      {attempt.type === 'evaluation' && (
                        <span style={{ color: '#94a3b8', fontWeight: '400' }}>
                          {' • '}Évaluation complète
                        </span>
                      )}
                      {attempt.type === 'exercise' && attempt.chapterName && (
                        <span style={{ color: '#94a3b8', fontWeight: '400' }}>
                          {' • '}{attempt.chapterName}
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      color: '#64748b',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        {formatDate(attempt.completedAt)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {formatDuration(attempt.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score + Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#1e293b'
                    }}>
                      {attempt.percentage}%
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#94a3b8'
                    }}>
                      {attempt.score}/{attempt.maxScore} pts
                    </div>
                  </div>
                  
                  {/* Badge */}
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: attempt.percentage >= 80 
                      ? '#dcfce7' 
                      : attempt.percentage >= 50 
                        ? '#fef3c7' 
                        : '#fee2e2',
                    color: attempt.percentage >= 80 
                      ? '#16a34a' 
                      : attempt.percentage >= 50 
                        ? '#d97706' 
                        : '#dc2626',
                    whiteSpace: 'nowrap'
                  }}>
                    {attempt.percentage >= 80 ? 'Excellent' : attempt.percentage >= 50 ? 'Bien' : 'À revoir'}
                  </div>
                  
                  <ChevronRight size={20} color="#94a3b8" />
                </div>
              </div>
            ))}
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
