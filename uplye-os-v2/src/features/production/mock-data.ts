// Données FICTIVES de démonstration, reprises des maquettes Figma « 13 Production ». À remplacer par l'API.
import type { Project, ProjectPhase, SocialAccount, SocialPost, StudioDelivery, StudioPack, StudioSession } from './types'

let taskSeq = 0
const t = (label: string, owner: 'EN' | 'AL' | 'AX', due: string, done = false) => ({ id: `t${++taskSeq}`, label, owner, due, done })
const phase = (id: string, label: string, start: string, end: string, tasks: ReturnType<typeof t>[] = []): ProjectPhase => ({ id, label, start, end, tasks })

export const PROJECTS: Project[] = [
  {
    id: 'p-dune',
    title: 'Saison Dune, podcast',
    clientId: 'skeals',
    brand: 'azurpod',
    pilot: 'AX',
    process: 'Podcast Azurpod, 4 phases',
    phases: [
      phase('brief', 'Brief', '2026-09-01', '2026-09-05', [t('Calendrier des 8 épisodes', 'EN', '2026-09-05', true)]),
      phase('enregistrement', 'Enregistrement', '2026-09-10', '2026-11-05', [t('Épisode 4', 'AX', '2026-10-22'), t('Épisode 5', 'AX', '2026-10-29')]),
      phase('montage', 'Montage', '2026-09-11', '2026-11-08', [t('Monter l’épisode 3', 'AX', '2026-10-12', true)]),
      phase('diffusion', 'Diffusion', '2026-09-15', '2026-11-15', [
        t('Envoyer l’épisode 3', 'AX', '2026-10-14'),
        t('Récupérer les visuels de l’épisode 3', 'EN', '2026-10-17'),
      ]),
    ],
    currentPhase: 3,
    due: '2026-11-15',
    dueNote: 'envoi ép. 3 bloqué',
    blocked: 'Visuels client manquants depuis 2 jours',
    revenue: 450,
    hoursSold: 12,
    hoursSpent: 13,
    plannedMargin: 0.43,
    revisions: null,
    clientWaiting: [{ id: 'w1', title: 'Visuels de l’épisode 3', detail: 'Demandés le 14 oct. à Thomas, sans réponse' }],
    deliverables: [
      { id: 'd1', title: 'Épisodes 1 et 2', detail: 'Publiés', kind: 'audio', status: 'valide' },
      { id: 'd2', title: 'Épisode 3', detail: 'Monté, en attente des visuels', kind: 'audio', status: 'en_cours' },
    ],
    clientSpace: true,
  },
  {
    id: 'p-ils',
    title: 'Campagne Meta, 2 vidéos',
    clientId: 'ils',
    brand: 'studio',
    devisId: 'dev-012',
    devisNumber: 'DEV-2026-012',
    pilot: 'EN',
    process: 'Vidéo pub, 6 phases',
    phases: [
      phase('brief', 'Brief', '2026-09-22', '2026-09-24', [t('Brief validé', 'EN', '2026-09-24', true)]),
      phase('preprod', 'Préproduction', '2026-09-25', '2026-09-29', [t('Liste des plans', 'AL', '2026-09-28', true)]),
      phase('tournage', 'Tournage', '2026-09-30', '2026-09-30', [t('Tournage à l’institut', 'AX', '2026-09-30', true)]),
      phase('montage', 'Montage', '2026-10-01', '2026-10-08', [t('Vidéos A et B', 'AX', '2026-10-02', true)]),
      phase('retours', 'Retours', '2026-10-09', '2026-10-19', [t('Intégrer les retours V2', 'AX', '2026-10-19')]),
      phase('livraison', 'Livraison', '2026-10-20', '2026-10-30', [t('Bilan de campagne', 'EN', '2026-10-30')]),
    ],
    currentPhase: 4,
    due: '2026-10-19',
    dueNote: 'V2 à valider',
    shootingDate: '2026-09-30',
    revenue: 1050,
    hoursSold: 16,
    hoursSpent: 19,
    plannedMargin: 0.59,
    revisions: { used: 2, included: 2 },
    clientWaiting: [{ id: 'w1', title: 'Validation de la V2', detail: 'Envoyée le 17 oct. à Coralie, ouverte une fois' }],
    deliverables: [
      { id: 'd1', title: 'Vidéo A, « Expérience »', detail: 'V2 envoyée', kind: 'video', status: 'chez_client' },
      { id: 'd2', title: 'Vidéo B, « La parenthèse »', detail: 'V2 envoyée', kind: 'video', status: 'chez_client' },
    ],
    clientSpace: true,
  },
  {
    id: 'p-mayli',
    title: 'Vidéo pub + shooting',
    clientId: 'mayli',
    brand: 'studio',
    devisId: 'dev-014',
    devisNumber: 'DEV-2026-014',
    pilot: 'AL',
    process: 'Vidéo pub, 6 phases',
    phases: [
      phase('brief', 'Brief', '2026-10-10', '2026-10-10', [t('Brief rempli par Mayli', 'EN', '2026-10-10', true)]),
      phase('preprod', 'Préproduction', '2026-10-11', '2026-10-21', [
        t('Confirmer lieu et modèle', 'EN', '2026-10-16', true),
        t('Script vidéo pub, accroche 3 s', 'AL', '2026-10-20'),
        t('Liste des plans et des photos', 'AL', '2026-10-21'),
        t('Préparer le matériel', 'AL', '2026-10-22'),
      ]),
      phase('tournage', 'Tournage', '2026-10-23', '2026-10-23', [t('Tournage vidéo', 'AL', '2026-10-23'), t('Shooting photo', 'AL', '2026-10-23')]),
      phase('montage', 'Montage', '2026-10-24', '2026-10-27', [t('Montage vidéo pub', 'AX', '2026-10-26'), t('Retouche des 20 photos', 'AX', '2026-10-27')]),
      phase('retours', 'Retours', '2026-10-28', '2026-10-28', []),
      phase('livraison', 'Livraison', '2026-10-30', '2026-10-30', [t('Livrer et lancer la campagne', 'EN', '2026-10-30')]),
    ],
    currentPhase: 1,
    due: '2026-10-30',
    shootingDate: '2026-10-23',
    revenue: 850,
    hoursSold: 19,
    hoursSpent: 3,
    plannedMargin: 0.62,
    revisions: { used: 0, included: 2 },
    clientWaiting: [{ id: 'w1', title: 'Validation du script V1', detail: 'Ouvert hier par Mayli, pas encore validé. Relance automatique demain à 9:00.' }],
    clientChecklist: { done: 1, total: 3, label: 'Préparation du tournage' },
    deliverables: [
      { id: 'd1', title: 'Script V1', detail: 'Partagé hier', kind: 'document', status: 'chez_client' },
      { id: 'd2', title: 'Liste des plans', detail: 'Allan, en cours', kind: 'liste', status: 'en_cours' },
      { id: 'd3', title: 'Vidéo V1', detail: 'Après le tournage', kind: 'video', status: 'a_venir' },
    ],
    clientSpace: true,
  },
  {
    id: 'p-club',
    title: 'Séminaire + vidéo matinale',
    clientId: 'club-royalty',
    brand: 'studio',
    pilot: 'AX',
    process: 'Captation, 5 phases',
    phases: [
      phase('brief', 'Brief', '2026-09-30', '2026-09-30', [t('Brief séminaire', 'AL', '2026-09-30', true)]),
      phase('preprod', 'Préproduction', '2026-10-01', '2026-10-09', [t('Repérage', 'AX', '2026-10-08', true)]),
      phase('tournage', 'Tournage', '2026-10-10', '2026-10-10', [t('Captation deux caméras', 'AX', '2026-10-10', true)]),
      phase('montage', 'Montage', '2026-10-12', '2026-11-04', [t('Best-of 3 minutes', 'AX', '2026-10-28'), t('Vidéo matinale', 'AX', '2026-11-04')]),
      phase('livraison', 'Livraison', '2026-11-05', '2026-11-08', [t('Livraison des fichiers', 'AL', '2026-11-08')]),
    ],
    currentPhase: 3,
    due: '2026-11-08',
    shootingDate: '2026-10-10',
    revenue: 1500,
    hoursSold: 34,
    hoursSpent: 31,
    plannedMargin: 0.55,
    revisions: { used: 0, included: 2 },
    clientWaiting: [],
    deliverables: [
      { id: 'd1', title: 'Best-of 3 minutes', detail: 'Montage en cours', kind: 'video', status: 'en_cours' },
      { id: 'd2', title: 'Vidéo matinale', detail: 'Après le best-of', kind: 'video', status: 'a_venir' },
    ],
    clientSpace: false,
  },
  {
    id: 'p-laforet',
    title: 'Pack 10 h podcast',
    clientId: 'laforet',
    brand: 'azurpod',
    devisId: 'dev-011',
    devisNumber: 'DEV-2026-011',
    pilot: 'AX',
    process: 'Podcast Azurpod, 4 phases',
    phases: [
      phase('brief', 'Brief', '2026-09-30', '2026-09-30', [t('Format et invités', 'EN', '2026-09-30', true)]),
      phase('enregistrement', 'Enregistrement', '2026-09-30', '2026-12-31', [t('Séance 2', 'AX', '2026-10-21')]),
      phase('montage', 'Montage', '2026-10-01', '2026-12-31', []),
      phase('diffusion', 'Diffusion', '2026-10-01', '2026-12-31', []),
    ],
    currentPhase: 1,
    due: '2026-12-31',
    dueNote: '1 h sur 10 utilisée',
    revenue: 648,
    hoursSold: 10,
    hoursSpent: 1,
    plannedMargin: null,
    revisions: null,
    clientWaiting: [],
    deliverables: [{ id: 'd1', title: 'Séance 1', detail: 'Envoyée le 1er oct.', kind: 'audio', status: 'valide' }],
    clientSpace: true,
  },
  {
    id: 'p-ils-photo',
    title: 'Shooting photo',
    clientId: 'ils',
    brand: 'studio',
    pilot: 'AL',
    process: 'Shooting, 4 phases',
    phases: [
      phase('brief', 'Brief', '2026-09-22', '2026-09-22', [t('Brief', 'AL', '2026-09-22', true)]),
      phase('shooting', 'Shooting', '2026-09-30', '2026-09-30', [t('Shooting soins visage', 'AL', '2026-09-30', true)]),
      phase('retouches', 'Retouches', '2026-10-01', '2026-10-01', [t('Retouches', 'AX', '2026-10-01', true)]),
      phase('livraison', 'Livraison', '2026-10-02', '2026-10-02', [t('Galerie client', 'AL', '2026-10-02', true)]),
    ],
    currentPhase: 4,
    due: '2026-10-02',
    deliveredAt: '2026-10-02',
    revenue: 300,
    hoursSold: 5,
    hoursSpent: 4,
    plannedMargin: 0.58,
    revisions: { used: 1, included: 2 },
    clientWaiting: [],
    deliverables: [{ id: 'd1', title: '20 photos retouchées', detail: 'Galerie livrée', kind: 'photos', status: 'valide' }],
    clientSpace: true,
  },
]

