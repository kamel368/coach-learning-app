import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getPrograms } from '../../services/supabase/programs';
import { getChaptersByProgram, countLessonsByChapter } from '../../services/supabase/chapters';
import { calculateProgramCompletion } from '../../services/supabase/progress';
import { ArrowLeft, BookOpen, Clock, ChevronRight, CheckCircle } from 'lucide-react';

export default function ApprenantProgramDetail() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { user, organizationId } = useSupabaseAuth();

  const [program, setProgram] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chaptersWithProgress, setChaptersWithProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programCompletion, setProgramCompletion] = useState(0);

  useEffect(() => {
    if (user && organizationId && programId) {
      loadProgramData();
    }
  }, [user, organizationId, programId]);

  const loadProgramData = async () => {
    try {
      setLoading(true);

      // 1. Charger le programme
      const { data: programs, error: programError } = await getPrograms(organizationId);
      
      if (programError) {
        console.error('Erreur chargement programme:', programError);
        setLoading(false);
        return;
      }

      const foundProgram = programs?.find(p => p.id === programId);
      
      if (!foundProgram) {
        console.error('Programme non trouvé');
        navigate('/apprenant/dashboard');
        return;
      }

      setProgram(foundProgram);

      // 2. Charger les chapitres
      const { data: chaptersData, error: chaptersError } = await getChaptersByProgram(programId);
      
      if (chaptersError) {
        console.error('Erreur chargement chapitres:', chaptersError);
        setLoading(false);
        return;
      }

      setChapters(chaptersData || []);

      // 3. Charger le nombre de leçons pour chaque chapitre
      const chaptersWithDetails = await Promise.all(
        (chaptersData || []).map(async (chapter) => {
          const { count } = await countLessonsByChapter(chapter.id);
          return {
            ...chapter,
            lessonsCount: count
          };
        })
      );

      setChaptersWithProgress(chaptersWithDetails);

      // 4. Calculer la progression globale
      const completion = await calculateProgramCompletion(user.id, programId);
      setProgramCompletion(completion);

      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleChapterClick = (chapterId) => {
    navigate(`/apprenant/programs/${programId}/chapters/${chapterId}`);
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f7fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 48, 
            marginBottom: 16 
          }}>📚</div>
          <div style={{ 
            fontSize: 16, 
            color: '#666' 
          }}>Chargement du programme...</div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f7fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Programme introuvable
          </div>
          <button
            onClick={() => navigate('/apprenant/dashboard')}
            style={{
              marginTop: 16,
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f7fa',
      padding: 24
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/apprenant/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: '#333'
          }}
        >
          <ArrowLeft size={18} />
          Retour au dashboard
        </button>
      </div>

      {/* Programme Info */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: 24 
        }}>
          <div style={{
            width: 80,
            height: 80,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BookOpen size={36} color="white" />
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              marginBottom: 8,
              color: '#1a1a1a'
            }}>
              {program.title || program.name}
            </h1>
            
            {program.description && (
              <p style={{ 
                fontSize: 15, 
                color: '#666', 
                lineHeight: 1.6,
                marginBottom: 16 
              }}>
                {program.description}
              </p>
            )}

            {/* Stats */}
            <div style={{ 
              display: 'flex', 
              gap: 24, 
              alignItems: 'center',
              marginTop: 16 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8 
              }}>
                <BookOpen size={18} color="#666" />
                <span style={{ fontSize: 14, color: '#666' }}>
                  {chapters.length} chapitre{chapters.length > 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8 
              }}>
                <Clock size={18} color="#666" />
                <span style={{ fontSize: 14, color: '#666' }}>
                  {program.duration_minutes || 0} min
                </span>
              </div>
            </div>
          </div>

          {/* Progression globale */}
          <div style={{
            textAlign: 'right',
            minWidth: 120
          }}>
            <div style={{ 
              fontSize: 42, 
              fontWeight: 700,
              color: programCompletion === 100 ? '#4CAF50' : '#3b82f6',
              marginBottom: 4 
            }}>
              {programCompletion}%
            </div>
            <div style={{ 
              fontSize: 13, 
              color: '#666' 
            }}>
              Complété
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            width: '100%',
            height: 12,
            background: '#e0e0e0',
            borderRadius: 6,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${programCompletion}%`,
              height: '100%',
              background: programCompletion === 100 
                ? 'linear-gradient(90deg, #4CAF50, #81C784)'
                : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Chapitres */}
      <div>
        <h2 style={{ 
          fontSize: 20, 
          fontWeight: 700, 
          marginBottom: 16,
          color: '#1a1a1a'
        }}>
          Chapitres
        </h2>

        {chaptersWithProgress.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <div style={{ fontSize: 16, color: '#666' }}>
              Aucun chapitre disponible pour le moment
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12 
          }}>
            {chaptersWithProgress.map((chapter, index) => (
              <div
                key={chapter.id}
                onClick={() => handleChapterClick(chapter.id)}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                {/* Numéro */}
                <div style={{
                  width: 48,
                  height: 48,
                  background: '#f0f4ff',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#3b82f6',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>

                {/* Contenu */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    marginBottom: 4,
                    color: '#1a1a1a'
                  }}>
                    {chapter.title}
                  </div>
                  {chapter.description && (
                    <div style={{ 
                      fontSize: 14, 
                      color: '#666',
                      marginBottom: 8
                    }}>
                      {chapter.description}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: 13, 
                    color: '#999' 
                  }}>
                    {chapter.lessonsCount} leçon{chapter.lessonsCount > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Flèche */}
                <ChevronRight size={24} color="#999" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
