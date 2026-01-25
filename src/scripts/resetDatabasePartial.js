import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * RESET PARTIEL : Supprime le contenu, garde users et organizations
 */
export async function resetDatabasePartial(organizationId) {
  console.log('🔥 ========================================');
  console.log('🔥 RESET PARTIEL - OPTION A');
  console.log('🔥 ========================================\n');
  console.log('⚠️  CE QUI SERA SUPPRIMÉ:');
  console.log('   • Tous les programmes');
  console.log('   • Tous les chapters');
  console.log('   • Toutes les lessons');
  console.log('   • Tous les exercices');
  console.log('   • Historique des évaluations\n');
  console.log('✅ CE QUI SERA CONSERVÉ:');
  console.log('   • /users (comptes utilisateurs)');
  console.log('   • /organizations (structure)');
  console.log('   • Firebase Authentication\n');
  
  const stats = {
    oldProgramsDeleted: 0,
    newProgramsDeleted: 0,
    modulesDeleted: 0,
    lessonsDeleted: 0,
    historyDeleted: 0,
    errors: []
  };
  
  try {
    // ============================================
    // ÉTAPE 1 : Supprimer /programs (ancienne structure)
    // ============================================
    console.log('🗑️  ÉTAPE 1/4 : Suppression /programs (ancienne structure)...\n');
    
    const oldProgramsRef = collection(db, 'programs');
    const oldProgramsSnap = await getDocs(oldProgramsRef);
    
    console.log(`   📚 ${oldProgramsSnap.size} programmes trouvés`);
    
    for (const programDoc of oldProgramsSnap.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();
      
      console.log(`      🗑️  ${programData.title || programId}`);
      
      try {
        // Supprimer chapters
        const modulesRef = collection(db, 'programs', programId, 'chapitres');
        const modulesSnap = await getDocs(modulesRef);
        
        for (const chapterDoc of modulesSnap.docs) {
          const chapterId = chapterDoc.id;
          
          // Supprimer lessons
          const lessonsRef = collection(db, 'programs', programId, 'chapitres', chapterId, 'lessons');
          const lessonsSnap = await getDocs(lessonsRef);
          
          for (const lessonDoc of lessonsSnap.docs) {
            const lessonId = lessonDoc.id;
            
            // Supprimer exercises/main de la lesson si existe
            try {
              const lessonExercisesRef = doc(db, 'programs', programId, 'chapitres', chapterId, 'lessons', lessonId, 'exercises', 'main');
              await deleteDoc(lessonExercisesRef);
            } catch (e) {}
            
            await deleteDoc(lessonDoc.ref);
            stats.lessonsDeleted++;
          }
          
          // Supprimer exercises/main du chapitre si existe
          try {
            const moduleExercisesRef = doc(db, 'programs', programId, 'chapitres', chapterId, 'exercises', 'main');
            await deleteDoc(moduleExercisesRef);
          } catch (e) {}
          
          await deleteDoc(chapterDoc.ref);
          stats.modulesDeleted++;
        }
        
        await deleteDoc(programDoc.ref);
        stats.oldProgramsDeleted++;
        
      } catch (error) {
        console.error(`      ❌ Erreur:`, error.message);
        stats.errors.push({ programId, error: error.message });
      }
    }
    
    console.log(`   ✅ ${stats.oldProgramsDeleted} programmes supprimés\n`);
    
    // ============================================
    // ÉTAPE 2 : Supprimer /organizations/{orgId}/programs (nouvelle structure)
    // ============================================
    console.log('🗑️  ÉTAPE 2/4 : Suppression /organizations/*/programs (nouvelle structure)...\n');
    
    if (organizationId) {
      const newProgramsRef = collection(db, 'organizations', organizationId, 'programs');
      const newProgramsSnap = await getDocs(newProgramsRef);
      
      console.log(`   📚 ${newProgramsSnap.size} programmes trouvés`);
      
      for (const programDoc of newProgramsSnap.docs) {
        const programId = programDoc.id;
        const programData = programDoc.data();
        
        console.log(`      🗑️  ${programData.title || programId}`);
        
        try {
          // Supprimer chapters
          const modulesRef = collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres');
          const modulesSnap = await getDocs(modulesRef);
          
          for (const chapterDoc of modulesSnap.docs) {
            const chapterId = chapterDoc.id;
            
            // Supprimer lessons
            const lessonsRef = collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres', chapterId, 'lessons');
            const lessonsSnap = await getDocs(lessonsRef);
            
            for (const lessonDoc of lessonsSnap.docs) {
              const lessonId = lessonDoc.id;
              
              // Supprimer exercises/main de la lesson si existe
              try {
                const lessonExercisesRef = doc(db, 'organizations', organizationId, 'programs', programId, 'chapitres', chapterId, 'lessons', lessonId, 'exercises', 'main');
                await deleteDoc(lessonExercisesRef);
              } catch (e) {}
              
              await deleteDoc(lessonDoc.ref);
              stats.lessonsDeleted++;
            }
            
            // Supprimer exercises/main du chapitre si existe
            try {
              const moduleExercisesRef = doc(db, 'organizations', organizationId, 'programs', programId, 'chapitres', chapterId, 'exercises', 'main');
              await deleteDoc(moduleExercisesRef);
            } catch (e) {}
            
            await deleteDoc(chapterDoc.ref);
            stats.modulesDeleted++;
          }
          
          await deleteDoc(programDoc.ref);
          stats.newProgramsDeleted++;
          
        } catch (error) {
          console.error(`      ❌ Erreur:`, error.message);
          stats.errors.push({ programId, error: error.message });
        }
      }
      
      console.log(`   ✅ ${stats.newProgramsDeleted} programmes supprimés\n`);
    }
    
    // ============================================
    // ÉTAPE 3 : Supprimer historique des évaluations
    // ============================================
    console.log('🗑️  ÉTAPE 3/4 : Suppression historique...\n');
    
    // Supprimer /quizAttempts si existe
    try {
      const quizAttemptsRef = collection(db, 'quizAttempts');
      const quizAttemptsSnap = await getDocs(quizAttemptsRef);
      
      console.log(`   📊 ${quizAttemptsSnap.size} tentatives d'évaluation trouvées`);
      
      for (const attemptDoc of quizAttemptsSnap.docs) {
        await deleteDoc(attemptDoc.ref);
        stats.historyDeleted++;
      }
      
      console.log(`   ✅ ${stats.historyDeleted} historiques supprimés\n`);
    } catch (e) {
      console.log(`   ℹ️  Pas d'historique à supprimer\n`);
    }
    
    // ============================================
    // ÉTAPE 4 : Vérification finale
    // ============================================
    console.log('🔍 ÉTAPE 4/4 : Vérification...\n');
    
    // Vérifier que /programs est vide
    const checkOldSnap = await getDocs(collection(db, 'programs'));
    console.log(`   /programs : ${checkOldSnap.size} documents (devrait être 0)`);
    
    // Vérifier que /organizations/{orgId}/programs est vide
    if (organizationId) {
      const checkNewSnap = await getDocs(collection(db, 'organizations', organizationId, 'programs'));
      console.log(`   /organizations/.../programs : ${checkNewSnap.size} documents (devrait être 0)`);
    }
    
    // Vérifier que /users existe toujours
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`   /users : ${usersSnap.size} comptes (conservés) ✅`);
    
    // Vérifier que /organizations existe toujours
    const orgsSnap = await getDocs(collection(db, 'organizations'));
    console.log(`   /organizations : ${orgsSnap.size} organisations (conservées) ✅\n`);
    
    // ============================================
    // RÉSUMÉ FINAL
    // ============================================
    console.log('\n🎯 ========================================');
    console.log('🎯 RÉSUMÉ DU RESET PARTIEL');
    console.log('🎯 ========================================\n');
    
    console.log('📊 SUPPRIMÉ:');
    console.log(`   • Programmes (ancienne structure): ${stats.oldProgramsDeleted}`);
    console.log(`   • Programmes (nouvelle structure): ${stats.newProgramsDeleted}`);
    console.log(`   • Chapitres: ${stats.modulesDeleted}`);
    console.log(`   • Lessons: ${stats.lessonsDeleted}`);
    console.log(`   • Historique: ${stats.historyDeleted}`);
    console.log(`   • Erreurs: ${stats.errors.length}\n`);
    
    if (stats.errors.length > 0) {
      console.log('❌ ERREURS:');
      stats.errors.forEach(err => {
        console.log(`   • ${err.programId}: ${err.error}`);
      });
      console.log('');
    }
    
    console.log('✅ CONSERVÉ:');
    console.log(`   • ${usersSnap.size} comptes utilisateurs`);
    console.log(`   • ${orgsSnap.size} organisations`);
    console.log('   • Firebase Authentication\n');
    
    console.log('✅ RESET PARTIEL TERMINÉ !\n');
    console.log('📋 PROCHAINES ÉTAPES:');
    console.log('   1. Recharger l\'application');
    console.log('   2. Se reconnecter (comptes conservés)');
    console.log('   3. Auditer le code de création');
    console.log('   4. Créer un programme test');
    console.log('   5. Vérifier qu\'il va dans /organizations/{orgId}/programs\n');
    
    console.log('🎯 ========================================\n');
    
    return stats;
    
  } catch (error) {
    console.error('❌ ERREUR FATALE:', error);
    throw error;
  }
}

window.resetDatabasePartial = resetDatabasePartial;
