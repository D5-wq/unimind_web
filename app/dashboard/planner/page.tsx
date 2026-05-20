"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Target, Calendar, Plus, X, CheckCircle2, Circle, Sparkles, BookOpen, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Exam {
  id: string
  subject: string
  date: string
}

interface WeekGoal {
  id: string
  text: string
  done: boolean
}

function calcDDay(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(dateStr)
  exam.setHours(0, 0, 0, 0)
  return Math.ceil((exam.getTime() - today.getTime()) / 86400000)
}

const DDAY_COLOR = (d: number) =>
  d === 0 ? "text-destructive bg-destructive/10" :
  d <= 3  ? "text-destructive bg-destructive/10" :
  d <= 7  ? "text-orange-600 bg-orange-500/10" :
            "text-primary bg-primary/10"

export default function PlannerPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [goals, setGoals] = useState<WeekGoal[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [addingGoal, setAddingGoal] = useState(false)
  const [newGoal, setNewGoal] = useState("")
  const [addingExam, setAddingExam] = useState(false)
  const [newSubject, setNewSubject] = useState("")
  const [newDate, setNewDate] = useState("")

  useEffect(() => {
    try {
      const e = localStorage.getItem("exams")
      if (e) setExams(JSON.parse(e))
    } catch {}

    try {
      const g = localStorage.getItem("planner-goals")
      if (g) setGoals(JSON.parse(g))
    } catch {}

    // 최신 분석에서 시험 포인트 → 학습 추천
    const keys = Object.keys(localStorage).filter(k => k.startsWith("analysis-"))
    keys.sort((a, b) => {
      const ia = a.replace("analysis-", ""); const ib = b.replace("analysis-", "")
      try {
        const ma = JSON.parse(localStorage.getItem(`meta-${ia}`) ?? "{}")
        const mb = JSON.parse(localStorage.getItem(`meta-${ib}`) ?? "{}")
        return (mb.uploadedAt ?? 0) - (ma.uploadedAt ?? 0)
      } catch { return 0 }
    })
    if (keys.length > 0) {
      try {
        const latest = JSON.parse(localStorage.getItem(keys[0]) ?? "")
        setRecommendations((latest.examPoints ?? []).slice(0, 4))
      } catch {}
    }
  }, [])

  const saveExams = (list: Exam[]) => {
    setExams(list)
    localStorage.setItem("exams", JSON.stringify(list))
  }

  const saveGoals = (list: WeekGoal[]) => {
    setGoals(list)
    localStorage.setItem("planner-goals", JSON.stringify(list))
  }

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

  const upcomingExams = exams
    .map(e => ({ ...e, dday: calcDDay(e.date) }))
    .filter(e => e.dday >= 0)
    .sort((a, b) => a.dday - b.dday)

  const doneCount = goals.filter(g => g.done).length
  const progress = goals.length > 0 ? (doneCount / goals.length) * 100 : 0

  return (
    <div className="flex flex-col">
      <Header title="학습 플래너" subtitle="시험 일정과 학습 목표를 관리하세요" />
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
                <Plus className="h-4 w-4" />
                추가
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
                      <button
                        onClick={() => saveExams(exams.filter(e => e.id !== exam.id))}
                        className="hidden h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive group-hover:flex"
                      >
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
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                      goal.done ? "bg-green-500/5" : "bg-secondary/30 hover:bg-secondary/50"
                    )}
                  >
                    {goal.done
                      ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                      : <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    }
                    <span className={cn("flex-1 text-sm", goal.done ? "text-green-700 line-through" : "text-foreground")}>
                      {goal.text}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); saveGoals(goals.filter(g => g.id !== goal.id)) }}
                      className="hidden h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive group-hover:flex"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </button>
                ))}
              </div>
              {addingGoal ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="학습 목표를 입력하세요"
                    value={newGoal}
                    onChange={e => setNewGoal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addGoal(); if (e.key === "Escape") setAddingGoal(false) }}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button size="sm" className="h-8 rounded-lg px-3" onClick={addGoal}>추가</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="w-full rounded-xl text-muted-foreground" onClick={() => setAddingGoal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  목표 추가
                </Button>
              )}
            </CardContent>
          </Card>

          {/* AI 추천 학습 계획 */}
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
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
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
