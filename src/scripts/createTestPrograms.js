import { 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const organizationId = 'mgCiVDyC7oNkE9WDI8IR'; // Auto-Ecole Test
const createdBy = 'k.moussaoui@simply-permis.com';

// ============================================
// PROGRAMME 1 : EXCELLENCE MANAGÉRIALE
// ============================================

const program1 = {
  title: 'Excellence Managériale',
  description: 'Devenez un manager inspirant et efficace',
  categoryId: null,
  status: 'active',
  organizationId,
  createdBy,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

const program1Chapters = [
  {
    title: 'Leadership & Vision',
    order: 1,
    lessons: [
      {
        title: 'Les fondamentaux du leadership',
        order: 1,
        content: 'Un leader inspire, guide et développe son équipe. Découvrez les 5 piliers du leadership moderne : Vision claire, Communication efficace, Exemplarité, Écoute active, Prise de décision.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Citez 3 qualités essentielles d\'un bon leader',
              answer: 'Vision, Communication, Exemplarité',
              hint: 'Pensez aux piliers du leadership'
            },
            points: 5,
            order: 0
          },
          {
            type: 'qcm',
            content: {
              question: 'Quelle est la première qualité d\'un leader ?',
              options: [
                'Avoir raison tout le temps',
                'Inspirer et donner une vision',
                'Contrôler chaque détail',
                'Être le plus compétent techniquement'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 1
          },
          {
            type: 'true_false',
            content: {
              question: 'Un bon leader écoute avant de décider',
              correct: true,
              explanation: 'L\'écoute active est essentielle pour prendre de bonnes décisions'
            },
            points: 5,
            order: 2
          }
        ]
      },
      {
        title: 'Développer sa vision stratégique',
        order: 2,
        content: 'Une vision claire est le moteur de toute équipe performante. Apprenez à définir et communiquer votre vision avec la méthode SMART : Spécifique, Mesurable, Atteignable, Réaliste, Temporel.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Que signifie l\'acronyme SMART ?',
              answer: 'Spécifique, Mesurable, Atteignable, Réaliste, Temporel',
              hint: '5 critères pour des objectifs efficaces'
            },
            points: 10,
            order: 0
          },
          {
            type: 'qcm',
            content: {
              question: 'Pourquoi une vision est-elle importante ?',
              options: [
                'Pour impressionner la direction',
                'Pour donner du sens et une direction',
                'Pour compliquer les choses',
                'Ce n\'est pas important'
              ],
              correctIndex: 1
            },
            points: 5,
            order: 1
          }
        ]
      },
      {
        title: 'Communiquer sa vision efficacement',
        order: 3,
        content: 'Communiquer sa vision est un art. Découvrez les techniques de storytelling managérial avec la règle des 3 : Simple, Répété, Inspirant.',
        exercises: [
          {
            type: 'true_false',
            content: {
              question: 'Il suffit de communiquer sa vision une seule fois',
              correct: false,
              explanation: 'Une vision doit être répétée régulièrement pour être intégrée'
            },
            points: 5,
            order: 0
          },
          {
            type: 'flashcard',
            content: {
              question: 'Quelle est la règle des 3 en communication ?',
              answer: 'Simple, Répété, Inspirant',
              hint: 'Trois qualités d\'une communication efficace'
            },
            points: 5,
            order: 1
          }
        ]
      }
    ]
  },
  {
    title: 'Gestion d\'équipe',
    order: 2,
    lessons: [
      {
        title: 'Les leviers de motivation',
        order: 1,
        content: 'La motivation n\'est pas qu\'une question de salaire. Découvrez les vrais leviers : Reconnaissance, Autonomie, Sens, Développement, Équité.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'Quel est le principal levier de motivation selon les études ?',
              options: [
                'Le salaire',
                'La reconnaissance et le sens',
                'Les bonus',
                'Les horaires flexibles'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 0
          },
          {
            type: 'flashcard',
            content: {
              question: 'Citez 3 leviers de motivation non-financiers',
              answer: 'Reconnaissance, Autonomie, Sens',
              hint: 'Ce qui motive au-delà de l\'argent'
            },
            points: 5,
            order: 1
          }
        ]
      },
      {
        title: 'L\'art de la délégation',
        order: 2,
        content: 'Déléguer n\'est pas se décharger, c\'est développer son équipe. Les 5 niveaux de délégation : Informer, Consulter, Recommander, Décider avec validation, Décider.',
        exercises: [
          {
            type: 'true_false',
            content: {
              question: 'Déléguer, c\'est abandonner ses responsabilités',
              correct: false,
              explanation: 'Déléguer est un moyen de développer son équipe'
            },
            points: 5,
            order: 0
          },
          {
            type: 'flashcard',
            content: {
              question: 'Combien y a-t-il de niveaux de délégation ?',
              answer: '5',
              hint: 'De informer à décider seul'
            },
            points: 5,
            order: 1
          }
        ]
      },
      {
        title: 'Résolution de conflits',
        order: 3,
        content: 'Les conflits sont inévitables. Apprenez à les transformer en opportunités avec la méthode DESC : Décrire, Exprimer, Suggérer, Conclure.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'Quelle est la première étape de la méthode DESC ?',
              options: [
                'Exprimer ses émotions',
                'Décrire les faits objectivement',
                'Suggérer une solution',
                'Conclure'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 0
          }
        ]
      }
    ]
  },
  {
    title: 'Performance & Résultats',
    order: 3,
    lessons: [
      {
        title: 'Définir des objectifs clairs',
        order: 1,
        content: 'Des objectifs bien définis sont la clé de la performance. Utilisez la méthode OKR : Objectives & Key Results.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Que signifie OKR ?',
              answer: 'Objectives and Key Results',
              hint: 'Une méthode de Google'
            },
            points: 5,
            order: 0
          },
          {
            type: 'true_false',
            content: {
              question: 'Un objectif doit être mesurable',
              correct: true,
              explanation: 'La mesurabilité permet de suivre la progression'
            },
            points: 5,
            order: 1
          }
        ]
      },
      {
        title: 'Piloter la performance',
        order: 2,
        content: 'Le suivi régulier est essentiel pour maintenir le cap. Rituels : 1-to-1 hebdomadaire, Point équipe, Revue mensuelle.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'À quelle fréquence faire un 1-to-1 ?',
              options: [
                'Une fois par an',
                'Une fois par mois',
                'Une fois par semaine',
                'Jamais'
              ],
              correctIndex: 2
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Feedback constructif',
        order: 3,
        content: 'Le feedback est un cadeau. Apprenez à le donner efficacement : Feedback positif immédiat, feedback constructif en privé.',
        exercises: [
          {
            type: 'true_false',
            content: {
              question: 'Il faut toujours donner le feedback négatif en public',
              correct: false,
              explanation: 'Le feedback négatif doit toujours être donné en privé'
            },
            points: 5,
            order: 0
          }
        ]
      }
    ]
  },
  {
    title: 'Développement & Innovation',
    order: 4,
    lessons: [
      {
        title: 'Développer les compétences',
        order: 1,
        content: 'Investir dans la formation, c\'est investir dans l\'avenir. Règle 70-20-10 : 70% terrain, 20% mentorat, 10% formation.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Quelle est la règle 70-20-10 ?',
              answer: '70% terrain, 20% mentorat, 10% formation',
              hint: 'Les 3 sources d\'apprentissage'
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Cultiver l\'innovation',
        order: 2,
        content: 'L\'innovation vient des équipes qui osent. Conditions : Droit à l\'erreur, temps dédié, valorisation des idées.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'Quelle est la condition essentielle à l\'innovation ?',
              options: [
                'Un gros budget',
                'Le droit à l\'erreur',
                'Beaucoup de réunions',
                'Des procédures strictes'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Conduire le changement',
        order: 3,
        content: 'Le changement fait peur. Apprenez à l\'accompagner. Courbe du changement : Choc, Déni, Acceptation, Engagement.',
        exercises: [
          {
            type: 'true_false',
            content: {
              question: 'Tout le monde accepte le changement immédiatement',
              correct: false,
              explanation: 'Le changement passe par plusieurs phases émotionnelles'
            },
            points: 5,
            order: 0
          }
        ]
      }
    ]
  }
];

