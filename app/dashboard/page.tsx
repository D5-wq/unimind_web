"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { supabase } from "@/lib/supabase"
import {
  FileText, Play, TrendingUp, BookOpen, Brain, Target,
  ArrowUpRight, Upload, Sparkles, Calendar, CheckCircle2, Zap, CheckCircle, Flame, Crown,
  RotateCcw, Network,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { timeAgo, calcDDay } from "@/lib/utils-app"
import { useAnalysis } from "@/components/dashboard/analysis-context"
import { useAuth } from "@/components/dashboard/auth-context"
import { useRouter } from "next/navigation"
import { getStreak, getStreakEmoji, isStreakAtRisk, type StreakData } from "@/lib/streak"
import { getDueCards, getReviewSummary, type RepCard } from "@/lib/spaced-repetition"
import { STORAGE_KEYS, storageGet } from "@/lib/storage"
import { FadeIn } from "@/components/ui/motion"

interface AnalysisEntry {
  id: string; name: string; uploadedAt: number
  oneLiner: string; conceptCount: number; examPointCount: number
}

interface Exam {
  id: string; subject: string; date: string
}

export default function DashboardPage() {
  const { selectedId, selectedAnalysis, select, allAnalyses } = useAnalysis()
  const { user, isPro, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [courseCount, setCourseCount] = useState(0)
  const [userName, setUserName] = useState("안녕하세요!")
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [upgraded, setUpgraded] = useState(false)
  const [dueCards, setDueCards] = useState<RepCard[]>([])
  const [reviewSummary, setReviewSummary] = useState({ total: 0, dueToday: 0, mastered: 0 })
  const [confusedConcepts, setConfusedConcepts] = useState<{ concept: string; analysisId: string; fileName: string }[]>([])
  const [heatmap, setHeatmap] = useState<Record<string, number>>({})  // "YYYY-MM-DD" → activity count

  // 로컬 analyses 리스트 — context의 allAnalyses를 AnalysisEntry 형태로 변환
  const analyses: AnalysisEntry[] = allAnalyses.map(a => ({
    id: a.id,
    name: a.fileName,
    uploadedAt: a.createdAt,
    oneLiner: a.oneLiner,
    conceptCount: 0,
    examPointCount: 0,
  }))

  // 선택된 강의의 추천 포인트
  const recommendations = selectedAnalysis?.examPoints?.slice(0, 3) ?? []

  useEffect(() => {
    const p = storageGet<{ name?: string }>(STORAGE_KEYS.userProfile, {})
    if (p.name) setUserName(`${p.name}님!`)
    const c = storageGet<any[]>(STORAGE_KEYS.courses, [])
    setCourseCount(c.length)
    const e = storageGet<Exam[]>(STORAGE_KEYS.exams, [])
    setExams(e)
    try { setStreak(getStreak()) } catch {}
    try { setDueCards(getDueCards().slice(0, 5)) } catch {}
    try { setReviewSummary(getReviewSummary()) } catch {}
    try {
      const confused: { concept: string; analysisId: string; fileName: string }[] = []
      Object.keys(localStorage)
        .filter(k => k.startsWith("concept-understanding-"))
        .forEach(k => {
          const analysisId = k.replace("concept-understanding-", "")
          const data = storageGet<Record<string, string>>(k, {})
          const meta = storageGet<Record<string, string>>(STORAGE_KEYS.analysisMeta(analysisId), {})
          const fileName: string = meta.fileName ?? meta.name ?? analysisId
          Object.entries(data).forEach(([concept, status]) => {
            if (status === "confused") confused.push({ concept, analysisId, fileName })
          })
        })
      setConfusedConcepts(confused.slice(0, 6))
    } catch {}

    // 히트맵 — quiz-history + concept-understanding 날짜 집계
    try {
      const map: Record<string, number> = {}
      const quizHistory = storageGet<any[]>("quiz-history", [])
      quizHistory.forEach(h => {
        const d = new Date(h.timestamp).toISOString().slice(0, 10)
        map[d] = (map[d] ?? 0) + 2
      })
      Object.keys(localStorage).filter(k => k.startsWith("concept-understanding-")).forEach(k => {
        // 오늘 날짜로 count (정확한 날짜 없이)
        const d = new Date().toISOString().slice(0, 10)
        map[d] = (map[d] ?? 0) + 1
      })
      setHeatmap(map)
    } catch {}

    // 결제 완료 후 리다이렉트
    const url = new URL(window.location.href)
    if (url.searchParams.get("upgraded") === "1") {
      setUpgraded(true)
      url.searchParams.delete("upgraded")
      window.history.replaceState({}, "", url.toString())
    }
  }, [])

  const upcomingExams = exams
    .map(e => ({ ...e, dday: calcDDay(e.date) }))
    .filter(e => e.dday >= 0 && e.dday <= 30)
    .sort((a, b) => a.dday - b.dday)
    .slice(0, 3)

  const closestExam = upcomingExams[0]

  // 예상 평균 점수 계산
  const avgScore = (() => {
    if (analyses.length === 0) return null
    const totalConcepts = analyses.reduce((sum, a) => {
      const analysis = storageGet<{ concepts?: any[] }>(STORAGE_KEYS.analysis(a.id), {})
      return sum + (analysis.concepts?.length ?? 0)
    }, 0)
    if (totalConcepts === 0) return null
    let understood = 0, confused = 0
    analyses.forEach(a => {
      const understanding = storageGet<Record<string, string>>(STORAGE_KEYS.conceptUnderstanding(a.id), {})
      Object.values(understanding).forEach(v => {
        if (v === "understood") understood++
        if (v === "confused") confused++
      })
    })
    const checked = understood + confused
    if (checked === 0) return null
    // 최소 30점 보장 — 개념 체크를 시작한 이상 0점은 말이 안 됨
    const raw = Math.round((understood / checked) * 65 + 30)
    return Math.max(30, Math.min(99, raw))
  })()

  const stats = [
    {
      title: "예상 평균 점수",
      value: avgScore ? `${avgScore}점` : "—",
      sub: avgScore ? (avgScore >= 80 ? "잘 하고 있어요" : avgScore >= 65 ? "보통 수준" : "복습 필요") : "개념 체크 후 계산",
      icon: Target,
      color: avgScore ? (avgScore >= 80 ? "text-green-500" : avgScore >= 65 ? "text-primary" : "text-destructive") : "text-muted-foreground",
      bg: avgScore ? (avgScore >= 80 ? "bg-green-500/10" : avgScore >= 65 ? "bg-primary/10" : "bg-destructive/10") : "bg-secondary",
    },
    {
      title: "위험 과목",
      value: avgScore && avgScore < 65 ? "있음" : "없음",
      sub: confusedConcepts.length > 0 ? `취약 개념 ${confusedConcepts.length}개` : "모두 양호",
      icon: Brain,
      color: confusedConcepts.length > 5 ? "text-destructive" : "text-orange-500",
      bg: confusedConcepts.length > 5 ? "bg-destructive/10" : "bg-orange-500/10",
    },
    {
      title: "분석한 강의",
      value: String(analyses.length),
      sub: analyses.length === 0 ? "아직 없음" : `${analyses.length}개 분석 완료`,
      icon: BookOpen,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: closestExam ? `${closestExam.subject} 시험` : "시험 일정",
      value: closestExam ? (closestExam.dday === 0 ? "D-Day!" : `D-${closestExam.dday}`) : "없음",
      sub: closestExam && closestExam.dday <= 3 ? "🚨 임박!" : closestExam ? closestExam.date : "플래너에서 추가",
      icon: Calendar,
      color: closestExam && closestExam.dday <= 7 ? "text-destructive" : "text-chart-4",
      bg: closestExam && closestExam.dday <= 7 ? "bg-destructive/10" : "bg-chart-4/10",
    },
  ]

  const handleSelectLecture = (entry: AnalysisEntry) => {
    select(entry.id)
    router.push(`/dashboard/analysis?id=${entry.id}`)
  }

  return (
    <div className="flex flex-col">
      <Header title="대시보드" subtitle="학습 현황을 한눈에 확인하세요" />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <FadeIn delay={0}>

        {/* 온보딩 카드 — 첫 방문자 */}
        {analyses.length === 0 && !upgraded && (
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">👋</div>
              <div className="flex-1">
                <p className="font-bold text-foreground mb-1">1분 안에 시작해봐요</p>
                <p className="text-sm text-muted-foreground mb-4">강의 PDF 하나만 올리면 핵심 개념, 퀴즈, 예상 점수까지 나와요.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["① PDF 업로드", "② AI 분석 (8초)", "③ 퀴즈 + 점수 예측"].map((step, i) => (
                    <span key={i} className="rounded-xl bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{step}</span>
                  ))}
                </div>
                <Link href="/dashboard/upload">
                  <button className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                    지금 시작하기 →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 업그레이드 완료 알림 */}
        {upgraded && (
          <div className="rounded-2xl bg-primary/10 border border-primary/30 p-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-primary">Pro 업그레이드 완료! 🎉</p>
              <p className="text-sm text-muted-foreground">이제 무제한으로 강의를 분석할 수 있어요.</p>
            </div>
          </div>
        )}

        {/* 오늘의 미션 */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/70 p-5 text-primary-foreground">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-primary-foreground/70 uppercase tracking-widest mb-1">오늘의 미션</p>
              <div className="space-y-1.5">
                {dueCards.length > 0 && (
                  <Link href="/dashboard">
                    <div className="flex items-center gap-2 text-sm text-primary-foreground/90 hover:text-primary-foreground transition-colors">
                      <span className="text-primary-foreground/60">①</span>
                      <span>{dueCards[0].conceptName} 복습</span>
                    </div>
                  </Link>
                )}
                {confusedConcepts[0] && (
                  <Link href={`/dashboard/analysis?id=${confusedConcepts[0].analysisId}`}>
                    <div className="flex items-center gap-2 text-sm text-primary-foreground/90 hover:text-primary-foreground transition-colors">
                      <span className="text-primary-foreground/60">②</span>
                      <span>{confusedConcepts[0].concept} 다시 보기</span>
                    </div>
                  </Link>
                )}
                {analyses[0] && (
                  <Link href={`/dashboard/quiz?id=${analyses[0].id}`}>
                    <div className="flex items-center gap-2 text-sm text-primary-foreground/90 hover:text-primary-foreground transition-colors">
                      <span className="text-primary-foreground/60">③</span>
                      <span>퀴즈 10문제 풀기</span>
                    </div>
                  </Link>
                )}
                {dueCards.length === 0 && confusedConcepts.length === 0 && analyses.length === 0 && (
                  <Link href="/dashboard/upload">
                    <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
                      <span className="text-primary-foreground/60">①</span>
                      <span>첫 강의 자료 업로드하기</span>
                    </div>
                  </Link>
                )}
              </div>
              {!user && (
                <button onClick={signInWithGoogle} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium transition-colors">
                  로그인하면 데이터가 저장돼요
                </button>
              )}
            </div>
            {streak && streak.current > 0 && (
              <div className="flex-shrink-0 text-center">
                <div className="text-2xl">{getStreakEmoji(streak.current)}</div>
                <div className="text-xl font-black">{streak.current}</div>
                <div className="text-[10px] text-primary-foreground/70">일 연속</div>
              </div>
            )}
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <Card key={stat.title} className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                    {'sub' in stat && stat.sub && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{(stat as any).sub}</p>
                    )}
                  </div>
                  <div className={cn("rounded-xl p-3", stat.bg)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 헷갈린 개념 복습 배너 */}
        {confusedConcepts.length > 0 && (
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-orange-500" />
                <p className="text-sm font-semibold text-foreground">헷갈린 개념 복습하기</p>
                <span className="text-xs bg-orange-500/15 text-orange-600 rounded-lg px-2 py-0.5 font-medium">
                  {confusedConcepts.length}개
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {confusedConcepts.map(({ concept, analysisId }) => (
                <Link key={`${analysisId}-${concept}`} href={`/dashboard/analysis?id=${analysisId}`}>
                  <button className="rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 text-xs px-3 py-1.5 font-medium transition-colors">
                    {concept} →
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 최근 분석 강의 */}
          <div className="lg:col-span-2">
            {analyses.length === 0 ? (
              <Card className="rounded-2xl border-2 border-dashed border-border shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">아직 분석한 강의가 없어요</h3>
                  <p className="mt-2 text-sm text-muted-foreground">PDF를 업로드하면 AI가 강의를 분석해줍니다</p>
                  <Link href="/dashboard/upload" className="mt-6">
                    <Button className="rounded-xl px-8">
                      <Upload className="mr-2 h-4 w-4" />PDF 업로드하기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">강의 목록</CardTitle>
                  <Link href="/dashboard/upload">
                    <Button variant="ghost" size="sm" className="gap-1 rounded-xl text-primary text-xs">
                      업로드 <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
                    {analyses.map(entry => {
                      const isSelected = entry.id === selectedId
                      return (
                        <button
                          key={entry.id}
                          onClick={() => handleSelectLecture(entry)}
                          className={cn(
                            "group w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all",
                            isSelected
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                          )}
                        >
                          <div className={cn(
                            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10"
                          )}>
                            {isSelected
                              ? <CheckCircle className="h-5 w-5" />
                              : <FileText className="h-5 w-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={cn("truncate text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
                                {entry.name}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isSelected && (
                                  <Badge className="rounded-lg bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 border-primary/20">
                                    선택됨
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">{timeAgo(entry.uploadedAt)}</span>
                              </div>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.oneLiner}</p>
                          </div>
                          <Play className={cn("h-4 w-4 flex-shrink-0 transition-opacity", isSelected ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-60")} />
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 사이드: 복습 + 일정 + AI 추천 */}
          <div className="space-y-4">

            {/* 시험 직전 모드 — D-3 이하 */}
            {closestExam && closestExam.dday <= 3 && (
              <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🚨</span>
                    <p className="font-black text-destructive text-sm">
                      {closestExam.subject} — {closestExam.dday === 0 ? "오늘 시험!" : `D-${closestExam.dday}`}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">새 개념 금지. 취약 개념만 복습하세요.</p>
                  {confusedConcepts.slice(0, 3).length > 0 && (
                    <div className="space-y-1.5">
                      {confusedConcepts.slice(0, 3).map(({ concept, analysisId }) => (
                        <Link key={concept} href={`/dashboard/analysis?id=${analysisId}`}>
                          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-1.5 hover:bg-destructive/20 transition-colors">
                            <div className="h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0" />
                            <span className="text-xs font-medium text-destructive truncate">{concept}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 학습 히트맵 */}
            {Object.keys(heatmap).length > 0 && (
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span>📅</span> 학습 활동
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const days: string[] = []
                    for (let i = 27; i >= 0; i--) {
                      const d = new Date()
                      d.setDate(d.getDate() - i)
                      days.push(d.toISOString().slice(0, 10))
                    }
                    const max = Math.max(...days.map(d => heatmap[d] ?? 0), 1)
                    return (
                      <div className="flex flex-wrap gap-1">
                        {days.map(d => {
                          const v = heatmap[d] ?? 0
                          const intensity = v === 0 ? 0 : Math.ceil((v / max) * 4)
                          return (
                            <div
                              key={d}
                              title={`${d}: ${v}개 활동`}
                              className={cn(
                                "h-4 w-4 rounded-sm transition-colors",
                                intensity === 0 ? "bg-secondary" :
                                intensity === 1 ? "bg-primary/20" :
                                intensity === 2 ? "bg-primary/40" :
                                intensity === 3 ? "bg-primary/70" :
                                "bg-primary"
                              )}
                            />
                          )
                        })}
                      </div>
                    )
                  })()}
                  <p className="text-xs text-muted-foreground mt-2">최근 28일 학습 기록</p>
                </CardContent>
              </Card>
            )}

            {/* 취약 개념 TOP 5 */}
            {confusedConcepts.length >= 3 && (
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span>🎯</span> 이번 학기 최대 적
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {confusedConcepts.slice(0, 5).map(({ concept, analysisId }, i) => (
                      <Link key={concept} href={`/dashboard/analysis?id=${analysisId}`}>
                        <div className="flex items-center gap-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/60 px-3 py-2 transition-colors">
                          <span className="text-xs font-black text-muted-foreground w-4">{i + 1}</span>
                          <span className="text-xs font-medium text-foreground flex-1 truncate">{concept}</span>
                          <span className="text-orange-500 text-xs">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 오늘 복습 카드 */}
            {reviewSummary.total > 0 && (
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <RotateCcw className="h-4 w-4 text-primary" />
                      오늘 복습할 개념
                    </CardTitle>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${dueCards.length > 0 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}`}>
                      {dueCards.length > 0 ? `${dueCards.length}개 대기` : "모두 완료 ✓"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {dueCards.length === 0 ? (
                    <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3 text-center">
                      <p className="text-xs text-green-600 font-medium">오늘 복습 완료!</p>
                      <p className="text-xs text-muted-foreground mt-0.5">총 {reviewSummary.mastered}개 개념 마스터</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {dueCards.map((card, i) => (
                        <Link key={i} href={`/dashboard/analysis?id=${card.analysisId}`}>
                          <div className="flex items-center gap-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 p-2.5 transition-colors cursor-pointer">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{card.conceptName}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{card.fileName.replace(/\.[^.]+$/, "")}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    이번 주 일정
                  </CardTitle>
                  <Link href="/dashboard/calendar">
                    <Button variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-xs text-primary">전체 보기</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingExams.length === 0 ? (
                  <div className="rounded-xl bg-secondary/30 py-4 text-center">
                    <p className="text-xs text-muted-foreground">예정된 시험이 없어요</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingExams.map(exam => (
                      <div key={exam.id} className="flex items-center gap-3 rounded-xl bg-secondary/30 p-2.5">
                        <div className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          exam.dday === 0 ? "bg-destructive text-white" :
                          exam.dday <= 3 ? "bg-destructive/10 text-destructive" :
                          exam.dday <= 7 ? "bg-orange-500/10 text-orange-600" : "bg-primary/10 text-primary"
                        )}>
                          {exam.dday === 0 ? "D!" : `D-${exam.dday}`}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{exam.subject}</p>
                          <p className="text-xs text-muted-foreground">{exam.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  {recommendations.length > 0 ? "선택 강의 시험 포인트" : "AI 추천"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="rounded-xl bg-secondary/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">강의를 선택하면 시험 포인트를 보여줍니다</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs leading-relaxed text-foreground/80">{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 과목별 건강도 */}
        {analyses.length >= 2 && (
          <Card className="rounded-2xl border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                과목별 이해도
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analyses.slice(0, 4).map(a => {
                  const understanding = storageGet<Record<string, string>>(STORAGE_KEYS.conceptUnderstanding(a.id), {})
                  const analysis = storageGet<{ concepts?: any[] }>(STORAGE_KEYS.analysis(a.id), {})
                  const total = analysis.concepts?.length ?? 0
                  const understood = Object.values(understanding).filter(v => v === "understood").length
                  const confused = Object.values(understanding).filter(v => v === "confused").length
                  const checked = understood + confused
                  const score = checked === 0 ? null : Math.round((understood / checked) * 85 + 10)
                  const name = a.name.replace(/\.[^.]+$/, "").slice(0, 12)
                  return (
                    <Link key={a.id} href={`/dashboard/analysis?id=${a.id}`}>
                      <div className="rounded-xl border border-border p-3 hover:border-primary/30 transition-colors cursor-pointer">
                        <p className="text-xs font-medium text-foreground truncate mb-2">{name}</p>
                        <div className="flex items-end gap-2 mb-1.5">
                          <span className={cn("text-2xl font-black",
                            score === null ? "text-muted-foreground" :
                            score >= 80 ? "text-green-600" :
                            score >= 65 ? "text-primary" : "text-destructive"
                          )}>
                            {score ?? "—"}
                          </span>
                          {score && <span className="text-xs text-muted-foreground mb-1">점</span>}
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all",
                              score === null ? "w-0" :
                              score >= 80 ? "bg-green-500" :
                              score >= 65 ? "bg-primary" : "bg-destructive"
                            )}
                            style={{ width: score ? `${score}%` : "0%" }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{total}개 개념</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 빠른 이동 */}
        {analyses.length > 0 && (
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { href: `/dashboard/analysis?id=${selectedId ?? analyses[0]?.id ?? ''}`, icon: FileText, label: "분석 결과 보기", sub: "선택한 강의 요약", color: "bg-primary/10", iconColor: "text-primary" },
              { href: "/dashboard/chat", icon: Sparkles, label: "AI에게 질문하기", sub: "강의 내용 질문", color: "bg-accent/10", iconColor: "text-accent" },
              { href: `/dashboard/quiz?id=${selectedId ?? analyses[0]?.id ?? ''}`, icon: Target, label: "퀴즈 풀기", sub: "AI 자동 생성 문제", color: "bg-chart-3/10", iconColor: "text-chart-3" },
              { href: "/dashboard/knowledge", icon: Network, label: "지식 그래프", sub: "누적 개념 시각화", color: "bg-accent/10", iconColor: "text-accent" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="contents">
                <Card className="cursor-pointer rounded-2xl border-border shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", item.color)}>
                      <item.icon className={cn("h-6 w-6", item.iconColor)} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        </FadeIn>
      </div>
    </div>
  )
}