/** Process proposés à la création d'un projet : phases et tâches de départ */
export const PROCESSES: { id: string; label: string; brand: 'studio' | 'azurpod'; phases: { label: string; tasks: string[] }[] }[] = [
  {
    id: 'video',
    label: 'Vidéo pub, 6 phases',
    brand: 'studio',
    phases: [
      { label: 'Brief', tasks: ['Envoyer le brief au client', 'Valider le brief'] },
      { label: 'Préproduction', tasks: ['Confirmer lieu et modèle', 'Script, accroche 3 s', 'Liste des plans', 'Préparer le matériel'] },
      { label: 'Tournage', tasks: ['Tournage', 'Sauvegarde des rushs'] },
      { label: 'Montage', tasks: ['Montage V1', 'Étalonnage et sous-titres', 'Formats 9:16 et 4:5'] },
      { label: 'Retours', tasks: ['Intégrer les retours'] },
      { label: 'Livraison', tasks: ['Livrer les fichiers', 'Demander un avis client'] },
    ],
  },
  {
    id: 'shooting',
    label: 'Shooting, 4 phases',
    brand: 'studio',
    phases: [
      { label: 'Brief', tasks: ['Moodboard', 'Valider le brief'] },
      { label: 'Shooting', tasks: ['Shooting'] },
      { label: 'Retouches', tasks: ['Sélection', 'Retouches'] },
      { label: 'Livraison', tasks: ['Galerie client'] },
    ],
  },
  {
    id: 'captation',
    label: 'Captation, 5 phases',
    brand: 'studio',
    phases: [
      { label: 'Brief', tasks: ['Programme de l’événement'] },
      { label: 'Préproduction', tasks: ['Repérage', 'Réserver le second cadreur'] },
      { label: 'Tournage', tasks: ['Captation'] },
      { label: 'Montage', tasks: ['Best-of', 'Vidéo complète'] },
      { label: 'Livraison', tasks: ['Livrer les fichiers'] },
    ],
  },
  {
    id: 'podcast',
    label: 'Podcast Azurpod, 4 phases',
    brand: 'azurpod',
    phases: [
      { label: 'Brief', tasks: ['Format, invités, calendrier'] },
      { label: 'Enregistrement', tasks: ['Réserver les séances'] },
      { label: 'Montage', tasks: ['Monter les épisodes'] },
      { label: 'Diffusion', tasks: ['Publier sur les plateformes'] },
    ],
  },
]

