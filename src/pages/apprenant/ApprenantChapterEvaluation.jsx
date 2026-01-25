import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChapterEvaluation } from '../../hooks/useChapterEvaluation';
import { useGamification } from '../../hooks/useGamification';

// Import des composants d'exercices
import FlashcardExercise from '../../components/exercises-apprenant/FlashcardExercise';
import TrueFalseExercise from '../../components/exercises-apprenant/TrueFalseExercise';
import QCMExercise from '../../components/exercises-apprenant/QCMExercise';
import QCMSelectiveExercise from '../../components/exercises-apprenant/QCMSelectiveExercise';
import ReorderExercise from '../../components/exercises-apprenant/ReorderExercise';
import DragDropExercise from '../../components/exercises-apprenant/DragDropExercise';
import MatchPairsExercise from '../../components/exercises-apprenant/MatchPairsExercise';
import TextExercise from '../../components/exercises-apprenant/TextExercise';

const BLOCK_LABELS = {
  flashcard: { icon: '🃏', label: 'Flashcard' },
  true_false: { icon: '✓✗', label: 'Vrai/Faux' },
  qcm: { icon: '○', label: 'QCM' },
  qcm_selective: { icon: '☑', label: 'QCM Sélectif' },
  reorder: { icon: '🔢', label: 'Réorganiser' },
  drag_drop: { icon: '🎯', label: 'Glisser-Déposer' },
  match_pairs: { icon: '🔗', label: 'Paires' }
};