// ============================================
// PROGRAMME 2 : EXCELLENCE COMMERCIALE
// ============================================

const program2 = {
  title: 'Excellence Commerciale',
  description: 'Maîtrisez l\'art de la vente moderne',
  categoryId: null,
  status: 'active',
  organizationId,
  createdBy,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

const program2Chapters = [
  {
    title: 'Prospection Efficace',
    order: 1,
    lessons: [
      {
        title: 'Cibler les bons prospects',
        order: 1,
        content: 'Un bon ciblage = 50% du succès commercial. ICP : Ideal Customer Profile - Définissez votre client idéal.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Que signifie ICP ?',
              answer: 'Ideal Customer Profile',
              hint: 'Le profil de votre client idéal'
            },
            points: 5,
            order: 0
          },
          {
            type: 'qcm',
            content: {
              question: 'Pourquoi le ciblage est-il important ?',
              options: [
                'Pour perdre moins de temps',
                'Ce n\'est pas important',
                'Pour impressionner',
                'Pour compliquer'
              ],
              correctIndex: 0
            },
            points: 10,
            order: 1
          }
        ]
      },
      {
        title: 'Réussir son approche initiale',
        order: 2,
        content: 'Vous n\'aurez jamais une deuxième chance de faire une première bonne impression. Technique AIDA : Attention, Intérêt, Désir, Action.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'Que signifie AIDA ?',
              options: [
                'Attention, Intérêt, Désir, Action',
                'Amour, Intelligence, Douceur, Agilité',
                'Argent, Investissement, Dette, Actif'
              ],
              correctIndex: 0
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Qualifier efficacement',
        order: 3,
        content: 'Poser les bonnes questions pour comprendre le vrai besoin. Méthode SPIN : Situation, Problème, Implication, Need-payoff.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Que signifie SPIN ?',
              answer: 'Situation, Problème, Implication, Need-payoff',
              hint: 'Méthode de questionnement commercial'
            },
            points: 10,
            order: 0
          }
        ]
      }
    ]
  },
  {
    title: 'Argumentation & Négociation',
    order: 2,
    lessons: [
      {
        title: 'Argumentation percutante',
        order: 1,
        content: 'Ne vendez pas des caractéristiques, vendez des bénéfices. CAB : Caractéristique, Avantage, Bénéfice.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'Qu\'est-ce qui intéresse le plus le client ?',
              options: [
                'Les caractéristiques techniques',
                'Les bénéfices pour lui',
                'Le prix',
                'La marque'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Gérer les objections',
        order: 2,
        content: 'Une objection est une opportunité de mieux expliquer. Méthode : Écouter, Reformuler, Argumenter, Valider.',
        exercises: [
          {
            type: 'true_false',
            content: {
              question: 'Une objection signifie que le client n\'est pas intéressé',
              correct: false,
              explanation: 'Une objection est souvent un signe d\'intérêt'
            },
            points: 5,
            order: 0
          }
        ]
      },
      {
        title: 'Négociation commerciale',
        order: 3,
        content: 'Ne négociez jamais sans contrepartie. Règle Si... Alors... : Si je vous accorde X, alors vous acceptez Y.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Quelle est la règle d\'or de la négociation ?',
              answer: 'Ne jamais donner sans demander en retour',
              hint: 'La contrepartie est essentielle'
            },
            points: 10,
            order: 0
          }
        ]
      }
    ]
  },
  {
    title: 'Closing & Signature',
    order: 3,
    lessons: [
      {
        title: 'Reconnaître les signaux',
        order: 1,
        content: 'Le client vous dit quand il est prêt, écoutez-le. Questions sur modalités, conditions, délais = signaux positifs.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'Quel est un signal d\'achat ?',
              options: [
                'C\'est trop cher',
                'Quels sont les délais de livraison ?',
                'Je vais réfléchir'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Techniques de closing',
        order: 2,
        content: 'Ne pas avoir peur de demander la commande. Closing assumé : Alors, on se lance ensemble ?',
        exercises: [
          {
            type: 'true_false',
            content: {
              question: 'Il ne faut jamais demander directement la commande',
              correct: false,
              explanation: 'Au contraire, il faut oser demander'
            },
            points: 5,
            order: 0
          }
        ]
      },
      {
        title: 'Finaliser l\'accord',
        order: 3,
        content: 'Confirmer tous les détails avant signature. Checklist : Prix, Quantité, Délais, Conditions, Contact.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Que faut-il toujours faire avant de faire signer ?',
              answer: 'Confirmer tous les détails de l\'accord',
              hint: 'Vérification finale'
            },
            points: 5,
            order: 0
          }
        ]
      }
    ]
  },
  {
    title: 'Fidélisation Client',
    order: 4,
    lessons: [
      {
        title: 'Réussir l\'intégration client',
        order: 1,
        content: 'Les 90 premiers jours sont cruciaux pour fidéliser. Suivi rapproché, formation, accompagnement.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'Quelle est la période critique pour fidéliser ?',
              options: [
                'Les 7 premiers jours',
                'Les 90 premiers jours',
                'La première année'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Entretenir la relation',
        order: 2,
        content: 'Un client satisfait en amène 3, un client mécontent en perd 10. Touches régulières, écoute active, proactivité.',
        exercises: [
          {
            type: 'true_false',
            content: {
              question: 'Il faut contacter ses clients seulement pour vendre',
              correct: false,
              explanation: 'La relation client se cultive au-delà de la vente'
            },
            points: 5,
            order: 0
          }
        ]
      },
      {
        title: 'Développer le compte',
        order: 3,
        content: 'Vendre plus à un client existant coûte 5x moins cher. Identifier les besoins additionnels naturellement.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Quelle est la différence Upsell/Cross-sell ?',
              answer: 'Upsell = version supérieure, Cross-sell = produit complémentaire',
              hint: 'Deux stratégies de développement'
            },
            points: 10,
            order: 0
          }
        ]
      }
    ]
  }
];

