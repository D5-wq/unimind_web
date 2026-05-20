"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/dashboard/header"
import {
  Clock,
  BookOpen,
  CheckSquare,
  FileText,
  Sparkles,
  Target,
  Brain,
  AlertTriangle,
  CheckCircle,
  Circle,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface AnalysisResult {
  oneLiner: string
  flow: string[]
  concepts: { name: string; simple: string; why: string }[]
  examPoints: string[]
}

interface CheckItem {
  id: string
  task: string
  completed: boolean
}

export default function ExamPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [latestId, setLatestId] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<CheckItem[]>([])
  const router = useRouter()

  useEffect(() => {
    const applyResult = (r: AnalysisResult, id: string) => {
      setResult(r)
      setLatestId(id)
      const savedChecklist = localStorage.getItem(`checklist-${id}`)
      if (savedChecklist) {
        setChecklist(JSON.parse(savedChecklist))
      } else {
        const items: CheckItem[] = [
          ...r.concepts.map((c, i) => ({
            id: `concept-${i}`,
            task: `개념 이해: ${c.name}`,
            completed: false,
          })),
          ...r.examPoints.slice(0, 3).map((p, i) => ({
            id: `exam-${i}`,
            task: `시험 포인트 복습: ${p.slice(0, 40)}${p.length > 40 ? "..." : ""}`,
            completed: false,
          })),
        ]
        setChecklist(items)
      }
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
      const id = keys[0].replace("analysis-", "")
      try {
        const saved = JSON.parse(localStorage.getItem(keys[0]) ?? "")
        applyResult(saved, id)
      } catch {}
    }

    supabase
      .from('analyses')
      .select('id, one_liner, flow, concepts, exam_points')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          applyResult({
            oneLiner: data.one_liner ?? '',
            flow: data.flow as string[],
            concepts: data.concepts as { name: string; simple: string; why: string }[],
            examPoints: data.exam_points as string[],
          }, data.id)
        } else {
          loadFromLocalStorage()
        }
      })
      .catch(() => loadFromLocalStorage())
  }, [])

  const toggleItem = (id: string) => {
    setChecklist(prev => {
      const next = prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
      if (latestId) localStorage.setItem(`checklist-${latestId}`, JSON.stringify(next))
      return next
    })
  }

  const completedCount = checklist.filter(i => i.completed).length
  const progressPercentage = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0

  if (!result) {
    return (
      <div className="flex flex-col">
        <Header title="시험 준비" subtitle="효율적인 시험 대비를 도와드립니다" />
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">먼저 강의 PDF를 업로드해주세요</h3>
          <p className="mt-2 text-sm text-muted-foreground">분석이 완료되면 시험 준비 자료가 자동으로 생성됩니다</p>
          <Link href="/dashboard/upload" className="mt-6">
            <Button className="rounded-xl px-8">PDF 업로드하기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="시험 준비" subtitle="효율적인 시험 대비를 도와드립니다" />

      <div className="flex-1 space-y-6 p-6">
        {/* 강의 요약 카드 */}
        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                <Target className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{result.oneLiner}</h2>
                <p className="text-sm text-muted-foreground">
                  개념 {result.concepts.length}개 · 시험 포인트 {result.examPoints.length}개
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 10분 핵심 정리 (강의 흐름) */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              강의 흐름 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {result.flow.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/30"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary mb-2">
                    {index + 1}
                  </div>
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 핵심 개념 */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  핵심 개념
                </span>
                <Badge variant="secondary" className="rounded-lg">
                  {result.concepts.length}개
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.concepts.map((concept, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl bg-secondary/30 p-3"
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{concept.name}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{concept.simple}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 복습 체크리스트 */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  복습 체크리스트
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {completedCount}/{checklist.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressPercentage} className="h-2" />
              <div className="space-y-2">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                      item.completed ? "bg-green-500/5" : "bg-secondary/30 hover:bg-secondary/50"
                    )}
                  >
                    {item.completed ? (
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <span className={cn(
                      "text-sm",
                      item.completed ? "text-green-700 line-through" : "text-foreground"
                    )}>
                      {item.task}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 시험 예상 포인트 */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              시험 출제 예상 포인트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.examPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                  <AlertTriangle className={cn(
                    "h-6 w-6",
                    index === 0 ? "text-destructive" : index === 1 ? "text-orange-500" : "text-primary"
                  )} />
                </div>
                <p className="flex-1 text-sm text-foreground">{point}</p>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-bold",
                    index === 0 ? "text-destructive" : index === 1 ? "text-orange-500" : "text-primary"
                  )}>
                    {90 - index * 5}%
                  </p>
                  <p className="text-xs text-muted-foreground">출제 확률</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI 도움 카드 */}
        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">더 깊이 공부하고 싶다면</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  AI에게 각 개념을 더 자세히 물어보거나, 예상 시험 문제를 만들어달라고 해보세요.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button className="rounded-xl" onClick={() => router.push("/dashboard/chat")}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    AI에게 질문하기
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
