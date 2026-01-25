import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditExercises, findProgramsWithExercises, auditEntireDatabase } from '../../scripts/auditExercises';
import { migrateToMultiTenant } from '../../scripts/migrateToMultiTenant';
import { verifyBeforeCleanup } from '../../scripts/verifyBeforeCleanup';
import { cleanupOldStructure } from '../../scripts/cleanupOldStructure';
import { resetDatabasePartial } from '../../scripts/resetDatabasePartial';
import { resetDatabaseTotal } from '../../scripts/resetDatabaseTotal';
import { useAuth } from '../../context/AuthContext';

export default function AuditPage() {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAuditingAll, setIsAuditingAll] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cleanupSafe, setCleanupSafe] = useState(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupDone, setCleanupDone] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [isResettingTotal, setIsResettingTotal] = useState(false);

  const handleFindPrograms = async () => {
    console.clear();
    console.log('🔎 Recherche de programmes avec exercices...\n');
    
    setIsSearching(true);
    
    try {
      await findProgramsWithExercises(organizationId);
      console.log('\n✅ Recherche terminée ! Consultez les résultats ci-dessus.');
      alert('✅ Recherche terminée ! Consultez la console.');
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur lors de la recherche. Consultez la console.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCleanup = async () => {
    const confirm1 = window.confirm(
      '⚠️ ATTENTION - SUPPRESSION IRRÉVERSIBLE !\n\n' +
      'Cette action va SUPPRIMER définitivement :\n' +
      '• La collection /programs\n' +
      '• Tous ses chapters, lessons et exercices\n\n' +
      'Les données migrées dans /organizations resteront intactes.\n\n' +
      'Êtes-vous SÛR de vouloir continuer ?'
    );
    
    if (!confirm1) return;
    
    const confirm2 = window.confirm(
      '⚠️ DERNIÈRE CONFIRMATION\n\n' +
      'Vous avez vérifié que :\n' +
      '✓ Tous les programmes fonctionnent dans la nouvelle structure\n' +
      '✓ Les évaluations marchent correctement\n' +
      '✓ Vous avez fait un backup (recommandé)\n\n' +
      'Procéder à la suppression DÉFINITIVE ?'
    );
    
    if (!confirm2) return;
    
    console.clear();
    console.log('🧹 Nettoyage de l\'ancienne structure...\n');
    
    setIsCleaning(true);
    
    try {
      const stats = await cleanupOldStructure();
      
      console.log('\n✅ Nettoyage terminé !');
      
      setCleanupDone(true);
      
      alert(
        '✅ NETTOYAGE TERMINÉ !\n\n' +
        `Programmes supprimés: ${stats.programsDeleted}\n` +
        `Chapitres supprimés: ${stats.modulesDeleted}\n` +
        `Lessons supprimées: ${stats.lessonsDeleted}\n\n` +
        'Vérifiez Firebase Console et testez l\'application.'
      );
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur lors du nettoyage. Consultez la console.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleVerify = async () => {
    console.clear();
    console.log('🔍 Vérification avant nettoyage...\n');
    
    setIsVerifying(true);
    setCleanupSafe(null);
    
    try {
      const result = await verifyBeforeCleanup(organizationId);
      setCleanupSafe(result.safe);
      
      if (result.safe) {
        alert('✅ VÉRIFICATION RÉUSSIE !\n\nTous les programmes sont bien migrés.\nVous pouvez procéder au nettoyage en toute sécurité.');
      } else {
        alert('⚠️ ATTENTION !\n\nDes problèmes ont été détectés.\nConsultez la console pour les détails.\nNE PAS procéder au nettoyage.');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur lors de la vérification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPartial = async () => {
    const confirm1 = window.confirm(
      '🔥 RESET PARTIEL - OPTION A\n\n' +
      'Cette action va SUPPRIMER :\n' +
      '✗ Tous les programmes\n' +
      '✗ Tous les chapters\n' +
      '✗ Toutes les lessons\n' +
      '✗ Tous les exercices\n' +
      '✗ Historique des évaluations\n\n' +
      'Cette action va CONSERVER :\n' +
      '✓ Vos comptes utilisateurs\n' +
      '✓ Vos organisations\n' +
      '✓ Votre authentification\n\n' +
      'Continuer ?'
    );
    
    if (!confirm1) return;
    
    const confirm2 = window.confirm(
      '⚠️ DERNIÈRE CONFIRMATION\n\n' +
      'Vous allez supprimer tout le contenu.\n' +
      'Les comptes restent fonctionnels.\n\n' +
      'CONFIRMER LE RESET PARTIEL ?'
    );
    
    if (!confirm2) return;
    
    console.clear();
    console.log('🔥 RESET PARTIEL EN COURS...\n');
    
    setIsResetting(true);
    
    try {
      const stats = await resetDatabasePartial(organizationId);
      
      setResetDone(true);
      
      alert(
        '✅ RESET PARTIEL TERMINÉ !\n\n' +
        `Programmes supprimés: ${stats.oldProgramsDeleted + stats.newProgramsDeleted}\n` +
        `Chapitres supprimés: ${stats.modulesDeleted}\n` +
        `Lessons supprimées: ${stats.lessonsDeleted}\n` +
        `Historique supprimé: ${stats.historyDeleted}\n\n` +
        'La page va se recharger.\n' +
        'Vous pourrez vous reconnecter normalement.'
      );
      
      // Recharger après 2 secondes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur lors du reset. Consultez la console.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetTotal = async () => {
    const confirm1 = window.confirm(
      '💀 RESET TOTAL - OPTION B\n\n' +
      'Cette action va SUPPRIMER :\n' +
      '✗ TOUS les comptes utilisateurs\n' +
      '✗ TOUTES les organizations (y compris org_default)\n' +
      '✗ TOUS les programmes (dans toutes les structures)\n' +
      '✗ TOUT LE CONTENU\n' +
      '✗ ABSOLUMENT TOUT\n\n' +
      'Vous devrez TOUT recréer manuellement après.\n' +
      'Firebase Auth restera (emails), mais pas les rôles.\n\n' +
      'Êtes-vous SÛR ?'
    );
    
    if (!confirm1) return;
    
    const confirm2 = window.confirm(
      '💀 DERNIÈRE CONFIRMATION\n\n' +
      'VOUS ALLEZ PERDRE :\n' +
      '❌ Tous vos comptes (users)\n' +
      '❌ Toutes vos organizations\n' +
      '❌ Toute votre configuration\n' +
      '❌ Toutes vos données\n' +
      '❌ org_default, /programs, /users/*/programs\n\n' +
      'Après le reset, vous serez déconnecté.\n\n' +
      'CONFIRMER LE RESET TOTAL ?'
    );
    
    if (!confirm2) return;
    
    const confirm3 = window.confirm(
      '💀💀💀 DERNIER AVERTISSEMENT 💀💀💀\n\n' +
      'Il n\'y aura AUCUN retour en arrière.\n' +
      'Vous devrez tout recréer manuellement.\n\n' +
      'Taper OK pour VALIDER LA SUPPRESSION TOTALE'
    );
    
    if (!confirm3) return;
    
    console.clear();
    console.log('💀💀💀 RESET TOTAL EN COURS 💀💀💀\n');
    console.log('Ne fermez PAS la page...\n');
    
    setIsResettingTotal(true);
    
    try {
      const stats = await resetDatabaseTotal();
      
      console.log('\n✅ Reset terminé avec succès !');
      
      alert(
        '💀 RESET TOTAL TERMINÉ !\n\n' +
        `${stats.totalDeleted} documents supprimés\n\n` +
        'Collections supprimées :\n' +
        Object.entries(stats.collections)
          .filter(([_, count]) => count > 0)
          .map(([name, count]) => `• ${name}: ${count}`)
          .join('\n') +
        '\n\n' +
        'La base de données est maintenant VIDE.\n\n' +
        'VOUS ALLEZ ÊTRE DÉCONNECTÉ.\n\n' +
        'Prochaines étapes :\n' +
        '1. Recréer organization dans Firebase Console\n' +
        '2. Recréer les users\n' +
        '3. Corriger le code'
      );
      
      // Déconnexion forcée + redirect
      setTimeout(() => {
        // Déconnecter l'utilisateur
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erreur lors du reset:', error);
      alert(
        '❌ ERREUR LORS DU RESET\n\n' +
        error.message + '\n\n' +
        'Consultez la console pour plus de détails.'
      );
    } finally {
      setIsResettingTotal(false);
    }
  };

  const handleMigrate = async () => {
    const confirm = window.confirm(
      '⚠️ ATTENTION - MIGRATION IMPORTANTE !\n\n' +
      'Cette migration va :\n' +
      '✓ Copier TOUS les programmes de /programs\n' +
      '✓ Les placer dans /organizations/' + organizationId + '/programs\n' +
      '✓ Ajouter organizationId à tous les documents\n' +
      '✓ Conserver les données originales (pas de suppression automatique)\n\n' +
      'Durée estimée : 1-2 minutes\n\n' +
      'Continuer la migration ?'
    );
    
    if (!confirm) return;
    
    console.clear();
    console.log('🚀 Démarrage de la migration multi-tenant...\n');
    
    setIsMigrating(true);
    setMigrationDone(false);
    
    try {
      const stats = await migrateToMultiTenant(organizationId);
      
      console.log('\n✅ Migration terminée avec succès !');
      console.log('📊 Résumé:', stats);
      
      setMigrationDone(true);
      
      alert(
        '✅ MIGRATION TERMINÉE !\n\n' +
        `Programmes migrés: ${stats.programsMigrated}\n` +
        `Chapitres migrés: ${stats.modulesMigrated}\n` +
        `Lessons migrées: ${stats.lessonsMigrated}\n` +
        `Exercices migrés: ${stats.exerciseDocsMigrated}\n\n` +
        'Consultez la console pour les détails.\n' +
        'Relancez l\'audit pour vérifier !'
      );
      
    } catch (error) {
      console.error('❌ Erreur fatale lors de la migration:', error);
      alert(
        '❌ ERREUR LORS DE LA MIGRATION\n\n' +
        error.message + '\n\n' +
        'Consultez la console pour plus de détails.'
      );
    } finally {
      setIsMigrating(false);
    }
  };

  const handleAuditAll = async () => {
    console.clear();
    console.log('🔎 Audit complet de TOUTE la base...\n');
    
    setIsAuditingAll(true);
    
    try {
      await auditEntireDatabase(organizationId);
      console.log('\n✅ Audit complet terminé !');
      alert('✅ Audit complet terminé ! Consultez la console.');
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur. Consultez la console.');
    } finally {
      setIsAuditingAll(false);
    }
  };

  const handleAudit = async () => {
    console.clear();
    console.log('🚀 Lancement de l\'audit...\n');
    
    setIsAuditing(true);
    
    try {
      const programId = 'e55HwUF8cAYmdSOblYtn';
      await auditExercises(organizationId, programId);
      
      console.log('\n✅ Audit terminé ! Consultez les résultats ci-dessus.');
      alert('✅ Audit terminé ! Consultez la console du navigateur (F12)');
    } catch (error) {
      console.error('❌ Erreur lors de l\'audit:', error);
      alert('❌ Erreur lors de l\'audit. Consultez la console.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔧 Outil d'audit des exercices
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Diagnostic de la base de données
            </h2>
            <p className="text-gray-600 mb-2">
              Cet outil va scanner toute la base de données pour identifier où sont stockés les exercices.
            </p>
            <p className="text-sm text-gray-500">
              <strong>Organization ID :</strong> {organizationId || 'Non défini'}
            </p>
            <p className="text-sm text-gray-500">
              <strong>Programme ID :</strong> e55HwUF8cAYmdSOblYtn
            </p>
          </div>

          {/* BOUTON RESET TOTAL - OPTION B - LE PLUS DANGEREUX */}
          <div className="bg-black border-4 border-red-600 rounded-lg p-8 mb-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-7xl mb-4 animate-pulse">💀</div>
              <h2 className="text-4xl font-bold text-red-500 mb-3 animate-pulse">
                RESET TOTAL - OPTION B
              </h2>
              <p className="text-red-400 font-bold text-lg mb-4">
                Supprime ABSOLUMENT TOUT (users, orgs, contenu, org_default)
              </p>
              <div className="bg-red-900 bg-opacity-50 rounded-lg p-4 mb-4">
                <p className="text-red-200 text-sm font-mono">
                  ⚠️ /organizations → SUPPRIMÉ<br/>
                  ⚠️ /users → SUPPRIMÉ<br/>
                  ⚠️ /programs → SUPPRIMÉ<br/>
                  ⚠️ /org_default → SUPPRIMÉ<br/>
                  ⚠️ TOUT LE RESTE → SUPPRIMÉ
                </p>
              </div>
              <div className="text-sm text-red-300 space-y-2">
                <div className="font-bold">⚠️⚠️ VOUS DEVREZ TOUT RECRÉER MANUELLEMENT ⚠️⚠️</div>
                <div>🔒 DÉCONNEXION FORCÉE APRÈS</div>
                <div>❌ AUCUN RETOUR EN ARRIÈRE</div>
              </div>
            </div>
            
            <button
              onClick={handleResetTotal}
              disabled={isResettingTotal}
              className={`w-full px-8 py-8 rounded-lg font-bold text-2xl transition-all border-4 ${
                isResettingTotal
                  ? 'bg-gray-600 border-gray-500 cursor-not-allowed text-gray-400' 
                  : 'bg-red-600 hover:bg-red-700 border-red-400 text-white shadow-2xl hover:shadow-red-500/50 animate-pulse'
              }`}
            >
              {isResettingTotal ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  💀 SUPPRESSION TOTALE EN COURS...
                </>
              ) : (
                '💀 LANCER LE RESET TOTAL (OPTION B)'
              )}
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-red-400 text-xs font-mono animate-pulse">
                ⚠️⚠️⚠️ ATTENTION : Aucun retour en arrière possible ⚠️⚠️⚠️
              </p>
            </div>
          </div>

          {/* BOUTON VÉRIFICATION - AVANT LA MIGRATION */}
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className={`w-full px-6 py-4 rounded-lg font-medium text-lg transition-all mb-4 ${
              isVerifying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isVerifying ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Vérification en cours...
              </>
            ) : (
              '🔍 Vérifier avant nettoyage'
            )}
          </button>

          {cleanupSafe === true && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <p className="text-sm text-green-800 font-medium">
                ✅ Vérification réussie ! Vous pouvez procéder au nettoyage en toute sécurité.
              </p>
            </div>
          )}

          {cleanupSafe === false && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Problèmes détectés ! Consultez la console. NE PAS nettoyer.
              </p>
            </div>
          )}

          {/* BOUTON RESET PARTIEL (OPTION A) - EN PREMIER */}
          <div className="bg-orange-100 border-4 border-orange-600 rounded-lg p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔥</div>
              <h2 className="text-3xl font-bold text-orange-800 mb-2">
                RESET PARTIEL - OPTION A
              </h2>
              <p className="text-orange-700 font-medium mb-4">
                Supprime le contenu, conserve les comptes
              </p>
              <div className="text-sm text-orange-600 space-y-1">
                <div>✗ Programmes / Chapitres / Lessons / Exercices</div>
                <div>✓ Users / Organizations / Auth</div>
              </div>
            </div>
            
            {resetDone && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Reset terminé ! Rechargement de la page...
                </p>
              </div>
            )}
            
            <button
              onClick={handleResetPartial}
              disabled={isResetting || resetDone}
              className={`w-full px-8 py-6 rounded-lg font-bold text-xl transition-all ${
                isResetting || resetDone
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-2xl'
              }`}
            >
              {isResetting ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  RESET EN COURS...
                </>
              ) : resetDone ? (
                '✅ RESET TERMINÉ'
              ) : (
                '🔥 LANCER RESET PARTIEL (OPTION A)'
              )}
            </button>
            
            <div className="mt-4 text-xs text-orange-600 text-center">
              ⚠️ Suppression irréversible du contenu - Conservation des comptes
            </div>
          </div>

          {/* BOUTON NETTOYAGE - N'APPARAÎT QUE SI VÉRIFICATION OK */}
          {cleanupSafe === true && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">🗑️</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-800 mb-2">
                    Nettoyage de l&apos;ancienne structure
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    ⚠️ Cette opération est <strong>IRRÉVERSIBLE</strong>. Elle supprimera définitivement la collection <code className="bg-red-100 px-1 rounded">/programs</code>.
                  </p>
                  <ul className="text-xs text-red-600 space-y-1 mb-3">
                    <li>✓ Vérification réussie - Migration confirmée</li>
                    <li>✓ Les données dans /organizations resteront intactes</li>
                    <li>⚠️ Impossible d&apos;annuler après suppression</li>
                  </ul>
                </div>
              </div>
              
              {cleanupDone && (
                <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Nettoyage terminé avec succès !
                  </p>
                </div>
              )}
              
              <button
                onClick={handleCleanup}
                disabled={isCleaning || cleanupDone}
                className={`w-full px-6 py-4 rounded-lg font-medium text-lg transition-all ${
                  isCleaning || cleanupDone
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isCleaning ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Suppression en cours... (ne pas fermer)
                  </>
                ) : cleanupDone ? (
                  '✅ Nettoyage terminé'
                ) : (
                  '🗑️ SUPPRIMER l\'ancienne structure'
                )}
              </button>
            </div>
          )}

          {/* BOUTON MIGRATION - EN PREMIER */}
          <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-4xl">🚀</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-800 mb-2">
                  Migration Multi-Tenant
                </h3>
                <p className="text-sm text-orange-700 mb-3">
                  Cette opération va migrer tous les programmes de <code className="bg-orange-100 px-1 rounded">/programs</code> vers <code className="bg-orange-100 px-1 rounded">/organizations/{organizationId}/programs</code>
                </p>
                <ul className="text-xs text-orange-600 space-y-1 mb-3">
                  <li>✓ Copie TOUS les programmes, chapters, lessons et exercices</li>
                  <li>✓ Ajoute organizationId à tous les documents</li>
                  <li>✓ Les données originales sont conservées (pas de suppression)</li>
                  <li>⚠️ Opération irréversible (les données sont copiées)</li>
                </ul>
              </div>
            </div>
            
            {migrationDone && (
              <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Migration terminée avec succès !
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Relancez l&apos;audit pour vérifier les données migrées.
                </p>
              </div>
            )}
            
            <button
              onClick={handleMigrate}
              disabled={isMigrating || migrationDone}
              className={`w-full px-6 py-4 rounded-lg font-medium text-lg transition-all ${
                isMigrating || migrationDone
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isMigrating ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Migration en cours... (ne pas fermer la page)
                </>
              ) : migrationDone ? (
                '✅ Migration terminée'
              ) : (
                '🚀 LANCER LA MIGRATION'
              )}
            </button>
          </div>

          <button
            onClick={handleAuditAll}
            disabled={isAuditingAll}
            className={`w-full px-6 py-4 rounded-lg font-medium text-lg transition-all mb-4 ${
              isAuditingAll 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isAuditingAll ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Audit en cours...
              </>
            ) : (
              <>
                🔍 AUDIT COMPLET (Multi-tenant + Non multi-tenant)
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/admin/create-test-exercises')}
            className="w-full px-6 py-4 rounded-lg font-medium text-lg bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all mb-4"
          >
            🧪 Créer exercices de test
          </button>

          <button
            onClick={handleFindPrograms}
            disabled={isSearching}
            className={`w-full px-6 py-4 rounded-lg font-medium text-lg transition-all mb-4 ${
              isSearching 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isSearching ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Recherche en cours...
              </>
            ) : (
              <>
                🔎 Trouver programmes avec exercices
              </>
            )}
          </button>

          <button
            onClick={handleAudit}
            disabled={isAuditing}
            className={`w-full px-6 py-4 rounded-lg font-medium text-lg transition-all ${
              isAuditing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isAuditing ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Audit en cours...
              </>
            ) : (
              <>
                🔍 Lancer l'audit complet
              </>
            )}
          </button>

          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important :</strong> Les résultats s'afficheront dans la console du navigateur.
              <br />
              Ouvrez la console (F12) avant de cliquer sur le bouton.
            </p>
          </div>

          <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 Ce que l'audit va scanner :</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Tous les chapters du programme</li>
              <li>Toutes les lessons de chaque chapitre</li>
              <li>Le champ "blocks" dans chaque lesson</li>
              <li>Les documents "exercises/main" dans les lessons</li>
              <li>Les documents "exercises/main" dans les chapters</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
