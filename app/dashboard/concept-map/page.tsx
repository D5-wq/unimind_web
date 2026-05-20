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

interface AnalysisResult {
  oneLiner: string
  flow: string[]
  concepts: { name: string; simple: string; why: string }[]
  examPoints: string[]
}

interface Node {
  id: string
  label: string
  x: number
  y: number
  type: "main" | "flow" | "concept"
  connections: string[]
  detail?: string
}

function buildNodes(result: AnalysisResult): Node[] {
  const SVG_W = 800
  const MAIN_X = SVG_W / 2
  const MAIN_Y = 270

  const nodes: Node[] = [
    {
      id: "main",
      label: result.oneLiner.length > 28 ? result.oneLiner.slice(0, 28) + "…" : result.oneLiner,
      x: MAIN_X,
      y: MAIN_Y,
      type: "main",
      connections: [
        ...result.flow.map((_, i) => `flow-${i}`),
        ...result.concepts.map((_, i) => `concept-${i}`),
      ],
      detail: result.oneLiner,
    },
  ]

  // Flow items: top arc
  const flowCount = result.flow.length
  result.flow.forEach((item, i) => {
    const x = (SVG_W / (flowCount + 1)) * (i + 1)
    nodes.push({
      id: `flow-${i}`,
      label: item.length > 16 ? item.slice(0, 16) + "…" : item,
      x,
      y: 100,
      type: "flow",
      connections: [],
      detail: item,
    })
  })

  // Concepts: bottom arc
  const conceptCount = result.concepts.length
  result.concepts.forEach((concept, i) => {
    const x = (SVG_W / (conceptCount + 1)) * (i + 1)
    nodes.push({
      id: `concept-${i}`,
      label: concept.name,
      x,
      y: 440,
      type: "concept",
      connections: [],
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
    const apply = (r: AnalysisResult) => {
      setResult(r)
      setNodes(buildNodes(r))
    }

    const loadFromLocalStorage = () => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("analysis-"))
      if (keys.length === 0) return
      keys.sort((a, b) => {
        const ia = a.replace("analysis-", "")
        const ib = b.replace("analysis-", "")
        try {
          const ma = JSON.parse(localStorage.getItem(`meta-${ia}`) ?? "{}")
          const mb = JSON.parse(localStorage.getItem(`meta-${ib}`) ?? "{}")
          return (mb.uploadedAt ?? 0) - (ma.uploadedAt ?? 0)
        } catch { return 0 }
      })
      try {
        apply(JSON.parse(localStorage.getItem(keys[0]) ?? ""))
      } catch {}
    }

    supabase
      .from('analyses')
      .select('one_liner, flow, concepts, exam_points')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          apply({
            oneLiner: data.one_liner ?? '',
            flow: data.flow as string[],
            concepts: data.concepts as { name: string; simple: string; why: string }[],
            examPoints: data.exam_points as string[],
          })
        } else {
          loadFromLocalStorage()
        }
      })
      .catch(() => loadFromLocalStorage())
  }, [])

  const getNodeStyle = (type: Node["type"], isSelected: boolean) => {
    const base = "cursor-pointer rounded-xl transition-all duration-200 hover:scale-105 whitespace-nowrap"
    const ring = isSelected ? " ring-2 ring-white ring-offset-1" : ""
    switch (type) {
      case "main": return `${base}${ring} bg-primary text-primary-foreground shadow-lg px-5 py-2.5 text-sm font-bold`
      case "flow": return `${base}${ring} bg-accent text-accent-foreground shadow-md px-3 py-1.5 text-xs font-semibold`
      case "concept": return `${base}${ring} bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-medium`
    }
  }

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

  return (
    <div className="flex flex-col">
      <Header title="개념 맵" subtitle="AI가 생성한 지식 그래프를 탐색하세요" />

      <div className="flex-1 p-6">
        <Card className="rounded-2xl border-border shadow-sm" style={{ height: 620 }}>
          <CardContent className="relative h-full p-0 overflow-hidden">
            {/* 줌 컨트롤 */}
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

            {/* 범례 */}
            <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-card/90 p-4 shadow-lg backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-semibold">범례</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">핵심 주제</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-accent" />
                  <span className="text-xs text-muted-foreground">강의 흐름</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-secondary" />
                  <span className="text-xs text-muted-foreground">핵심 개념</span>
                </div>
              </div>
            </div>

            {/* 선택된 노드 정보 */}
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
                  variant="link"
                  size="sm"
                  className="mt-2 h-auto p-0 text-primary text-xs"
                  onClick={() => router.push("/dashboard/chat")}
                >
                  AI에게 자세히 물어보기 →
                </Button>
              </div>
            )}

            {/* 배지 */}
            <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
              <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary">
                {result.oneLiner.slice(0, 20)}{result.oneLiner.length > 20 ? "…" : ""}
              </Badge>
              <Badge variant="secondary" className="rounded-lg">
                노드: {nodes.length}개
              </Badge>
            </div>

            {/* SVG 개념 맵 */}
            <div
              className="flex h-full items-center justify-center"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            >
              <svg width="800" height="560" viewBox="0 0 800 560" className="overflow-visible">
                {/* 연결선 */}
                <g>
                  {nodes.map(node =>
                    node.connections.map(targetId => {
                      const target = nodes.find(n => n.id === targetId)
                      if (!target) return null
                      const isHighlighted = selectedNode?.id === node.id || selectedNode?.id === targetId
                      return (
                        <line
                          key={`${node.id}-${targetId}`}
                          x1={node.x} y1={node.y}
                          x2={target.x} y2={target.y}
                          stroke={isHighlighted ? "var(--primary)" : "var(--border)"}
                          strokeWidth={isHighlighted ? 2 : 1}
                          strokeDasharray={isHighlighted ? "none" : "5 4"}
                          className="transition-all duration-300"
                        />
                      )
                    })
                  )}
                </g>

                {/* 노드 */}
                <g>
                  {nodes.map(node => (
                    <foreignObject
                      key={node.id}
                      x={node.x - 70}
                      y={node.y - 20}
                      width="140"
                      height="40"
                      className="overflow-visible"
                    >
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                          className={getNodeStyle(node.type, selectedNode?.id === node.id)}
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
      </div>
    </div>
  )
}
