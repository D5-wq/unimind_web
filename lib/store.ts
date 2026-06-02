import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ThemeStore {
  dark: boolean
  toggleDark: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      dark: false,
      toggleDark: () => {
        const next = !get().dark
        set({ dark: next })
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", next)
        }
      },
    }),
    { name: "theme" }
  )
)

interface WrongNote {
  id: string
  analysisId: string
  fileName: string
  question: string
  answer: string
  explanation: string
  type: "ox" | "multiple"
  conceptName?: string
  timestamp: number
}

interface WrongNotesStore {
  notes: WrongNote[]
  add: (notes: WrongNote[]) => void
  remove: (id: string) => void
  clear: () => void
}

export const useWrongNotesStore = create<WrongNotesStore>()(
  persist(
    (set) => ({
      notes: [],
      add: (newNotes) => set((s) => ({
        notes: [...newNotes, ...s.notes].slice(0, 100),
      })),
      remove: (id) => set((s) => ({ notes: s.notes.filter(n => n.id !== id) })),
      clear: () => set({ notes: [] }),
    }),
    { name: "wrong-notes" }
  )
)

interface QuizHistoryEntry {
  id: string
  analysisId: string
  fileName: string
  oneLiner: string
  score: number
  total: number
  pct: number
  answers: boolean[]
  timestamp: number
}

interface QuizHistoryStore {
  history: QuizHistoryEntry[]
  add: (entry: QuizHistoryEntry) => void
  clear: () => void
}

export const useQuizHistoryStore = create<QuizHistoryStore>()(
  persist(
    (set) => ({
      history: [],
      add: (entry) => set((s) => ({
        history: [entry, ...s.history].slice(0, 50),
      })),
      clear: () => set({ history: [] }),
    }),
    { name: "quiz-history" }
  )
)
