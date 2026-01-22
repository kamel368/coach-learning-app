import { 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';

const DEFAULT_ORG_ID = "org_default";

export const migrationStep2 = async () => {
  console.log('🚀 ====================================');
  console.log('🚀 MIGRATION STEP 2 : Users → Employees');
  console.log('🚀 ====================================\n');

  try {
    // ========================================
    // 1. Récupérer tous les users existants
    // ========================================
    console.log('📊 Récupération des users existants...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`   📦 ${usersSnapshot.size} users trouvés\n`);

    if (usersSnapshot.size === 0) {
      console.log('⚠️ Aucun user à migrer');
      return { success: true, migrated: 0 };
    }

    let migratedCount = 0;
    let errorCount = 0;

    // ========================================
    // 2. Migrer chaque user
    // ========================================
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`\n👤 Migration: ${userData.email || userId}`);

      try {
        // --- 2.1 Créer le profil employee ---
        const employeeRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'employees', userId);
        
        await setDoc(employeeRef, {
          profile: {
            userId: userId,
            email: userData.email || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            role: userData.role || 'learner',
            status: 'active',
            createdAt: userData.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        });
        console.log('   ✅ Profil employee créé');

        // --- 2.2 Créer learning/data ---
        const learningDataRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'employees', userId, 'learning', 'data');
        
        await setDoc(learningDataRef, {
          assignedPrograms: userData.assignedPrograms || [],
          lastActivityAt: serverTimestamp()
        });
        console.log('   ✅ Learning data créé');

        // --- 2.3 Migrer gamification ---
        try {
          const gamifDoc = await getDoc(doc(db, 'users', userId, 'gamification', 'data'));
          if (gamifDoc.exists()) {
            const gamifRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'employees', userId, 'learning', 'gamification');
            await setDoc(gamifRef, {
              ...gamifDoc.data(),
              migratedAt: serverTimestamp()
            });
            console.log('   ✅ Gamification migrée');
          } else {
            console.log('   ⚠️ Pas de gamification');
          }
        } catch (e) {
          console.log('   ⚠️ Erreur gamification:', e.message);
        }

        // --- 2.4 Migrer exerciseAttempts ---
        try {
          const attemptsSnapshot = await getDocs(collection(db, 'users', userId, 'exerciseAttempts'));
          if (attemptsSnapshot.size > 0) {
            for (const attemptDoc of attemptsSnapshot.docs) {
              const attemptRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'employees', userId, 'learning', 'exerciseAttempts', attemptDoc.id);
              await setDoc(attemptRef, attemptDoc.data());
            }
            console.log(`   ✅ ${attemptsSnapshot.size} exerciseAttempts migrés`);
          }
        } catch (e) {
          console.log('   ⚠️ Pas d\'exerciseAttempts');
        }

        // --- 2.5 Migrer evaluations ---
        try {
          const programsSnapshot = await getDocs(collection(db, 'users', userId, 'programs'));
          let evalCount = 0;
          
          for (const progDoc of programsSnapshot.docs) {
            const evalsSnapshot = await getDocs(collection(db, 'users', userId, 'programs', progDoc.id, 'evaluations'));
            
            for (const evalDoc of evalsSnapshot.docs) {
              const evalRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'employees', userId, 'learning', 'evaluations', `${progDoc.id}_${evalDoc.id}`);
              await setDoc(evalRef, {
                ...evalDoc.data(),
                programId: progDoc.id
              });
              evalCount++;
            }
          }
          
          if (evalCount > 0) {
            console.log(`   ✅ ${evalCount} evaluations migrées`);
          }
        } catch (e) {
          console.log('   ⚠️ Pas d\'evaluations');
        }

        // --- 2.6 Migrer progress (userProgress) ---
        try {
          const progressDoc = await getDoc(doc(db, 'userProgress', userId));
          if (progressDoc.exists()) {
            const progressData = progressDoc.data();
            
            // Migrer chaque programme
            for (const [programId, progData] of Object.entries(progressData.programs || {})) {
              const progressRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'employees', userId, 'learning', 'progress', programId);
              await setDoc(progressRef, {
                programId: programId,
                ...progData,
                migratedAt: serverTimestamp()
              });
            }
            console.log('   ✅ Progress migré');
          }
        } catch (e) {
          console.log('   ⚠️ Pas de progress');
        }

        migratedCount++;

      } catch (error) {
        console.error(`   ❌ Erreur pour ${userId}:`, error.message);
        errorCount++;
      }
    }

    // ========================================
    // RÉSUMÉ
    // ========================================
    console.log('\n🎉 ====================================');
    console.log('🎉 MIGRATION STEP 2 TERMINÉE !');
    console.log('🎉 ====================================');
    console.log('\n📊 Résumé :');
    console.log(`   • Users migrés: ${migratedCount}`);
    console.log(`   • Erreurs: ${errorCount}`);
    console.log('\n⏭️  Prochaine étape : Exécuter migrationStep3 (programs)');
    
    return { success: true, migrated: migratedCount, errors: errorCount };

  } catch (error) {
    console.error('\n❌ ERREUR Migration Step 2:', error);
    return { success: false, error };
  }
};
