import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getAllUserProgress, calculateGlobalProgress, getUserAssignedProgramsWithDetails } from '../../services/progressionService';
import { BookOpen, TrendingUp, ArrowRight, Clock, CheckCircle2, Zap, Flame, Trophy, Award, ChevronRight } from 'lucide-react';
import { apprenantTheme, cardStyles, buttonStyles } from '../../styles/apprenantTheme';
import { useGamification, LEVELS, BADGES_CONFIG } from '../../hooks/useGamification';
import { useViewAs } from '../../hooks/useViewAs';
import ViewAsBanner from '../../components/ViewAsBanner';
import { useAuth } from '../../context/AuthContext';

export default function ApprenantDashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Ajout pour détecter les changements de navigation
  const [programs, setPrograms] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [globalProgress, setGlobalProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [categories, setCategories] = useState([]); // Liste des catégories

  // Mode "Voir comme"
  const user = auth.currentUser;
  const { isViewingAs, targetUserId, viewAsUserName } = useViewAs();
  
  // Récupérer l'organizationId pour charger les programmes depuis l'organisation
  const { organizationId } = useAuth();

  // Hook gamification - utiliser targetUserId
  const { 
    gamificationData, 
    currentLevel, 
    levelProgress, 
    unlockedBadges,
    loading: gamifLoading 
  } = useGamification(targetUserId);

  // ✅ Recharger les données à chaque changement de location (navigation)
  useEffect(() => {
    if (organizationId) {
      console.log('🔄 Rechargement du dashboard (navigation détectée)', {
        organizationId,
        targetUserId,
        locationKey: location.key,
        pathname: location.pathname,
        timestamp: new Date().toISOString()
      });
      loadData();
    }
  }, [organizationId, targetUserId, location.pathname, location.key]); // ✅ Ajout de pathname ET key
  
  // ✅ NOUVEAU: Recharger aussi quand la page redevient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && organizationId) {
        console.log('👁️ Page dashboard visible, rechargement des données');
        loadData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [organizationId]);

  async function loadData() {
    try {
      const user = auth.currentUser;
      if (!user && !isViewingAs) {
        navigate('/login');
        return;
      }

      // Récupérer info utilisateur (utiliser targetUserId pour le mode viewAs)
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserName(isViewingAs ? (viewAsUserName || userData.displayName || userData.name) : (userData.displayName || userData.name || 'Apprenant'));
      }

      // Récupérer les programmes affectés à l'utilisateur
      console.log('🔍 Fetching assigned programs for user:', targetUserId, isViewingAs ? '(Mode Voir comme)' : '');
      console.log('🏢 Using organizationId:', organizationId);
      const assignedPrograms = await getUserAssignedProgramsWithDetails(targetUserId, organizationId);
      console.log('✅ Assigned programs:', assignedPrograms);

      // Enrichir chaque programme avec sa progression de lecture
      console.log('📊 Enrichissement des programmes avec progression...');
      const programsWithProgress = await Promise.all(
        assignedPrograms.map(async (program) => {
          try {
            // ✅ Nouvelle structure: /userProgress/{userId}__{programId}
            const progressDocId = `${targetUserId}__${program.id}`;
            const progressRef = doc(db, 'userProgress', progressDocId);
            const progressSnap = await getDoc(progressRef);
            
            if (progressSnap.exists()) {
              const data = progressSnap.data();
              const completedCount = data.completedLessons?.length || 0;
              console.log(`  → ${program.name}: ${completedCount}/${program.totalLessons} leçons complétées`, {
                completedLessons: data.completedLessons,
                percentage: data.percentage
              });
              return {
                ...program,
                completedLessons: completedCount,
                readingProgress: data.percentage || 0
              };
            }
            console.log(`  → ${program.name}: 0/${program.totalLessons} leçons (pas de progression)`,);
            return {
              ...program,
              completedLessons: 0,
              readingProgress: 0
            };
          } catch (error) {
            console.error('❌ Erreur récupération progression pour', program.id, error);
            return {
              ...program,
              completedLessons: 0,
              readingProgress: 0
            };
          }
        })
      );

      console.log('✅ Programmes avec progression:', programsWithProgress.map(p => ({
        name: p.name,
        completed: p.completedLessons,
        total: p.totalLessons,
        progress: p.readingProgress
      })));
      
      // Charger les catégories
      try {
        let categoriesSnap;
        if (organizationId) {
          categoriesSnap = await getDocs(collection(db, "organizations", organizationId, "categories"));
        } else {
          categoriesSnap = await getDocs(collection(db, "categories"));
        }
        
        const categoriesList = categoriesSnap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setCategories(categoriesList);
        console.log('📂 Catégories chargées:', categoriesList.length);
      } catch (error) {
        console.error('❌ Erreur chargement catégories:', error);
        setCategories([]);
      }
      
      setPrograms(programsWithProgress);

      // Charger la progression utilisateur (utiliser targetUserId en mode viewAs)
      const allProgress = await getAllUserProgress(targetUserId);
      setUserProgress(allProgress);

      // Calculer progression globale pour TOUS les programmes assignés (même ceux à 0%)
      const userDocSnap = await getDoc(doc(db, 'users', targetUserId));
      const assignedProgramIds = userDocSnap.exists() ? (userDocSnap.data().assignedPrograms || []) : [];
      
      console.log('📚 Programmes assignés (IDs):', assignedProgramIds);
      
      // Pour CHAQUE programme, récupérer sa progression (0 si pas de document)
      const progressions = await Promise.all(
        assignedProgramIds.map(async (programId) => {
          try {
            // ✅ Nouvelle structure: /userProgress/{userId}__{programId}
            const progressDocId = `${targetUserId}__${programId}`;
            const progressRef = doc(db, 'userProgress', progressDocId);
            const progressSnap = await getDoc(progressRef);
            
            if (progressSnap.exists() && progressSnap.data().percentage !== undefined) {
              return progressSnap.data().percentage;
            }
            return 0; // Programme pas commencé = 0%
          } catch (error) {
            console.error('Erreur récupération progression pour', programId, error);
            return 0;
          }
        })
      );
      
      console.log('📊 Progressions individuelles:', progressions);
      
      // Calculer la MOYENNE (pas la somme !)
      const globalProg = progressions.length > 0
        ? Math.round(progressions.reduce((sum, p) => sum + p, 0) / progressions.length)
        : 0;
      
      console.log('📈 Progression globale calculée:', globalProg);
      
      // Afficher avec protection max 100%
      setGlobalProgress(Math.min(globalProg, 100));

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  }

  function getProgramStatus(programId) {
    // ✅ Guard de sécurité : vérifier que userProgress existe
    if (!userProgress || !userProgress[programId]) {
      return { label: 'Commencer', color: '#3b82f6' };
    }
    
    const progress = userProgress[programId];
    
    // ✅ Guard de sécurité : vérifier que completedLessons existe
    if (!progress.completedLessons || progress.completedLessons.length === 0) {
      return { label: 'Commencer', color: '#3b82f6' };
    } else if (progress.percentage === 100) {
      return { label: 'Terminé ✓', color: '#10b981' };
    } else {
      return { label: 'Continuer', color: '#8b5cf6' };
    }
  }

  // Grouper les programmes par catégorie
  function groupProgramsByCategory() {
    const grouped = {};
    
    programs.forEach(program => {
      const categoryId = program.categoryId || 'uncategorized';
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(program);
    });
    
    return grouped;
  }

  // Obtenir le nom d'une catégorie
  function getCategoryName(categoryId) {
    if (categoryId === 'uncategorized') return 'Sans catégorie';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.label : 'Catégorie inconnue';
  }

  // Obtenir l'icône d'une catégorie
  function getCategoryIcon(categoryId) {
    const icons = {
      'uncategorized': '📁',
      'commerce': '📊',
      'rh': '👥',
      'management': '💼',
      'formation': '🎓',
      'leadership': '🎯',
    };
    
    // Chercher par ID exact ou par label partiel
    const category = categories.find(c => c.id === categoryId);
    const label = category?.label?.toLowerCase() || '';
    
    if (label.includes('commerc')) return '📊';
    if (label.includes('rh') || label.includes('ressources')) return '👥';
    if (label.includes('manage') || label.includes('direction')) return '💼';
    if (label.includes('formation') || label.includes('enseign')) return '🎓';
    if (label.includes('leader')) return '🎯';
    
    return icons[categoryId] || '📚';
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: apprenantTheme.fontSize.lg,
        color: apprenantTheme.colors.textSecondary
      }}>
        Chargement...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100%',
      background: apprenantTheme.colors.bgApp
    }}>
      {/* Bandeau Mode Voir comme */}
      <ViewAsBanner />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: apprenantTheme.spacing.lg + ' ' + apprenantTheme.spacing.md,
        paddingBottom: 'clamp(40px, 6vw, 60px)'
      }}>
        
        {/* Header de bienvenue */}
        <div style={{
          background: apprenantTheme.colors.bgPrimary,
          borderRadius: apprenantTheme.radius.xl,
          padding: apprenantTheme.spacing.xl,
          marginBottom: apprenantTheme.spacing.lg,
          boxShadow: apprenantTheme.shadows.xl
        }}>
          <h1 style={{
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: '700',
            color: apprenantTheme.colors.textPrimary,
            marginBottom: '8px',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span>Bonjour {userName} !</span>
            <span style={{
              display: 'inline-block',
              animation: 'wave 2s ease-in-out infinite'
            }}>👋</span>
          </h1>

          <style>
            {`
              @keyframes wave {
                0%, 100% { transform: rotate(0deg); }
                10%, 30% { transform: rotate(14deg); }
                20% { transform: rotate(-8deg); }
                40% { transform: rotate(-4deg); }
                50% { transform: rotate(10deg); }
                60% { transform: rotate(0deg); }
              }
            `}
          </style>

          <p style={{
            fontSize: apprenantTheme.fontSize.lg,
            color: apprenantTheme.colors.textSecondary,
            marginBottom: apprenantTheme.spacing.lg,
            lineHeight: '1.6'
          }}>
            Continuez votre apprentissage là où vous vous êtes arrêté
          </p>
        </div>

        {/* Section Gamification */}
        {gamificationData && (
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
            color: 'white'
          }}>
            {/* Header avec niveau */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Niveau et XP */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Badge niveau */}
                <div style={{
                  width: '52px',
                  height: '52px',
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
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    marginBottom: '2px'
                  }}>
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
                    {gamificationData.xp || 0} XP
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px'
              }}>
                <Flame size={22} color="#ef4444" />
                <div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#ef4444'
                  }}>
                    {gamificationData.currentStreak || 0}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    jours
                  </div>
                </div>
              </div>
            </div>

            {/* Barre de progression niveau */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '6px'
              }}>
                <span>Progression niveau {currentLevel.level}</span>
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

            {/* Badges récents */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Trophy size={16} color="#fbbf24" />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  {unlockedBadges.length} badge{unlockedBadges.length > 1 ? 's' : ''} obtenu{unlockedBadges.length > 1 ? 's' : ''}
                </span>
                
                {/* Derniers badges */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginLeft: '8px'
                }}>
                  {unlockedBadges.slice(-5).map((badgeId) => {
                    const badge = BADGES_CONFIG[badgeId];
                    if (!badge) return null;
                    return (
                      <div
                        key={badgeId}
                        title={badge.name}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px'
                        }}
                      >
                        {badge.icon}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lien voir tous les badges */}
              <button
                onClick={() => navigate('/apprenant/badges')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
              >
                Voir tout
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Carte de bienvenue avec progression globale */}
        <div style={{
          background: apprenantTheme.colors.bgPrimary,
          borderRadius: apprenantTheme.radius.xl,
          padding: apprenantTheme.spacing.xl,
          marginBottom: apprenantTheme.spacing.lg,
          boxShadow: apprenantTheme.shadows.xl
        }}>
          {/* Progression globale */}
          <div style={{
            background: apprenantTheme.gradients.card,
            borderRadius: apprenantTheme.radius.lg,
            padding: apprenantTheme.spacing.md,
            border: `1px solid ${apprenantTheme.colors.border}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: apprenantTheme.fontSize.base,
                fontWeight: '600',
                color: apprenantTheme.colors.textPrimary
              }}>
                <TrendingUp size={20} color={apprenantTheme.colors.secondary} />
                <span>Progression globale</span>
              </div>
              <span style={{
                fontSize: apprenantTheme.fontSize['3xl'],
                fontWeight: '700',
                color: apprenantTheme.colors.secondary
              }}>
                {Math.min(globalProgress, 100)}%
              </span>
            </div>
            
            <div style={{
              width: '100%',
              height: 'clamp(10px, 2vw, 16px)',
              background: apprenantTheme.colors.bgTertiary,
              borderRadius: apprenantTheme.radius.full,
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${Math.min(globalProgress, 100)}%`,
                height: '100%',
                background: apprenantTheme.gradients.secondary,
                transition: 'width 0.5s ease',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
              }} />
            </div>
          </div>
        </div>

        {/* Section programmes groupés par catégories */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: apprenantTheme.fontSize['3xl'],
            fontWeight: '800',
            color: apprenantTheme.colors.primary,
            marginBottom: apprenantTheme.spacing.lg,
            paddingLeft: 'clamp(0px, 2vw, 8px)'
          }}>
            <BookOpen size={28} strokeWidth={2.5} />
            <span>Vos programmes de formation</span>
          </div>

          {programs.length === 0 ? (
            <div style={{
              background: apprenantTheme.colors.bgPrimary,
              borderRadius: apprenantTheme.radius.xl,
              padding: 'clamp(32px, 6vw, 60px)',
              textAlign: 'center',
              boxShadow: apprenantTheme.shadows.xl
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                borderRadius: apprenantTheme.radius.full,
                background: apprenantTheme.gradients.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={40} color={apprenantTheme.colors.textTertiary} />
              </div>
              <p style={{
                fontSize: apprenantTheme.fontSize.lg,
                color: apprenantTheme.colors.textSecondary,
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                Aucun programme affecté
              </p>
              <p style={{
                fontSize: apprenantTheme.fontSize.sm,
                color: apprenantTheme.colors.textTertiary
              }}>
                Contactez votre administrateur pour accéder à des programmes de formation
              </p>
            </div>
          ) : (
            <>
              {(() => {
                const groupedPrograms = groupProgramsByCategory();
                const categoryIds = Object.keys(groupedPrograms);
                
                // Trier : catégories avec nom d'abord, "uncategorized" à la fin
                const sortedCategoryIds = categoryIds.sort((a, b) => {
                  if (a === 'uncategorized') return 1;
                  if (b === 'uncategorized') return -1;
                  return getCategoryName(a).localeCompare(getCategoryName(b));
                });

                return sortedCategoryIds.map(categoryId => {
                  const categoryPrograms = groupedPrograms[categoryId];
                  const categoryName = getCategoryName(categoryId);
                  const categoryIcon = getCategoryIcon(categoryId);

                  return (
                    <div 
                      key={categoryId}
                      style={{
                        marginBottom: 'clamp(32px, 5vw, 48px)'
                      }}
                    >
                      {/* Header catégorie */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px',
                        paddingLeft: 'clamp(0px, 2vw, 8px)'
                      }}>
                        <div style={{
                          fontSize: 'clamp(28px, 6vw, 36px)'
                        }}>
                          {categoryIcon}
                        </div>
                        <div>
                          <h2 style={{
                            fontSize: 'clamp(18px, 4vw, 22px)',
                            fontWeight: '700',
                            color: apprenantTheme.colors.textPrimary,
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {categoryName}
                          </h2>
                          <p style={{
                            fontSize: 'clamp(12px, 2.5vw, 14px)',
                            color: apprenantTheme.colors.textSecondary,
                            margin: 0
                          }}>
                            {categoryPrograms.length} programme{categoryPrograms.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Grille programmes */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                        gap: apprenantTheme.spacing.md
                      }}>
                        {categoryPrograms.map((program) => (
                <div
                  key={program.id}
                  style={{
                    ...cardStyles.base,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    background: apprenantTheme.colors.bgPrimary
                  }}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, cardStyles.hover);
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, cardStyles.base);
                    e.currentTarget.style.background = apprenantTheme.colors.bgPrimary;
                  }}
                  onClick={() => navigate(`/apprenant/programs/${program.id}`)}
                >
                  {/* Header : Icône + Infos + Indicateur */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    marginBottom: '16px'
                  }}>
                    {/* Icône programme */}
                    <div style={{
                      width: 'clamp(40px, 8vw, 48px)',
                      height: 'clamp(40px, 8vw, 48px)',
                      borderRadius: apprenantTheme.radius.lg,
                      background: apprenantTheme.gradients.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: apprenantTheme.shadows.md,
                      flexShrink: 0
                    }}>
                      <BookOpen size={22} color="white" strokeWidth={2} />
                    </div>

                    {/* Nom et description */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: 'clamp(14px, 3vw, 15px)',
                        fontWeight: '700',
                        color: apprenantTheme.colors.textPrimary,
                        marginBottom: '4px',
                        lineHeight: '1.3',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {program.name}
                      </h3>
                      {program.description && (
                        <p style={{
                          fontSize: apprenantTheme.fontSize.sm,
                          color: apprenantTheme.colors.textSecondary,
                          lineHeight: '1.4',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {program.description}
                        </p>
                      )}
                    </div>

                    {/* INDICATEUR DISCRET À DROITE */}
                    {(() => {
                      const progress = program.readingProgress || 0;
                      const completed = program.completedLessons || 0;
                      const total = program.totalLessons || 0;

                      // Terminé (100%)
                      if (progress >= 100) {
                        return (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 8px',
                            background: '#dcfce7',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#16a34a',
                            flexShrink: 0
                          }}>
                            <CheckCircle2 size={12} />
                            Terminé
                          </div>
                        );
                      }

                      // En cours (1-99%)
                      if (progress > 0 || completed > 0) {
                        return (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0
                          }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#64748b'
                            }}>
                              {completed}/{total}
                            </span>
                            <div style={{
                              width: '40px',
                              height: '4px',
                              background: '#e2e8f0',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${Math.min(progress, 100)}%`,
                                height: '100%',
                                background: '#3b82f6',
                                borderRadius: '2px'
                              }} />
                            </div>
                          </div>
                        );
                      }

                      // Non commencé (0%)
                      return (
                        <span style={{
                          fontSize: '10px',
                          color: '#cbd5e1',
                          flexShrink: 0
                        }}>
                          Nouveau
                        </span>
                      );
                    })()}
                  </div>

                  {/* Barre de progression */}
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    background: '#e2e8f0', 
                    borderRadius: '999px', 
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: `${program.readingProgress || 0}%`,
                      height: '100%',
                      background: (program.readingProgress || 0) === 100 ? '#10b981' : '#3b82f6',
                      borderRadius: '999px',
                      transition: 'width 0.3s'
                    }} />
                  </div>

                  {/* Texte de progression */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '14px',
                    marginBottom: '16px'
                  }}>
                    <span style={{ 
                      fontWeight: '700', 
                      color: (program.readingProgress || 0) === 100 ? '#10b981' : '#3b82f6'
                    }}>
                      {program.readingProgress || 0}%
                    </span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ color: '#64748b' }}>
                      {program.completedLessons || 0}/{program.totalLessons || 0} leçons
                    </span>
                  </div>

                  {/* Bouton */}
                  <button
                    style={{
                      ...buttonStyles.primary.base,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: 'auto',
                      background: (program.readingProgress || 0) === 100 
                        ? '#10b981' 
                        : ((program.readingProgress || 0) > 0 ? '#8b5cf6' : buttonStyles.primary.base.background)
                    }}
                    onMouseEnter={(e) => {
                      const progress = program.readingProgress || 0;
                      if (progress === 100) {
                        e.currentTarget.style.background = '#059669';
                      } else if (progress > 0) {
                        e.currentTarget.style.background = '#7c3aed';
                      } else {
                        Object.assign(e.currentTarget.style, buttonStyles.primary.hover);
                      }
                    }}
                    onMouseLeave={(e) => {
                      const progress = program.readingProgress || 0;
                      if (progress === 100) {
                        e.currentTarget.style.background = '#10b981';
                      } else if (progress > 0) {
                        e.currentTarget.style.background = '#8b5cf6';
                      } else {
                        Object.assign(e.currentTarget.style, buttonStyles.primary.base);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/apprenant/programs/${program.id}`);
                    }}
                  >
                    <span>
                      {(program.readingProgress || 0) === 100 ? 'Revoir' : 
                       (program.readingProgress || 0) > 0 ? 'Continuer' : 
                       'Commencer'}
                    </span>
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
