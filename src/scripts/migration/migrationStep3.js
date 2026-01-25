import { 
  doc, 
  setDoc, 
  getDocs,
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';

const DEFAULT_ORG_ID = "org_default";

export const migrationStep3 = async () => {
  console.log('🚀 ====================================');
  console.log('🚀 MIGRATION STEP 3 : Programs');
  console.log('🚀 ====================================\n');

  try {
    // ========================================
    // 1. Récupérer tous les programmes existants
    // ========================================
    console.log('📊 Récupération des programmes existants...');
    
    const programsSnapshot = await getDocs(collection(db, 'programs'));
    console.log(`   📦 ${programsSnapshot.size} programmes trouvés\n`);

    if (programsSnapshot.size === 0) {
      console.log('⚠️ Aucun programme à migrer');
      return { success: true, migrated: 0 };
    }

    let migratedCount = 0;
    let errorCount = 0;

    // ========================================
    // 2. Migrer chaque programme
    // ========================================
    for (const programDoc of programsSnapshot.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();
      
      console.log(`\n📚 Migration: ${programData.title || programId}`);

      try {
        // --- 2.1 Copier le programme ---
        const newProgramRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'programs', programId);
        
        await setDoc(newProgramRef, {
          ...programData,
          migratedAt: serverTimestamp()
        });
        console.log('   ✅ Programme copié');

        // --- 2.2 Copier les chapters ---
        try {
          const modulesSnapshot = await getDocs(collection(db, 'programs', programId, 'chapitres'));
          
          for (const chapterDoc of modulesSnapshot.docs) {
            const chapterId = chapterDoc.id;
            const chapterData = chapterDoc.data();
            
            // Copier le chapitre
            const newModuleRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'programs', programId, 'chapitres', chapterId);
            await setDoc(newModuleRef, chapterData);

            // --- 2.3 Copier les lessons ---
            try {
              const lessonsSnapshot = await getDocs(collection(db, 'programs', programId, 'chapitres', chapterId, 'lessons'));
              for (const lessonDoc of lessonsSnapshot.docs) {
                const newLessonRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'programs', programId, 'chapitres', chapterId, 'lessons', lessonDoc.id);
                await setDoc(newLessonRef, lessonDoc.data());
              }
              if (lessonsSnapshot.size > 0) {
                console.log(`   ✅ Chapitre ${chapterId}: ${lessonsSnapshot.size} lessons`);
              }
            } catch (e) {
              console.log(`   ⚠️ Pas de lessons pour chapitre ${chapterId}`);
            }

            // --- 2.4 Copier les exercises ---
            try {
              const exercisesSnapshot = await getDocs(collection(db, 'programs', programId, 'chapitres', chapterId, 'exercises'));
              for (const exerciseDoc of exercisesSnapshot.docs) {
                const newExerciseRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'programs', programId, 'chapitres', chapterId, 'exercises', exerciseDoc.id);
                await setDoc(newExerciseRef, exerciseDoc.data());
              }
              if (exercisesSnapshot.size > 0) {
                console.log(`   ✅ Chapitre ${chapterId}: ${exercisesSnapshot.size} exercises`);
              }
            } catch (e) {
              console.log(`   ⚠️ Pas d'exercises pour chapitre ${chapterId}`);
            }
          }
          
          if (modulesSnapshot.size > 0) {
            console.log(`   ✅ ${modulesSnapshot.size} chapters migrés`);
          }
        } catch (e) {
          console.log('   ⚠️ Pas de chapters');
        }

        // --- 2.5 Copier l'évaluation du programme ---
        try {
          const evalConfigSnapshot = await getDocs(collection(db, 'programs', programId, 'evaluation'));
          for (const evalDoc of evalConfigSnapshot.docs) {
            const newEvalRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'programs', programId, 'evaluation', evalDoc.id);
            await setDoc(newEvalRef, evalDoc.data());
          }
          if (evalConfigSnapshot.size > 0) {
            console.log('   ✅ Evaluation config migrée');
          }
        } catch (e) {
          console.log('   ⚠️ Pas d\'evaluation config');
        }

        migratedCount++;

      } catch (error) {
        console.error(`   ❌ Erreur pour ${programId}:`, error.message);
        errorCount++;
      }
    }

    // ========================================
    // RÉSUMÉ
    // ========================================
    console.log('\n🎉 ====================================');
    console.log('🎉 MIGRATION STEP 3 TERMINÉE !');
    console.log('🎉 ====================================');
    console.log('\n📊 Résumé :');
    console.log(`   • Programmes migrés: ${migratedCount}`);
    console.log(`   • Erreurs: ${errorCount}`);
    console.log('\n✅ MIGRATION COMPLÈTE ! Prochaine étape : Adapter le code.');
    
    return { success: true, migrated: migratedCount, errors: errorCount };

  } catch (error) {
    console.error('\n❌ ERREUR Migration Step 3:', error);
    return { success: false, error };
  }
};