export const SESSIONS: StudioSession[] = [
  { id: 's1', clientId: 'skeals', label: 'Skeals, ép. 2', date: '2026-10-02', start: '15:30', end: '17:00', formula: 'standard' },
  { id: 's2', label: 'Podcast RH', date: '2026-10-07', start: '10:00', end: '11:30', formula: 'premontage' },
  { id: 's3', clientId: 'skeals', label: 'Skeals, ép. 3', date: '2026-10-09', start: '15:30', end: '17:00', formula: 'standard' },
  { id: 's4', label: 'Matins du Var', date: '2026-10-14', start: '09:00', end: '10:00', formula: 'cle_en_main' },
  { id: 's5', label: 'Coach sportif', date: '2026-10-16', start: '14:00', end: '15:00', formula: 'premontage' },
  { id: 's6', clientId: 'laforet', label: 'Laforêt, séance 2', date: '2026-10-21', start: '10:00', end: '12:00', formula: 'pack' },
  { id: 's7', clientId: 'skeals', label: 'Skeals, Dune ép. 4', date: '2026-10-22', start: '15:30', end: '17:00', formula: 'standard' },
  { id: 's8', label: 'Matins du Var', date: '2026-10-27', start: '09:00', end: '10:00', formula: 'cle_en_main' },
  { id: 's9', label: 'Option : Podcast RH', date: '2026-10-30', start: '14:00', end: '16:00', formula: 'premontage', option: true },
]

