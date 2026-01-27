import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 📊 SERVICE GESTION PROGRESSION APPRENANT
 * 
 * Structure Firestore :
 * ✅ NOUVELLE STRUCTURE : /userProgress/{userId}__{programId}
 *   - userId: string
 *   - programId: string
 *   - organizationId: string
 *   - completedLessons: [lessonId1, lessonId2, ...]
 *   - currentLesson: lessonId
 *   - lastAccessedAt: timestamp
 *   - percentage: 0-100
 *   - totalLessons: number
 *   - createdAt: timestamp
 *   - updatedAt: timestamp
 */

/**
 * Récupérer la progression d'un utilisateur sur un programme
 */
export async function getUserProgramProgress(userId, programId) {
  try {
    // ✅ Nouvelle structure
    const progressDocId = `${userId}__${programId}`;
    const progressRef = doc(db, 'userProgress', progressDocId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      return progressSnap.data();
    }
    
    // Première visite du programme
    return {
      completedLessons: [],
      currentLesson: null,
      lastAccessedAt: null,
      percentage: 0
    };
  } catch (error) {
    console.error('Erreur getUserProgramProgress:', error);
    throw error;
  }
}

/**
 * Récupérer toutes les progressions d'un utilisateur
 */
export async function getAllUserProgress(userId) {
  try {
    // ✅ Nouvelle structure : tous les documents commencent par userId__
    const progressRef = collection(db, 'userProgress');
    const q = query(progressRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const progressMap = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      // La clé est le programId
      progressMap[data.programId] = data;
    });
    
    return progressMap;
  } catch (error) {
    console.error('Erreur getAllUserProgress:', error);
    throw error;
  }
}

/**
 * Nettoyer les IDs de leçons obsolètes (qui n'existent plus)
 */
export async function cleanObsoleteLessons(userId, programId, validLessonIds) {
  try {
    // ✅ Nouvelle structure
    const progressDocId = `${userId}__${programId}`;
    const progressRef = doc(db, 'userProgress', progressDocId);
    const progressSnap = await getDoc(progressRef);
    
    if (!progressSnap.exists()) return;
    
    const data = progressSnap.data();
    const oldCompleted = data.completedLessons || [];
    
    // Filtrer pour garder uniquement les IDs qui existent encore
    const cleanedCompleted = oldCompleted.filter(id => validLessonIds.includes(id));
    
    if (cleanedCompleted.length !== oldCompleted.length) {
      const removed = oldCompleted.filter(id => !validLessonIds.includes(id));
      console.log('🧹 Nettoyage des leçons obsolètes:', {
        avant: oldCompleted.length,
        après: cleanedCompleted.length,
        supprimés: removed
      });
      
      // Mettre à jour la progression
      await setDoc(progressRef, {
        ...data,
        completedLessons: cleanedCompleted,
        lastAccessedAt: new Date().toISOString()
      }, { merge: true });
      
      return cleanedCompleted;
    }
    
    return oldCompleted;
  } catch (error) {
    console.error('Erreur cleanObsoleteLessons:', error);
    return [];
  }
}

/**
 * Marquer une leçon comme terminée
 */
