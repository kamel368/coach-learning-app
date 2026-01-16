// src/services/lessonsService.js
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * ============================================
 * FONCTION : getLesson()
 * ============================================
 * Récupère une leçon depuis les subcollections Firebase.
 * 
 * @param {string} lessonId - ID de la leçon
 * @param {string} programId - ID du programme (optionnel pour compatibilité)
 * @param {string} moduleId - ID du module (optionnel pour compatibilité)
 * @returns {Object|null} - La leçon ou null si non trouvée
 * 
 * NOUVEAU : Si programId et moduleId sont fournis, lit depuis les subcollections
 * ANCIEN : Si absents, lit depuis la collection plate "lessons/" (fallback)
 */
export async function getLesson(lessonId, programId = null, moduleId = null) {
  try {
    // ✅ NOUVEAU SYSTÈME : Subcollections imbriquées
    if (programId && moduleId) {
      const ref = doc(db, "programs", programId, "modules", moduleId, "lessons", lessonId);
      const snap = await getDoc(ref);
      
      if (!snap.exists()) {
        console.warn(`⚠️ Leçon ${lessonId} introuvable dans le module ${moduleId} du programme ${programId}`);
        return null;
      }
      
      console.log(`✅ Leçon chargée depuis subcollection: programs/${programId}/modules/${moduleId}/lessons/${lessonId}`);
      return { id: snap.id, ...snap.data() };
    }

    // ❌ ANCIEN SYSTÈME : Collection plate (fallback pour compatibilité temporaire)
    console.warn(`⚠️ getLesson() appelé sans programId/moduleId. Utilisation du système legacy.`);
    const ref = doc(db, "lessons", lessonId);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      console.warn(`⚠️ Leçon ${lessonId} introuvable dans l'ancien système`);
      return null;
    }
    
    console.log(`✅ Leçon chargée depuis ancien système: lessons/${lessonId}`);
    return { id: snap.id, ...snap.data() };

  } catch (error) {
    console.error(`❌ Erreur lors du chargement de la leçon ${lessonId}:`, error);
    throw error;
  }
}

/**
 * ============================================
 * FONCTION : saveLesson()
 * ============================================
 * Sauvegarde une leçon dans les subcollections Firebase.
 * 
 * @param {Object} lesson - Objet leçon contenant { id, title, blocks, ... }
 * @param {string} programId - ID du programme (REQUIS)
 * @param {string} moduleId - ID du module (REQUIS)
 * @throws {Error} - Si programId ou moduleId sont manquants
 * 
 * IMPORTANT : Les paramètres programId et moduleId sont OBLIGATOIRES
 */
export async function saveLesson(lesson, programId, moduleId) {
  // ✅ VALIDATION : Vérifier que programId et moduleId sont fournis
  if (!programId || !moduleId) {
    const errorMsg = "❌ saveLesson() nécessite programId et moduleId pour sauvegarder dans les subcollections";
    console.error(errorMsg, { lesson, programId, moduleId });
    throw new Error(errorMsg);
  }

  if (!lesson.id) {
    const errorMsg = "❌ saveLesson() nécessite un lesson.id";
    console.error(errorMsg, { lesson });
    throw new Error(errorMsg);
  }

  try {
    // ✅ CHEMIN SUBCOLLECTION
    const ref = doc(db, "programs", programId, "modules", moduleId, "lessons", lesson.id);
    
    // ✅ PAYLOAD avec métadonnées
    const payload = {
      ...lesson,
      programId,      // ✅ Ajouter programId dans le document
      moduleId,       // ✅ Ajouter moduleId dans le document
      updatedAt: serverTimestamp(),
      createdAt: lesson.createdAt || serverTimestamp(),
    };

    // ✅ SAUVEGARDE
    await setDoc(ref, payload, { merge: true });

    console.log(`✅ Leçon sauvegardée avec succès: programs/${programId}/modules/${moduleId}/lessons/${lesson.id}`);
    console.log(`   Titre: "${lesson.title || 'Sans titre'}"`);
    console.log(`   Blocs: ${lesson.blocks ? lesson.blocks.length : 0}`);

    return { success: true, path: ref.path };

  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde de la leçon ${lesson.id}:`, error);
    throw error;
  }
}

/**
 * ============================================
 * FONCTION : getLessonsByModule()
 * ============================================
 * Récupère toutes les leçons d'un module, triées par ordre.
 * 
 * @param {string} moduleId - ID du module
 * @param {string} programId - ID du programme
 * @returns {Array} - Liste des leçons triées par order
 */
export async function getLessonsByModule(moduleId, programId) {
  if (!programId || !moduleId) {
    console.error("❌ getLessonsByModule() nécessite programId et moduleId");
    throw new Error("programId et moduleId sont requis");
  }

  try {
    const lessonsRef = collection(db, "programs", programId, "modules", moduleId, "lessons");
    const q = query(lessonsRef, orderBy("order", "asc"));
    const snap = await getDocs(q);

    const lessons = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ ${lessons.length} leçon(s) chargée(s) pour le module ${moduleId}`);
    return lessons;

  } catch (error) {
    console.error(`❌ Erreur lors du chargement des leçons du module ${moduleId}:`, error);
    throw error;
  }
}

