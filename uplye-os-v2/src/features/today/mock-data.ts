// Données FICTIVES (maquette Figma « Aujourd’hui », 41:1086). À remplacer par l'API.
import type { TodayData } from './types'

export const TODAY_MOCK: TodayData = {
  inbox: [
    { id: 'i1', title: 'Débloquer l’envoi de l’épisode 3', context: 'Production, Skeals : visuels client manquants depuis 2 jours', pole: 'production', group: 'urgent', actionLabel: 'Relancer Skeals', done: false },
    { id: 'i2', title: 'Facture F-2026-118 échue', context: 'Finance, Club Royalty, 790 €, 12 jours de retard', pole: 'finance', group: 'urgent', actionLabel: 'Relancer', done: false },
    { id: 'i3', title: 'Relancer Mayli Spa & Beauty', context: 'Devis ouvert 3 fois, 4 min passées sur les prix', pole: 'commercial', group: 'today', actionLabel: 'Relancer', done: false },
    { id: 'i4', title: 'Relancer 3 contacts du BNI', context: 'Événements, avant demain 18:00, messages prêts', pole: 'commercial', group: 'today', actionLabel: 'Relire', done: false },
    { id: 'i5', title: 'Point J3 campagne, 10:00', context: 'Rendez-vous, Institut Lumière du Sud. CTR 2,4 %, 18 RDV générés', pole: 'commercial', group: 'today', actionLabel: 'Préparer', done: false },
    { id: 'i6', title: 'Validation de la vidéo B', context: 'Production, chez Coralie depuis 1 jour, révision 2 sur 2', pole: 'production', group: 'waiting', actionLabel: 'Voir', done: false },
    { id: 'i7', title: 'Acompte Laforêt, 194 €', context: 'Finance, lien de paiement envoyé le 30 sept.', pole: 'finance', group: 'waiting', actionLabel: 'Voir', done: false },
    { id: 'd1', title: 'Envoyer le devis Alan Diagola', context: 'Commercial, envoyé à 9:12', pole: 'commercial', group: 'today', actionLabel: 'Voir', done: true },
    { id: 'd2', title: 'Valider le planning de tournage Mayli', context: 'Production, validé par Coralie', pole: 'production', group: 'today', actionLabel: 'Voir', done: true },
  ],
  cash: { month: 'octobre', goal: 3000, collected: 1860, invoicedUnpaid: 790, weightedToSign: 330, late: { amount: 790, client: 'Club Royalty' } },
  team: [
    { id: 'ax', name: 'Alexis', initials: 'AX', hours: 28, capacity: 35, alert: 'Jeudi en conflit' },
    { id: 'al', name: 'Allan', initials: 'AL', hours: 23, capacity: 35 },
    { id: 'en', name: 'Enzo', initials: 'EN', hours: 14, capacity: 35 },
  ],
  nextMeeting: { time: '10:00', day: 'lun.', title: 'Point J3 campagne Meta', place: 'Institut Lumière du Sud, Google Meet', joinUrl: 'https://meet.google.com/' },
  nextDeadline: 'mardi : le script de la vidéo Mayli',
}

/** Simule un appel réseau (en attendant l'API). */
export function fetchToday(delayMs = 600): Promise<TodayData> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(TODAY_MOCK)), delayMs))
}
