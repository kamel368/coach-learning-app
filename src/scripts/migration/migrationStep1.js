import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

// ⚠️ CONFIGURATION - À MODIFIER AVANT EXÉCUTION
const CONFIG = {
  SUPER_ADMIN_UID: "Oh0YjUfRBxQqjP27IizG1vtvSRH2",
  SUPER_ADMIN_EMAIL: "k.moussaoui@simply-permis.com",
  SUPER_ADMIN_FIRST_NAME: "Kamel",
  SUPER_ADMIN_LAST_NAME: "Super Admin",
  DEFAULT_ORG_ID: "org_default",
  DEFAULT_ORG_NAME: "Organisation par défaut"
};

export const migrationStep1 = async () => {
  console.log('🚀 ====================================');
  console.log('🚀 MIGRATION STEP 1 : Structure initiale');
  console.log('🚀 ====================================\n');

  try {
    // ========================================
    // 1. Créer /platformSettings (document unique)
    // ========================================
    console.log('📦 1/3 - Création /platformSettings...');
    
    await setDoc(doc(db, 'platformSettings', 'config'), {
      appName: 'Coach HR',
      version: '1.0.0',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('   ✅ /platformSettings/config créé');

    // ========================================
    // 2. Créer Super Admin dans /platformAdmins/{uid}
    // ========================================
    console.log('👑 2/3 - Création Super Admin...');
    
    await setDoc(doc(db, 'platformAdmins', CONFIG.SUPER_ADMIN_UID), {
      userId: CONFIG.SUPER_ADMIN_UID,
      email: CONFIG.SUPER_ADMIN_EMAIL,
      firstName: CONFIG.SUPER_ADMIN_FIRST_NAME,
      lastName: CONFIG.SUPER_ADMIN_LAST_NAME,
      role: 'superadmin',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('   ✅ /platformAdmins/' + CONFIG.SUPER_ADMIN_UID + ' créé');

    // ========================================
    // 3. Créer organisation par défaut
    // ========================================
    console.log('🏢 3/3 - Création organisation par défaut...');
    
    await setDoc(doc(db, 'organizations', CONFIG.DEFAULT_ORG_ID), {
      info: {
        name: CONFIG.DEFAULT_ORG_NAME,
        email: CONFIG.SUPER_ADMIN_EMAIL,
        logoUrl: null,
        createdAt: serverTimestamp()
      },
      modules: ['learning'],
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: CONFIG.SUPER_ADMIN_UID
    });
    
    console.log('   ✅ /organizations/' + CONFIG.DEFAULT_ORG_ID + ' créé');

    // ========================================
    // RÉSUMÉ
    // ========================================
    console.log('\n🎉 ====================================');
    console.log('🎉 MIGRATION STEP 1 TERMINÉE !');
    console.log('🎉 ====================================');
    console.log('\n📊 Résumé :');
    console.log('   • /platformSettings/config ✅');
    console.log('   • /platformAdmins/' + CONFIG.SUPER_ADMIN_UID + ' ✅');
    console.log('   • /organizations/' + CONFIG.DEFAULT_ORG_ID + ' ✅');
    console.log('\n⏭️  Prochaine étape : Exécuter migrationStep2 (users → employees)');
    
    return { success: true };

  } catch (error) {
    console.error('\n❌ ERREUR Migration Step 1:', error);
    return { success: false, error };
  }
};
