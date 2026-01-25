import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Nettoyage de l'ancienne structure /programs
 * ATTENTION : Cette opération est IRRÉVERSIBLE
 */
export async function cleanupOldStructure() {
  console.log('🧹 ========================================');
  console.log('🧹 NETTOYAGE ANCIENNE STRUCTURE');
  console.log('🧹 ========================================\n');
  console.log('⚠️  ATTENTION : Opération IRRÉVERSIBLE !\n');
  
  const stats = {
    programsDeleted: 0,
    modulesDeleted: 0,
    lessonsDeleted: 0,
    exerciseDocsDeleted: 0,
    errors: []
  };
  
  try {
    // 1. Récupérer tous les programmes
    const programsRef = collection(db, 'programs');
    const programsSnap = await getDocs(programsRef);
    
    console.log(`📚 ${programsSnap.size} programmes à supprimer\n`);
    
    for (const programDoc of programsSnap.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();
      
      console.log(`${'='.repeat(60)}`);
      console.log(`🗑️  Suppression programme: ${programData.title || programId}`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        // 2. Supprimer les chapters et leurs sous-collections
        const modulesRef = collection(db, 'programs', programId, 'chapitres');
        const modulesSnap = await getDocs(modulesRef);
        
        console.log(`   📚 ${modulesSnap.size} chapters à supprimer`);
        
        for (const chapterDoc of modulesSnap.docs) {
          const chapterId = chapterDoc.id;
          
          // Supprimer exercises/main du chapitre si existe
          try {
            const moduleExercisesRef = doc(db, 'programs', programId, 'chapitres', chapterId, 'exercises', 'main');
            await deleteDoc(moduleExercisesRef);
            stats.exerciseDocsDeleted++;
            console.log(`      🗑️  exercises/main du chapitre supprimé`);
          } catch (e) {
            // Pas d'exercises/main, c'est OK
          }
          
          // Supprimer les lessons
          const lessonsRef = collection(db, 'programs', programId, 'chapitres', chapterId, 'lessons');
          const lessonsSnap = await getDocs(lessonsRef);
          
          for (const lessonDoc of lessonsSnap.docs) {
            const lessonId = lessonDoc.id;
            
            // Supprimer exercises/main de la lesson si existe
            try {
              const lessonExercisesRef = doc(db, 'programs', programId, 'chapitres', chapterId, 'lessons', lessonId, 'exercises', 'main');
              await deleteDoc(lessonExercisesRef);
              stats.exerciseDocsDeleted++;
            } catch (e) {
              // Pas d'exercises/main, c'est OK
            }
            
            // Supprimer la lesson
            await deleteDoc(lessonDoc.ref);
            stats.lessonsDeleted++;
          }
          
          // Supprimer le chapitre
          await deleteDoc(chapterDoc.ref);
          stats.modulesDeleted++;
        }
        
        // 3. Supprimer le programme
        await deleteDoc(programDoc.ref);
        stats.programsDeleted++;
        
        console.log(`   ✅ Programme supprimé\n`);
        
      } catch (error) {
        console.error(`   ❌ Erreur suppression programme ${programId}:`, error);
        stats.errors.push({ programId, error: error.message });
      }
    }
    
    // RÉSUMÉ
    console.log('\n🎯 ========================================');
    console.log('🎯 RÉSUMÉ DU NETTOYAGE');
    console.log('🎯 ========================================\n');
    
    console.log('📊 STATISTIQUES:');
    console.log(`   • Programmes supprimés: ${stats.programsDeleted}`);
    console.log(`   • Chapitres supprimés: ${stats.modulesDeleted}`);
    console.log(`   • Lessons supprimées: ${stats.lessonsDeleted}`);
    console.log(`   • Documents exercises supprimés: ${stats.exerciseDocsDeleted}`);
    console.log(`   • Erreurs: ${stats.errors.length}\n`);
    
    if (stats.errors.length > 0) {
      console.log('❌ ERREURS:');
      stats.errors.forEach(err => {
        console.log(`   • ${err.programId}: ${err.error}`);
      });
      console.log('');
    }
    
    if (stats.errors.length === 0) {
      console.log('✅ NETTOYAGE TERMINÉ AVEC SUCCÈS !\n');
      console.log('📋 VÉRIFICATION:');
      console.log('   1. Ouvrir Firebase Console');
      console.log('   2. Vérifier que /programs a disparu');
      console.log('   3. Vérifier que /organizations/.../programs existe');
      console.log('   4. Tester l\'application\n');
    }
    
    console.log('🎯 ========================================\n');
    
    return stats;
    
  } catch (error) {
    console.error('❌ ERREUR FATALE:', error);
    throw error;
  }
}

window.cleanupOldStructure = cleanupOldStructure;
