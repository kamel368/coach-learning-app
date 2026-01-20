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
 * userProgress/{userId}/programs/{programId}
 *   - completedLessons: [lessonId1, lessonId2, ...]
 *   - currentLesson: lessonId
 *   - lastAccessedAt: timestamp
 *   - percentage: 0-100
 */

/**
 * Récupérer la progression d'un utilisateur sur un programme
 */
export async function getUserProgramProgress(userId, programId) {
  try {
    const progressRef = doc(db, `userProgress/${userId}/programs/${programId}`);
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
    const programsRef = collection(db, `userProgress/${userId}/programs`);
    const snapshot = await getDocs(programsRef);
    
    const progressMap = {};
    snapshot.forEach(doc => {
      progressMap[doc.id] = doc.data();
    });
    
    return progressMap;
  } catch (error) {
    console.error('Erreur getAllUserProgress:', error);
    throw error;
  }
}

/**
 * Marquer une leçon comme terminée
 */
export async function markLessonCompleted(userId, programId, lessonId, totalLessons) {
  try {
    console.log('📝 markLessonCompleted appelé:', { userId, programId, lessonId, totalLessons });
    
    const progressRef = doc(db, `userProgress/${userId}/programs/${programId}`);
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
    
    await setDoc(progressRef, {
      completedLessons,
      currentLesson: lessonId,
      lastAccessedAt: new Date().toISOString(),
      percentage
    }, { merge: true });
    
    console.log('💾 Progression sauvegardée dans Firebase');
    
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
    const progressRef = doc(db, `userProgress/${userId}/programs/${programId}`);
    
    await setDoc(progressRef, {
      currentLesson: lessonId,
      lastAccessedAt: new Date().toISOString()
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
 * @returns {Promise<Array>} Liste des programmes affectés avec le nombre de leçons
 */
export async function getUserAssignedProgramsWithDetails(userId) {
  try {
    console.log('🔍 getUserAssignedProgramsWithDetails for user:', userId);
    
    // 1. Récupérer l'utilisateur
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.warn('⚠️ User document not found:', userId);
      return [];
    }
    
    const assignedProgramIds = userDoc.data().assignedPrograms || [];
    console.log('📋 Assigned program IDs:', assignedProgramIds);
    
    if (assignedProgramIds.length === 0) {
      console.log('ℹ️ No programs assigned to this user');
      return [];
    }
    
    // 2. Récupérer tous les programmes publiés
    const programsQuery = query(
      collection(db, 'programs'),
      where('status', '==', 'published')
    );
    const programsSnap = await getDocs(programsQuery);
    console.log('📚 Total published programs:', programsSnap.size);
    
    // 3. Filtrer pour ne garder que les programmes affectés
    const allPrograms = programsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const assignedPrograms = allPrograms.filter(p => assignedProgramIds.includes(p.id));
    console.log('✅ Assigned and published programs:', assignedPrograms.length);
    
    // 4. Pour chaque programme, compter les leçons
    const programsWithLessons = await Promise.all(
      assignedPrograms.map(async (program) => {
        let totalLessons = 0;
        
        // Compter les leçons dans tous les modules
        const modulesSnap = await getDocs(
          collection(db, `programs/${program.id}/modules`)
        );
        
        for (const moduleDoc of modulesSnap.docs) {
          const lessonsSnap = await getDocs(
            collection(db, `programs/${program.id}/modules/${moduleDoc.id}/lessons`)
          );
          totalLessons += lessonsSnap.size;
        }
        
        console.log(`  → ${program.name}: ${totalLessons} leçons`);
        
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
