"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { supabase } from "@/lib/supabase"
import {
  FileText, Play, TrendingUp, BookOpen, Brain, Target,
  ArrowUpRight, Upload, Sparkles, Calendar, CheckCircle2, Zap, CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { timeAgo, calcDDay } from "@/lib/utils-app"
import { useAnalysis } from "@/components/dashboard/analysis-context"
import { useRouter } from "next/navigation"

interface AnalysisEntry {
  id: string; name: string; uploadedAt: number
  oneLiner: string; conceptCount: number; examPointCount: number
}

interface Exam {
  id: string; subject: string; date: string
}

export default function DashboardPage() {
  const { selectedId, selectedAnalysis, select, allAnalyses } = useAnalysis()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [courseCount, setCourseCount] = useState(0)
  const [userName, setUserName] = useState("안녕하세요!")

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
    try { const p = JSON.parse(localStorage.getItem("user-profile") ?? "{}"); if (p.name) setUserName(`${p.name}님!`) } catch {}
    try { const c = JSON.parse(localStorage.getItem("courses") ?? "[]"); setCourseCount(c.length) } catch {}
    try { const e = JSON.parse(localStorage.getItem("exams") ?? "[]"); setExams(e) } catch {}
  }, [])

  const upcomingExams = exams
    .map(e => ({ ...e, dday: calcDDay(e.date) }))
    .filter(e => e.dday >= 0 && e.dday <= 30)
    .sort((a, b) => a.dday - b.dday)
    .slice(0, 3)

  const closestExam = upcomingExams[0]

  const stats = [
    { title: "분석한 강의", value: String(analyses.length), icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { title: "이번 주 할 일", value: String(selectedAnalysis?.examPoints?.length ?? 0), icon: CheckCircle2, color: "text-accent", bg: "bg-accent/10" },
    { title: "등록된 강의", value: String(courseCount), icon: TrendingUp, color: "text-chart-3", bg: "bg-chart-3/10" },
    {
      title: closestExam ? closestExam.subject : "D-Day",
      value: closestExam ? (closestExam.dday === 0 ? "D-Day!" : `D-${closestExam.dday}`) : "-",
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

        {/* 인사 배너 */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/70 p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">안녕하세요, {userName} 👋</h2>
              <p className="mt-1 text-sm text-primary-foreground/80">오늘도 학습을 시작해볼까요?</p>
            </div>
            <Sparkles className="h-10 w-10 text-primary-foreground/40" />
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
                  </div>
                  <div className={cn("rounded-xl p-3", stat.bg)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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

          {/* 사이드: 이번 주 일정 + AI 추천 */}
          <div className="space-y-4">
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

        {/* 빠른 이동 */}
        {analyses.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { href: `/dashboard/analysis?id=${selectedId ?? analyses[0]?.id ?? ''}`, icon: FileText, label: "분석 결과 보기", sub: "선택한 강의 요약", color: "bg-primary/10", iconColor: "text-primary" },
              { href: "/dashboard/chat", icon: Sparkles, label: "AI에게 질문하기", sub: "강의 내용 질문", color: "bg-accent/10", iconColor: "text-accent" },
              { href: "/dashboard/exam", icon: Target, label: "시험 준비", sub: "예상 문제 확인", color: "bg-chart-3/10", iconColor: "text-chart-3" },
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
      </div>
    </div>
  )
}
