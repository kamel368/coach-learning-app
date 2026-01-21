import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useHistorique } from '../../hooks/useHistorique';
import { 
  BarChart3, 
  BookOpen, 
  Zap, 
  TrendingUp, 
  Clock, 
  Trophy,
  Target,
  Calendar,
  ChevronRight,
  Filter
} from 'lucide-react';

const ApprenantHistorique = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { attempts, programStats, loading } = useHistorique(user?.uid);
  const [filter, setFilter] = useState('all');
  const [hoveredBar, setHoveredBar] = useState(null);

  // Filtrer les tentatives
  const filteredAttempts = attempts.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'exercises') return a.type === 'exercise';
    if (filter === 'evaluations') return a.type === 'evaluation';
    return true;
  });

  // Stats globales
  const stats = {
    totalAttempts: attempts.length,
    averageScore: attempts.length > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length)
      : 0,
    bestScore: attempts.length > 0 
      ? Math.max(...attempts.map(a => a.percentage || 0))
      : 0
  };

  // Évaluations pour la courbe
  const evaluations = attempts
    .filter(a => a.type === 'evaluation')
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
    .slice(-10);

  const averageEval = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.percentage, 0) / evaluations.length)
    : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={22} color="white" />
          </div>
          Mon Historique
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Suivez votre progression et vos performances</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard icon={Target} label="Tentatives" value={stats.totalAttempts} color="#3b82f6" />
        <StatCard icon={TrendingUp} label="Score moyen" value={`${stats.averageScore}%`} color="#8b5cf6" />
        <StatCard icon={Trophy} label="Meilleur" value={`${stats.bestScore}%`} color="#10b981" />
      </div>

      {/* Layout 50/50 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        alignItems: 'stretch'  // ← Alignement des hauteurs
      }}>
        {/* COLONNE GAUCHE : 3 Graphiques empilés */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          height: 'fit-content'  // ← Hauteur auto selon contenu
        }}>
          
          {/* Graphique 1 : Progression lecture */}
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '20px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BookOpen size={18} color="#3b82f6" />
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Progression lecture</h3>
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              maxHeight: '180px', 
              overflowY: 'auto'
            }}>
              {programStats.map((prog, index) => (
                <BarRow
                  key={`read-${prog.programId}`}
                  label={prog.programName}
                  value={prog.readingProgress}
                  color="#3b82f6"
                  isHovered={hoveredBar === `read-${index}`}
                  onHover={() => setHoveredBar(`read-${index}`)}
                  onLeave={() => setHoveredBar(null)}
                />
              ))}
              {programStats.length === 0 && (
                <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Aucun programme</p>
              )}
            </div>
          </div>

          {/* Graphique 2 : Score exercices */}
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '20px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={18} color="#10b981" />
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Score exercices</h3>
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              maxHeight: '180px', 
              overflowY: 'auto'
            }}>
              {programStats.map((prog, index) => (
                <BarRow
                  key={`ex-${prog.programId}`}
                  label={prog.programName}
                  value={prog.exerciseScore}
                  color="#10b981"
                  isHovered={hoveredBar === `ex-${index}`}
                  onHover={() => setHoveredBar(`ex-${index}`)}
                  onLeave={() => setHoveredBar(null)}
                />
              ))}
              {programStats.length === 0 && (
                <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Aucun programme</p>
              )}
            </div>
          </div>

          {/* Graphique 3 : Courbe de progression */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp size={18} color="#8b5cf6" />
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Courbe de progression</h3>
            </div>
            <CurveChart evaluations={evaluations} average={averageEval} />
          </div>
        </div>

        {/* COLONNE DROITE : Liste des tentatives */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '20px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: '100%',      // ← S'étire pour matcher la hauteur de gauche
          maxHeight: '800px'      // ← Limite max pour scroll si trop d'éléments
        }}>
          {/* Header avec filtres */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#64748b" />
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Historique</h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>({filteredAttempts.length})</span>
            </div>
            
            {/* Filtres */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'all', label: 'Tous' },
                { key: 'exercises', label: 'Exercices' },
                { key: 'evaluations', label: 'Évaluations' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: filter === f.key ? '#3b82f6' : '#f1f5f9',
                    color: filter === f.key ? 'white' : '#64748b',
                    transition: 'all 0.2s'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liste scrollable */}
          <div style={{ 
            flex: 1,               // ← Prend tout l'espace disponible
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            paddingRight: '4px'    // ← Espace pour la scrollbar
          }}>
            {filteredAttempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Target size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px' }}>Aucune tentative</p>
              </div>
            ) : (
              filteredAttempts.map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} navigate={navigate} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant StatCard
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{label}</p>
        <p style={{ fontSize: '22px', fontWeight: '700', color }}>{value}</p>
      </div>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} color={color} />
      </div>
    </div>
  </div>
);

