"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { ZoomIn, ZoomOut, Maximize2, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface Concept {
  name: string; simple: string; why: string
  example?: string; difficulty?: string; relatedTo?: string[]
}

interface AnalysisResult {
  oneLiner: string
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
    const seen = new Set<string>()
    concept.relatedTo?.forEach(relName => {
      const idx = result.concepts.findIndex(c => c.name === relName)
      const key = `concept-${idx}`
      if (idx !== -1 && idx !== i && !seen.has(key)) {
        relConns.push(key)
        seen.add(key)
      }
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

export default function ConceptMapPage() {
  const [zoom, setZoom] = useState(1)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const router = useRouter()

  useEffect(() => {
    const apply = (r: AnalysisResult) => { setResult(r); setNodes(buildNodes(r)) }

    const loadFromLocalStorage = () => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("analysis-"))
      if (keys.length === 0) return
      keys.sort((a, b) => {
        const ia = a.replace("analysis-", ""), ib = b.replace("analysis-", "")
        try {
          const ma = JSON.parse(localStorage.getItem(`meta-${ia}`) ?? "{}")
          const mb = JSON.parse(localStorage.getItem(`meta-${ib}`) ?? "{}")
          return (mb.uploadedAt ?? 0) - (ma.uploadedAt ?? 0)
        } catch { return 0 }
      })
      try { apply(JSON.parse(localStorage.getItem(keys[0]) ?? "")) } catch {}
    }

    supabase.from('analyses').select('one_liner, flow, concepts, exam_points')
      .order('created_at', { ascending: false }).limit(1).single()
      .then(({ data }) => {
        if (data) apply({
          oneLiner: data.one_liner ?? '',
          flow: data.flow as string[],
          concepts: data.concepts as Concept[],
          examPoints: data.exam_points as string[],
        })
        else loadFromLocalStorage()
      })
      .catch(() => loadFromLocalStorage())
  }, [])

  if (!result) {
    return (
      <div className="flex flex-col">
        <Header title="개념 맵" subtitle="AI가 생성한 지식 그래프를 탐색하세요" />
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">먼저 강의 PDF를 업로드해주세요</h3>
          <p className="mt-2 text-sm text-muted-foreground">분석이 완료되면 개념 맵이 자동으로 생성됩니다</p>
          <Link href="/dashboard/upload" className="mt-6">
            <Button className="rounded-xl px-8">PDF 업로드하기</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Pre-compute deduplicated concept-concept edges
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
      <Header title="개념 맵" subtitle="AI가 생성한 지식 그래프를 탐색하세요" />

      <div className="flex-1 p-6">
        <Card className="rounded-2xl border-border shadow-sm" style={{ height: 620 }}>
          <CardContent className="relative h-full p-0 overflow-hidden">
            {/* Zoom controls */}
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-card shadow-md"
                onClick={() => setZoom(z => Math.min(z + 0.15, 2))}>
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-card shadow-md"
                onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}>
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-card shadow-md"
                onClick={() => setZoom(1)}>
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-card/90 p-4 shadow-lg backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-semibold">범례</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">핵심 주제</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-accent" />
                  <span className="text-muted-foreground">강의 흐름 (순서 연결)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-secondary border border-border" />
                  <span className="text-muted-foreground">핵심 개념</span>
                </div>
                {conceptEdges.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-0 w-3.5 border-t-2 border-dashed border-muted-foreground opacity-50" />
                    <span className="text-muted-foreground">개념 연관성</span>
                  </div>
                )}
              </div>
            </div>

            {/* Selected node info */}
            {selectedNode && (
              <div className="absolute bottom-4 right-4 z-10 w-72 rounded-xl bg-card/90 p-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">{selectedNode.label}</h4>
                </div>
                {selectedNode.detail && selectedNode.detail !== selectedNode.label && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.detail}</p>
                )}
                <Button
                  variant="link" size="sm"
                  className="mt-2 h-auto p-0 text-primary text-xs"
                  onClick={() => router.push("/dashboard/chat")}
                >
                  AI에게 자세히 물어보기 →
                </Button>
              </div>
            )}

            {/* Badges */}
            <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
              <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary">
                {result.oneLiner.slice(0, 20)}{result.oneLiner.length > 20 ? "…" : ""}
              </Badge>
              <Badge variant="secondary" className="rounded-lg">
                노드 {nodes.length}개
              </Badge>
            </div>

            {/* SVG concept map */}
            <div
              className="flex h-full items-center justify-center"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            >
              <svg width="800" height="560" viewBox="0 0 800 560" className="overflow-visible">
                {/* Layer 1: main spokes (gray dashed) */}
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

                {/* Layer 2: flow sequential (accent solid) */}
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

                {/* Layer 3: concept relations (dashed, deduped) */}
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
      </div>
    </div>
  )
}