export async function markLessonCompleted(userId, programId, lessonId, totalLessons, organizationId = null) {
  try {
    console.log('📝 markLessonCompleted appelé:', { userId, programId, lessonId, totalLessons });
    
    // ✅ NOUVELLE STRUCTURE
    const progressDocId = `${userId}__${programId}`;
    const progressRef = doc(db, 'userProgress', progressDocId);
    const progressSnap = await getDoc(progressRef);
    
    let completedLessons = [];
    
    if (progressSnap.exists()) {
      completedLessons = progressSnap.data().completedLessons || [];
      console.log('📚 Leçons déjà complétées:', completedLessons);
    }
    
    // Ajouter la leçon si pas déjà terminée
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
      console.log('✅ Leçon ajoutée aux complétées');
    } else {
      console.log('⚠️  Leçon déjà complétée, pas d\'ajout');
    }
    
    // Calculer avec protection max 100%
    const percentage = Math.min(
      Math.round((completedLessons.length / totalLessons) * 100),
      100
    );
    
    console.log('📊 Nouveau pourcentage calculé:', {
      completedLessons: completedLessons.length,
      totalLessons,
      percentage,
      liste: completedLessons
    });
    
    // ✅ SAUVEGARDE AVEC NOUVELLE STRUCTURE
    await setDoc(progressRef, {
      userId,
      programId,
      organizationId: organizationId || null,
      completedLessons,
      currentLesson: lessonId,
      lastAccessedAt: new Date().toISOString(),
      percentage,
      totalLessons,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('💾 Progression sauvegardée dans Firebase (nouvelle structure)');
    
    return { completedLessons, percentage };
  } catch (error) {
    console.error('Erreur markLessonCompleted:', error);
    throw error;
  }
}

/**
 * Mettre à jour la leçon en cours
 */
export async function updateCurrentLesson(userId, programId, lessonId) {
  try {
    // ✅ Nouvelle structure
    const progressDocId = `${userId}__${programId}`;
    const progressRef = doc(db, 'userProgress', progressDocId);
    
    await setDoc(progressRef, {
      userId,
      programId,
      currentLesson: lessonId,
      lastAccessedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Erreur updateCurrentLesson:', error);
    throw error;
  }
}

/**
 * Calculer la progression globale d'un utilisateur
 */
export async function calculateGlobalProgress(userId) {
  try {
    const allProgress = await getAllUserProgress(userId);
    
    if (Object.keys(allProgress).length === 0) {
      return 0;
    }
    
    const totalPercentage = Object.values(allProgress)
      .reduce((sum, prog) => sum + (prog.percentage || 0), 0);
    
    // Calculer la moyenne avec protection max 100%
    return Math.min(
      Math.round(totalPercentage / Object.keys(allProgress).length),
      100
    );
  } catch (error) {
    console.error('Erreur calculateGlobalProgress:', error);
    return 0;
  }
}

/**
 * Récupérer les programmes affectés à l'utilisateur avec leurs détails
 * @param {string} userId - ID de l'utilisateur
 * @param {string} organizationId - ID de l'organisation (optionnel)
 * @returns {Promise<Array>} Liste des programmes affectés avec le nombre de leçons
 */
export async function getUserAssignedProgramsWithDetails(userId, organizationId = null) {
  try {
    console.log('🔍 getUserAssignedProgramsWithDetails for user:', userId, 'org:', organizationId);
    
    // 1. Récupérer l'utilisateur
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.warn('⚠️ User document not found:', userId);
      return [];
    }
    
    const userData = userDoc.data();
    const assignedProgramIds = userData.assignedPrograms || [];
    const userOrgId = userData.organizationId || organizationId;
    
    console.log('📋 Assigned program IDs:', assignedProgramIds);
    console.log('🏢 User organizationId:', userOrgId);
    
    if (assignedProgramIds.length === 0) {
      console.log('ℹ️ No programs assigned to this user');
      return [];
    }
    
    // 2. Récupérer tous les programmes (depuis l'organisation si disponible)
    let allPrograms = [];
    
    // Essayer d'abord depuis l'organisation
    if (userOrgId) {
      const orgProgramsSnap = await getDocs(
        collection(db, 'organizations', userOrgId, 'programs')
      );
      allPrograms = orgProgramsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log('📚 Programmes depuis /organizations/' + userOrgId + '/programs:', allPrograms.length);
    }
    
    // Fallback vers /programs si vide
    if (allPrograms.length === 0) {
      const programsSnap = await getDocs(collection(db, 'programs'));
      allPrograms = programsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log('⚠️ Fallback: Programmes depuis /programs:', allPrograms.length);
    }
    
    // 3. Filtrer pour ne garder que les programmes affectés
    const assignedPrograms = allPrograms.filter(p => assignedProgramIds.includes(p.id));
    console.log('✅ Assigned programs found:', assignedPrograms.length);
    
    // 4. Pour chaque programme, compter les leçons VISIBLES
    const programsWithLessons = await Promise.all(
      assignedPrograms.map(async (program) => {
        let totalLessons = 0;
        
        // Compter les leçons dans tous les chapters VISIBLES (depuis l'organisation si disponible)
        let modulesSnap;
        if (userOrgId) {
          modulesSnap = await getDocs(
            collection(db, 'organizations', userOrgId, 'programs', program.id, 'chapitres')
          );
        } else {
          modulesSnap = await getDocs(
            collection(db, 'programs', program.id, 'chapitres')
          );
        }
        
        for (const chapterDoc of modulesSnap.docs) {
          const chapterData = chapterDoc.data();
          
          // ✅ Exclure les chapitres masqués
          if (chapterData.hidden === true) {
            console.log(`  🚫 Chapitre masqué ignoré: ${chapterData.name || chapterData.title}`);
            continue;
          }
          
          let lessonsSnap;
          if (userOrgId) {
            lessonsSnap = await getDocs(
              collection(db, 'organizations', userOrgId, 'programs', program.id, 'chapitres', chapterDoc.id, 'lessons')
            );
          } else {
            lessonsSnap = await getDocs(
              collection(db, 'programs', program.id, 'chapitres', chapterDoc.id, 'lessons')
            );
          }
          
          // ✅ Filtrer les leçons masquées
          const visibleLessonsCount = lessonsSnap.docs.filter(lessonDoc => {
            const lessonData = lessonDoc.data();
            return lessonData.hidden !== true;
          }).length;
          
          totalLessons += visibleLessonsCount;
        }
        
        console.log(`  → ${program.name || program.title}: ${totalLessons} leçons visibles`);
        
        return {
          ...program,
          totalLessons
        };
      })
    );
    
    console.log('🎉 getUserAssignedProgramsWithDetails completed:', programsWithLessons.length, 'programs');
    return programsWithLessons;
  } catch (error) {
    console.error('❌ Erreur getUserAssignedProgramsWithDetails:', error);
    return [];
  }
}
