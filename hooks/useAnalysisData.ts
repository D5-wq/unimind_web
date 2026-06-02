import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { STORAGE_KEYS, storageGet, storageSet } from "@/lib/storage"

interface AnalysisResult {
  oneLiner: string
  summary?: string
  flow: string[]
  concepts: { name: string; simple: string; why: string; example?: string; difficulty?: string; relatedTo?: string[] }[]
  examPoints: string[]
}

async function fetchAnalysis(id: string): Promise<AnalysisResult | null> {
  // 캐시 먼저
  const cached = storageGet<AnalysisResult | null>(STORAGE_KEYS.analysis(id), null)
  if (cached) return cached

  const { data } = await supabase
    .from("analyses")
    .select("one_liner, summary, flow, concepts, exam_points")
    .eq("id", id)
    .single()

  if (!data) return null

  const result: AnalysisResult = {
    oneLiner: data.one_liner ?? "",
    summary: data.summary ?? undefined,
    flow: data.flow as string[],
    concepts: data.concepts as AnalysisResult["concepts"],
    examPoints: data.exam_points as string[],
  }

  storageSet(STORAGE_KEYS.analysis(id), result)
  return result
}

export function useAnalysisData(id: string | null) {
  return useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetchAnalysis(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10분 캐시
  })
}
