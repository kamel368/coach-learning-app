import { useParams, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useExerciseSession } from '../../hooks/useExerciseSession';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Target } from 'lucide-react';
import FlashcardExercise from '../../components/exercises-apprenant/FlashcardExercise';
import TrueFalseExercise from '../../components/exercises-apprenant/TrueFalseExercise';
import QCMExercise from '../../components/exercises-apprenant/QCMExercise';
import QCMSelectiveExercise from '../../components/exercises-apprenant/QCMSelectiveExercise';
import ReorderExercise from '../../components/exercises-apprenant/ReorderExercise';
import DragDropExercise from '../../components/exercises-apprenant/DragDropExercise';
import MatchPairsExercise from '../../components/exercises-apprenant/MatchPairsExercise';

const BLOCK_LABELS = {
  flashcard: { icon: '🃏', label: 'Flashcard' },
  true_false: { icon: '✓✗', label: 'Vrai/Faux' },
  qcm: { icon: '☑', label: 'QCM' },
  qcm_selective: { icon: '☑☑', label: 'QCM Sélectif' },
  reorder: { icon: '🔢', label: 'Réorganiser' },
  drag_drop: { icon: '🎯', label: 'Glisser-Déposer' },
  match_pairs: { icon: '🔗', label: 'Paires' }
};

export default function ApprenantExercises() {
  const { programId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const {
    exercises,
    currentBlock,
    currentBlockIndex,
    totalBlocks,
    answers,
    answerBlock,
    goToNext,
    goToPrevious,
    submitAttempt,
    loading,
    submitting,
    isLastBlock,
    progress
  } = useExerciseSession(user?.uid, programId, moduleId);

  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!window.confirm('Terminer et soumettre les exercices ?')) return;
    
    const result = await submitAttempt();
    if (result.success) {
      navigate(`/apprenant/programs/${programId}/modules/${moduleId}/exercises/results`, {
        state: { results: result.results, duration: result.duration }
      });
    } else {
      alert('Erreur : ' + result.error);
    }
  };

  const renderExercise = () => {
    if (!currentBlock) return null;

    const commonProps = {
      block: currentBlock,
      answer: answers[currentBlock.id],
      onAnswer: (answer) => answerBlock(currentBlock.id, answer)
    };

    switch (currentBlock.type) {
      case 'flashcard':
        return <FlashcardExercise {...commonProps} />;
      case 'true_false':
        return <TrueFalseExercise {...commonProps} />;
      case 'qcm':
        return <QCMExercise {...commonProps} />;
      case 'qcm_selective':
        return <QCMSelectiveExercise {...commonProps} />;
      case 'reorder':
        return <ReorderExercise {...commonProps} />;
      case 'drag_drop':
        return <DragDropExercise {...commonProps} />;
      case 'match_pairs':
        return <MatchPairsExercise {...commonProps} />;
      default:
        return (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Type d'exercice "{currentBlock.type}" non implémenté
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#64748b' }}>
          Chargement des exercices...
        </div>
      </div>
    );
  }

  if (!exercises || totalBlocks === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
          Aucun exercice disponible
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Retour
        </button>
      </div>
    );
  }

  const blockInfo = BLOCK_LABELS[currentBlock?.type] || { icon: '❓', label: 'Exercice' };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '0'
    }}>
      {/* Header fixe */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '11px 17px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '11px'
        }}>
          {/* Gauche : Retour */}
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}/modules/${moduleId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '10px',
              fontWeight: '600',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >
            <ArrowLeft size={13} />
            Retour
          </button>

          {/* Centre : Stats */}
          <div style={{ display: 'flex', gap: '17px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color="#3b82f6" />
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#1e293b' }}>
                {formatTime(elapsedTime)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={13} color="#10b981" />
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#1e293b' }}>
                {currentBlockIndex + 1}/{totalBlocks}
              </span>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div style={{
          maxWidth: '1200px',
          margin: '11px auto 0',
          height: '4px',
          background: '#f1f5f9',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #10b981)',
            width: `${progress}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '22px 17px'
      }}>
        {/* Card exercice */}
        <div style={{
          background: 'white',
          borderRadius: '11px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '17px'
        }}>
          {/* Titre exercice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '17px',
            paddingBottom: '11px',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <span style={{ fontSize: '22px' }}>{blockInfo.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: '600', marginBottom: '3px' }}>
                EXERCICE {currentBlockIndex + 1}/{totalBlocks}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                {blockInfo.label}
              </div>
            </div>
            <div style={{
              padding: '4px 8px',
              background: '#fef3c7',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#92400e'
            }}>
              {currentBlock?.points || 0} pts
            </div>
          </div>

          {/* Contenu exercice */}
          {renderExercise()}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '11px'
        }}>
          <button
            onClick={goToPrevious}
            disabled={currentBlockIndex === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: currentBlockIndex === 0 ? '#f8fafc' : 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              fontSize: '10px',
              fontWeight: '600',
              color: currentBlockIndex === 0 ? '#cbd5e1' : '#1e293b',
              cursor: currentBlockIndex === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: currentBlockIndex === 0 ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <ChevronLeft size={13} />
            Précédent
          </button>

          {isLastBlock ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                background: submitting 
                  ? '#cbd5e1' 
                  : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '7px',
                fontSize: '10px',
                fontWeight: '600',
                color: 'white',
                cursor: submitting ? 'wait' : 'pointer',
                boxShadow: '0 2px 4px rgba(16,185,129,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {submitting ? 'Soumission...' : '✓ Terminer'}
            </button>
          ) : (
            <button
              onClick={goToNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none',
                borderRadius: '7px',
                fontSize: '10px',
                fontWeight: '600',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(59,130,246,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(59,130,246,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(59,130,246,0.3)';
              }}
            >
              Suivant
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
