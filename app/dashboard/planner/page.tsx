"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import {
  Target, Calendar, Plus, X, CheckCircle2, Circle, Sparkles,
  BookOpen, Loader2, Brain, Clock, RotateCcw, ChevronDown, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { calcDDay } from "@/lib/utils-app"
import { useAnalysis } from "@/components/dashboard/analysis-context"
import { STORAGE_KEYS, storageGet, storageSet } from "@/lib/storage"
import type { StudyPlan, StudyTask } from "@/app/api/study-plan/route"

interface Exam { id: string; subject: string; date: string }
interface WeekGoal { id: string; text: string; done: boolean }

const DDAY_COLOR = (d: number) =>
  d === 0 ? "text-destructive bg-destructive/10" :
  d <= 3  ? "text-destructive bg-destructive/10" :
  d <= 7  ? "text-orange-600 bg-orange-500/10" :
            "text-primary bg-primary/10"

const PRIORITY_COLOR = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  low: "bg-primary/10 text-primary border-primary/20",
}

const TYPE_LABEL = { review: "복습", study: "학습", quiz: "퀴즈" }

export default function PlannerPage() {
  const { selectedAnalysis, allAnalyses } = useAnalysis()
  const [exams, setExams] = useState<Exam[]>([])
  const [goals, setGoals] = useState<WeekGoal[]>([])
  const [addingGoal, setAddingGoal] = useState(false)
  const [newGoal, setNewGoal] = useState("")
  const [addingExam, setAddingExam] = useState(false)
  const [newSubject, setNewSubject] = useState("")
  const [newDate, setNewDate] = useState("")

  // AI 학습 플랜
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [generating, setGenerating] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  const recommendations = selectedAnalysis?.examPoints?.slice(0, 4) ?? []

  useEffect(() => {
    setExams(storageGet<Exam[]>(STORAGE_KEYS.exams, []))
    setGoals(storageGet<WeekGoal[]>("planner-goals", []))
    const saved = storageGet<StudyPlan | null>("study-plan", null)
    if (saved) setPlan(saved)
  }, [])

  const saveExams = (list: Exam[]) => { setExams(list); storageSet(STORAGE_KEYS.exams, list) }
  const saveGoals = (list: WeekGoal[]) => { setGoals(list); storageSet("planner-goals", list) }

  const addExam = () => {
    if (!newSubject.trim() || !newDate) return
    saveExams([...exams, { id: Date.now().toString(), subject: newSubject.trim(), date: newDate }])
    setNewSubject(""); setNewDate(""); setAddingExam(false)
  }

  const addGoal = () => {
    if (!newGoal.trim()) return
    saveGoals([...goals, { id: Date.now().toString(), text: newGoal.trim(), done: false }])
    setNewGoal(""); setAddingGoal(false)
  }

  const toggleGoal = (id: string) =>
    saveGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g))

  const generatePlan = async () => {
    if (!exams.length) { setPlanError("먼저 시험 일정을 추가해주세요"); return }

    // 모든 분석에서 개념 수집
    const concepts: { subject: string; concept: string; status: string }[] = []
    for (const a of allAnalyses) {
      const analysis = storageGet<{ concepts?: { name: string }[] }>(STORAGE_KEYS.analysis(a.id), {})
      const understanding = storageGet<Record<string, string>>(STORAGE_KEYS.conceptUnderstanding(a.id), {})
      const subject = a.fileName.replace(/\.[^.]+$/, "")
      analysis.concepts?.forEach(c => {
        concepts.push({ subject, concept: c.name, status: understanding[c.name] ?? "unknown" })
      })
    }

    if (!concepts.length) { setPlanError("먼저 강의 자료를 업로드하고 개념을 확인해주세요"); return }

    setGenerating(true)
    setPlanError(null)

    try {
      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exams, concepts }),
      })
      const data = await res.json()
      if (data.error) { setPlanError(data.error); return }
      setPlan(data)
      storageSet("study-plan", data)

      // 처음 3일 자동 펼치기
      const first3 = [...new Set<string>(data.tasks.map((t: StudyTask) => t.date))].slice(0, 3)
      setExpandedDates(new Set<string>(first3))
    } catch {
      setPlanError("플랜 생성에 실패했어요. 다시 시도해주세요.")
    } finally {
      setGenerating(false)
    }
  }

  const upcomingExams = exams.map(e => ({ ...e, dday: calcDDay(e.date) })).filter(e => e.dday >= 0).sort((a, b) => a.dday - b.dday)
  const doneCount = goals.filter(g => g.done).length
  const progress = goals.length > 0 ? (doneCount / goals.length) * 100 : 0

  // 날짜별로 플랜 그룹핑
  const planByDate = plan?.tasks.reduce<Record<string, StudyTask[]>>((acc, t) => {
    acc[t.date] = [...(acc[t.date] ?? []), t]
    return acc
  }, {}) ?? {}
  const planDates = Object.keys(planByDate).sort()

  const toggleDate = (date: string) =>
    setExpandedDates(prev => { const s = new Set(prev); s.has(date) ? s.delete(date) : s.add(date); return s })

  return (
    <div className="flex flex-col">
      <Header title="학습 플래너" subtitle="AI가 시험까지 최적의 학습 계획을 짜드립니다" />
      <div className="flex-1 space-y-6 p-6">

        {/* 시험 D-Day */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                시험 일정
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 rounded-xl text-primary" onClick={() => setAddingExam(v => !v)}>
                <Plus className="h-4 w-4" />추가
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {addingExam && (
              <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
                <Input placeholder="과목명" value={newSubject} onChange={e => setNewSubject(e.target.value)} onKeyDown={e => e.key === "Enter" && addExam()} className="h-8 text-sm" />
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="h-8 text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 flex-1 rounded-lg text-xs" onClick={addExam}>추가</Button>
                  <Button size="sm" variant="ghost" className="h-7 flex-1 rounded-lg text-xs" onClick={() => setAddingExam(false)}>취소</Button>
                </div>
              </div>
            )}
            {upcomingExams.length === 0 ? (
              <div className="rounded-xl bg-secondary/30 py-6 text-center">
                <p className="text-sm text-muted-foreground">등록된 시험 일정이 없어요</p>
                <p className="mt-1 text-xs text-muted-foreground/70">+ 추가 버튼으로 시험을 등록하세요</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingExams.map(exam => (
                  <div key={exam.id} className="group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{exam.subject}</span>
                      <button onClick={() => saveExams(exams.filter(e => e.id !== exam.id))} className="hidden h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive group-hover:flex">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{exam.date}</p>
                    <span className={cn("w-fit rounded-lg px-2.5 py-1 text-sm font-bold", DDAY_COLOR(exam.dday))}>
                      {exam.dday === 0 ? "D-Day!" : `D-${exam.dday}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI 학습 플랜 */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI 학습 플랜
                {plan && <span className="text-xs font-normal text-muted-foreground">생성: {plan.generatedAt}</span>}
              </CardTitle>
              <Button
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={generatePlan}
                disabled={generating}
              >
                {generating
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />생성 중...</>
                  : plan
                  ? <><RotateCcw className="h-3.5 w-3.5" />다시 생성</>
                  : <><Sparkles className="h-3.5 w-3.5" />플랜 생성</>
                }
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {planError && (
              <div className="mb-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{planError}</div>
            )}

            {!plan && !generating && (
              <div className="rounded-xl bg-secondary/30 py-10 text-center">
                <Brain className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">AI가 시험까지 학습 계획을 짜드려요</p>
                <p className="mt-1 text-xs text-muted-foreground">시험 일정 + 업로드된 강의 기반으로 자동 생성</p>
                <p className="mt-0.5 text-xs text-muted-foreground">헷갈리는 개념 우선 배정 · 하루 90분 이내</p>
              </div>
            )}

            {plan && planDates.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">{plan.summary}</p>
                {planDates.map(date => {
                  const tasks = planByDate[date]
                  const isOpen = expandedDates.has(date)
                  const totalMin = tasks.reduce((s, t) => s + t.duration, 0)
                  const hasHigh = tasks.some(t => t.priority === "high")
                  const d = new Date(date)
                  const label = d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })

                  return (
                    <div key={date} className="rounded-xl border border-border overflow-hidden">
                      <button
                        onClick={() => toggleDate(date)}
                        className="flex w-full items-center gap-3 p-3 text-left hover:bg-secondary/30 transition-colors"
                      >
                        <div className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          hasHigh ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        )}>
                          {d.getDate()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">{tasks.length}개 항목 · {totalMin}분</p>
                        </div>
                        {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>

                      {isOpen && (
                        <div className="border-t border-border bg-secondary/10 p-3 space-y-2">
                          {tasks.map((task, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl bg-card p-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-foreground">{task.concept}</span>
                                  <Badge variant="outline" className={cn("rounded-lg text-[10px] px-1.5", PRIORITY_COLOR[task.priority])}>
                                    {task.priority === "high" ? "집중" : task.priority === "medium" ? "보통" : "가볍게"}
                                  </Badge>
                                  <Badge variant="outline" className="rounded-lg text-[10px] px-1.5 bg-secondary text-muted-foreground">
                                    {TYPE_LABEL[task.type]}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{task.subject}</p>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Clock className="h-3 w-3" />
                                {task.duration}분
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 주간 목표 */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  주간 학습 목표
                </CardTitle>
                <span className="text-sm text-muted-foreground">{doneCount}/{goals.length}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.length > 0 && <Progress value={progress} className="h-2" />}
              <div className="space-y-2">
                {goals.map(goal => (
                  <button key={goal.id} onClick={() => toggleGoal(goal.id)} className={cn("flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors", goal.done ? "bg-green-500/5" : "bg-secondary/30 hover:bg-secondary/50")}>
                    {goal.done ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" /> : <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />}
                    <span className={cn("flex-1 text-sm", goal.done ? "text-green-700 line-through" : "text-foreground")}>{goal.text}</span>
                    <button onClick={e => { e.stopPropagation(); saveGoals(goals.filter(g => g.id !== goal.id)) }} className="h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive hidden group-hover:flex">
                      <X className="h-3 w-3" />
                    </button>
                  </button>
                ))}
              </div>
              {addingGoal ? (
                <div className="flex gap-2">
                  <Input placeholder="학습 목표를 입력하세요" value={newGoal} onChange={e => setNewGoal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addGoal(); if (e.key === "Escape") setAddingGoal(false) }} className="h-8 text-sm" autoFocus />
                  <Button size="sm" className="h-8 rounded-lg px-3" onClick={addGoal}>추가</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="w-full rounded-xl text-muted-foreground" onClick={() => setAddingGoal(true)}>
                  <Plus className="mr-2 h-4 w-4" />목표 추가
                </Button>
              )}
            </CardContent>
          </Card>

          {/* AI 추천 학습 포인트 */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI 추천 학습 포인트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="rounded-xl bg-secondary/30 py-8 text-center">
                  <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">강의 자료를 업로드하면</p>
                  <p className="text-sm text-muted-foreground">AI가 학습 포인트를 추천해줍니다</p>
                </div>
              ) : (
                recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</div>
                    <p className="flex-1 text-sm leading-relaxed text-foreground/80">{rec}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
