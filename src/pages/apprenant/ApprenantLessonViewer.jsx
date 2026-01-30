import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getLesson, getLessonsByChapter } from '../../services/supabase/lessons';
import { getChapter } from '../../services/supabase/chapters';
import { markLessonCompleted } from '../../services/supabase/progress';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import LessonContentRenderer from '../../components/LessonContentRenderer';

export default function ApprenantLessonViewer() {
  const { programId, chapterId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();

  const [lesson, setLesson] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    if (user && lessonId && chapterId) {
      loadLessonData();
    }
  }, [user, lessonId, chapterId]);

  const loadLessonData = async () => {
    try {
      setLoading(true);

      // 1. Charger la leçon
      const { data: lessonData, error: lessonError } = await getLesson(lessonId);
      
      if (lessonError || !lessonData) {
        console.error('Erreur chargement leçon:', lessonError);
        navigate(`/apprenant/programs/${programId}/chapters/${chapterId}`);
        return;
      }

      setLesson(lessonData);

      // 2. Charger le chapitre (pour le titre)
      const { data: chapterData } = await getChapter(chapterId);
      setChapter(chapterData);

      // 3. Charger toutes les leçons du chapitre (pour navigation)
      const { data: lessonsData } = await getLessonsByChapter(chapterId);
      setAllLessons(lessonsData || []);

      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!user || !lessonId) return;

    try {
      setMarkingComplete(true);
      
      const { error } = await markLessonCompleted(user.id, lessonId);
      
      if (error) {
        console.error('Erreur marquage complétion:', error);
        alert('Erreur lors du marquage de la leçon comme complétée');
      } else {
        console.log('✅ Leçon marquée comme complétée');
        
        // Naviguer vers la prochaine leçon ou retour au chapitre
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        const nextLesson = allLessons[currentIndex + 1];
        
        if (nextLesson) {
          navigate(`/apprenant/programs/${programId}/chapters/${chapterId}/lessons/${nextLesson.id}`);
        } else {
          // Dernière leçon, retour au chapitre
          navigate(`/apprenant/programs/${programId}/chapters/${chapterId}`);
        }
      }
      
      setMarkingComplete(false);
    } catch (error) {
      console.error('Exception:', error);
      setMarkingComplete(false);
    }
  };

  const handlePrevious = () => {
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    const prevLesson = allLessons[currentIndex - 1];
    
    if (prevLesson) {
      navigate(`/apprenant/programs/${programId}/chapters/${chapterId}/lessons/${prevLesson.id}`);
    }
  };

  const handleNext = () => {
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    const nextLesson = allLessons[currentIndex + 1];
    
    if (nextLesson) {
      navigate(`/apprenant/programs/${programId}/chapters/${chapterId}/lessons/${nextLesson.id}`);
    }
  };

  const getCurrentLessonIndex = () => {
    return allLessons.findIndex(l => l.id === lessonId);
  };

  const hasPrevious = () => getCurrentLessonIndex() > 0;
  const hasNext = () => getCurrentLessonIndex() < allLessons.length - 1;

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
            Chargement de la leçon...
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
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
            Leçon introuvable
          </div>
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}/chapters/${chapterId}`)}
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
            Retour au chapitre
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f7fa'
    }}>
      {/* Header fixe */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => navigate(`/apprenant/programs/${programId}/chapters/${chapterId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: '#333'
            }}
          >
            <ArrowLeft size={18} />
            Retour au chapitre
          </button>

          <div style={{ 
            flex: 1, 
            textAlign: 'center',
            padding: '0 24px'
          }}>
            <div style={{ 
              fontSize: 12, 
              color: '#999',
              marginBottom: 4
            }}>
              {chapter?.title || 'Chapitre'}
            </div>
            <div style={{ 
              fontSize: 16, 
              fontWeight: 600,
              color: '#1a1a1a'
            }}>
              {lesson.title}
            </div>
          </div>

          <div style={{ 
            fontSize: 14, 
            color: '#666' 
          }}>
            {getCurrentLessonIndex() + 1} / {allLessons.length}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Titre de la leçon */}
        <h1 style={{
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 16,
          color: '#1a1a1a'
        }}>
          {lesson.title}
        </h1>

        {lesson.duration_minutes && (
          <div style={{
            fontSize: 14,
            color: '#999',
            marginBottom: 32
          }}>
            📖 Temps de lecture estimé : {lesson.duration_minutes} min
          </div>
        )}

        {/* Contenu de la leçon */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 48,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: 32
        }}>
          <LessonContentRenderer editorData={lesson.editor_data} />
        </div>

        {/* Bouton Marquer comme complétée */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: 32,
          textAlign: 'center'
        }}>
          <button
            onClick={handleMarkComplete}
            disabled={markingComplete}
            style={{
              padding: '16px 48px',
              background: markingComplete 
                ? '#ccc' 
                : 'linear-gradient(135deg, #4CAF50, #81C784)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              cursor: markingComplete ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!markingComplete) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(76, 175, 80, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <CheckCircle size={20} />
            {markingComplete ? 'Enregistrement...' : 'Marquer comme complétée'}
          </button>

          <div style={{
            marginTop: 16,
            fontSize: 14,
            color: '#666'
          }}>
            {hasNext() 
              ? 'Vous serez redirigé vers la prochaine leçon'
              : 'Vous serez redirigé vers le chapitre'
            }
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16
        }}>
          <button
            onClick={handlePrevious}
            disabled={!hasPrevious()}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: hasPrevious() ? 'white' : '#f5f7fa',
              border: hasPrevious() ? '2px solid #e0e0e0' : '2px solid transparent',
              borderRadius: 12,
              cursor: hasPrevious() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 600,
              color: hasPrevious() ? '#333' : '#999'
            }}
          >
            <ChevronLeft size={20} />
            Leçon précédente
          </button>

          <button
            onClick={handleNext}
            disabled={!hasNext()}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: hasNext() ? 'white' : '#f5f7fa',
              border: hasNext() ? '2px solid #e0e0e0' : '2px solid transparent',
              borderRadius: 12,
              cursor: hasNext() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 600,
              color: hasNext() ? '#333' : '#999'
            }}
          >
            Leçon suivante
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
