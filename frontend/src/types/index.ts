export type Theme = 'dark' | 'light'

export type TabId = 'plan' | 'vibe' | 'india' | 'pack'

export interface TripFormData {
  origin: string
  destination: string
  startDate: string
  endDate: string
  noOfMembers: number
  interests: string
  tripVibe: string
  onlyVeg: boolean
  religious: boolean
}

export interface BudgetData {
  Flights: number
  Hotels: number
  Food: number
  Activities: number
  Transport: number
  [key: string]: number
}

export interface PlanningState {
  isLoading: boolean
  progress: number
  progressLabel: string
  images: string[]
  budget: BudgetData | null
  itinerary: string | null
  events: string | null
  localTips: string | null
  coords: [number, number] | null
  noDays: number
  error: string | null
  destination: string
  formData: TripFormData | null
}

export interface IndiaDestination {
  name: string
  emoji: string
  gradient: string
  season: string
  description: string
  highlights: string[]
  budget: string
  vibe: string
  avg_temp: string
  language: string
}

export interface PackingList {
  Clothing: string[]
  Toiletries: string[]
  Electronics: string[]
  Documents: string[]
  'Health & Safety': string[]
  'Misc & Comfort': string[]
  [key: string]: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export const VIBE_MAP: Record<string, string> = {
  'Adventure 🏔️': 'adventure, outdoor activities, trekking, extreme sports',
  'Chill 🌴': 'relaxation, beaches, spas, slow travel',
  'Cultural 🎭': 'museums, history, local cuisine, art, festivals',
  'Romantic 💕': 'couples activities, scenic dinners, sunset spots, private experiences',
  'Party 🎉': 'nightlife, clubs, festivals, social events',
  'Solo 🧘': 'solo-friendly, cafes, journaling spots, mindful travel',
}

export const PACK_EMOJIS: Record<string, string> = {
  Clothing: '👕',
  Toiletries: '🧴',
  Electronics: '🔌',
  Documents: '📄',
  'Health & Safety': '💊',
  'Misc & Comfort': '🎒',
}

export const PAYMENT_TIPS = [
  { icon: '💳', title: 'UPI First', desc: 'Use Google Pay, PhonePe, or Paytm for 90% of transactions — even street vendors accept it.' },
  { icon: '💵', title: 'Cash Backup', desc: 'Carry ₹1000–2000 cash for remote areas, tolls, and small dhabas.' },
  { icon: '🌐', title: 'Card Abroad', desc: 'Wise or Niyo Zero card gives you zero forex markup for international spends.' },
  { icon: '⚠️', title: 'DCC Warning', desc: "Decline 'Dynamic Currency Conversion' on ATMs and POS abroad — always pay in local currency." },
  { icon: '🏧', title: 'ATM Tip', desc: 'Use bank ATMs (SBI, HDFC, ICICI) over standalone ATMs to avoid hidden charges.' },
]
