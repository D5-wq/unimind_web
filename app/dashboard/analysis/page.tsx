"use client"

import { useEffect, useState } from "react"
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

interface AnalysisResult {
  oneLiner: string
  flow: string[]
  concepts: { name: string; simple: string; why: string }[]
  examPoints: string[]
}

interface Node {
  id: string; label: string; x: number; y: number
  type: "main" | "flow" | "concept"; connections: string[]; detail?: string
}

function buildNodes(result: AnalysisResult): Node[] {
  const W = 800, MAIN_X = W / 2, MAIN_Y = 270
  const nodes: Node[] = [{
    id: "main", label: result.oneLiner.length > 28 ? result.oneLiner.slice(0, 28) + "…" : result.oneLiner,
    x: MAIN_X, y: MAIN_Y, type: "main",
    connections: [...result.flow.map((_, i) => `flow-${i}`), ...result.concepts.map((_, i) => `concept-${i}`)],
    detail: result.oneLiner,
  }]
  result.flow.forEach((item, i) => {
    nodes.push({ id: `flow-${i}`, label: item.length > 16 ? item.slice(0, 16) + "…" : item,
      x: (W / (result.flow.length + 1)) * (i + 1), y: 100, type: "flow", connections: [], detail: item })
  })
  result.concepts.forEach((concept, i) => {
    nodes.push({ id: `concept-${i}`, label: concept.name,
      x: (W / (result.concepts.length + 1)) * (i + 1), y: 440, type: "concept", connections: [], detail: concept.simple })
  })
  return nodes
}

const IMPORTANCE = (i: number) =>
  i === 0 ? { label: "매우 중요", cls: "bg-destructive/10 text-destructive border-destructive/20" } :
  i <= 2  ? { label: "중요",      cls: "bg-orange-500/10 text-orange-600 border-orange-500/20" } :
             { label: "보통",      cls: "bg-secondary text-muted-foreground border-border" }

export default function AnalysisPage() {
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
          const r = { oneLiner: data.one_liner ?? '', flow: data.flow as string[], concepts: data.concepts as any[], examPoints: data.exam_points as string[] }
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

  return (
    <div className="flex flex-col">
      <Header title="분석 결과" subtitle="AI가 분석한 강의 내용을 확인하세요" />
      <div className="flex-1 p-6">

        {/* 상단 요약 카드 */}
        <Card className="mb-6 rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-foreground">{result.oneLiner}</p>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
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
                { icon: BookOpen, label: "난이도", value: "중간", color: "text-orange-500 bg-orange-500/10" },
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
                        <p className="max-w-[80px] text-xs font-medium text-foreground leading-tight">{item.length > 12 ? item.slice(0, 12) + "…" : item}</p>
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
                {result.concepts.map((concept, i) => {
                  const imp = IMPORTANCE(i)
                  return (
                    <div key={i} className="flex items-start gap-4 rounded-xl bg-secondary/30 p-4 transition-colors hover:bg-secondary/50">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-foreground">{concept.name}</h4>
                          <Badge variant="outline" className={cn("rounded-lg text-xs", imp.cls)}>{imp.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{concept.simple}</p>
                        <div className="mt-2 rounded-lg bg-primary/5 p-2">
                          <p className="text-xs font-medium text-primary">왜 중요한가?</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{concept.why}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 개념 맵 ── */}
          <TabsContent value="map">
            <Card className="rounded-2xl border-border shadow-sm" style={{ height: 580 }}>
              <CardContent className="relative h-full p-0 overflow-hidden">
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

                {selectedNode && (
                  <div className="absolute bottom-4 right-4 z-10 w-64 rounded-xl bg-card/90 p-4 shadow-lg backdrop-blur-sm">
                    <p className="font-semibold text-sm text-foreground">{selectedNode.label}</p>
                    {selectedNode.detail && selectedNode.detail !== selectedNode.label && (
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{selectedNode.detail}</p>
                    )}
                  </div>
                )}

                <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-card/90 p-3 shadow-lg backdrop-blur-sm text-xs space-y-1.5">
                  {[["bg-primary","핵심 주제"],["bg-accent","강의 흐름"],["bg-secondary border border-border","핵심 개념"]].map(([cls, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", cls)} /><span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex h-full items-center justify-center"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}>
                  <svg width="800" height="540" viewBox="0 0 800 540" className="overflow-visible">
                    <g>
                      {nodes.map(node => node.connections.map(tid => {
                        const target = nodes.find(n => n.id === tid)
                        if (!target) return null
                        const hi = selectedNode?.id === node.id || selectedNode?.id === tid
                        return <line key={`${node.id}-${tid}`} x1={node.x} y1={node.y} x2={target.x} y2={target.y}
                          stroke={hi ? "var(--primary)" : "var(--border)"} strokeWidth={hi ? 2 : 1}
                          strokeDasharray={hi ? "none" : "5 4"} className="transition-all duration-300" />
                      }))}
                    </g>
                    <g>
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
                                "bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-medium"
                              )}
                            >
                              {node.label}
                            </button>
                          </div>
                        </foreignObject>
                      ))}
                    </g>
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
                {result.flow.map((item, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-border">
                    <button
                      onClick={() => toggleFlow(i)}
                      className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</div>
                      <span className="flex-1 font-medium text-foreground">{i + 1}주차</span>
                      <span className="flex-1 truncate text-sm text-muted-foreground">{item}</span>
                      {openFlows.has(i)
                        ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      }
                    </button>
                    {openFlows.has(i) && (
                      <div className="border-t border-border bg-secondary/20 px-5 py-4">
                        <p className="text-sm leading-relaxed text-foreground">{item}</p>
                        {result.concepts.slice(i * 1, i * 1 + 2).map((c, ci) => (
                          <div key={ci} className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="text-xs text-muted-foreground">{c.name}: {c.simple}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
                  <p className="text-sm leading-relaxed text-foreground/80">{result.oneLiner}</p>
                  <div className="mt-4 space-y-2">
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
