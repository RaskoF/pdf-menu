import type { Notification, Referral, Sop, SopRun } from './types'
import { daysAgo } from './utils'

let n = 0
const S = (text: string, detail?: string) => ({ id: `st${++n}`, text, detail })

// Process internes (SOP). Contenu de départ à ajuster par l'équipe.
export const SEED_SOPS: Sop[] = [
  { id: 'sop1', title: 'Trame R1 · rendez-vous de découverte', category: 'Commercial', owner: 'E', duration: '45 min', updatedAt: daysAgo(12),
    goal: 'Comprendre le besoin, le budget et le décideur pour envoyer un devis juste sous 48 h.',
    steps: [
      S('Préparer : site, réseaux, Google avis, 2 réalisations du même secteur', 'Ouvrir la fiche client dans l’OS et noter 3 observations.'),
      S('Brise-glace et cadre (5 min)', '« On a 45 minutes : je vous pose des questions, puis je vous dis comment on travaille. Ça vous va ? »'),
      S('Situation actuelle', 'Comment trouvez-vous vos clients aujourd’hui ? Qu’est-ce qui marche, qu’est-ce qui ne marche plus ?'),
      S('Objectif chiffré', 'Si on se revoit dans 6 mois et que c’est un succès, qu’est-ce qui a changé ? (nombre de clients, réservations, CA)'),
      S('Budget', '« Pour ce type de projet, nos clients investissent entre X et Y. Où vous situez-vous ? »'),
      S('Décision', 'Qui d’autre participe à la décision ? Quel délai pour démarrer ?'),
      S('Montrer 2 réalisations proches', 'Toujours du même secteur ou du même format.'),
      S('Prochaine étape datée', 'Fixer le R2 avant de raccrocher : « Je vous présente la proposition jeudi à 10 h ? »'),
      S('Après le rendez-vous', 'Notes dans l’OS (ou Fireflies), devis en brouillon dans les 24 h.'),
    ] },
  { id: 'sop2', title: 'Trame R2 · présentation du devis', category: 'Commercial', owner: 'E', duration: '30 min', updatedAt: daysAgo(12),
    goal: 'Présenter la proposition en partageant l’écran et repartir avec un « oui », un « non » ou une date.',
    steps: [
      S('Rappeler l’objectif chiffré du R1', '« Vous m’aviez dit vouloir… On a construit la proposition pour ça. »'),
      S('Dérouler la page devis en partage d’écran', 'Le projet, ce qui est inclus, le déroulé, les réalisations.'),
      S('Annoncer le prix une seule fois, puis se taire'),
      S('Traiter les objections', 'Prix : proposer l’échéancier ou retirer une ligne, jamais baisser sans contrepartie.'),
      S('Demander la décision', '« Est-ce qu’on lance ? » Si oui : bon pour accord en ligne pendant l’appel.'),
      S('Sinon, poser une date', 'Relance J+3 activée dans l’OS.'),
    ] },
  { id: 'sop3', title: 'Relance d’un devis', category: 'Commercial', owner: 'E', duration: '10 min', updatedAt: daysAgo(30),
    goal: 'Ne jamais laisser un devis sans réponse plus de 10 jours.',
    steps: [S('J+3 si non ouvert : relance automatique par e-mail'), S('J+5 si ouvert sans réponse : message WhatsApp personnel'), S('J+10 : appel', '« Je fais le point sur les projets de la semaine prochaine, on vous garde le créneau ? »'), S('J+20 sans réponse : classer en perdu avec le motif « Plus de nouvelles » et une relance à 3 mois')] },
  { id: 'sop4', title: 'Préparer et réussir un tournage', category: 'Production', owner: 'A', duration: 'J-3 à J+1', updatedAt: daysAgo(20),
    goal: 'Zéro oubli sur place, rushs sauvegardés le soir même.',
    steps: [S('J-3 : liste des plans validée par le client'), S('J-2 : checklist matériel (batteries chargées, cartes vides, micros testés)'), S('J-1 : confirmer l’horaire et l’adresse au client par message'), S('Sur place : plans larges d’abord, interviews ensuite, B-roll pour finir'), S('Le soir : double sauvegarde des rushs (NAS + disque) et nommage', 'AAAA-MM-JJ_Client_Projet_Camera'), S('J+1 : message de remerciement au client avec 2 photos des coulisses')] },
  { id: 'sop5', title: 'Montage, retours et livraison', category: 'Production', owner: 'A', duration: '1 à 2 semaines', updatedAt: daysAgo(20),
    goal: 'Livrer en deux allers-retours maximum.',
    steps: [S('V1 envoyée dans le portail client, avec 3 questions précises'), S('Retours horodatés sur la vidéo, regroupés en une seule liste'), S('V2 corrigée, vérification sous-titres et formats (9:16, 4:5, 16:9)'), S('Validation client puis export final et livraison dans le portail'), S('Archiver le projet et ranger les rushs sur le NAS')] },
  { id: 'sop6', title: 'Accueillir une session Azurpod', category: 'Azurpod', owner: 'A', duration: '20 min avant', updatedAt: daysAgo(15),
    goal: 'Le client se sent attendu, l’enregistrement démarre à l’heure.',
    steps: [S('Studio prêt 20 min avant : lumières, caméras, micros testés'), S('Eau et café sur la table'), S('Brief de 5 min avec les invités : posture, regard caméra, micro'), S('Enregistrement + sauvegarde immédiate'), S('Fin : proposer le pack 10 h ou la formule Clé en main')] },
  { id: 'sop7', title: 'Onboarding d’un nouveau membre', category: 'Équipe', owner: 'E', duration: '1re semaine', updatedAt: daysAgo(40),
    goal: 'Autonome sur les outils et les process en 5 jours.',
    steps: [S('Avant l’arrivée : compte Uplye OS (rôle adapté), e-mail, accès Drive / NAS en lecture'), S('Jour 1 : visite du local, café avec l’équipe, visite guidée de l’OS'), S('Jour 1 : lire les SOP Production et le nommage des fichiers'), S('Jour 2 : premier montage accompagné sur un projet interne'), S('Semaine 1 : un point de 15 min chaque soir'), S('Fin de semaine 1 : retour d’expérience et objectifs du mois')] },
  { id: 'sop8', title: 'Offboarding d’un membre', category: 'Équipe', owner: 'E', duration: 'Dernière semaine', updatedAt: daysAgo(40),
    goal: 'Aucun accès oublié, aucun fichier perdu.',
    steps: [S('Lister ses projets et tâches en cours, les réassigner'), S('Récupérer les fichiers locaux sur le NAS'), S('Couper les accès le dernier jour : OS, e-mail, Drive, NAS, logiciels'), S('Récupérer le matériel prêté'), S('Entretien de sortie : ce qu’on garde, ce qu’on change')] },
  { id: 'sop9', title: 'Facturation et relances de paiement', category: 'Admin', owner: 'E', duration: 'Chaque fin de mois', updatedAt: daysAgo(25),
    goal: 'Délai de paiement moyen sous 20 jours.',
    steps: [S('Facture d’acompte envoyée à la signature (automatique)'), S('Facture de livraison le jour de la livraison'), S('J+1 après échéance : relance automatique'), S('J+7 : appel'), S('J+30 : mise en demeure (modèle dans le Drive)')] },
]

export const SEED_RUNS: SopRun[] = [
  { id: 'run1', sopId: 'sop7', label: 'Onboarding Alexis', startedAt: daysAgo(40), done: ['st36', 'st37', 'st38'], by: 'E' },
]

export const SEED_REFERRALS: Referral[] = [
  { id: 'rf1', referrerId: 'cl1', name: 'Paul Martin', company: 'Pâtisserie Martin', email: 'paul@exemple.fr', status: 'signe', amountHT: 1200, reward: 'credit', settled: false, createdAt: daysAgo(35) },
  { id: 'rf2', referrerId: 'cl1', name: 'Inès Garcia', company: 'Fleurs d’Inès', email: 'ines@exemple.fr', status: 'devis', amountHT: 850, reward: 'credit', settled: false, createdAt: daysAgo(8) },
  { id: 'rf3', referrerId: 'cl5', name: 'Marc Olivier', company: 'Cave Olivier', email: 'marc@exemple.fr', status: 'invite', amountHT: 0, reward: 'commission', settled: false, createdAt: daysAgo(3) },
]

export const SEED_NOTIFS: Notification[] = []
