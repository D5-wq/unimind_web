"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export interface AnalysisMeta {
  id: string
  fileName: string
  oneLiner: string
  createdAt: number
}

export interface AnalysisResult {
  oneLiner: string
  summary?: string
  flow: string[]
  concepts: { name: string; simple: string; why: string; example?: string; difficulty?: string; relatedTo?: string[] }[]
  examPoints: string[]
}

interface AnalysisContextType {
  allAnalyses: AnalysisMeta[]
  selectedId: string | null
  selectedAnalysis: AnalysisResult | null
  loading: boolean
  select: (id: string) => void
  reload: () => void
}

const AnalysisContext = createContext<AnalysisContextType>({
  allAnalyses: [],
  selectedId: null,
  selectedAnalysis: null,
  loading: false,
  select: () => {},
  reload: () => {},
})

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [allAnalyses, setAllAnalyses] = useState<AnalysisMeta[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Load all analyses list
  const reload = useCallback(async () => {
    const fromLocalStorage = (): AnalysisMeta[] => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("analysis-"))
      return keys.map(k => {
        const id = k.replace("analysis-", "")
        const meta = (() => { try { return JSON.parse(localStorage.getItem(`meta-${id}`) ?? "{}") } catch { return {} } })()
        const data = (() => { try { return JSON.parse(localStorage.getItem(k) ?? "{}") } catch { return {} } })()
        return {
          id,
          fileName: meta.fileName ?? meta.name ?? id,
          oneLiner: data.oneLiner ?? "",
          createdAt: meta.uploadedAt ?? 0,
        }
      }).sort((a, b) => b.createdAt - a.createdAt)
    }

    try {
      const { data, error } = await Promise.resolve(
        supabase.from("analyses").select("id, file_name, one_liner, created_at").order("created_at", { ascending: false })
      )
      if (error || !data || data.length === 0) {
        setAllAnalyses(fromLocalStorage())
      } else {
        setAllAnalyses(data.map(r => ({
          id: r.id,
          fileName: r.file_name,
          oneLiner: r.one_liner ?? "",
          createdAt: new Date(r.created_at).getTime(),
        })))
      }
    } catch {
      setAllAnalyses(fromLocalStorage())
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  // Load full analysis when selectedId changes
  useEffect(() => {
    if (!selectedId) return
    setLoading(true)

    const fromLocalStorage = () => {
      const raw = localStorage.getItem(`analysis-${selectedId}`)
      if (raw) { try { setSelectedAnalysis(JSON.parse(raw)); return true } catch {} }
      return false
    }

    if (fromLocalStorage()) { setLoading(false); return }

    Promise.resolve(
      supabase.from("analyses").select("one_liner, summary, flow, concepts, exam_points").eq("id", selectedId).single()
    ).then(({ data }) => {
      if (data) {
        const r: AnalysisResult = {
          oneLiner: data.one_liner ?? "",
          summary: data.summary ?? undefined,
          flow: data.flow as string[],
          concepts: data.concepts as AnalysisResult["concepts"],
          examPoints: data.exam_points as string[],
        }
        setSelectedAnalysis(r)
        localStorage.setItem(`analysis-${selectedId}`, JSON.stringify(r))
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [selectedId])

  // Auto-select: restore from localStorage or pick latest
  useEffect(() => {
    if (allAnalyses.length === 0) return
    const saved = localStorage.getItem("selected-analysis-id")
    const valid = saved && allAnalyses.find(a => a.id === saved)
    const id = valid ? saved : allAnalyses[0].id
    setSelectedId(id)
    localStorage.setItem("selected-analysis-id", id)
  }, [allAnalyses])

  const select = (id: string) => {
    setSelectedId(id)
    localStorage.setItem("selected-analysis-id", id)
  }

  return (
    <AnalysisContext.Provider value={{ allAnalyses, selectedId, selectedAnalysis, loading, select, reload }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export const useAnalysis = () => useContext(AnalysisContext)
