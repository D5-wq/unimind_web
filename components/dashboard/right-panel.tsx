"use client"

import { useEffect, useState } from "react"
import { Calendar, TrendingUp, Zap, Plus, X, Play, Pause, RotateCcw } from "lucide-react"
import { useAnalysis } from "./analysis-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Exam {
  id: string
  subject: string
  date: string
}

const COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"]

function calcDDay(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(dateStr)
  exam.setHours(0, 0, 0, 0)
  return Math.ceil((exam.getTime() - today.getTime()) / 86400000)
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600).toString().padStart(2, "0")
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0")
  const s = (secs % 60).toString().padStart(2, "0")
  return `${h}:${m}:${s}`
}

export function RightPanel() {
  const { selectedAnalysis, allAnalyses } = useAnalysis()
  const [exams, setExams] = useState<Exam[]>([])
  const [addingExam, setAddingExam] = useState(false)
  const [newSubject, setNewSubject] = useState("")
  const [newDate, setNewDate] = useState("")
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)

  const recommendations = selectedAnalysis?.examPoints?.slice(0, 3) ?? []
  const analysisCount = allAnalyses.length

  useEffect(() => {
    try {
      const saved = localStorage.getItem("exams")
      if (saved) setExams(JSON.parse(saved))
    } catch {}

    const saved = localStorage.getItem(`timer-${new Date().toDateString()}`)
    if (saved) setTimerSeconds(parseInt(saved))
  }, [])

  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => {
      setTimerSeconds(prev => {
        const next = prev + 1
        localStorage.setItem(`timer-${new Date().toDateString()}`, String(next))
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  const saveExams = (list: Exam[]) => {
    setExams(list)
    localStorage.setItem("exams", JSON.stringify(list))
  }

  const addExam = () => {
    if (!newSubject.trim() || !newDate) return
    saveExams([...exams, { id: Date.now().toString(), subject: newSubject.trim(), date: newDate }])
    setNewSubject("")
    setNewDate("")
    setAddingExam(false)
  }

  const upcomingExams = exams
    .map(e => ({ ...e, dday: calcDDay(e.date) }))
    .filter(e => e.dday >= 0)
    .sort((a, b) => a.dday - b.dday)

  return (
    <aside className="hidden w-80 flex-shrink-0 border-l border-border bg-card xl:block">
      <div className="flex h-full flex-col p-6 overflow-y-auto">

        {/* D-Day */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              시험 D-Day
            </h3>
            <button
              onClick={() => setAddingExam(v => !v)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {addingExam && (
            <div className="mb-3 space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
              <Input
                placeholder="과목명 (예: 데이터베이스)"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addExam()}
                className="h-8 text-sm"
              />
              <Input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-7 flex-1 rounded-lg text-xs" onClick={addExam}>추가</Button>
                <Button size="sm" variant="ghost" className="h-7 flex-1 rounded-lg text-xs"
                  onClick={() => { setAddingExam(false); setNewSubject(""); setNewDate("") }}>
                  취소
                </Button>
              </div>
            </div>
          )}

          {upcomingExams.length === 0 ? (
            <div className="rounded-xl bg-secondary/30 p-4 text-center">
              <p className="text-xs text-muted-foreground">+ 버튼으로 시험 일정을 추가하세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingExams.map((exam, i) => (
                <div key={exam.id} className="group flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${COLORS[i % COLORS.length]}`} />
                    <span className="text-sm font-medium text-foreground">{exam.subject}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "rounded-lg px-2 py-1 text-xs font-semibold",
                      exam.dday === 0 ? "bg-destructive text-destructive-foreground" :
                      exam.dday <= 3 ? "bg-destructive/10 text-destructive" :
                      exam.dday <= 7 ? "bg-orange-500/10 text-orange-600" :
                      "bg-primary/10 text-primary"
                    )}>
                      {exam.dday === 0 ? "D-Day!" : `D-${exam.dday}`}
                    </span>
                    <button
                      onClick={() => saveExams(exams.filter(e => e.id !== exam.id))}
                      className="hidden h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive group-hover:flex"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 학습 통계 */}
        <div className="mb-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            학습 통계
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{analysisCount}</p>
              <p className="text-xs text-muted-foreground">분석한 강의</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <p className="text-2xl font-bold text-accent">{formatTime(timerSeconds).slice(0, 5)}</p>
              <p className="text-xs text-muted-foreground">오늘 학습</p>
            </div>
          </div>
        </div>

        {/* 시험 핵심 포인트 */}
        <div className="flex-1">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Zap className="h-4 w-4 text-primary" />
            {recommendations.length > 0 ? "시험 핵심 포인트" : "AI 학습 추천"}
          </h3>
          <div className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.map((tip, i) => (
                <div key={i} className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs leading-relaxed text-foreground/80">{tip}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground">PDF를 업로드하면 AI가 맞춤 시험 포인트를 보여줍니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 타이머 */}
        <div className="mt-6 rounded-xl bg-primary p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">오늘의 학습 시간</p>
              <p className="text-2xl font-bold tabular-nums">{formatTime(timerSeconds)}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setTimerRunning(r => !r)}
                className="rounded-xl bg-primary-foreground/20 p-2.5 transition-colors hover:bg-primary-foreground/30"
              >
                {timerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false)
                  setTimerSeconds(0)
                  localStorage.removeItem(`timer-${new Date().toDateString()}`)
                }}
                className="rounded-xl bg-primary-foreground/20 p-2.5 transition-colors hover:bg-primary-foreground/30"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </aside>
  )
}