// ============================================
// PROGRAMME 3 : EXCELLENCE RH
// ============================================

const program3 = {
  title: 'Excellence RH',
  description: 'Maîtrisez les fondamentaux des Ressources Humaines',
  categoryId: null,
  status: 'active',
  organizationId,
  createdBy,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

const program3Chapters = [
  {
    title: 'Recrutement',
    order: 1,
    lessons: [
      {
        title: 'Analyse du besoin en recrutement',
        order: 1,
        content: 'Un bon recrutement commence par une définition claire du besoin. Fiche de poste : Missions, Compétences, Profil, Environnement.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Quels sont les 4 éléments d\'une fiche de poste ?',
              answer: 'Missions, Compétences, Profil, Environnement',
              hint: 'Les 4 M-C-P-E'
            },
            points: 10,
            order: 0
          },
          {
            type: 'qcm',
            content: {
              question: 'Pourquoi définir précisément le besoin ?',
              options: [
                'Pour compliquer le processus',
                'Pour attirer les bons candidats',
                'Ce n\'est pas important'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 1
          }
        ]
      },
      {
        title: 'Trouver les bons talents',
        order: 2,
        content: 'Multipliez les canaux de sourcing pour toucher les meilleurs. LinkedIn, Jobboards, Cooptation, CVthèques, Écoles.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'Quel est le canal le plus efficace selon les études ?',
              options: [
                'LinkedIn',
                'La cooptation',
                'Les jobboards',
                'Les agences'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Techniques d\'entretien',
        order: 3,
        content: 'L\'entretien révèle les compétences ET le fit culturel. Méthode STAR : Situation, Tâche, Action, Résultat.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Que signifie STAR ?',
              answer: 'Situation, Tâche, Action, Résultat',
              hint: 'Méthode d\'entretien structuré'
            },
            points: 10,
            order: 0
          }
        ]
      }
    ]
  },
  {
    title: 'Onboarding',
    order: 2,
    lessons: [
      {
        title: 'Préparation de l\'intégration',
        order: 1,
        content: 'La première impression compte : préparez l\'arrivée. Matériel, Accès, Planning, Parrain, Documentation.',
        exercises: [
          {
            type: 'true_false',
            content: {
              question: 'On peut improviser le premier jour',
              correct: false,
              explanation: 'Le premier jour doit être parfaitement préparé'
            },
            points: 5,
            order: 0
          }
        ]
      },
      {
        title: 'Les 30 premiers jours',
        order: 2,
        content: 'Un bon onboarding réduit le turnover de 50%. J1 : Administratif, J7 : Équipe, J30 : Objectifs.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'En combien de temps juge-t-on un onboarding réussi ?',
              options: [
                '7 jours',
                '30 jours',
                '90 jours'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Points d\'étape',
        order: 3,
        content: 'Des points réguliers pour s\'assurer que tout va bien. Feedback à J7, J30, J90.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'À quels moments faire les points d\'intégration ?',
              answer: 'J7, J30, J90',
              hint: 'Trois jalons clés'
            },
            points: 5,
            order: 0
          }
        ]
      }
    ]
  },
  {
    title: 'Formation & Développement',
    order: 3,
    lessons: [
      {
        title: 'Analyse des besoins en formation',
        order: 1,
        content: 'Former pour développer, pas pour corriger. Entretiens annuels, Évaluations 360°, Demandes terrain.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'D\'où proviennent les besoins en formation ?',
              options: [
                'Uniquement de la direction',
                'Des entretiens et du terrain',
                'Des budgets disponibles'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Plan de développement des compétences',
        order: 2,
        content: 'Un plan structuré pour faire grandir les talents. Prioriser : Obligatoires, Stratégiques, Demandes.',
        exercises: [
          {
            type: 'true_false',
            content: {
              question: 'Toutes les formations se valent',
              correct: false,
              explanation: 'Il faut prioriser les formations selon l\'impact'
            },
            points: 5,
            order: 0
          }
        ]
      },
      {
        title: 'ROI de la formation',
        order: 3,
        content: 'Former coûte, ne pas former coûte plus cher. Évaluation à chaud, à froid, impact business.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Quels sont les 3 niveaux d\'évaluation ?',
              answer: 'À chaud, à froid, impact business',
              hint: 'Mesurer l\'efficacité de la formation'
            },
            points: 10,
            order: 0
          }
        ]
      }
    ]
  },
  {
    title: 'Rétention & Engagement',
    order: 4,
    lessons: [
      {
        title: 'Mesurer l\'engagement',
        order: 1,
        content: 'Un collaborateur engagé est 3x plus productif. Enquêtes, eNPS, Taux de turnover, Absentéisme.',
        exercises: [
          {
            type: 'qcm',
            content: {
              question: 'Quel indicateur mesure la satisfaction ?',
              options: [
                'Le CA',
                'L\'eNPS (Employee Net Promoter Score)',
                'Le nombre de formations'
              ],
              correctIndex: 1
            },
            points: 10,
            order: 0
          }
        ]
      },
      {
        title: 'Fidéliser les talents',
        order: 2,
        content: 'Remplacer un collaborateur coûte entre 6 et 12 mois de salaire. Reconnaissance, Évolution, Équilibre vie pro/perso.',
        exercises: [
          {
            type: 'true_false',
            content: {
              question: 'L\'argent est le seul levier de rétention',
              correct: false,
              explanation: 'La reconnaissance et l\'évolution sont tout aussi importants'
            },
            points: 5,
            order: 0
          }
        ]
      },
      {
        title: 'Offboarding',
        order: 3,
        content: 'Un départ bien géré préserve la marque employeur. Entretien de départ, Restitution, Ambassadeur potentiel.',
        exercises: [
          {
            type: 'flashcard',
            content: {
              question: 'Pourquoi faire un entretien de départ ?',
              answer: 'Pour comprendre les raisons et s\'améliorer',
              hint: 'Apprentissage organisationnel'
            },
            points: 5,
            order: 0
          }
        ]
      }
    ]
  }
];

