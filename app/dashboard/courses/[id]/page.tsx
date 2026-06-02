"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import {
  BookOpen, FileText, Target, Brain, ArrowLeft,
  TrendingUp, AlertTriangle, CheckCircle2, Plus, ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STORAGE_KEYS, storageGet } from "@/lib/storage"
import Link from "next/link"
import { FadeIn } from "@/components/ui/motion"

interface Course { id: string; name: string; professor: string; colorIndex: number }
interface AnalysisMeta { fileName: string; name?: string; uploadedAt: number; courseId?: string }
interface Analysis { oneLiner: string; concepts: { name: string; simple: string; difficulty?: string }[] }

const COLORS = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-blue-500/10", text: "text-blue-500" },
  { bg: "bg-green-500/10", text: "text-green-500" },
  { bg: "bg-orange-500/10", text: "text-orange-500" },
  { bg: "bg-pink-500/10", text: "text-pink-500" },
]

function calcScore(analysisId: string): number | null {
  const understanding = storageGet<Record<string, string>>(STORAGE_KEYS.conceptUnderstanding(analysisId), {})
  const vals = Object.values(understanding)
  const understood = vals.filter(v => v === "understood").length
  const confused = vals.filter(v => v === "confused").length
  const checked = understood + confused
  if (checked === 0) return null
  return Math.round((understood / checked) * 85 + 10)
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [analysisIds, setAnalysisIds] = useState<string[]>([])

  useEffect(() => {
    const courses = storageGet<Course[]>(STORAGE_KEYS.courses, [])
    const found = courses.find(c => c.id === id)
    if (!found) { router.push("/dashboard/courses"); return }
    setCourse(found)
    setAnalysisIds(storageGet<string[]>(STORAGE_KEYS.courseAnalyses(id), []))
  }, [id])

  const analyses = useMemo(() =>
    analysisIds.map(aId => {
      const meta = storageGet<AnalysisMeta>(STORAGE_KEYS.analysisMeta(aId), { fileName: aId, uploadedAt: 0 })
      const analysis = storageGet<Analysis>(STORAGE_KEYS.analysis(aId), { oneLiner: "", concepts: [] })
      const understanding = storageGet<Record<string, string>>(STORAGE_KEYS.conceptUnderstanding(aId), {})
      const score = calcScore(aId)
      const understood = Object.values(understanding).filter(v => v === "understood").length
      const confused = Object.values(understanding).filter(v => v === "confused").length
      return { id: aId, meta, analysis, understanding, score, understood, confused }
    }),
    [analysisIds]
  )

  // 과목 전체 건강도
  const overallScore = useMemo(() => {
    const scores = analyses.map(a => a.score).filter(Boolean) as number[]
    if (scores.length === 0) return null
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [analyses])

  // 전체 취약 개념 TOP5
  const weakConcepts = useMemo(() => {
    const map = new Map<string, number>()
    analyses.forEach(a => {
      Object.entries(a.understanding).forEach(([concept, status]) => {
        if (status === "confused") map.set(concept, (map.get(concept) ?? 0) + 1)
      })
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [analyses])

  // 건강도 추이
  const scoreHistory = useMemo(() =>
    [...analyses].reverse().map(a => a.score).filter(Boolean) as number[],
    [analyses]
  )

  if (!course) return null

  const color = COLORS[course.colorIndex % COLORS.length]
  const totalConcepts = analyses.reduce((s, a) => s + a.analysis.concepts.length, 0)
  const totalUnderstood = analyses.reduce((s, a) => s + a.understood, 0)
  const totalConfused = analyses.reduce((s, a) => s + a.confused, 0)

  return (
    <div className="flex flex-col">
      <Header title={course.name} subtitle={course.professor} />
      <div className="flex-1 p-4 md:p-6">
        <FadeIn>

          {/* 뒤로가기 */}
          <Link href="/dashboard/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            강의 목록으로
          </Link>

          {/* 과목 헤더 */}
          <div className="flex items-center gap-4 mb-6">
            <div className={cn("flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl", color.bg)}>
              <BookOpen className={cn("h-7 w-7", color.text)} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">{course.name}</h1>
              <p className="text-sm text-muted-foreground">{course.professor} · 자료 {analyses.length}개</p>
            </div>
          </div>

          {/* KPI 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              {
                label: "예상 점수",
                value: overallScore ? `${overallScore}점` : "—",
                icon: Target,
                color: overallScore
                  ? overallScore >= 80 ? "text-green-600 bg-green-500/10"
                  : overallScore >= 65 ? "text-primary bg-primary/10"
                  : "text-destructive bg-destructive/10"
                  : "text-muted-foreground bg-secondary",
              },
              {
                label: "이해한 개념",
                value: `${totalUnderstood}개`,
                icon: CheckCircle2,
                color: "text-green-600 bg-green-500/10",
              },
              {
                label: "취약 개념",
                value: `${totalConfused}개`,
                icon: AlertTriangle,
                color: totalConfused > 5 ? "text-destructive bg-destructive/10" : "text-orange-500 bg-orange-500/10",
              },
              {
                label: "총 개념 수",
                value: `${totalConcepts}개`,
                icon: Brain,
                color: "text-primary bg-primary/10",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="rounded-2xl border-border">
                <CardContent className="p-4">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl mb-3", color.split(" ")[1])}>
                    <Icon className={cn("h-4 w-4", color.split(" ")[0])} />
                  </div>
                  <p className="text-2xl font-black text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* 왼쪽: 자료 목록 */}
            <div className="md:col-span-2 space-y-4">

              {/* 건강도 추이 */}
              {scoreHistory.length >= 2 && (
                <Card className="rounded-2xl border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      건강도 추이
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-16">
                      {scoreHistory.map((s, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{s}</span>
                          <div
                            className={cn("w-full rounded-t-lg transition-all", s >= 80 ? "bg-green-500" : s >= 65 ? "bg-primary" : "bg-destructive")}
                            style={{ height: `${(s / 100) * 48}px` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">초기</span>
                      <span className="text-[10px] text-muted-foreground">최근</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 자료 목록 */}
              <Card className="rounded-2xl border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      업로드된 자료
                    </CardTitle>
                    <Link href="/dashboard/upload">
                      <button className="flex items-center gap-1 rounded-xl border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
                        <Plus className="h-3 w-3" /> 추가
                      </button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analyses.length === 0 ? (
                    <Link href="/dashboard/upload">
                      <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border py-10 text-center hover:border-primary/30 transition-colors cursor-pointer">
                        <Plus className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">아직 자료가 없어요</p>
                        <p className="text-xs text-muted-foreground/70">PDF 업로드 시 이 과목을 선택해보세요</p>
                      </div>
                    </Link>
                  ) : (
                    analyses.map(a => {
                      const fname = a.meta.fileName.replace(/\.[^.]+$/, "")
                      const score = a.score
                      return (
                        <Link key={a.id} href={`/dashboard/analysis?id=${a.id}`}>
                          <div className="flex items-center gap-3 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/30 p-3.5 transition-all group">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{fname}</p>
                              <p className="text-xs text-muted-foreground truncate">{a.analysis.oneLiner || "분석 결과 없음"}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {score !== null && (
                                <span className={cn("text-xs font-black px-2 py-0.5 rounded-lg",
                                  score >= 80 ? "bg-green-500/10 text-green-600" :
                                  score >= 65 ? "bg-primary/10 text-primary" :
                                  "bg-destructive/10 text-destructive"
                                )}>{score}점</span>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 오른쪽: 취약 개념 + 추천 */}
            <div className="space-y-4">

              {/* 취약 개념 TOP5 */}
              <Card className="rounded-2xl border-destructive/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    취약 개념 TOP 5
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weakConcepts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">아직 데이터가 없어요</p>
                  ) : (
                    <div className="space-y-2">
                      {weakConcepts.map(([concept, count], i) => (
                        <div key={concept} className="flex items-center gap-2.5">
                          <span className="text-xs font-black text-muted-foreground w-4">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{concept}</p>
                            <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full bg-destructive rounded-full"
                                style={{ width: `${Math.round((count / (weakConcepts[0]?.[1] ?? 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-destructive font-bold flex-shrink-0">{count}회</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 추천 학습 */}
              <Card className="rounded-2xl border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    추천 학습
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {weakConcepts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">개념을 체크하면 추천이 생겨요</p>
                  ) : (
                    <>
                      {weakConcepts.slice(0, 3).map(([concept], i) => {
                        const relatedAnalysis = analyses.find(a =>
                          Object.keys(a.understanding).includes(concept) && a.understanding[concept] === "confused"
                        )
                        return (
                          <Link key={concept} href={relatedAnalysis ? `/dashboard/analysis?id=${relatedAnalysis.id}` : "#"}>
                            <div className="flex items-center gap-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 px-3 py-2 transition-colors">
                              <span className="text-xs font-black text-primary w-4">{i + 1}</span>
                              <span className="text-xs text-foreground flex-1 truncate">{concept} 복습</span>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </Link>
                        )
                      })}
                      {analyses[0] && (
                        <Link href={`/dashboard/quiz?id=${analyses[0].id}`}>
                          <div className={cn("flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors mt-2", color.bg, color.text)}>
                            <Target className="h-3.5 w-3.5" />
                            퀴즈로 확인하기
                          </div>
                        </Link>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </FadeIn>
      </div>
    </div>
  )
}
