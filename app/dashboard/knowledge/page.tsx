"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/dashboard/header"
import {
  Brain, TrendingUp, BookOpen, Layers, ChevronDown, ChevronRight,
  Sparkles, Target, AlertTriangle, CheckCircle2, HelpCircle, Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { STORAGE_KEYS, storageGet } from "@/lib/storage"
import type { ExamPrediction } from "@/app/api/exam-prediction/route"

interface Concept { name: string; simple: string; difficulty?: string }
interface AnalysisEntry {
  id: string; fileName: string; oneLiner: string
  concepts: Concept[]; uploadedAt: number
}
interface ConceptNode {
  name: string; simple: string; difficulty?: string
  sources: { analysisId: string; fileName: string }[]
  count: number
  understanding: string
}
interface Exam { id: string; subject: string; date: string }

function loadAllAnalyses(): AnalysisEntry[] {
  if (typeof window === "undefined") return []
  return Object.keys(localStorage)
    .filter(k => k.startsWith("analysis-"))
    .map(k => {
      try {
        const id = k.replace("analysis-", "")
        const data = storageGet<any>(STORAGE_KEYS.analysis(id), {})
        const meta = storageGet<any>(STORAGE_KEYS.analysisMeta(id), {})
        return {
          id, fileName: meta.fileName ?? meta.name ?? id,
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
    const understanding = storageGet<Record<string, string>>(STORAGE_KEYS.conceptUnderstanding(a.id), {})
    a.concepts.forEach(c => {
      const key = c.name.toLowerCase().trim()
      const status = (understanding[c.name] as "understood" | "confused") ?? "unknown"
      if (map.has(key)) {
        const node = map.get(key)!
        node.count += 1
        if (!node.sources.find(s => s.analysisId === a.id))
          node.sources.push({ analysisId: a.id, fileName: a.fileName })
        // confused > unknown > understood 우선
        const rank = (s: string) => s === "confused" ? 2 : s === "unknown" ? 1 : 0
        if (rank(status) > rank(node.understanding)) node.understanding = status
      } else {
        map.set(key, {
          name: c.name, simple: c.simple, difficulty: c.difficulty,
          sources: [{ analysisId: a.id, fileName: a.fileName }],
          count: 1, understanding: status,
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

const UNDERSTAND_ICON = (u: string) =>
  u === "understood" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
  u === "confused"   ? <HelpCircle className="h-4 w-4 text-orange-500" /> :
                       <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />

const GRADE_COLOR = (g: string) =>
  g.startsWith("A") ? "text-green-500 bg-green-500/10" :
  g.startsWith("B") ? "text-primary bg-primary/10" :
  g.startsWith("C") ? "text-orange-500 bg-orange-500/10" :
  "text-destructive bg-destructive/10"

export default function KnowledgePage() {
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [predictions, setPredictions] = useState<ExamPrediction[]>([])
  const [predLoading, setPredLoading] = useState(false)
  const [predError, setPredError] = useState<string | null>(null)

  useEffect(() => { setAnalyses(loadAllAnalyses()) }, [])

  const conceptGraph = useMemo(() => buildConceptGraph(analyses), [analyses])
  const crossConcepts = conceptGraph.filter(c => c.count > 1)
  const topConcepts = conceptGraph.slice(0, 20)
  const maxCount = conceptGraph[0]?.count ?? 1

  const toggle = (name: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s })

  const runPrediction = async () => {
    const exams = storageGet<Exam[]>(STORAGE_KEYS.exams, [])
    if (!exams.length) { setPredError("플래너에서 시험 일정을 먼저 추가해주세요"); return }

    const concepts: { subject: string; concept: string; status: string; difficulty?: string }[] = []
    for (const a of analyses) {
      const understanding = storageGet<Record<string, string>>(STORAGE_KEYS.conceptUnderstanding(a.id), {})
      const subject = a.fileName.replace(/\.[^.]+$/, "")
      a.concepts.forEach(c => {
        concepts.push({ subject, concept: c.name, status: understanding[c.name] ?? "unknown", difficulty: c.difficulty })
      })
    }

    setPredLoading(true)
    setPredError(null)
    try {
      const res = await fetch("/api/exam-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exams, concepts }),
      })
      const data = await res.json()
      if (data.error) { setPredError(data.error); return }
      setPredictions(data.predictions ?? [])
    } catch {
      setPredError("예측 실패. 다시 시도해주세요.")
    } finally {
      setPredLoading(false)
    }
  }

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

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: BookOpen, label: "분석한 강의", value: `${analyses.length}개`, color: "text-primary bg-primary/10" },
            { icon: Brain, label: "총 개념 수", value: `${conceptGraph.length}개`, color: "text-accent bg-accent/10" },
            { icon: Layers, label: "반복 등장", value: `${crossConcepts.length}개`, color: "text-orange-500 bg-orange-500/10" },
            {
              icon: CheckCircle2, label: "이해 완료",
              value: `${conceptGraph.filter(c => c.understanding === "understood").length}개`,
              color: "text-green-500 bg-green-500/10"
            },
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

        <Tabs defaultValue="graph">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-secondary p-1">
            <TabsTrigger value="graph" className="rounded-xl text-xs">지식 그래프</TabsTrigger>
            <TabsTrigger value="concepts" className="rounded-xl text-xs">개념 목록</TabsTrigger>
            <TabsTrigger value="prediction" className="rounded-xl text-xs">시험 예측</TabsTrigger>
          </TabsList>

          {/* ── 지식 그래프 탭 ── */}
          <TabsContent value="graph" className="space-y-4 mt-4">
            <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  이번 학기 핵심 개념 맵
                  <span className="text-xs font-normal text-muted-foreground ml-1">크기 = 반복 횟수 · 색 = 이해도</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 min-h-[120px] items-center">
                  {topConcepts.map(c => {
                    const size = 0.7 + (c.count / maxCount) * 0.9
                    return (
                      <div
                        key={c.name}
                        style={{ fontSize: `${size}rem` }}
                        className={cn(
                          "cursor-pointer rounded-xl border px-3 py-1.5 font-medium transition-all hover:scale-110",
                          c.understanding === "understood" ? "bg-green-500/10 border-green-500/30 text-green-600" :
                          c.understanding === "confused"   ? "bg-orange-500/10 border-orange-500/30 text-orange-600" :
                          c.count > 1                     ? "bg-primary/10 border-primary/30 text-primary" :
                                                            "bg-secondary/50 border-border text-muted-foreground"
                        )}
                        title={`${c.name} (${c.count}개 강의 · ${c.understanding})`}
                        onClick={() => toggle(c.name)}
                      >
                        {c.name}
                        {c.count > 1 && <span className="ml-1.5 text-[0.65rem] opacity-70">×{c.count}</span>}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> 이해 완료</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500 inline-block" /> 헷갈림</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary inline-block" /> 반복 등장</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary border inline-block" /> 미체크</span>
                </div>
              </CardContent>
            </Card>

            {crossConcepts.length > 0 && (
              <Card className="rounded-2xl border-orange-500/20 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="h-4 w-4 text-orange-500" />
                    여러 강의에서 반복 등장한 개념
                    <Badge variant="outline" className="rounded-lg text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">{crossConcepts.length}개</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {crossConcepts.map(c => (
                    <div key={c.name} className="overflow-hidden rounded-xl border border-border">
                      <button onClick={() => toggle(c.name)} className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-secondary/40 transition-colors">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-500">{c.count}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {UNDERSTAND_ICON(c.understanding)}
                            <span className="font-semibold text-sm text-foreground">{c.name}</span>
                            {c.difficulty && <Badge variant="outline" className={cn("rounded-md text-[10px]", DIFF_COLOR(c.difficulty))}>{c.difficulty}</Badge>}
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
                        {expanded.has(c.name) ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                      </button>
                      {expanded.has(c.name) && (
                        <div className="border-t border-border bg-secondary/20 px-5 py-3 space-y-2">
                          <p className="text-sm text-foreground leading-relaxed">{c.simple}</p>
                          <div className="flex flex-wrap gap-1">
                            {c.sources.map(s => (
                              <span key={s.analysisId} className="rounded-lg bg-secondary border border-border px-2 py-0.5 text-xs text-foreground">{s.fileName}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── 개념 목록 탭 ── */}
          <TabsContent value="concepts" className="mt-4">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-primary" />
                  강의별 개념 현황
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analyses.map(a => {
                  const understanding = storageGet<Record<string, string>>(STORAGE_KEYS.conceptUnderstanding(a.id), {})
                  const understood = a.concepts.filter(c => understanding[c.name] === "understood").length
                  const confused = a.concepts.filter(c => understanding[c.name] === "confused").length
                  const pct = a.concepts.length > 0 ? Math.round((understood / a.concepts.length) * 100) : 0
                  return (
                    <div key={a.id} className="rounded-xl bg-secondary/30 p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{a.fileName}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.oneLiner}</p>
                        </div>
                        <span className="text-sm font-bold text-foreground flex-shrink-0">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> 이해 {understood}</span>
                        <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3 text-orange-500" /> 헷갈림 {confused}</span>
                        <span>전체 {a.concepts.length}</span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 시험 예측 탭 ── */}
          <TabsContent value="prediction" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">이해도 데이터 기반 시험 점수 예측</p>
              <Button onClick={runPrediction} disabled={predLoading} className="rounded-xl gap-2">
                {predLoading ? <><Loader2 className="h-4 w-4 animate-spin" />분석 중...</> : <><Target className="h-4 w-4" />예측 실행</>}
              </Button>
            </div>

            {predError && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{predError}</div>}

            {predictions.length === 0 && !predLoading && (
              <Card className="rounded-2xl border-border shadow-sm">
                <CardContent className="py-12 text-center">
                  <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-foreground">예측 실행 버튼을 눌러주세요</p>
                  <p className="mt-1 text-xs text-muted-foreground">플래너의 시험 일정 + 개념 이해도로 점수를 예측해요</p>
                </CardContent>
              </Card>
            )}

            {predictions.map(p => (
              <Card key={p.subject} className="rounded-2xl border-border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn("flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl font-black", GRADE_COLOR(p.grade))}>
                      <span className="text-2xl">{p.grade}</span>
                      <span className="text-xs opacity-70">{p.predictedScore}점</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground">{p.subject}</h3>
                        <Badge variant="outline" className={cn("rounded-lg text-xs",
                          p.confidence === "high" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                          p.confidence === "medium" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                          "bg-secondary text-muted-foreground"
                        )}>
                          신뢰도 {p.confidence === "high" ? "높음" : p.confidence === "medium" ? "보통" : "낮음"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">D-{p.dday}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{p.advice}</p>

                      {p.weakPoints.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-destructive mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> 집중 공부 필요
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {p.weakPoints.map(w => (
                              <span key={w} className="rounded-lg bg-destructive/10 text-destructive text-xs px-2 py-0.5">{w}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {p.strongPoints.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-600 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> 잘 하고 있어요
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {p.strongPoints.map(s => (
                              <span key={s} className="rounded-lg bg-green-500/10 text-green-600 text-xs px-2 py-0.5">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 점수 근거 카드 */}
                      <div className="mt-4 rounded-xl bg-secondary/50 border border-border p-3">
                        <p className="text-xs font-bold text-muted-foreground mb-2">📊 {p.predictedScore}점으로 예측한 근거</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "이해 완료 개념", value: `${p.strongPoints.length + Math.max(0, p.conceptScores?.filter((c: any) => c.status === "understood").length - p.strongPoints.length)}개`, color: "text-green-600" },
                            { label: "헷갈리는 개념", value: `${p.weakPoints.length}개`, color: "text-destructive" },
                            { label: "미확인 개념", value: `${p.conceptScores?.filter((c: any) => c.status === "unknown").length ?? 0}개`, color: "text-muted-foreground" },
                            { label: "시험까지", value: `D-${p.dday}`, color: p.dday <= 7 ? "text-destructive" : "text-primary" },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="text-center rounded-lg bg-background p-2">
                              <p className={`text-sm font-black ${color}`}>{value}</p>
                              <p className="text-[10px] text-muted-foreground">{label}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                          이해도 + 난이도 가중치 + D-day 보정으로 계산
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