export const DELIVERIES: StudioDelivery[] = [
  {
    id: 'l1',
    title: 'Dune, épisode 3',
    detail: 'Skeals, enregistré le 9 oct.',
    clientId: 'skeals',
    recordedAt: '2026-10-09',
    formula: 'standard',
    promiseDays: 1,
    status: 'bloque',
    blockedReason: 'Visuels client manquants',
    blockedSince: '2026-10-17',
  },
  {
    id: 'l2',
    title: 'Session découverte',
    detail: 'Coach sportif, enregistré le 16 oct.',
    recordedAt: '2026-10-16',
    formula: 'premontage',
    promiseDays: 3,
    status: 'a_monter',
  },
  {
    id: 'l3',
    title: 'Pack 10 h, séance 1',
    detail: 'Laforêt, enregistré le 30 sept.',
    clientId: 'laforet',
    recordedAt: '2026-09-30',
    formula: 'standard',
    promiseDays: 1,
    status: 'livre',
    deliveredAt: '2026-10-01',
  },
]

export const PACKS: StudioPack[] = [
  { id: 'k1', clientId: 'laforet', label: 'Laforêt, pack 10 h', unit: 'h', used: 1, total: 10, next: 'Prochaine séance mercredi 21 oct.' },
  { id: 'k2', clientId: 'skeals', label: 'Skeals, saison Dune', unit: 'épisodes', used: 3, total: 8, next: 'Épisode 4 jeudi 22 oct.' },
]