export default function ApprenantChapterEvaluation() {
  const { programId, chapterId } = useParams();
  const navigate = useNavigate();
  const { user, organizationId } = useAuth();
  const [targetOrgId, setTargetOrgId] = useState(null);
  
  // Hook gamification
  const { onEvaluationCompleted } = useGamification(user?.uid);
  
  // Charger l'organizationId de l'utilisateur
  useEffect(() => {
    const loadOrgId = async () => {
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setTargetOrgId(userDoc.data().organizationId || organizationId);
        } else {
          setTargetOrgId(organizationId);
        }
      } else {
        setTargetOrgId(organizationId);
      }
    };
    loadOrgId();
  }, [user, organizationId]);
  
  const {
    evaluation,
    currentBlock,
    currentBlockIndex,
    totalBlocks,
    answers,
    answerBlock,
    goToNext,
    goToPrevious,
    submitEvaluation,
    loading,
    submitting,
    isLastBlock,
    progress
  } = useChapterEvaluation(user?.uid, programId, chapterId, targetOrgId);

  const [timer, setTimer] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    if (!window.confirm('Terminer l\'évaluation et voir les résultats ?')) return;
    
    const result = await submitEvaluation();
    if (result.success) {
      // ✅ Mettre à jour la gamification
      try {
        const percentage = result.results.score;
        console.log('🎮 Mise à jour gamification après évaluation:', { 
          percentage, 
          chapterId,
          resultId: result.resultId 
        });
        
        // Attribuer XP et marquer l'évaluation comme récompensée
        await onEvaluationCompleted(percentage, chapterId);
        console.log('✅ Gamification mise à jour avec succès');
      } catch (gamifError) {
        console.error('⚠️ Erreur mise à jour gamification (non bloquante):', gamifError);
      }
      
      navigate(`/apprenant/evaluation/${programId}/${chapterId}/results`, {
        state: {
          results: result.results,
          duration: result.duration
        }
      });
    } else {
      alert('Erreur lors de la soumission : ' + (result.error || 'Inconnue'));
    }
  };

  const renderExercise = () => {
    if (!currentBlock) return null;

    const answer = answers[currentBlock.id];
    const handleAnswer = (value) => answerBlock(currentBlock.id, value);

    switch (currentBlock.type) {
      case 'flashcard':
        return <FlashcardExercise block={currentBlock} answer={answer} onAnswer={handleAnswer} />;
      case 'true_false':
        return <TrueFalseExercise block={currentBlock} answer={answer} onAnswer={handleAnswer} />;
      case 'qcm':
        return <QCMExercise block={currentBlock} answer={answer} onAnswer={handleAnswer} />;
      case 'qcm_selective':
        return <QCMSelectiveExercise block={currentBlock} answer={answer} onAnswer={handleAnswer} />;
      case 'reorder':
        return <ReorderExercise block={currentBlock} answer={answer} onAnswer={handleAnswer} />;
      case 'drag_drop':
        return <DragDropExercise block={currentBlock} answer={answer} onAnswer={handleAnswer} />;
      case 'match_pairs':
        return <MatchPairsExercise block={currentBlock} answer={answer} onAnswer={handleAnswer} />;
      case 'text':
        return <TextExercise block={currentBlock} answer={answer} onAnswer={handleAnswer} />;
      default:
        return <div style={{ color: '#ef4444' }}>Type d'exercice non supporté: {currentBlock.type}</div>;
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
            width: '35px',
            height: '35px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#f093fb',
            borderRadius: '50%',
            margin: '0 auto 14px',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            Chargement de l'évaluation...
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation || totalBlocks === 0) {
    return (
      <div style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '28px'
      }}>
        <div style={{
          maxWidth: '420px',
          padding: '28px',
          background: 'white',
          borderRadius: '11px',
          boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '42px', marginBottom: '14px' }}>🏆</div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '7px' }}>
            Aucun exercice disponible
          </h3>
          <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '17px' }}>
            Ce chapitre ne contient pas encore d'exercices pour l'évaluation.
          </p>
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}/chapitres/${chapterId}`)}
            style={{
              padding: '8px 14px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#1e293b',
              cursor: 'pointer'
            }}
          >
            ← Retour au chapitre
          </button>
        </div>
      </div>
    );
  }

  const blockInfo = BLOCK_LABELS[currentBlock?.type] || { icon: '❓', label: 'Exercice' };

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header fixe */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '11px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}/chapitres/${chapterId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              background: 'transparent',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={12} />
            Retour
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748b' }}>
              ⏱️ {formatTime(timer)}
            </div>
            <div style={{
              padding: '5px 9px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '700',
              color: 'white'
            }}>
              <Trophy size={11} style={{ display: 'inline', marginRight: '4px' }} />
              Évaluation
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div style={{
          height: '5px',
          background: '#e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{
        flex: 1,
        padding: '14px',
        overflow: 'auto'
      }}>
        <div style={{ maxWidth: '630px', margin: '0 auto' }}>
          {/* Carte d'exercice */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            marginBottom: '14px'
          }}>
            {/* Header de l'exercice */}
            <div style={{
              padding: '11px 14px',
              background: '#fafbfc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '16px' }}>{blockInfo.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748b' }}>
                  {blockInfo.label}
                </span>
                {currentBlock?.sourceChapterTitle && (
                  <>
                    <span style={{ fontSize: '10px', color: '#cbd5e1' }}>•</span>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                      {currentBlock.sourceChapterTitle}
                    </span>
                  </>
                )}
              </div>
              <div style={{
                padding: '3px 6px',
                background: '#fef3c7',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: '600',
                color: '#92400e'
              }}>
                {currentBlock?.points || 0} pts
              </div>
            </div>

            {/* Contenu de l'exercice */}
            <div style={{ padding: '14px' }}>
              {renderExercise()}
            </div>
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <button
              onClick={goToPrevious}
              disabled={currentBlockIndex === 0}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '10px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: '600',
                color: currentBlockIndex === 0 ? '#cbd5e1' : '#64748b',
                cursor: currentBlockIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentBlockIndex === 0 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={14} />
              Précédent
            </button>

            <div style={{
              padding: '8px 12px',
              background: '#f8fafc',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#1e293b',
              whiteSpace: 'nowrap'
            }}>
              {currentBlockIndex + 1} / {totalBlocks}
            </div>

            {!isLastBlock ? (
              <button
                onClick={goToNext}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none',
                  borderRadius: '7px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(240, 147, 251, 0.3)'
                }}
              >
                Suivant
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={submitting}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '10px',
                  background: submitting ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '7px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: submitting ? 'wait' : 'pointer',
                  boxShadow: submitting ? 'none' : '0 3px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Trophy size={14} />
                {submitting ? 'Envoi...' : 'Terminer'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
