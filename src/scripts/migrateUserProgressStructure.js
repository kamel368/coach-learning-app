import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 🔄 Script de migration de la progression utilisateur
 * 
 * ANCIENNE STRUCTURE : /userProgress/{userId}/programs/{programId}
 * NOUVELLE STRUCTURE : /userProgress/{userId}__{programId}
 * 
 * Ce script migre toutes les données de progression d'un utilisateur
 * vers la nouvelle structure plate.
 */

export async function migrateUserProgress(userId, organizationId) {
  console.log(`\n🔄 Migration progression pour user ${userId}`);
  console.log(`📍 Organisation : ${organizationId}`);
  
  let migrated = 0;
  let errors = 0;
  
  try {
    // 1. Lire l'ancienne structure
    console.log('\n📖 Lecture ancienne structure...');
    const oldProgressRef = collection(db, 'userProgress', userId, 'programs');
    const oldProgressSnap = await getDocs(oldProgressRef);
    
    console.log(`   Trouvé ${oldProgressSnap.size} programme(s) à migrer`);
    
    if (oldProgressSnap.empty) {
      console.log('   ℹ️  Aucune donnée à migrer');
      return { migrated: 0, errors: 0 };
    }
    
    // 2. Pour chaque programme, migrer vers la nouvelle structure
    for (const programDoc of oldProgressSnap.docs) {
      const programId = programDoc.id;
      const oldData = programDoc.data();
      
      try {
        console.log(`\n  📦 Migration programme ${programId}`);
        console.log(`     Données : ${oldData.completedLessons?.length || 0} leçons, ${oldData.percentage || 0}%`);
        
        // 3. Créer dans la nouvelle structure
        const newProgressId = `${userId}__${programId}`;
        const newProgressRef = doc(db, 'userProgress', newProgressId);
        
        // Vérifier si déjà migré
        const existingSnap = await getDoc(newProgressRef);
        if (existingSnap.exists()) {
          console.log(`     ⚠️  Déjà migré, skip`);
          continue;
        }
        
        await setDoc(newProgressRef, {
          // IDs
          userId,
          programId,
          organizationId: oldData.organizationId || organizationId,
          
          // Progression
          percentage: oldData.percentage || 0,
          totalLessons: oldData.totalLessons || 0,
          completedLessons: oldData.completedLessons || [],
          completedChapters: oldData.completedChapters || [],
          
          // État
          currentLesson: oldData.currentLesson || null,
          lastAccessedAt: oldData.lastAccessedAt || new Date(),
          
          // Timestamps
          createdAt: oldData.createdAt || new Date(),
          updatedAt: new Date()
        });
        
        console.log(`     ✅ Migré vers /userProgress/${newProgressId}`);
        migrated++;
        
      } catch (error) {
        console.error(`     ❌ Erreur migration ${programId}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n✅ Migration terminée pour ${userId}`);
    console.log(`   📊 Résumé : ${migrated} migrés, ${errors} erreurs`);
    
    // 4. Proposer la suppression de l'ancienne structure
    if (migrated > 0 && errors === 0) {
      console.log(`\n⚠️  IMPORTANT : Ancienne structure toujours présente`);
      console.log(`   Pour la supprimer, exécutez :`);
      console.log(`   await cleanupOldUserProgress('${userId}')`);
    }
    
    return { migrated, errors };
    
  } catch (error) {
    console.error('❌ Erreur migration globale:', error);
    throw error;
  }
}

/**
 * 🗑️  Nettoyer l'ancienne structure après migration réussie
 */
export async function cleanupOldUserProgress(userId) {
  console.log(`\n🗑️  Nettoyage ancienne structure pour ${userId}`);
  
  try {
    const oldProgressRef = collection(db, 'userProgress', userId, 'programs');
    const oldProgressSnap = await getDocs(oldProgressRef);
    
    console.log(`   Trouvé ${oldProgressSnap.size} document(s) à supprimer`);
    
    for (const programDoc of oldProgressSnap.docs) {
      await deleteDoc(programDoc.ref);
      console.log(`   ✅ Supprimé ${programDoc.id}`);
    }
    
    console.log(`\n✅ Nettoyage terminé`);
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
    throw error;
  }
}

/**
 * 🔄 Migrer TOUS les utilisateurs d'une organisation
 */
export async function migrateAllUsersInOrganization(organizationId) {
  console.log(`\n🚀 Migration de tous les utilisateurs de l'organisation ${organizationId}`);
  
  try {
    // 1. Récupérer tous les employés
    const employeesRef = collection(db, 'organizations', organizationId, 'employees');
    const employeesSnap = await getDocs(employeesRef);
    
    console.log(`📊 Trouvé ${employeesSnap.size} employé(s)`);
    
    let totalMigrated = 0;
    let totalErrors = 0;
    
    // 2. Migrer chaque utilisateur
    for (const employeeDoc of employeesSnap.docs) {
      const userId = employeeDoc.id;
      const { migrated, errors } = await migrateUserProgress(userId, organizationId);
      totalMigrated += migrated;
      totalErrors += errors;
    }
    
    console.log(`\n✅✅✅ MIGRATION GLOBALE TERMINÉE`);
    console.log(`   📊 Total : ${totalMigrated} programmes migrés`);
    console.log(`   ⚠️  Erreurs : ${totalErrors}`);
    
    return { totalMigrated, totalErrors };
    
  } catch (error) {
    console.error('❌ Erreur migration globale:', error);
    throw error;
  }
}

// Pour utiliser depuis la console :
// import { migrateUserProgress, migrateAllUsersInOrganization } from './scripts/migrateUserProgressStructure';
// 
// // Migrer un seul utilisateur
// await migrateUserProgress('RFCValeMzrWxTnG24naO13JMpNU2', 'mgCiVDyC7oNkE9WDI8IR');
// 
// // Migrer toute l'organisation
// await migrateAllUsersInOrganization('mgCiVDyC7oNkE9WDI8IR');
// 
// // Nettoyer après validation
// await cleanupOldUserProgress('RFCValeMzrWxTnG24naO13JMpNU2');