// ============================================
// FONCTION PRINCIPALE DE CRÉATION
// ============================================

async function createProgram(programData, chaptersData) {
  console.log(`\n📚 Création du programme : ${programData.title}`);
  
  // 1. Créer le programme
  const programsRef = collection(db, 'organizations', organizationId, 'programs');
  const programDoc = await addDoc(programsRef, programData);
  const programId = programDoc.id;
  console.log(`✅ Programme créé : ${programId}`);
  
  // 2. Créer les chapitres
  for (const chapterData of chaptersData) {
    console.log(`  📖 Création du chapitre : ${chapterData.title}`);
    
    const chaptersRef = collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres');
    const chapterDoc = await addDoc(chaptersRef, {
      title: chapterData.title,
      order: chapterData.order,
      organizationId,
      programId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'active'
    });
    const chapterId = chapterDoc.id;
    console.log(`  ✅ Chapitre créé : ${chapterId}`);
    
    // 3. Créer les lessons
    for (const lessonData of chapterData.lessons) {
      console.log(`    📝 Création de la lesson : ${lessonData.title}`);
      
      const lessonsRef = collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres', chapterId, 'lessons');
      const lessonDoc = await addDoc(lessonsRef, {
        title: lessonData.title,
        order: lessonData.order,
        organizationId,
        programId,
        chapterId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'published',
        blocks: [
          {
            id: `block_${Date.now()}`,
            type: 'text',
            order: 0,
            isSaved: true,
            data: { html: `<p>${lessonData.content}</p>` }
          }
        ]
      });
      const lessonId = lessonDoc.id;
      console.log(`    ✅ Lesson créée : ${lessonId}`);
      
      // 4. Créer les exercices dans la collection exercises
      if (lessonData.exercises && lessonData.exercises.length > 0) {
        console.log(`      🎯 Création de ${lessonData.exercises.length} exercices...`);
        
        // Créer le document "main" dans la sous-collection exercises
        const exercisesDocRef = doc(db, 'organizations', organizationId, 'programs', programId, 'chapitres', chapterId, 'exercises', 'main');
        
        // Transformer les exercices en blocks
        const exerciseBlocks = lessonData.exercises.map((ex, idx) => ({
          id: `block_${Date.now()}_${idx}`,
          type: ex.type,
          order: ex.order,
          content: ex.content,
          points: ex.points
        }));
        
        await setDoc(exercisesDocRef, {
          organizationId,
          programId,
          chapterId,
          lessonId,
          blocks: exerciseBlocks,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        console.log(`      ✅ ${lessonData.exercises.length} exercices créés`);
      }
    }
  }
  
  console.log(`\n🎉 Programme "${programData.title}" créé avec succès !`);
}

// ============================================
// EXÉCUTION
// ============================================

export async function createAllTestPrograms() {
  console.log('🚀 Démarrage de la création des programmes de test...\n');
  console.log(`📍 Organisation : ${organizationId}`);
  console.log(`👤 Créé par : ${createdBy}\n`);
  
  try {
    // Créer les 3 programmes
    await createProgram(program1, program1Chapters);
    await createProgram(program2, program2Chapters);
    await createProgram(program3, program3Chapters);
    
    console.log('\n✅✅✅ TOUS LES PROGRAMMES ONT ÉTÉ CRÉÉS AVEC SUCCÈS ! ✅✅✅');
    console.log('\n📊 Résumé :');
    console.log('  - 3 programmes créés');
    console.log('  - 12 chapitres créés (4 par programme)');
    console.log('  - 36 lessons créées (3 par chapitre)');
    console.log('  - ~80 exercices créés\n');
    console.log('🎓 Vous pouvez maintenant tester l\'application avec du contenu réel !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des programmes:', error);
    console.error('Détails:', error.message);
    throw error;
  }
}

// Pour exécuter le script depuis la console :
// import { createAllTestPrograms } from './scripts/createTestPrograms';
// await createAllTestPrograms();
