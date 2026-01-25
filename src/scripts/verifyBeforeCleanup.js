import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Vérification pré-nettoyage : S'assurer que tout est OK avant suppression
 */
export async function verifyBeforeCleanup(organizationId) {
  console.log('🔍 ========================================');
  console.log('🔍 VÉRIFICATION PRÉ-NETTOYAGE');
  console.log('🔍 ========================================\n');
  
  const issues = [];
  let totalProgramsOld = 0;
  let totalProgramsNew = 0;
  
  try {
    // 1. Compter programmes dans ancienne structure
    console.log('📂 Vérification ancienne structure (/programs)...');
    const oldProgramsRef = collection(db, 'programs');
    const oldProgramsSnap = await getDocs(oldProgramsRef);
    totalProgramsOld = oldProgramsSnap.size;
    console.log(`   ✅ ${totalProgramsOld} programmes dans /programs\n`);
    
    // 2. Compter programmes dans nouvelle structure
    console.log('📂 Vérification nouvelle structure (/organizations)...');
    const newProgramsRef = collection(db, 'organizations', organizationId, 'programs');
    const newProgramsSnap = await getDocs(newProgramsRef);
    totalProgramsNew = newProgramsSnap.size;
    console.log(`   ✅ ${totalProgramsNew} programmes dans /organizations/${organizationId}/programs\n`);
    
    // 3. Vérifier que chaque programme a ses données
    console.log('🔍 Vérification intégrité des données...');
    
    for (const programDoc of newProgramsSnap.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();
      
      console.log(`   📘 Programme: ${programData.title || programId}`);
      
      // Vérifier chapters
      const modulesRef = collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres');
      const modulesSnap = await getDocs(modulesRef);
      
      if (modulesSnap.size === 0) {
        console.log(`      ⚠️  Aucun chapitre`);
        issues.push({ programId, issue: 'Aucun chapitre trouvé' });
      } else {
        console.log(`      ✅ ${modulesSnap.size} chapters`);
        
        // Compter lessons et exercices
        let totalLessons = 0;
        let totalExercises = 0;
        
        for (const chapterDoc of modulesSnap.docs) {
          const chapterId = chapterDoc.id;
          
          const lessonsRef = collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres', chapterId, 'lessons');
          const lessonsSnap = await getDocs(lessonsRef);
          totalLessons += lessonsSnap.size;
          
          // Compter exercices dans lessons
          for (const lessonDoc of lessonsSnap.docs) {
            const lessonData = lessonDoc.data();
            const blocks = lessonData.blocks || [];
            totalExercises += blocks.filter(b => {
              const type = b.type || b.data?.type;
              return ['flashcard', 'qcm', 'true_false', 'qcm_selective', 'reorder', 'drag_drop', 'match_pairs'].includes(type);
            }).length;
          }
          
          // Compter exercices dans chapters/exercises/main
          try {
            const moduleExercisesRef = doc(db, 'organizations', organizationId, 'programs', programId, 'chapitres', chapterId, 'exercises', 'main');
            const moduleExercisesSnap = await getDoc(moduleExercisesRef);
            if (moduleExercisesSnap.exists()) {
              const blocks = moduleExercisesSnap.data().blocks || [];
              totalExercises += blocks.filter(b => {
                const type = b.type || b.data?.type;
                return ['flashcard', 'qcm', 'true_false', 'qcm_selective', 'reorder', 'drag_drop', 'match_pairs'].includes(type);
              }).length;
            }
          } catch (e) {}
        }
        
        console.log(`      ✅ ${totalLessons} lessons`);
        console.log(`      ✅ ${totalExercises} exercices\n`);
        
        if (totalExercises === 0) {
          console.log(`      ⚠️  Attention : Aucun exercice évaluable`);
        }
      }
    }
    
    // 4. RÉSUMÉ ET RECOMMANDATION
    console.log('\n🎯 ========================================');
    console.log('🎯 RÉSUMÉ DE LA VÉRIFICATION');
    console.log('🎯 ========================================\n');
    
    console.log(`📊 COMPTAGE:`);
    console.log(`   • Programmes ancienne structure: ${totalProgramsOld}`);
    console.log(`   • Programmes nouvelle structure: ${totalProgramsNew}\n`);
    
    if (issues.length > 0) {
      console.log(`⚠️  PROBLÈMES DÉTECTÉS (${issues.length}):`);
      issues.forEach(issue => {
        console.log(`   • ${issue.programId}: ${issue.issue}`);
      });
      console.log('');
    }
    
    // Recommandation
    if (totalProgramsNew >= totalProgramsOld && issues.length === 0) {
      console.log('✅ RECOMMANDATION: ✅');
      console.log('   Tous les programmes ont été migrés avec succès.');
      console.log('   Il est SÛRE de procéder au nettoyage.\n');
      console.log('💡 PROCHAINE ÉTAPE:');
      console.log('   Utilisez cleanupOldStructure() pour supprimer /programs\n');
      return { safe: true, issues: [] };
    } else {
      console.log('⚠️  RECOMMANDATION: ⚠️');
      console.log('   Des problèmes ont été détectés.');
      console.log('   NE PAS procéder au nettoyage avant résolution.\n');
      return { safe: false, issues };
    }
    
  } catch (error) {
    console.error('❌ ERREUR lors de la vérification:', error);
    return { safe: false, error: error.message };
  }
}

window.verifyBeforeCleanup = verifyBeforeCleanup;