/**
 * ============================================
 * FONCTION : getPreviousLesson()
 * ============================================
 * Récupère la leçon précédente dans l'ordre.
 * 
 * @param {string} currentLessonId - ID de la leçon actuelle
 * @param {string} moduleId - ID du module
 * @param {string} programId - ID du programme
 * @returns {Object|null} - La leçon précédente ou null
 */
export async function getPreviousLesson(currentLessonId, moduleId, programId) {
  try {
    // 1. Récupérer la leçon actuelle pour connaître son order
    const currentLesson = await getLesson(currentLessonId, programId, moduleId);
    if (!currentLesson || currentLesson.order === undefined) {
      console.warn(`⚠️ Leçon actuelle ${currentLessonId} introuvable ou sans order`);
      return null;
    }

    const currentOrder = currentLesson.order;

    // 2. Récupérer toutes les leçons du module
    const allLessons = await getLessonsByModule(moduleId, programId);

    // 3. Trouver la leçon avec l'order immédiatement inférieur
    const previousLessons = allLessons.filter(lesson => lesson.order < currentOrder);
    
    if (previousLessons.length === 0) {
      console.log(`ℹ️ Aucune leçon précédente pour ${currentLessonId}`);
      return null;
    }

    // Retourner la leçon avec l'order le plus élevé parmi celles inférieures
    const previousLesson = previousLessons[previousLessons.length - 1];
    console.log(`✅ Leçon précédente trouvée: ${previousLesson.id} (order: ${previousLesson.order})`);
    return previousLesson;

  } catch (error) {
    console.error(`❌ Erreur lors de la recherche de la leçon précédente:`, error);
    return null;
  }
}

/**
 * ============================================
 * FONCTION : getNextLesson()
 * ============================================
 * Récupère la leçon suivante dans l'ordre.
 * 
 * @param {string} currentLessonId - ID de la leçon actuelle
 * @param {string} moduleId - ID du module
 * @param {string} programId - ID du programme
 * @returns {Object|null} - La leçon suivante ou null
 */
export async function getNextLesson(currentLessonId, moduleId, programId) {
  try {
    // 1. Récupérer la leçon actuelle pour connaître son order
    const currentLesson = await getLesson(currentLessonId, programId, moduleId);
    if (!currentLesson || currentLesson.order === undefined) {
      console.warn(`⚠️ Leçon actuelle ${currentLessonId} introuvable ou sans order`);
      return null;
    }

    const currentOrder = currentLesson.order;

    // 2. Récupérer toutes les leçons du module
    const allLessons = await getLessonsByModule(moduleId, programId);

    // 3. Trouver la leçon avec l'order immédiatement supérieur
    const nextLessons = allLessons.filter(lesson => lesson.order > currentOrder);
    
    if (nextLessons.length === 0) {
      console.log(`ℹ️ Aucune leçon suivante pour ${currentLessonId}`);
      return null;
    }

    // Retourner la première leçon avec l'order supérieur
    const nextLesson = nextLessons[0];
    console.log(`✅ Leçon suivante trouvée: ${nextLesson.id} (order: ${nextLesson.order})`);
    return nextLesson;

  } catch (error) {
    console.error(`❌ Erreur lors de la recherche de la leçon suivante:`, error);
    return null;
  }
}
