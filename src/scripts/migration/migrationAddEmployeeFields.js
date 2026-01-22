import { 
  doc, 
  getDocs,
  updateDoc,
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';

const DEFAULT_ORG_ID = "org_default";

export const migrationAddEmployeeFields = async () => {
  console.log('🚀 ====================================');
  console.log('🚀 MIGRATION : Ajout champs poste/contrat');
  console.log('🚀 ====================================\n');

  try {
    // 1. Mettre à jour les employees (nouvelle structure)
    console.log('📦 Mise à jour /organizations/org_default/employees...');
    
    const employeesSnapshot = await getDocs(
      collection(db, 'organizations', DEFAULT_ORG_ID, 'employees')
    );
    
    console.log(`   ${employeesSnapshot.size} employees trouvés\n`);

    let updatedCount = 0;

    for (const employeeDoc of employeesSnapshot.docs) {
      const data = employeeDoc.data();
      const profile = data.profile || {};
      
      if (profile.poste === undefined || profile.contrat === undefined) {
        console.log(`   👤 Mise à jour: ${profile.email || employeeDoc.id}`);
        
        await updateDoc(
          doc(db, 'organizations', DEFAULT_ORG_ID, 'employees', employeeDoc.id),
          {
            'profile.poste': profile.poste || '',
            'profile.contrat': profile.contrat || '',
            'profile.updatedAt': serverTimestamp()
          }
        );
        
        updatedCount++;
      }
    }

    // 2. Mettre à jour l'ancienne structure /users (compatibilité)
    console.log('\n📦 Mise à jour /users (ancienne structure)...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let usersUpdated = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const data = userDoc.data();
      
      if (data.poste === undefined || data.contrat === undefined) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          poste: data.poste || '',
          contrat: data.contrat || '',
          updatedAt: serverTimestamp()
        });
        usersUpdated++;
      }
    }

    console.log('\n🎉 ====================================');
    console.log('🎉 MIGRATION TERMINÉE !');
    console.log('🎉 ====================================');
    console.log(`\n📊 Résumé :`);
    console.log(`   • Employees mis à jour: ${updatedCount}`);
    console.log(`   • Users mis à jour: ${usersUpdated}`);
    
    return { success: true, employees: updatedCount, users: usersUpdated };

  } catch (error) {
    console.error('\n❌ ERREUR Migration:', error);
    return { success: false, error };
  }
};
