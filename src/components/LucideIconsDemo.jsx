// 🎨 Composant de démonstration des icônes Lucide React
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ListTree, 
  FileText, 
  HelpCircle, 
  BrainCircuit, 
  UserCog,
  Menu,
  LogOut,
  Type,
  Image,
  Video,
  Info,
  ChevronDown,
  Clock,
  Minus,
  Link,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Code,
  Undo2,
  Redo2,
  Eye,
  X,
  Package
} from 'lucide-react';

export default function LucideIconsDemo() {
  const menuIcons = [
    { icon: LayoutDashboard, name: 'LayoutDashboard', usage: 'Dashboard' },
    { icon: Users, name: 'Users', usage: 'Rôles Métier' },
    { icon: BookOpen, name: 'BookOpen', usage: 'Programmes' },
    { icon: ListTree, name: 'ListTree', usage: 'Chapitres' },
    { icon: FileText, name: 'FileText', usage: 'Leçons' },
    { icon: HelpCircle, name: 'HelpCircle', usage: 'QCM' },
    { icon: BrainCircuit, name: 'BrainCircuit', usage: 'Exercices IA' },
    { icon: UserCog, name: 'UserCog', usage: 'Utilisateurs' },
  ];

  const blockIcons = [
    { icon: Type, name: 'Type', usage: 'Texte' },
    { icon: Image, name: 'Image', usage: 'Image' },
    { icon: Video, name: 'Video', usage: 'Vidéo' },
    { icon: Info, name: 'Info', usage: "Bloc d'info" },
    { icon: ChevronDown, name: 'ChevronDown', usage: 'Toggle' },
    { icon: Clock, name: 'Clock', usage: 'Timeline' },
    { icon: Minus, name: 'Minus', usage: 'Séparateur' },
    { icon: Link, name: 'Link', usage: 'Lien leçon' },
  ];

  const tabIcons = [
    { icon: FileText, name: 'FileText', usage: 'Onglet Leçon' },
    { icon: Package, name: 'Package', usage: 'Onglet Blocs' },
  ];

  const actionIcons = [
    { icon: Menu, name: 'Menu', usage: 'Hamburger' },
    { icon: LogOut, name: 'LogOut', usage: 'Déconnexion' },
    { icon: GripVertical, name: 'GripVertical', usage: 'Drag handle' },
    { icon: ArrowUp, name: 'ArrowUp', usage: 'Monter' },
    { icon: ArrowDown, name: 'ArrowDown', usage: 'Descendre' },
    { icon: Pencil, name: 'Pencil', usage: 'Éditer' },
    { icon: Trash2, name: 'Trash2', usage: 'Supprimer' },
    { icon: Code, name: 'Code', usage: 'Code' },
    { icon: Undo2, name: 'Undo2', usage: 'Annuler' },
    { icon: Redo2, name: 'Redo2', usage: 'Rétablir' },
    { icon: Eye, name: 'Eye', usage: 'Voir' },
    { icon: X, name: 'X', usage: 'Fermer' },
  ];

  const IconSection = ({ title, icons, color }) => (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color }}>
        {title}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {icons.map(({ icon: IconComponent, name, usage }) => (
          <div 
            key={name}
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
          >
            <IconComponent className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-xs font-semibold text-gray-800 text-center">{usage}</span>
            <code className="text-xs text-gray-400 mt-1">{name}</code>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg max-w-6xl mx-auto my-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 flex items-center gap-3">
          <BrainCircuit className="w-10 h-10 text-blue-600" />
          Icônes Lucide React - Coach Learning
        </h1>
        <p className="text-gray-600">
          Toutes les icônes Bootstrap ont été remplacées par Lucide React pour un design moderne et cohérent.
        </p>
      </div>

      <IconSection 
        title="📍 Icônes du Menu Navigation" 
        icons={menuIcons}
        color="#3b82f6"
      />

      <IconSection 
        title="🧩 Icônes des Blocs de Contenu" 
        icons={blockIcons}
        color="#10b981"
      />

      <IconSection 
        title="📑 Icônes des Onglets" 
        icons={tabIcons}
        color="#8b5cf6"
      />

      <IconSection 
        title="⚡ Icônes d'Actions" 
        icons={actionIcons}
        color="#f59e0b"
      />

      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Avantages de Lucide React
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✅ <strong>Moderne et cohérent</strong> - Design uniforme dans toute l'application</li>
          <li>✅ <strong>Performant</strong> - Composants React optimisés, pas de police d'icônes</li>
          <li>✅ <strong>Flexible</strong> - Facilement personnalisable avec Tailwind CSS</li>
          <li>✅ <strong>Tree-shakeable</strong> - Seules les icônes utilisées sont incluses dans le bundle</li>
          <li>✅ <strong>TypeScript natif</strong> - Autocomplétion et typage complet</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">Utilisation dans votre code</h3>
        <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`// Import
import { LayoutDashboard } from 'lucide-react';

// Utilisation
<LayoutDashboard className="w-5 h-5" />

// Avec Tailwind
<LayoutDashboard className="w-6 h-6 text-blue-600 hover:text-blue-800" />`}</pre>
        </div>
      </div>
    </div>
  );
}
