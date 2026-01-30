import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getChapter } from '../../services/supabase/chapters';
import { getLessonsWithProgress } from '../../services/supabase/lessons';
import { ArrowLeft, BookOpen, CheckCircle, Clock, Circle, PlayCircle } from 'lucide-react';

export default function ApprenantChapterDetail() {
  const { programId, chapterId } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();

  const [chapter, setChapter] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && chapterId) {
      loadChapterData();
    }
  }, [user, chapterId]);

  const loadChapterData = async () => {
    try {
      setLoading(true);

      // 1. Charger le chapitre
      const { data: chapterData, error: chapterError } = await getChapter(chapterId);
      
      if (chapterError) {
        console.error('Erreur chargement chapitre:', chapterError);
        setLoading(false);
        return;
      }

      if (!chapterData) {
        console.error('Chapitre non trouvé');
        navigate(`/apprenant/programs/${programId}`);
        return;
      }

      setChapter(chapterData);

      // 2. Charger les leçons avec progression
      const { data: lessonsData, error: lessonsError } = await getLessonsWithProgress(chapterId, user.id);
      
      if (lessonsError) {
        console.error('Erreur chargement leçons:', lessonsError);
        setLoading(false);
        return;
      }

      setLessons(lessonsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleLessonClick = (lessonId) => {
    navigate(`/apprenant/programs/${programId}/chapters/${chapterId}/lessons/${lessonId}`);
  };

  const getCompletionStats = () => {
    const completed = lessons.filter(l => l.completed).length;
    const total = lessons.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
          <div style={{ fontSize: 16, color: '#666' }}>
            Chargement du chapitre...
          </div>
        </div>
      </div>
    );
  }

  if (!chapter) {
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
            Chapitre introuvable
          </div>
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}`)}
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
            Retour au programme
          </button>
        </div>
      </div>
    );
  }

  const stats = getCompletionStats();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f7fa',
      padding: 24
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate(`/apprenant/programs/${programId}`)}
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
          Retour au programme
        </button>
      </div>

      {/* Chapter Info */}
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
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
              {chapter.title}
            </h1>
            
            {chapter.description && (
              <p style={{ 
                fontSize: 15, 
                color: '#666', 
                lineHeight: 1.6,
                marginBottom: 16 
              }}>
                {chapter.description}
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
                  {stats.total} leçon{stats.total > 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8 
              }}>
                <CheckCircle size={18} color="#4CAF50" />
                <span style={{ fontSize: 14, color: '#666' }}>
                  {stats.completed} complétée{stats.completed > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Progression */}
          <div style={{
            textAlign: 'right',
            minWidth: 120
          }}>
            <div style={{ 
              fontSize: 42, 
              fontWeight: 700,
              color: stats.percentage === 100 ? '#4CAF50' : '#3b82f6',
              marginBottom: 4 
            }}>
              {stats.percentage}%
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
              width: `${stats.percentage}%`,
              height: '100%',
              background: stats.percentage === 100 
                ? 'linear-gradient(90deg, #4CAF50, #81C784)'
                : 'linear-gradient(90deg, #f093fb, #f5576c)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Leçons */}
      <div>
        <h2 style={{ 
          fontSize: 20, 
          fontWeight: 700, 
          marginBottom: 16,
          color: '#1a1a1a'
        }}>
          Leçons
        </h2>

        {lessons.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <div style={{ fontSize: 16, color: '#666' }}>
              Aucune leçon disponible pour le moment
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12 
          }}>
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson.id)}
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
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  opacity: lesson.completed ? 0.8 : 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = lesson.completed ? '#4CAF50' : '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = lesson.completed 
                    ? '0 4px 12px rgba(76, 175, 80, 0.2)'
                    : '0 4px 12px rgba(59, 130, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                {/* Icône de statut */}
                <div style={{
                  width: 48,
                  height: 48,
                  background: lesson.completed ? '#e8f5e9' : '#f0f4ff',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {lesson.completed ? (
                    <CheckCircle size={24} color="#4CAF50" />
                  ) : lesson.reading_progress > 0 ? (
                    <PlayCircle size={24} color="#3b82f6" />
                  ) : (
                    <Circle size={24} color="#999" />
                  )}
                </div>

                {/* Contenu */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    marginBottom: 4,
                    color: '#1a1a1a',
                    textDecoration: lesson.completed ? 'line-through' : 'none'
                  }}>
                    {lesson.title}
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    color: '#999',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    {lesson.duration_minutes && (
                      <>
                        <Clock size={14} />
                        <span>{lesson.duration_minutes} min</span>
                      </>
                    )}
                    {lesson.completed && (
                      <span style={{ 
                        marginLeft: 8,
                        padding: '2px 8px',
                        background: '#e8f5e9',
                        color: '#4CAF50',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        ✓ Terminée
                      </span>
                    )}
                    {!lesson.completed && lesson.reading_progress > 0 && (
                      <span style={{ 
                        marginLeft: 8,
                        padding: '2px 8px',
                        background: '#f0f4ff',
                        color: '#3b82f6',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        En cours ({lesson.reading_progress}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Bouton */}
                <button
                  style={{
                    padding: '10px 20px',
                    background: lesson.completed 
                      ? 'linear-gradient(135deg, #4CAF50, #81C784)'
                      : 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    flexShrink: 0
                  }}
                >
                  {lesson.completed ? 'Revoir' : lesson.reading_progress > 0 ? 'Continuer' : 'Commencer'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
