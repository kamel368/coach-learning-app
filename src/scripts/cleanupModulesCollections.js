import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Script de nettoyage : Supprime toutes les collections /modules
 * ⚠️ ATTENTION : Cette opération est IRRÉVERSIBLE !
 * 
 * À exécuter UNE SEULE FOIS après la refactorisation Module → Chapitre
 */
export async function cleanupModulesCollections() {
  console.log('🧹 ========================================');
  console.log('🧹 NETTOYAGE : Suppression /modules');
  console.log('🧹 ========================================\n');
  console.log('⚠️  CE QUI SERA SUPPRIMÉ:');
  console.log('   • /programs/{id}/modules/{id}');
  console.log('   • /organizations/{orgId}/programs/{id}/modules/{id}');
  console.log('   • Toutes les lessons et exercices associés\n');
  
  const stats = {
    programsScanned: 0,
    modulesDeleted: 0,
    lessonsDeleted: 0,
    errors: []
  };
  
  try {
    // ============================================
    // ÉTAPE 1 : Nettoyer /programs/{id}/modules
    // ============================================
    console.log('🗑️  ÉTAPE 1/2 : Nettoyage /programs/*/modules...\n');
    
    const programsRef = collection(db, 'programs');
    const programsSnap = await getDocs(programsRef);
    
    console.log(`   📚 ${programsSnap.size} programmes trouvés`);
    
    for (const programDoc of programsSnap.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();
      stats.programsScanned++;
      
      console.log(`\n   📘 Programme: ${programData.name || programId}`);
      
      try {
        // Récupérer les modules
        const modulesRef = collection(db, 'programs', programId, 'modules');
        const modulesSnap = await getDocs(modulesRef);
        
        if (modulesSnap.empty) {
          console.log(`      ℹ️  Pas de modules à supprimer`);
          continue;
        }
        
        console.log(`      🗑️  ${modulesSnap.size} modules à supprimer`);
        
        for (const moduleDoc of modulesSnap.docs) {
          const moduleId = moduleDoc.id;
          const moduleData = moduleDoc.data();
          
          console.log(`         - ${moduleData.title || moduleId}`);
          
          // Supprimer les lessons du module
          try {
            const lessonsRef = collection(db, 'programs', programId, 'modules', moduleId, 'lessons');
            const lessonsSnap = await getDocs(lessonsRef);
            
            for (const lessonDoc of lessonsSnap.docs) {
              await deleteDoc(lessonDoc.ref);
              stats.lessonsDeleted++;
            }
            
            if (lessonsSnap.size > 0) {
              console.log(`            ✓ ${lessonsSnap.size} lessons supprimées`);
            }
          } catch (e) {
            console.log(`            ⚠️  Erreur suppression lessons:`, e.message);
          }
          
          // Supprimer exercises/main si existe
          try {
            const exercisesRef = doc(db, 'programs', programId, 'modules', moduleId, 'exercises', 'main');
            await deleteDoc(exercisesRef);
          } catch (e) {
            // Pas d'exercises/main, c'est OK
          }
          
          // Supprimer le module
          await deleteDoc(moduleDoc.ref);
          stats.modulesDeleted++;
        }
        
        console.log(`      ✅ ${modulesSnap.size} modules supprimés`);
        
      } catch (error) {
        console.error(`      ❌ Erreur:`, error.message);
        stats.errors.push({ programId, error: error.message });
      }
    }
    
    // ============================================
    // ÉTAPE 2 : Nettoyer /organizations/.../modules
    // ============================================
    console.log('\n\n🗑️  ÉTAPE 2/2 : Nettoyage /organizations/.../programs/.../modules...\n');
    
    try {
      const orgsRef = collection(db, 'organizations');
      const orgsSnap = await getDocs(orgsRef);
      
      console.log(`   🏢 ${orgsSnap.size} organisations trouvées`);
      
      for (const orgDoc of orgsSnap.docs) {
        const orgId = orgDoc.id;
        console.log(`\n   🏢 Organisation: ${orgId}`);
        
        const orgProgramsRef = collection(db, 'organizations', orgId, 'programs');
        const orgProgramsSnap = await getDocs(orgProgramsRef);
        
        console.log(`      📚 ${orgProgramsSnap.size} programmes`);
        
        for (const programDoc of orgProgramsSnap.docs) {
          const programId = programDoc.id;
          const programData = programDoc.data();
          
          console.log(`      📘 ${programData.name || programId}`);
          
          try {
            const modulesRef = collection(db, 'organizations', orgId, 'programs', programId, 'modules');
            const modulesSnap = await getDocs(modulesRef);
            
            if (modulesSnap.empty) {
              console.log(`         ℹ️  Pas de modules`);
              continue;
            }
            
            console.log(`         🗑️  ${modulesSnap.size} modules à supprimer`);
            
            for (const moduleDoc of modulesSnap.docs) {
              const moduleId = moduleDoc.id;
              
              // Supprimer les lessons
              try {
                const lessonsRef = collection(db, 'organizations', orgId, 'programs', programId, 'modules', moduleId, 'lessons');
                const lessonsSnap = await getDocs(lessonsRef);
                
                for (const lessonDoc of lessonsSnap.docs) {
                  await deleteDoc(lessonDoc.ref);
                  stats.lessonsDeleted++;
                }
              } catch (e) {}
              
              // Supprimer exercises/main
              try {
                const exercisesRef = doc(db, 'organizations', orgId, 'programs', programId, 'modules', moduleId, 'exercises', 'main');
                await deleteDoc(exercisesRef);
              } catch (e) {}
              
              // Supprimer le module
              await deleteDoc(moduleDoc.ref);
              stats.modulesDeleted++;
            }
            
            console.log(`         ✅ ${modulesSnap.size} modules supprimés`);
            
          } catch (error) {
            console.error(`         ❌ Erreur:`, error.message);
          }
        }
      }
    } catch (error) {
      console.log('\n   ℹ️  Pas d\'organisations multi-tenant ou erreur:', error.message);
    }
    
    // ============================================
    // RÉSUMÉ FINAL
    // ============================================
    console.log('\n\n🎯 ========================================');
    console.log('🎯 RÉSUMÉ DU NETTOYAGE');
    console.log('🎯 ========================================\n');
    console.log('📊 STATISTIQUES:');
    console.log(`   • Programmes scannés: ${stats.programsScanned}`);
    console.log(`   • Modules supprimés: ${stats.modulesDeleted}`);
    console.log(`   • Lessons supprimées: ${stats.lessonsDeleted}`);
    console.log(`   • Erreurs: ${stats.errors.length}\n`);
    
    if (stats.errors.length > 0) {
      console.log('❌ ERREURS:');
      stats.errors.forEach(err => {
        console.log(`   • ${err.programId}: ${err.error}`);
      });
      console.log('');
    }
    
    if (stats.modulesDeleted === 0) {
      console.log('ℹ️  Aucun module trouvé - La base est déjà propre !\n');
    } else {
      console.log('✅ NETTOYAGE TERMINÉ !\n');
      console.log('📋 PROCHAINES ÉTAPES:');
      console.log('   1. Créer un nouveau programme');
      console.log('   2. Ajouter des chapitres (nouvelle structure /chapitres)');
      console.log('   3. Vérifier que tout fonctionne');
      console.log('   4. Créer du contenu de test\n');
    }
    
    console.log('🎯 ========================================\n');
    return stats;
    
  } catch (error) {
    console.error('❌ ERREUR FATALE:', error);
    throw error;
  }
}

// Exposer globalement pour exécution depuis console
window.cleanupModulesCollections = cleanupModulesCollections;
