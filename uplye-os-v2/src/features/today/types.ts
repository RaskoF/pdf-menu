export type Pole = 'commercial' | 'production' | 'finance'
export type InboxGroup = 'urgent' | 'today' | 'waiting'

export interface InboxEntry {
  id: string
  title: string
  /** « Pôle, client : détail » */
  context: string
  pole: Pole
  group: InboxGroup
  actionLabel: string
  done: boolean
}

export interface CashSummary {
  month: string
  goal: number
  collected: number
  invoicedUnpaid: number
  weightedToSign: number
  late?: { amount: number; client: string }
}

export interface TeamLoad {
  id: string
  name: string
  initials: string
  hours: number
  capacity: number
  alert?: string
}

export interface NextMeeting {
  time: string
  day: string
  title: string
  place: string
  joinUrl: string
}

export interface TodayData {
  inbox: InboxEntry[]
  cash: CashSummary
  team: TeamLoad[]
  nextMeeting: NextMeeting | null
  nextDeadline: string
}
