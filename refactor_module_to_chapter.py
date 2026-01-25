#!/usr/bin/env python3
"""
Script de refactorisation automatique : Module → Chapitre
Objectif : Remplacer toutes les occurrences de "module" par "chapitre" dans le code
"""

import os
import re
from pathlib import Path

# Configuration
SRC_DIR = Path("src")
BACKUP_SUFFIX = ".backup"

# Règles de remplacement (ordre important !)
REPLACEMENTS = [
    # === CHEMINS FIREBASE ===
    (r'(["\'])modules(["\'])', r'\1chapitres\2'),  # "/modules/" → "/chapitres/"
    (r'/modules/', '/chapitres/'),
    
    # === NOMS DE COMPOSANTS/FONCTIONS (PascalCase) ===
    (r'\bApprenantModule', 'ApprenantChapter'),
    (r'\bAdminModule', 'AdminChapter'),
    (r'\bModule([A-Z])', r'Chapter\1'),  # Module<Something> → Chapter<Something>
    
    # === HOOKS ===
    (r'\buseModule', 'useChapter'),
    
    # === VARIABLES/PARAMS (camelCase) ===
    (r'\bmoduleId\b', 'chapterId'),
    (r'\bmoduleName\b', 'chapterName'),
    (r'\bmoduleData\b', 'chapterData'),
    (r'\bmoduleDoc\b', 'chapterDoc'),
    (r'\bmoduleRef\b', 'chapterRef'),
    (r'\bmoduleSnap\b', 'chapterSnap'),
    (r'\bmoduleSnapshot\b', 'chapterSnapshot'),
    (r'\bcurrentModule\b', 'currentChapter'),
    (r'\btargetModule\b', 'targetChapter'),
    (r'\bsourceModule', 'sourceChapter'),
    (r'\ballModules\b', 'allChapters'),
    
    # === TABLEAUX/COLLECTIONS ===
    (r'\bmodules\b', 'chapters'),
    
    # === ROUTES URL ===
    (r'/module/', '/chapter/'),
    (r'/modules/', '/chapters/'),
    
    # === TEXTES UI (sensible à la casse) ===
    (r'\bModule\b', 'Chapitre'),
    (r'\bModules\b', 'Chapitres'),
    (r'\bmodule\b', 'chapitre'),
    
    # === TEXTES FRANÇAIS SPÉCIFIQUES ===
    (r'du module', 'du chapitre'),
    (r'ce module', 'ce chapitre'),
    (r'le module', 'le chapitre'),
    (r'un module', 'un chapitre'),
    (r'au module', 'au chapitre'),
    (r'les modules', 'les chapitres'),
    (r'des modules', 'des chapitres'),
]

# Fichiers à exclure
EXCLUDE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.backup',
    '__pycache__',
]

# Extensions de fichiers à traiter
INCLUDE_EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.json'}

def should_process_file(file_path):
    """Détermine si un fichier doit être traité"""
    # Vérifier l'extension
    if file_path.suffix not in INCLUDE_EXTENSIONS:
        return False
    
    # Vérifier les patterns d'exclusion
    path_str = str(file_path)
    for pattern in EXCLUDE_PATTERNS:
        if pattern in path_str:
            return False
    
    return True

def apply_replacements(content):
    """Applique toutes les règles de remplacement au contenu"""
    original = content
    
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    
    return content, content != original

def process_file(file_path):
    """Traite un fichier individuel"""
    try:
        # Lire le contenu
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Appliquer les remplacements
        new_content, changed = apply_replacements(content)
        
        if changed:
            # Sauvegarder le fichier modifié
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✅ {file_path}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ Erreur {file_path}: {e}")
        return False

def find_files_to_rename():
    """Trouve les fichiers qui doivent être renommés"""
    renames = []
    
    for root, dirs, files in os.walk(SRC_DIR):
        # Filtrer les dossiers exclus
        dirs[:] = [d for d in dirs if d not in EXCLUDE_PATTERNS]
        
        for file in files:
            if 'Module' in file or 'module' in file:
                old_path = Path(root) / file
                new_name = file.replace('Module', 'Chapter').replace('module', 'chapter')
                new_path = Path(root) / new_name
                
                if old_path != new_path:
                    renames.append((old_path, new_path))
    
    return renames

def main():
    print("🚀 Début de la refactorisation Module → Chapitre\n")
    
    # Étape 1 : Modifier le contenu des fichiers
    print("📝 ÉTAPE 1 : Modification du contenu des fichiers\n")
    modified_count = 0
    total_count = 0
    
    for root, dirs, files in os.walk(SRC_DIR):
        # Filtrer les dossiers exclus
        dirs[:] = [d for d in dirs if d not in EXCLUDE_PATTERNS]
        
        for file in files:
            file_path = Path(root) / file
            
            if should_process_file(file_path):
                total_count += 1
                if process_file(file_path):
                    modified_count += 1
    
    print(f"\n📊 {modified_count}/{total_count} fichiers modifiés\n")
    
    # Étape 2 : Lister les fichiers à renommer
    print("📁 ÉTAPE 2 : Fichiers à renommer\n")
    renames = find_files_to_rename()
    
    if renames:
        print("⚠️  ATTENTION : Les fichiers suivants doivent être renommés manuellement :\n")
        for old, new in renames:
            print(f"   {old} → {new}")
        print(f"\n   Total : {len(renames)} fichiers\n")
        print("   Utilisez la commande :")
        print("   git mv <ancien_nom> <nouveau_nom>")
    else:
        print("✅ Aucun fichier à renommer\n")
    
    print("✅ Refactorisation terminée !")
    print("\n📋 Prochaines étapes :")
    print("   1. Renommer les fichiers manuellement (voir liste ci-dessus)")
    print("   2. Mettre à jour les imports dans App.jsx")
    print("   3. Compiler : npm run build")
    print("   4. Tester l'application")
    print("   5. Nettoyer Firebase (supprimer /modules)")

if __name__ == "__main__":
    main()
