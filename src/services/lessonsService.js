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
 * @param {string} chapterId - ID du chapitre (optionnel pour compatibilité)
 * @param {string} organizationId - ID de l'organisation (optionnel pour multi-tenant)
 * @returns {Object|null} - La leçon ou null si non trouvée
 * 
 * NOUVEAU : Si programId, chapterId et organizationId sont fournis, lit depuis /organizations/{orgId}/programs/...
 * ANCIEN : Si organizationId absent, lit depuis /programs/... (fallback)
 */
export async function getLesson(lessonId, programId = null, chapterId = null, organizationId = null) {
  try {
    // ✅ STRUCTURE MULTI-TENANT : /organizations/{orgId}/programs/...
    if (programId && chapterId && organizationId) {
      const ref = doc(db, "organizations", organizationId, "programs", programId, "chapitres", chapterId, "lessons", lessonId);
      const snap = await getDoc(ref);
      
      if (!snap.exists()) {
        console.warn(`⚠️ Leçon ${lessonId} introuvable dans /organizations/${organizationId}/programs/${programId}/chapitres/${chapterId}`);
        // Fallback vers ancienne structure
        const fallbackRef = doc(db, "programs", programId, "chapitres", chapterId, "lessons", lessonId);
        const fallbackSnap = await getDoc(fallbackRef);
        
        if (fallbackSnap.exists()) {
          console.log(`✅ Leçon trouvée dans l'ancienne structure: programs/${programId}/chapitres/${chapterId}/lessons/${lessonId}`);
          return { id: fallbackSnap.id, ...fallbackSnap.data() };
        }
        
        return null;
      }
      
      console.log(`✅ Leçon chargée depuis /organizations/${organizationId}/programs/${programId}/chapitres/${chapterId}/lessons/${lessonId}`);
      return { id: snap.id, ...snap.data() };
    }

    // ✅ ANCIENNE STRUCTURE : Subcollections imbriquées sans organization
    if (programId && chapterId) {
      const ref = doc(db, "programs", programId, "chapitres", chapterId, "lessons", lessonId);
      const snap = await getDoc(ref);
      
      if (!snap.exists()) {
        console.warn(`⚠️ Leçon ${lessonId} introuvable dans le chapitre ${chapterId} du programme ${programId}`);
        return null;
      }
      
      console.log(`✅ Leçon chargée depuis subcollection: programs/${programId}/chapitres/${chapterId}/lessons/${lessonId}`);
      return { id: snap.id, ...snap.data() };
    }

    // ❌ ANCIEN SYSTÈME : Collection plate (fallback pour compatibilité temporaire)
    console.warn(`⚠️ getLesson() appelé sans programId/chapterId. Utilisation du système legacy.`);
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
 * @param {string} chapterId - ID du chapitre (REQUIS)
 * @param {string} organizationId - ID de l'organisation (optionnel pour multi-tenant)
 * @throws {Error} - Si programId ou chapterId sont manquants
 * 
 * IMPORTANT : Les paramètres programId et chapterId sont OBLIGATOIRES
 * Si organizationId est fourni, sauvegarde dans /organizations/{orgId}/programs/...
 */
export async function saveLesson(lesson, programId, chapterId, organizationId = null) {
  // ✅ VALIDATION : Vérifier que programId et chapterId sont fournis
  if (!programId || !chapterId) {
    const errorMsg = "❌ saveLesson() nécessite programId et chapterId pour sauvegarder dans les subcollections";
    console.error(errorMsg, { lesson, programId, chapterId });
    throw new Error(errorMsg);
  }

  if (!lesson.id) {
    const errorMsg = "❌ saveLesson() nécessite un lesson.id";
    console.error(errorMsg, { lesson });
    throw new Error(errorMsg);
  }

  try {
    // ✅ CHEMIN SUBCOLLECTION (multi-tenant ou ancien)
    const ref = organizationId
      ? doc(db, "organizations", organizationId, "programs", programId, "chapitres", chapterId, "lessons", lesson.id)
      : doc(db, "programs", programId, "chapitres", chapterId, "lessons", lesson.id);
    
    // ✅ PAYLOAD avec métadonnées
    const payload = {
      ...lesson,
      programId,      // ✅ Ajouter programId dans le document
      chapterId,       // ✅ Ajouter chapterId dans le document
      organizationId: organizationId || null, // ✅ Ajouter organizationId
      updatedAt: serverTimestamp(),
      createdAt: lesson.createdAt || serverTimestamp(),
    };

    // ✅ SAUVEGARDE
    await setDoc(ref, payload, { merge: true });

    const path = organizationId 
      ? `organizations/${organizationId}/programs/${programId}/chapitres/${chapterId}/lessons/${lesson.id}`
      : `programs/${programId}/chapitres/${chapterId}/lessons/${lesson.id}`;
    
    console.log(`✅ Leçon sauvegardée avec succès: ${path}`);
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
 * Récupère toutes les leçons d'un chapitre, triées par ordre.
 * 
 * @param {string} chapterId - ID du chapitre
 * @param {string} programId - ID du programme
 * @param {string} organizationId - ID de l'organisation (optionnel pour multi-tenant)
 * @returns {Array} - Liste des leçons triées par order
 */
export async function getLessonsByModule(chapterId, programId, organizationId = null) {
  if (!programId || !chapterId) {
    console.error("❌ getLessonsByModule() nécessite programId et chapterId");
    throw new Error("programId et chapterId sont requis");
  }

  try {
    const lessonsRef = organizationId
      ? collection(db, "organizations", organizationId, "programs", programId, "chapitres", chapterId, "lessons")
      : collection(db, "programs", programId, "chapitres", chapterId, "lessons");
    
    const q = query(lessonsRef, orderBy("order", "asc"));
    const snap = await getDocs(q);

    const lessons = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const path = organizationId 
      ? `/organizations/${organizationId}/programs/${programId}/chapitres/${chapterId}`
      : `/programs/${programId}/chapitres/${chapterId}`;
    
    console.log(`✅ ${lessons.length} leçon(s) chargée(s) depuis ${path}`);
    return lessons;

  } catch (error) {
    console.error(`❌ Erreur lors du chargement des leçons du chapitre ${chapterId}:`, error);
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
 * @param {string} chapterId - ID du chapitre
 * @param {string} programId - ID du programme
 * @returns {Object|null} - La leçon précédente ou null
 */
export async function getPreviousLesson(currentLessonId, chapterId, programId) {
  try {
    // 1. Récupérer la leçon actuelle pour connaître son order
    const currentLesson = await getLesson(currentLessonId, programId, chapterId);
    if (!currentLesson || currentLesson.order === undefined) {
      console.warn(`⚠️ Leçon actuelle ${currentLessonId} introuvable ou sans order`);
      return null;
    }

    const currentOrder = currentLesson.order;

    // 2. Récupérer toutes les leçons du chapitre
    const allLessons = await getLessonsByModule(chapterId, programId);

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
 * @param {string} chapterId - ID du chapitre
 * @param {string} programId - ID du programme
 * @returns {Object|null} - La leçon suivante ou null
 */
export async function getNextLesson(currentLessonId, chapterId, programId) {
  try {
    // 1. Récupérer la leçon actuelle pour connaître son order
    const currentLesson = await getLesson(currentLessonId, programId, chapterId);
    if (!currentLesson || currentLesson.order === undefined) {
      console.warn(`⚠️ Leçon actuelle ${currentLessonId} introuvable ou sans order`);
      return null;
    }

    const currentOrder = currentLesson.order;

    // 2. Récupérer toutes les leçons du chapitre
    const allLessons = await getLessonsByModule(chapterId, programId);

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
