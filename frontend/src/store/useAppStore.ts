import { create } from 'zustand'
import type { Theme, TabId, PlanningState, ChatMessage, TripFormData } from '../types'

interface AppStore {
  theme: Theme
  toggleTheme: () => void

  activeTab: TabId
  setActiveTab: (tab: TabId) => void

  planning: PlanningState
  setPlanningField: <K extends keyof PlanningState>(key: K, value: PlanningState[K]) => void
  resetPlanning: () => void

  chatHistory: ChatMessage[]
  addChatMessage: (msg: ChatMessage) => void
  clearChat: () => void

  // Packing
  packChecked: Record<string, boolean>
  togglePackItem: (key: string) => void
  resetPackChecked: () => void

  // India quick-select
  selectedIndiaDest: string
  setSelectedIndiaDest: (dest: string) => void
}

const defaultPlanning: PlanningState = {
  isLoading: false,
  progress: 0,
  progressLabel: '',
  images: [],
  budget: null,
  itinerary: null,
  events: null,
  localTips: null,
  coords: null,
  noDays: 0,
  error: null,
  destination: '',
  formData: null,
}

export const useAppStore = create<AppStore>((set) => ({
  theme: 'dark',
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      document.documentElement.setAttribute('data-theme', next)
      return { theme: next }
    }),

  activeTab: 'plan',
  setActiveTab: (tab) => set({ activeTab: tab }),

  planning: defaultPlanning,
  setPlanningField: (key, value) =>
    set((s) => ({ planning: { ...s.planning, [key]: value } })),
  resetPlanning: () => set({ planning: defaultPlanning }),

  chatHistory: [],
  addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  clearChat: () => set({ chatHistory: [] }),

  packChecked: {},
  togglePackItem: (key) =>
    set((s) => ({ packChecked: { ...s.packChecked, [key]: !s.packChecked[key] } })),
  resetPackChecked: () => set({ packChecked: {} }),

  selectedIndiaDest: '',
  setSelectedIndiaDest: (dest) => set({ selectedIndiaDest: dest }),
}))
