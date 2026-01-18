/**
 * 📚 SERVICE D'AFFECTATION
 * Gestion des affectations de programmes aux apprenants
 */

import { doc, updateDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Récupérer les programmes affectés à un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des programmes affectés avec leurs détails
 */
export async function getUserAssignedPrograms(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.warn(`User ${userId} introuvable`);
      return [];
    }
    
    const assignedProgramIds = userDoc.data().assignedPrograms || [];
    
    if (assignedProgramIds.length === 0) {
      return [];
    }
    
    // Récupérer les détails des programmes
    const programsSnap = await getDocs(collection(db, 'programs'));
    const allPrograms = programsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Filtrer uniquement les programmes affectés
    return allPrograms.filter(p => assignedProgramIds.includes(p.id));
  } catch (error) {
    console.error('Erreur getUserAssignedPrograms:', error);
    return [];
  }
}

/**
 * Affecter des programmes à un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Array<string>} programIds - Tableau des IDs de programmes à affecter
 * @returns {Promise<Object>} Résultat de l'opération
 */
export async function assignProgramsToUser(userId, programIds) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      assignedPrograms: programIds
    });
    
    console.log(`✅ ${programIds.length} programme(s) affecté(s) à ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Erreur assignProgramsToUser:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupérer tous les programmes disponibles
 * @returns {Promise<Array>} Liste de tous les programmes
 */
export async function getAllPrograms() {
  try {
    const snap = await getDocs(collection(db, 'programs'));
    const programs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log(`📚 ${programs.length} programmes récupérés`);
    return programs;
  } catch (error) {
    console.error('Erreur getAllPrograms:', error);
    return [];
  }
}

/**
 * Récupérer tous les apprenants
 * @returns {Promise<Array>} Liste de tous les apprenants
 */
export async function getAllLearners() {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'learner')
    );
    const snap = await getDocs(q);
    const learners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log(`👥 ${learners.length} apprenants récupérés`);
    return learners;
  } catch (error) {
    console.error('Erreur getAllLearners:', error);
    return [];
  }
}

/**
 * Vérifier si un utilisateur a accès à un programme
 * @param {string} userId - ID de l'utilisateur
 * @param {string} programId - ID du programme
 * @returns {Promise<boolean>} true si l'utilisateur a accès
 */
export async function userHasAccessToProgram(userId, programId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const assignedPrograms = userDoc.data().assignedPrograms || [];
    return assignedPrograms.includes(programId);
  } catch (error) {
    console.error('Erreur userHasAccessToProgram:', error);
    return false;
  }
}

/**
 * Retirer un programme d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} programId - ID du programme à retirer
 * @returns {Promise<Object>} Résultat de l'opération
 */
export async function removeProgramFromUser(userId, programId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'Utilisateur introuvable' };
    }
    
    const currentPrograms = userDoc.data().assignedPrograms || [];
    const updatedPrograms = currentPrograms.filter(id => id !== programId);
    
    await updateDoc(doc(db, 'users', userId), {
      assignedPrograms: updatedPrograms
    });
    
    console.log(`✅ Programme ${programId} retiré de ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Erreur removeProgramFromUser:', error);
    return { success: false, error: error.message };
  }
}