/** Tarifs du catalogue Azurpod (HT par heure) */
export const FORMULA_RATE: Record<Exclude<StudioSession['formula'], 'pack'>, number> = { standard: 90, premontage: 165, cle_en_main: 350 }

export const ACCOUNTS: SocialAccount[] = [
  { brand: 'studio', network: 'instagram', handle: 'uplyestudio', followers: 2380, connected: true },
  { brand: 'studio', network: 'facebook', handle: 'Uplye Studio', followers: 640, connected: true },
  { brand: 'studio', network: 'linkedin', handle: 'Uplye Studio', followers: 1240, connected: true },
  { brand: 'azurpod', network: 'instagram', handle: 'azurpod', followers: 910, connected: false, disconnectedSince: '2026-10-15' },
  { brand: 'azurpod', network: 'facebook', handle: 'Azurpod', followers: 220, connected: true },
  { brand: 'academy', network: 'instagram', handle: 'uplye.academy', followers: 430, connected: true },
  { brand: 'academy', network: 'facebook', handle: 'Uplye Academy', followers: 150, connected: true },
  { brand: 'academy', network: 'linkedin', handle: 'Uplye Academy', followers: 380, connected: true },
]

const CASE_STUDY =
  'Cas client. L’Institut Lumière du Sud voulait remplir son agenda avant les fêtes. Deux vidéos et une campagne Meta locale : 2,4 % de clics et 18 rendez-vous pris sur Planity en 3 jours.\n\nVous voulez la même chose ? Lien en bio.'

let postSeq = 0
const post = (p: Omit<SocialPost, 'id' | 'caption' | 'media'> & Partial<Pick<SocialPost, 'caption' | 'media'>>): SocialPost => ({
  id: `post-${++postSeq}`,
  caption: `${p.title}.`,
  media: p.format === 'carrousel' ? 3 : 1,
  ...p,
})

