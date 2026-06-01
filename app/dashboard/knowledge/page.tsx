"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Brain, TrendingUp, BookOpen, Layers, ChevronDown, ChevronRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Concept {
  name: string
  simple: string
  difficulty?: string
}

interface AnalysisEntry {
  id: string
  fileName: string
  oneLiner: string
  concepts: Concept[]
  uploadedAt: number
}

interface ConceptNode {
  name: string
  simple: string
  difficulty?: string
  sources: { analysisId: string; fileName: string }[]
  count: number
}

function loadAllAnalyses(): AnalysisEntry[] {
  if (typeof window === "undefined") return []
  return Object.keys(localStorage)
    .filter(k => k.startsWith("analysis-"))
    .map(k => {
      try {
        const id = k.replace("analysis-", "")
        const data = JSON.parse(localStorage.getItem(k) ?? "{}")
        const meta = JSON.parse(localStorage.getItem(`meta-${id}`) ?? "{}")
        return {
          id,
          fileName: meta.fileName ?? meta.name ?? id,
          oneLiner: data.oneLiner ?? "",
          concepts: (data.concepts ?? []) as Concept[],
          uploadedAt: meta.uploadedAt ?? 0,
        }
      } catch { return null }
    })
    .filter(Boolean)
    .sort((a, b) => b!.uploadedAt - a!.uploadedAt) as AnalysisEntry[]
}

function buildConceptGraph(analyses: AnalysisEntry[]): ConceptNode[] {
  const map = new Map<string, ConceptNode>()

  analyses.forEach(a => {
    a.concepts.forEach(c => {
      const key = c.name.toLowerCase().trim()
      if (map.has(key)) {
        const node = map.get(key)!
        node.count += 1
        if (!node.sources.find(s => s.analysisId === a.id)) {
          node.sources.push({ analysisId: a.id, fileName: a.fileName })
        }
      } else {
        map.set(key, {
          name: c.name,
          simple: c.simple,
          difficulty: c.difficulty,
          sources: [{ analysisId: a.id, fileName: a.fileName }],
          count: 1,
        })
      }
    })
  })

  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

const DIFF_COLOR = (d?: string) =>
  d === "심화" ? "bg-red-500/10 text-red-500 border-red-500/20" :
  d === "핵심" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                 "bg-primary/10 text-primary border-primary/20"

export default function KnowledgePage() {
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    setAnalyses(loadAllAnalyses())
  }, [])

  const conceptGraph = useMemo(() => buildConceptGraph(analyses), [analyses])

  const crossConcepts = conceptGraph.filter(c => c.count > 1)
  const uniqueConcepts = conceptGraph.filter(c => c.count === 1)
  const totalConcepts = conceptGraph.length
  const masteredCount = crossConcepts.length

  const toggle = (name: string) =>
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(name) ? s.delete(name) : s.add(name)
      return s
    })

  // 버블 차트용 크기 계산
  const maxCount = conceptGraph[0]?.count ?? 1
  const topConcepts = conceptGraph.slice(0, 20)

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col">
        <Header title="지식 그래프" subtitle="내 학습 지식이 쌓이는 공간" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <Brain className="mx-auto mb-4 h-12 w-12 text-primary/30" />
            <p className="font-medium text-foreground">아직 분석한 강의가 없어요</p>
            <p className="mt-2 text-sm">강의를 분석할수록 지식 그래프가 쌓여요</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="지식 그래프" subtitle="내 강의들에서 쌓인 지식 구조" />
      <div className="flex-1 space-y-6 p-6">

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: BookOpen, label: "분석한 강의", value: `${analyses.length}개`, color: "text-primary bg-primary/10" },
            { icon: Brain, label: "총 개념 수", value: `${totalConcepts}개`, color: "text-accent bg-accent/10" },
            { icon: Layers, label: "반복 등장 개념", value: `${crossConcepts.length}개`, color: "text-orange-500 bg-orange-500/10" },
            { icon: TrendingUp, label: "최다 반복", value: conceptGraph[0] ? `${conceptGraph[0].count}회` : "-", color: "text-destructive bg-destructive/10" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-5">
                <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", color.split(" ")[1])}>
                  <Icon className={cn("h-5 w-5", color.split(" ")[0])} />
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 개념 버블 맵 */}
        <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              이번 학기 핵심 개념 맵
              <span className="text-xs font-normal text-muted-foreground ml-1">크기 = 반복 횟수</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 min-h-[120px] items-center">
              {topConcepts.map(c => {
                const size = 0.7 + (c.count / maxCount) * 0.9
                const isRepeat = c.count > 1
                return (
                  <div
                    key={c.name}
                    style={{ fontSize: `${size}rem` }}
                    className={cn(
                      "cursor-pointer rounded-xl border px-3 py-1.5 font-medium transition-all hover:scale-110",
                      isRepeat
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary/50 border-border text-muted-foreground"
                    )}
                    title={`${c.name} (${c.count}개 강의)`}
                    onClick={() => toggle(c.name)}
                  >
                    {c.name}
                    {isRepeat && (
                      <span className="ml-1.5 text-[0.65rem] opacity-70">×{c.count}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 반복 등장 개념 — 포트폴리오 킬러 섹션 */}
        {crossConcepts.length > 0 && (
          <Card className="rounded-2xl border-orange-500/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-orange-500" />
                여러 강의에서 반복 등장한 개념
                <Badge variant="outline" className="rounded-lg text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
                  {crossConcepts.length}개
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                이 개념들은 핵심 지식 구조예요 — 확실히 이해해두면 여러 과목에서 유리해요
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {crossConcepts.map(c => (
                <div key={c.name} className="overflow-hidden rounded-xl border border-border">
                  <button
                    onClick={() => toggle(c.name)}
                    className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-secondary/40 transition-colors"
                  >
                    {/* 등장 횟수 뱃지 */}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-500">
                      {c.count}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{c.name}</span>
                        {c.difficulty && (
                          <Badge variant="outline" className={cn("rounded-md text-[10px]", DIFF_COLOR(c.difficulty))}>
                            {c.difficulty}
                          </Badge>
                        )}
                        {/* 과목 태그 */}
                        <div className="flex flex-wrap gap-1">
                          {c.sources.map(s => (
                            <span key={s.analysisId} className="rounded-md bg-secondary border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {s.fileName.replace(/\.[^.]+$/, "")}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.simple}</p>
                    </div>
                    {expanded.has(c.name)
                      ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                  </button>
                  {expanded.has(c.name) && (
                    <div className="border-t border-border bg-secondary/20 px-5 py-3 space-y-2">
                      <p className="text-sm text-foreground leading-relaxed">{c.simple}</p>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">등장한 강의</p>
                        <div className="space-y-1">
                          {c.sources.map(s => (
                            <div key={s.analysisId} className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                              <span className="text-xs text-foreground">{s.fileName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 과목별 개념 현황 */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              강의별 개념 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyses.map(a => {
              const repeatInThis = a.concepts.filter(c =>
                crossConcepts.some(cc => cc.name.toLowerCase() === c.name.toLowerCase())
              ).length
              return (
                <div key={a.id} className="flex items-center gap-4 rounded-xl bg-secondary/30 p-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.fileName}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.oneLiner}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 text-xs">
                    <span className="rounded-lg bg-primary/10 text-primary px-2 py-0.5 font-medium">
                      {a.concepts.length}개
                    </span>
                    {repeatInThis > 0 && (
                      <span className="rounded-lg bg-orange-500/10 text-orange-500 px-2 py-0.5 font-medium">
                        반복 {repeatInThis}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
