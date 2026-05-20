"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { supabase } from "@/lib/supabase"
import {
  FileText, Lightbulb, AlertTriangle, Sparkles, CheckCircle,
  Target, Clock, Brain, BookOpen, ZoomIn, ZoomOut, Maximize2,
  ChevronDown, ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Concept {
  name: string
  simple: string
  why: string
  example?: string
  difficulty?: string
  relatedTo?: string[]
}

interface AnalysisResult {
  oneLiner: string
  summary?: string
  flow: string[]
  concepts: Concept[]
  examPoints: string[]
}

interface Node {
  id: string; label: string; x: number; y: number
  type: "main" | "flow" | "concept"; connections: string[]; detail?: string
}

function buildNodes(result: AnalysisResult): Node[] {
  const CX = 400, CY = 280
  const flowR = 175, conceptR = 200
  const nodes: Node[] = []

  nodes.push({
    id: "main",
    label: result.oneLiner.length > 22 ? result.oneLiner.slice(0, 22) + "…" : result.oneLiner,
    x: CX, y: CY, type: "main",
    connections: [
      ...result.flow.map((_, i) => `flow-${i}`),
      ...result.concepts.map((_, i) => `concept-${i}`),
    ],
    detail: result.oneLiner,
  })

  // Flow: upper arc (-150° to -30°)
  result.flow.forEach((item, i) => {
    const n = result.flow.length
    const angle = n === 1
      ? -Math.PI / 2
      : (-Math.PI * 5 / 6) + (i / (n - 1)) * (Math.PI * 2 / 3)
    nodes.push({
      id: `flow-${i}`,
      label: item.length > 13 ? item.slice(0, 13) + "…" : item,
      x: CX + flowR * Math.cos(angle),
      y: CY + flowR * Math.sin(angle),
      type: "flow",
      connections: i < result.flow.length - 1 ? [`flow-${i + 1}`] : [],
      detail: item,
    })
  })

  // Concepts: lower arc (30° to 150°)
  result.concepts.forEach((concept, i) => {
    const n = result.concepts.length
    const angle = n === 1
      ? Math.PI / 2
      : (Math.PI / 6) + (i / (n - 1)) * (Math.PI * 2 / 3)
    const relConns: string[] = []
    concept.relatedTo?.forEach(relName => {
      const idx = result.concepts.findIndex(c => c.name === relName)
      if (idx !== -1 && idx !== i) relConns.push(`concept-${idx}`)
    })
    nodes.push({
      id: `concept-${i}`,
      label: concept.name.length > 11 ? concept.name.slice(0, 11) + "…" : concept.name,
      x: CX + conceptR * Math.cos(angle),
      y: CY + conceptR * Math.sin(angle),
      type: "concept",
      connections: relConns,
      detail: concept.simple,
    })
  })

  return nodes
}

const DIFF_CLS = (d?: string) =>
  d === "심화" ? "bg-destructive/10 text-destructive border-destructive/20" :
  d === "핵심" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                 "bg-primary/10 text-primary border-primary/20"

function AnalysisContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [zoom, setZoom] = useState(1)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [openFlows, setOpenFlows] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!id) return
    const saved = localStorage.getItem(`analysis-${id}`)
    if (saved) { const r = JSON.parse(saved); setResult(r); setNodes(buildNodes(r)); return }
    supabase.from('analyses').select('one_liner, flow, concepts, exam_points').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          const r: AnalysisResult = {
            oneLiner: data.one_liner ?? '',
            flow: data.flow as string[],
            concepts: data.concepts as Concept[],
            examPoints: data.exam_points as string[],
          }
          setResult(r); setNodes(buildNodes(r))
          localStorage.setItem(`analysis-${id}`, JSON.stringify(r))
        }
      })
  }, [id])

  const toggleFlow = (i: number) =>
    setOpenFlows(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })

  if (!result) {
    return (
      <div className="flex flex-col">
        <Header title="분석 결과" subtitle="AI가 분석한 강의 내용을 확인하세요" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary" />
            <p className="font-medium">분석 결과를 불러오는 중...</p>
            <p className="mt-2 text-sm">업로드 페이지에서 분석 완료 후 결과 보기를 눌러주세요</p>
          </div>
        </div>
      </div>
    )
  }

  // Pre-compute deduplicated concept-concept edges for the map
  const conceptEdges: { from: Node; to: Node; key: string }[] = []
  const drawnEdges = new Set<string>()
  nodes.filter(n => n.type === "concept").forEach(n => {
    n.connections.forEach(tid => {
      const key = [n.id, tid].sort().join("|")
      if (!drawnEdges.has(key)) {
        drawnEdges.add(key)
        const t = nodes.find(x => x.id === tid)
        if (t) conceptEdges.push({ from: n, to: t, key })
      }
    })
  })

  return (
    <div className="flex flex-col">
      <Header title="분석 결과" subtitle="AI가 분석한 강의 내용을 확인하세요" />
      <div className="flex-1 p-6">

        {/* 상단 요약 카드 */}
        <Card className="mb-6 rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-foreground">{result.oneLiner}</p>
                </div>
                {result.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg bg-green-500/10 px-2 py-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs font-medium text-green-600">분석 완료</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-2xl bg-secondary p-1">
            <TabsTrigger value="overview" className="rounded-xl text-xs">개요</TabsTrigger>
            <TabsTrigger value="concepts" className="rounded-xl text-xs">핵심 개념</TabsTrigger>
            <TabsTrigger value="map" className="rounded-xl text-xs">개념 맵</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl text-xs">타임라인</TabsTrigger>
            <TabsTrigger value="summary" className="rounded-xl text-xs">요약</TabsTrigger>
          </TabsList>

          {/* ── 개요 ── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: Brain, label: "핵심 개념", value: `${result.concepts.length}개`, color: "text-primary bg-primary/10" },
                { icon: Clock, label: "강의 흐름", value: `${result.flow.length}단계`, color: "text-accent bg-accent/10" },
                { icon: Target, label: "시험 포인트", value: `${result.examPoints.length}개`, color: "text-destructive bg-destructive/10" },
                {
                  icon: BookOpen, label: "심화 개념",
                  value: `${result.concepts.filter(c => c.difficulty === "심화").length}개`,
                  color: "text-orange-500 bg-orange-500/10"
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

            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">강의의 흐름 한눈에 보기</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  {result.flow.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-secondary/30 px-3 py-2 text-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</div>
                        <p className="max-w-[90px] text-xs font-medium text-foreground leading-tight">{item.length > 15 ? item.slice(0, 15) + "…" : item}</p>
                      </div>
                      {i < result.flow.length - 1 && <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 핵심 개념 ── */}
          <TabsContent value="concepts">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  핵심 개념 TOP {result.concepts.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.concepts.map((concept, i) => (
                  <div key={i} className="rounded-xl bg-secondary/30 p-4 transition-colors hover:bg-secondary/40">
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</div>
                      <h4 className="font-semibold text-foreground">{concept.name}</h4>
                      {concept.difficulty && (
                        <Badge variant="outline" className={cn("rounded-lg text-xs", DIFF_CLS(concept.difficulty))}>
                          {concept.difficulty}
                        </Badge>
                      )}
                    </div>

                    {/* Simple explanation */}
                    <p className="text-sm text-muted-foreground mb-2 ml-9">{concept.simple}</p>

                    {/* Example */}
                    {concept.example && (
                      <div className="ml-9 mb-2 flex items-start gap-2 rounded-lg bg-accent/10 p-2.5">
                        <span className="flex-shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-xs font-semibold text-accent">예시</span>
                        <p className="text-xs text-foreground/75 leading-relaxed">{concept.example}</p>
                      </div>
                    )}

                    {/* Why */}
                    <div className="ml-9 rounded-lg bg-primary/5 p-2.5">
                      <p className="text-xs font-medium text-primary mb-0.5">왜 중요한가?</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{concept.why}</p>
                    </div>

                    {/* Related concepts */}
                    {concept.relatedTo && concept.relatedTo.length > 0 && (
                      <div className="ml-9 mt-2 flex flex-wrap gap-1.5">
                        {concept.relatedTo.map((rel, ri) => (
                          <span key={ri} className="rounded-md bg-secondary border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            ↔ {rel}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 개념 맵 ── */}
          <TabsContent value="map">
            <Card className="rounded-2xl border-border shadow-sm" style={{ height: 580 }}>
              <CardContent className="relative h-full p-0 overflow-hidden">
                {/* Zoom controls */}
                <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
                  {[
                    { icon: ZoomIn, action: () => setZoom(z => Math.min(z + 0.15, 2)) },
                    { icon: ZoomOut, action: () => setZoom(z => Math.max(z - 0.15, 0.4)) },
                    { icon: Maximize2, action: () => setZoom(1) },
                  ].map(({ icon: Icon, action }, i) => (
                    <Button key={i} variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-card shadow-md" onClick={action}>
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>

                {/* Selected node detail */}
                {selectedNode && (
                  <div className="absolute bottom-4 right-4 z-10 w-64 rounded-xl bg-card/90 p-4 shadow-lg backdrop-blur-sm">
                    <p className="font-semibold text-sm text-foreground mb-1">{selectedNode.label}</p>
                    {selectedNode.detail && selectedNode.detail !== selectedNode.label && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.detail}</p>
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-card/90 p-3 shadow-lg backdrop-blur-sm text-xs space-y-1.5">
                  {[
                    ["bg-primary", "핵심 주제"],
                    ["bg-accent", "강의 흐름 (순서 연결)"],
                    ["bg-secondary border border-border", "핵심 개념"],
                  ].map(([cls, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", cls)} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="flex h-full items-center justify-center"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                >
                  <svg width="800" height="540" viewBox="0 0 800 540" className="overflow-visible">
                    {/* Layer 1: main → flow/concept (faint gray dashed) */}
                    {nodes.filter(n => n.type === "main").flatMap(n =>
                      n.connections.map(tid => {
                        const t = nodes.find(x => x.id === tid)
                        if (!t) return null
                        const hi = selectedNode?.id === n.id || selectedNode?.id === tid
                        return (
                          <line key={`main-${tid}`}
                            x1={n.x} y1={n.y} x2={t.x} y2={t.y}
                            stroke={hi ? "var(--primary)" : "var(--border)"}
                            strokeWidth={hi ? 1.5 : 1}
                            strokeDasharray={hi ? "none" : "5 4"}
                            className="transition-all duration-300"
                          />
                        )
                      })
                    )}

                    {/* Layer 2: flow → flow sequential (accent solid) */}
                    {nodes.filter(n => n.type === "flow").flatMap(n =>
                      n.connections.map(tid => {
                        const t = nodes.find(x => x.id === tid)
                        if (!t) return null
                        const hi = selectedNode?.id === n.id || selectedNode?.id === tid
                        return (
                          <line key={`seq-${n.id}-${tid}`}
                            x1={n.x} y1={n.y} x2={t.x} y2={t.y}
                            stroke={hi ? "var(--primary)" : "var(--accent)"}
                            strokeWidth={hi ? 2 : 1.5}
                            className="transition-all duration-300"
                          />
                        )
                      })
                    )}

                    {/* Layer 3: concept → concept relations (dashed, deduplicated) */}
                    {conceptEdges.map(({ from, to, key }) => {
                      const hi = selectedNode?.id === from.id || selectedNode?.id === to.id
                      return (
                        <line key={`rel-${key}`}
                          x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                          stroke={hi ? "var(--primary)" : "var(--muted-foreground)"}
                          strokeWidth={hi ? 1.5 : 1}
                          strokeDasharray="3 3"
                          opacity={0.5}
                          className="transition-all duration-300"
                        />
                      )
                    })}

                    {/* Nodes */}
                    {nodes.map(node => (
                      <foreignObject key={node.id} x={node.x - 70} y={node.y - 20} width="140" height="40" className="overflow-visible">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                            className={cn(
                              "cursor-pointer rounded-xl transition-all duration-200 hover:scale-105 whitespace-nowrap",
                              selectedNode?.id === node.id ? "ring-2 ring-white ring-offset-1" : "",
                              node.type === "main" ? "bg-primary text-primary-foreground shadow-lg px-5 py-2.5 text-sm font-bold" :
                              node.type === "flow" ? "bg-accent text-accent-foreground shadow-md px-3 py-1.5 text-xs font-semibold" :
                              "bg-secondary text-secondary-foreground border border-border px-3 py-1.5 text-xs font-medium"
                            )}
                          >
                            {node.label}
                          </button>
                        </div>
                      </foreignObject>
                    ))}
                  </svg>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 타임라인 ── */}
          <TabsContent value="timeline">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  강의 흐름 타임라인
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.flow.map((item, i) => {
                  // Find concepts whose names appear in this flow step
                  const relConcepts = result.concepts.filter(c =>
                    item.toLowerCase().includes(c.name.toLowerCase())
                  )
                  // Fallback: pair by index
                  const fallbackConcepts = relConcepts.length > 0
                    ? relConcepts
                    : result.concepts.slice(
                        Math.floor(i * result.concepts.length / result.flow.length),
                        Math.floor(i * result.concepts.length / result.flow.length) + 2
                      )

                  return (
                    <div key={i} className="overflow-hidden rounded-xl border border-border">
                      <button
                        onClick={() => toggleFlow(i)}
                        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</div>
                        <span className="flex-1 truncate text-sm font-medium text-foreground">{item}</span>
                        {openFlows.has(i)
                          ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                      </button>
                      {openFlows.has(i) && (
                        <div className="border-t border-border bg-secondary/20 px-5 py-4 space-y-3">
                          <p className="text-sm leading-relaxed text-foreground">{item}</p>
                          {fallbackConcepts.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">관련 개념</p>
                              <div className="space-y-2">
                                {fallbackConcepts.map((c, ci) => (
                                  <div key={ci} className="flex items-start gap-2">
                                    <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                                    <div>
                                      <span className="text-xs font-medium text-foreground">{c.name}</span>
                                      <span className="text-xs text-muted-foreground"> — {c.simple}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 요약 ── */}
          <TabsContent value="summary">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-2xl">🤖</div>
                    <div>
                      <p className="font-bold text-foreground">AI 학습 요약</p>
                      <p className="text-xs text-muted-foreground">핵심만 빠르게 정리했어요</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80 mb-4">
                    {result.summary ?? result.oneLiner}
                  </p>
                  <div className="space-y-2">
                    {result.flow.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        <p className="text-sm text-muted-foreground">{f}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    핵심 요약 (시험 대비)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.examPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-secondary/30 p-3">
                      <div className={cn(
                        "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        i === 0 ? "bg-destructive/10 text-destructive" :
                        i === 1 ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"
                      )}>{i + 1}</div>
                      <p className="flex-1 text-sm leading-relaxed text-foreground">{point}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary" />
            <p>불러오는 중...</p>
          </div>
        </div>
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  )
}
