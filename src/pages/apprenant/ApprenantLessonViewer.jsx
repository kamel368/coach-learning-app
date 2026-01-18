import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { markLessonCompleted, updateCurrentLesson } from '../../services/progressionService';

export default function ApprenantLessonViewer() {
  const { programId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState(null);
  const [module, setModule] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [programId, moduleId, lessonId]);

  async function loadData() {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      // Récupérer le programme
      const programDoc = await getDoc(doc(db, 'programs', programId));
      if (programDoc.exists()) {
        setProgram({ id: programDoc.id, ...programDoc.data() });
      }

      // Récupérer le module
      const moduleDoc = await getDoc(
        doc(db, `programs/${programId}/modules/${moduleId}`)
      );
      
      if (moduleDoc.exists()) {
        setModule({ id: moduleDoc.id, ...moduleDoc.data() });
      }

      // Récupérer toutes les leçons du module pour navigation
      const lessonsRef = collection(db, `programs/${programId}/modules/${moduleId}/lessons`);
      const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
      const lessonsSnap = await getDocs(lessonsQuery);
      
      const lessonsData = lessonsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAllLessons(lessonsData);

      // Trouver l'index de la leçon actuelle
      const index = lessonsData.findIndex(l => l.id === lessonId);
      setCurrentIndex(index);

      // Récupérer la leçon actuelle
      const currentLesson = lessonsData[index];
      if (currentLesson) {
        setLesson(currentLesson);
        
        // Marquer comme leçon en cours
        await updateCurrentLesson(user.uid, programId, lessonId);
      }

    } catch (error) {
      console.error('Erreur chargement leçon:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    try {
      setCompleting(true);
      const user = auth.currentUser;
      
      // Marquer la leçon comme terminée
      await markLessonCompleted(user.uid, programId, lessonId, allLessons.length);

      // Vérifier s'il y a une leçon suivante
      if (currentIndex < allLessons.length - 1) {
        // Aller à la leçon suivante
        const nextLesson = allLessons[currentIndex + 1];
        navigate(`/apprenant/programs/${programId}/modules/${moduleId}/lessons/${nextLesson.id}`);
      } else {
        // Dernière leçon, retour au module
        navigate(`/apprenant/programs/${programId}/modules/${moduleId}`);
      }
    } catch (error) {
      console.error('Erreur marquage leçon:', error);
    } finally {
      setCompleting(false);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      navigate(`/apprenant/programs/${programId}/modules/${moduleId}/lessons/${prevLesson.id}`);
    }
  }

  function handleNext() {
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      navigate(`/apprenant/programs/${programId}/modules/${moduleId}/lessons/${nextLesson.id}`);
    }
  }

  function renderBlock(block, index) {
    if (!block || !block.type) return null;

    const blockStyle = {
      marginBottom: '24px',
      animation: `fadeIn 0.5s ease ${index * 0.1}s both`
    };

    switch (block.type) {
      case 'text':
        return (
          <div 
            key={index}
            style={{
              ...blockStyle,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              maxWidth: '100%'
            }}
            dangerouslySetInnerHTML={{ __html: block.data?.html || block.data?.text || '' }}
          />
        );

      case 'header':
        const HeadingTag = `h${block.data?.level || 2}`;
        return (
          <HeadingTag
            key={index}
            style={{
              ...blockStyle,
              fontSize: block.data?.level === 1 ? 'clamp(24px, 6vw, 32px)' : 
                        block.data?.level === 2 ? 'clamp(22px, 5vw, 28px)' : 
                        block.data?.level === 3 ? 'clamp(20px, 4vw, 24px)' : 'clamp(18px, 3.5vw, 20px)',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '16px',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto'
            }}
          >
            {block.data?.text || ''}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p
            key={index}
            style={{
              ...blockStyle,
              fontSize: 'clamp(14px, 3vw, 16px)',
              lineHeight: '1.7',
              color: '#475569',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto'
            }}
          >
            {block.data?.text || ''}
          </p>
        );

      case 'image':
        return (
          <div key={index} style={blockStyle}>
            <img
              src={block.data?.url || block.data?.file?.url}
              alt={block.data?.caption || 'Image'}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 'clamp(8px, 2vw, 12px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            />
            {block.data?.caption && (
              <p style={{
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                color: '#94a3b8',
                marginTop: '8px',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                {block.data.caption}
              </p>
            )}
          </div>
        );

      case 'list':
        const ListTag = block.data?.style === 'ordered' ? 'ol' : 'ul';
        return (
          <ListTag
            key={index}
            style={{
              ...blockStyle,
              paddingLeft: '24px',
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#475569'
            }}
          >
            {block.data?.items?.map((item, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>
                {item}
              </li>
            ))}
          </ListTag>
        );

      case 'code':
        return (
          <pre
            key={index}
            style={{
              ...blockStyle,
              background: '#1e293b',
              color: '#e2e8f0',
              padding: 'clamp(16px, 3vw, 20px)',
              borderRadius: 'clamp(8px, 2vw, 12px)',
              overflow: 'auto',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontFamily: 'monospace',
              lineHeight: '1.5'
            }}
          >
            <code>{block.data?.code || ''}</code>
          </pre>
        );

      case 'quote':
        return (
          <blockquote
            key={index}
            style={{
              ...blockStyle,
              borderLeft: '4px solid #8b5cf6',
              paddingLeft: '20px',
              fontStyle: 'italic',
              fontSize: '18px',
              color: '#64748b',
              margin: '24px 0'
            }}
          >
            {block.data?.text || ''}
            {block.data?.caption && (
              <footer style={{
                fontSize: '14px',
                marginTop: '8px',
                color: '#94a3b8'
              }}>
                — {block.data.caption}
              </footer>
            )}
          </blockquote>
        );

      case 'delimiter':
        return (
          <div
            key={index}
            style={{
              ...blockStyle,
              textAlign: 'center',
              fontSize: '24px',
              color: '#cbd5e1',
              margin: '32px 0'
            }}
          >
            * * *
          </div>
        );

      case 'warning':
        return (
          <div
            key={index}
            style={{
              ...blockStyle,
              padding: '16px 20px',
              background: '#fef3c7',
              border: '2px solid #fbbf24',
              borderRadius: '12px',
              display: 'flex',
              gap: '12px',
              alignItems: 'start'
            }}
          >
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              {block.data?.title && (
                <div style={{
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '4px'
                }}>
                  {block.data.title}
                </div>
              )}
              <div style={{ color: '#78350f', fontSize: '14px' }}>
                {block.data?.message || ''}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div
            key={index}
            style={{
              ...blockStyle,
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#64748b'
            }}
          >
            Bloc non supporté : {block.type}
          </div>
        );
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#64748b'
      }}>
        Chargement...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{
        padding: 'clamp(24px, 5vw, 40px)',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: 'clamp(16px, 3vw, 18px)', color: '#64748b' }}>
          Leçon introuvable
        </p>
        <button
          onClick={() => navigate(`/apprenant/programs/${programId}/modules/${moduleId}`)}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: 'clamp(14px, 3vw, 16px)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Retour au module
        </button>
      </div>
    );
  }

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allLessons.length - 1;
  const isLastLesson = currentIndex === allLessons.length - 1;

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Styles globaux pour le contenu des leçons */
          .lesson-content * {
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
          }
          
          .lesson-content p,
          .lesson-content div,
          .lesson-content h1,
          .lesson-content h2,
          .lesson-content h3,
          .lesson-content h4,
          .lesson-content h5,
          .lesson-content h6,
          .lesson-content span,
          .lesson-content li {
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
          }
          
          @media (max-width: 768px) {
            .lesson-content {
              padding: 16px !important;
            }
            
            .lesson-content img {
              max-width: 100%;
              height: auto !important;
            }
            
            .lesson-content pre {
              font-size: 12px;
              overflow-x: auto;
              max-width: 100%;
            }
            
            .lesson-content p,
            .lesson-content div {
              word-break: break-word;
            }
          }
        `}
      </style>

      <div style={{
        minHeight: '100%',
        background: '#f8fafc'
      }}>
        {/* Header fixe */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 32px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {/* Bouton retour */}
            <button
              onClick={() => navigate(`/apprenant/programs/${programId}/modules/${moduleId}`)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: 'clamp(13px, 2.5vw, 14px)',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>←</span>
              <span style={{ display: window.innerWidth < 400 ? 'none' : 'inline' }}>
                Retour au module
              </span>
              <span style={{ display: window.innerWidth >= 400 ? 'none' : 'inline' }}>
                Retour
              </span>
            </button>

            {/* Progress */}
            <div style={{
              fontSize: 'clamp(13px, 2.5vw, 14px)',
              color: '#64748b',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}>
              Leçon {currentIndex + 1} / {allLessons.length}
            </div>
          </div>
        </div>

        {/* Contenu leçon */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(20px, 3vw, 32px) clamp(16px, 3vw, 24px)',
          paddingBottom: 'clamp(40px, 6vw, 60px)'
        }}>
          {/* Titre leçon */}
          <div style={{
            background: 'white',
            borderRadius: 'clamp(12px, 2.5vw, 18px)',
            padding: 'clamp(18px, 3.5vw, 30px)',
            marginBottom: 'clamp(16px, 3vw, 24px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {/* Breadcrumb */}
            {program && module && (
              <div style={{
                fontSize: 'clamp(11px, 2vw, 13px)',
                color: '#94a3b8',
                marginBottom: '12px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {program.name} / {module.title}
              </div>
            )}

            <h1 style={{
              fontSize: 'clamp(16px, 4vw, 20px)',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '6px',
              letterSpacing: '-0.5px',
              lineHeight: '1.2'
            }}>
              {lesson.title || `Leçon ${currentIndex + 1}`}
            </h1>

            {/* Barre de progression */}
            <div style={{
              marginTop: 'clamp(16px, 3vw, 24px)',
              width: '100%',
              height: 'clamp(4px, 1vw, 6px)',
              background: '#e2e8f0',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${((currentIndex + 1) / allLessons.length) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* Blocs de contenu */}
          <div 
            className="lesson-content"
            style={{
              background: 'white',
              borderRadius: 'clamp(12px, 2.5vw, 18px)',
              padding: 'clamp(20px, 4vw, 36px)',
              marginBottom: 'clamp(20px, 3vw, 28px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              minHeight: '300px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {lesson.blocks && lesson.blocks.length > 0 ? (
              lesson.blocks.map((block, index) => renderBlock(block, index))
            ) : (
              <p style={{
                fontSize: 'clamp(14px, 3vw, 16px)',
                color: '#94a3b8',
                textAlign: 'center',
                padding: 'clamp(32px, 6vw, 40px)'
              }}>
                Cette leçon ne contient pas encore de contenu.
              </p>
            )}
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'clamp(12px, 3vw, 16px)',
            flexWrap: window.innerWidth < 500 ? 'wrap' : 'nowrap'
          }}>
            {/* Bouton précédent */}
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              style={{
                flex: window.innerWidth < 500 ? '1 1 100%' : '0 1 auto',
                padding: 'clamp(12px, 2.5vw, 14px) clamp(20px, 4vw, 24px)',
                background: hasPrevious ? 'white' : '#f1f5f9',
                color: hasPrevious ? '#64748b' : '#cbd5e1',
                border: hasPrevious ? '2px solid #e2e8f0' : '2px solid #f1f5f9',
                borderRadius: '12px',
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: '600',
                cursor: hasPrevious ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (hasPrevious) {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.color = '#8b5cf6';
                }
              }}
              onMouseLeave={(e) => {
                if (hasPrevious) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              <span>←</span>
              <span style={{ display: window.innerWidth < 400 ? 'none' : 'inline' }}>
                Précédent
              </span>
            </button>

            {/* Bouton terminer / suivant */}
            <button
              onClick={isLastLesson ? handleComplete : handleNext}
              disabled={completing}
              style={{
                flex: window.innerWidth < 500 ? '1 1 100%' : '1 1 auto',
                padding: 'clamp(12px, 2.5vw, 14px) clamp(24px, 5vw, 32px)',
                background: completing 
                  ? '#cbd5e1'
                  : isLastLesson 
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: '600',
                cursor: completing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!completing) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!completing) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <span style={{ 
                fontSize: window.innerWidth < 400 ? 'clamp(13px, 3vw, 14px)' : 'inherit'
              }}>
                {completing ? 'Chargement...' : isLastLesson ? 'Terminer' : 'Suivant'}
              </span>
              {!completing && <span>{isLastLesson ? '✓' : '→'}</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