// Composant BarRow avec hover stylé
const BarRow = ({ label, value, color, isHovered, onHover, onLeave }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 10px',
      borderRadius: '8px',
      background: isHovered ? '#f1f5f9' : 'transparent',
      transition: 'all 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
    title={label}
  >
    {/* Badge nom du programme au hover */}
    <div style={{
      minWidth: isHovered ? '100px' : '0px',
      maxWidth: isHovered ? '140px' : '0px',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      opacity: isHovered ? 1 : 0
    }}>
      <span style={{
        display: 'inline-block',
        fontSize: '11px',
        color: 'white',
        fontWeight: '600',
        padding: '4px 10px',
        borderRadius: '6px',
        background: color,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '130px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {label}
      </span>
    </div>

    {/* Barre de progression */}
    <div style={{ 
      flex: 1, 
      height: '10px', 
      background: '#e2e8f0', 
      borderRadius: '5px', 
      overflow: 'hidden',
      transition: 'all 0.2s'
    }}>
      <div style={{
        width: `${Math.min(value, 100)}%`,
        height: '100%',
        background: color,
        borderRadius: '5px',
        transition: 'width 0.3s'
      }} />
    </div>
    
    {/* Pourcentage */}
    <span style={{ 
      fontSize: '14px', 
      fontWeight: '700', 
      color: color, 
      minWidth: '50px', 
      textAlign: 'right' 
    }}>
      {value}%
    </span>
  </div>
);

// Composant AttemptRow amélioré
const AttemptRow = ({ attempt, navigate }) => {
  // DEBUG - à supprimer après
  console.log('🔗 ATTEMPT COMPLET:', attempt);

  const isEval = attempt.type === 'evaluation';
  const scoreColor = attempt.percentage >= 80 ? '#10b981' : attempt.percentage >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = attempt.percentage >= 80 ? 'Excellent' : attempt.percentage >= 50 ? 'Bien' : 'À revoir';

  // Construire l'URL des résultats
  const getResultsUrl = () => {
    console.log('🔗 Building URL:', {
      type: attempt.type,
      isEval: isEval,
      programId: attempt.programId,
      moduleId: attempt.moduleId
    });
    
    if (isEval) {
      const url = `/apprenant/program-evaluation/${attempt.programId}/results`;
      console.log('🔗 URL Evaluation:', url);
      return url;
    }
    
    const url = `/apprenant/programs/${attempt.programId}/modules/${attempt.moduleId}/exercises/results`;
    console.log('🔗 URL Exercise:', url);
    return url;
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px',
        borderRadius: '12px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s',
        cursor: 'pointer'
      }}
      onClick={() => {
        const url = getResultsUrl();
        
        console.log('📤 Navigation avec données:', attempt);
        
        // Passer TOUTES les données de l'attempt dans le state
        navigate(url, { 
          state: { 
            fromHistory: true,
            attempt: attempt,
            // Données explicites pour évaluation
            score: attempt.score,
            maxScore: attempt.maxScore,
            percentage: attempt.percentage,
            duration: attempt.duration,
            earnedPoints: attempt.earnedPoints,
            totalPoints: attempt.totalPoints,
            programName: attempt.programName,
            moduleName: attempt.moduleName,
            completedAt: attempt.completedAt,
            answers: attempt.answers,
            results: attempt.results,
            exerciseResults: attempt.exerciseResults
          } 
        });
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f1f5f9';
        e.currentTarget.style.borderColor = '#cbd5e1';
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#f8fafc';
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      {/* Icône type */}
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '10px',
        background: isEval ? '#fef3c7' : '#dbeafe',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {isEval ? <Trophy size={20} color="#f59e0b" /> : <BookOpen size={20} color="#3b82f6" />}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {attempt.programName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Date */}
          <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            {new Date(attempt.completedAt?.seconds * 1000 || attempt.completedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
          {/* Durée si disponible */}
          {attempt.duration && (
            <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              {Math.floor(attempt.duration / 60)}min {attempt.duration % 60}s
            </span>
          )}
          {/* Type badge */}
          <span style={{
            fontSize: '10px',
            fontWeight: '600',
            padding: '2px 6px',
            borderRadius: '4px',
            background: isEval ? '#fef3c7' : '#dbeafe',
            color: isEval ? '#b45309' : '#1d4ed8',
            textTransform: 'uppercase'
          }}>
            {isEval ? 'Évaluation' : 'Exercice'}
          </span>
        </div>
      </div>

      {/* Score + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: scoreColor
          }}>
            {attempt.percentage}%
          </div>
          {attempt.score !== undefined && attempt.maxScore !== undefined && (
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {attempt.score}/{attempt.maxScore} pts
            </div>
          )}
        </div>
        
        {/* Badge résultat */}
        <div style={{
          padding: '6px 10px',
          borderRadius: '8px',
          background: `${scoreColor}15`,
          fontSize: '11px',
          fontWeight: '600',
          color: scoreColor
        }}>
          {scoreLabel}
        </div>

        {/* Chevron */}
        <ChevronRight size={18} color="#94a3b8" />
      </div>
    </div>
  );
};

// Composant CurveChart (simplifié)
const CurveChart = ({ evaluations, average }) => {
  if (evaluations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
        <TrendingUp size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
        <p style={{ fontSize: '13px' }}>Aucune évaluation</p>
      </div>
    );
  }

  const height = 120;
  const points = evaluations.map((ev, index) => {
    const x = evaluations.length > 1 ? 10 + (index / (evaluations.length - 1)) * 80 : 50;
    const y = 100 - ev.percentage;
    return { x, y, ...ev };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ position: 'relative', height: `${height}px` }}>
      {/* Zone de réussite */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '20%',
        background: 'rgba(16, 185, 129, 0.1)',
        borderBottom: '1px dashed rgba(16, 185, 129, 0.4)',
        borderRadius: '8px 8px 0 0'
      }} />

      {/* SVG */}
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        {/* Ligne moyenne */}
        <line
          x1="0" y1={100 - average}
          x2="100" y2={100 - average}
          stroke="#f59e0b"
          strokeWidth="0.5"
          strokeDasharray="3,3"
        />
        
        {/* Courbe */}
        <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#8b5cf6" />
        ))}
      </svg>

      {/* Label moyenne */}
      <div style={{
        position: 'absolute',
        right: '4px',
        top: `${100 - average}%`,
        transform: 'translateY(-50%)',
        fontSize: '10px',
        color: '#f59e0b',
        fontWeight: '600'
      }}>
        {average}%
      </div>
    </div>
  );
};

export default ApprenantHistorique;