export const POSTS: SocialPost[] = [
  post({
    brand: 'studio',
    format: 'reel',
    title: 'Les 3 plans d’ouverture qui accrochent',
    date: '2026-10-01',
    time: '12:30',
    networks: ['instagram'],
    status: 'publie',
  }),
  post({ brand: 'azurpod', format: 'reel', title: 'Dune ép. 2', date: '2026-10-03', time: '11:00', networks: ['instagram', 'facebook'], status: 'publie' }),
  post({
    brand: 'studio',
    format: 'carrousel',
    title: 'Carrousel ILS',
    date: '2026-10-06',
    time: '18:30',
    networks: ['instagram', 'facebook'],
    status: 'publie',
  }),
  post({
    brand: 'academy',
    format: 'post',
    title: 'Formation montage : dates de novembre',
    date: '2026-10-08',
    time: '12:00',
    networks: ['instagram', 'linkedin'],
    status: 'publie',
  }),
  post({ brand: 'azurpod', format: 'reel', title: 'Coulisses Skeals', date: '2026-10-09', time: '17:00', networks: ['instagram'], status: 'publie' }),
  post({ brand: 'studio', format: 'story', title: 'Story Mayli', date: '2026-10-10', time: '10:00', networks: ['instagram'], status: 'publie' }),
  post({
    brand: 'studio',
    format: 'reel',
    title: 'Reel avant/après',
    date: '2026-10-13',
    time: '18:00',
    networks: ['instagram', 'facebook'],
    status: 'publie',
  }),
  post({ brand: 'academy', format: 'post', title: 'Post Academy', date: '2026-10-14', time: '12:00', networks: ['linkedin'], status: 'publie' }),
  post({
    brand: 'studio',
    format: 'carrousel',
    title: 'Cas client : 18 RDV en 3 jours (première version)',
    caption: CASE_STUDY,
    date: '2026-10-15',
    time: '18:30',
    networks: ['instagram', 'facebook', 'linkedin'],
    status: 'echec',
    sourceProjectId: 'p-ils',
    failure: { network: 'linkedin', reason: 'Le PDF du carrousel fait 104 Mo, la limite LinkedIn est de 100 Mo. Instagram et Facebook sont partis à 18:30.' },
  }),
  post({ brand: 'studio', format: 'story', title: 'Coulisses du bilan ILS', date: '2026-10-15', time: '17:00', networks: ['instagram'], status: 'publie' }),
  post({
    brand: 'azurpod',
    format: 'reel',
    title: 'Dune épisode 3, extrait',
    date: '2026-10-16',
    time: '17:00',
    networks: ['instagram', 'facebook'],
    status: 'publie',
  }),
  post({
    brand: 'studio',
    format: 'reel',
    title: '5 erreurs qui ruinent une vidéo pub',
    date: '2026-10-19',
    time: '12:30',
    networks: ['instagram', 'facebook', 'linkedin'],
    status: 'programme',
  }),
  post({
    brand: 'studio',
    format: 'carrousel',
    title: 'Cas client : 18 RDV en 3 jours pour l’Institut',
    caption: CASE_STUDY,
    date: '2026-10-20',
    time: '18:30',
    networks: ['instagram', 'facebook', 'linkedin'],
    status: 'programme',
    sourceProjectId: 'p-ils',
  }),
  post({
    brand: 'azurpod',
    format: 'reel',
    title: 'Extrait Skeals, Dune épisode 3',
    date: '2026-10-21',
    time: '18:00',
    networks: ['instagram'],
    status: 'programme',
    sourceProjectId: 'p-dune',
  }),
  post({
    brand: 'academy',
    format: 'post',
    title: 'Formation montage : les inscriptions ouvrent',
    date: '2026-10-22',
    time: '12:00',
    networks: ['instagram', 'facebook', 'linkedin'],
    status: 'programme',
  }),
  post({
    brand: 'studio',
    format: 'story',
    title: 'Coulisses du tournage chez Mayli',
    date: '2026-10-23',
    time: '10:30',
    networks: ['instagram'],
    status: 'programme',
    sourceProjectId: 'p-mayli',
  }),
  post({ brand: 'azurpod', format: 'reel', title: 'Dune ép. 4', date: '2026-10-29', time: '17:00', networks: ['instagram', 'facebook'], status: 'programme' }),
  post({
    brand: 'studio',
    format: 'reel',
    title: 'Avant / après : la vidéo Mayli',
    networks: ['instagram', 'facebook'],
    status: 'brouillon',
    sourceProjectId: 'p-mayli',
  }),
  post({ brand: 'azurpod', format: 'carrousel', title: 'Annonce saison 2 de Dune', networks: ['instagram', 'facebook'], status: 'brouillon' }),
]

/** Créneaux conseillés par marque (d'après les statistiques de publication) */
export const BEST_SLOTS: Record<SocialPost['brand'], { label: string; time: string }> = {
  studio: { label: '18:00 – 19:30', time: '18:30' },
  azurpod: { label: '17:00 – 18:30', time: '17:30' },
  academy: { label: '12:00 – 13:00', time: '12:00' },
}

export interface ProductionData {
  projects: Project[]
  sessions: StudioSession[]
  deliveries: StudioDelivery[]
  packs: StudioPack[]
  accounts: SocialAccount[]
  posts: SocialPost[]
}

export const PRODUCTION_MOCK: ProductionData = {
  projects: PROJECTS,
  sessions: SESSIONS,
  deliveries: DELIVERIES,
  packs: PACKS,
  accounts: ACCOUNTS,
  posts: POSTS,
}

/** Simule l'appel API (état « Projets / Chargement », 122:1811) */
export const fetchProduction = (delay = 500) => new Promise<ProductionData>((resolve) => setTimeout(() => resolve(structuredClone(PRODUCTION_MOCK)), delay))
