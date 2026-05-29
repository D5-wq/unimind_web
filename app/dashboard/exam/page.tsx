"use client"

import { useEffect, useState, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import {
  Clock, BookOpen, CheckSquare, FileText, Sparkles, Target, Brain,
  AlertTriangle, CheckCircle, Circle, Upload, Play, Pause, RotateCcw,
  Zap, ArrowRight, ArrowLeft, X, Send, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAnalysis } from "@/components/dashboard/analysis-context"

// ──────────────────────────────────────────────
// Timer helpers
// ──────────────────────────────────────────────
interface TimerState {
  target: number
  elapsed: number
  startedAt: number | null
}

const TIMER_KEY = "study-timer"
const PRESETS = [15, 25, 50]

function readTimer(): TimerState {
  try {
    const raw = localStorage.getItem(TIMER_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { target: 25 * 60, elapsed: 0, startedAt: null }
}

function saveTimer(s: TimerState) {
  localStorage.setItem(TIMER_KEY, JSON.stringify(s))
}

function calcRemaining(s: TimerState): number {
  const elapsed = s.startedAt != null
    ? s.elapsed + (Date.now() - s.startedAt) / 1000
    : s.elapsed
  return Math.max(0, s.target - elapsed)
}

function fmtTime(secs: number): string {
  const s = Math.max(0, Math.floor(secs))
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`
}

interface CheckItem { id: string; task: string; completed: boolean }

// ──────────────────────────────────────────────
// Quiz Mode
// ──────────────────────────────────────────────
function QuizMode({ result, onClose }: { result: NonNullable<ReturnType<typeof useAnalysis>["selectedAnalysis"]>; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState<("correct" | "partial" | "wrong" | null)[]>(
    () => Array(result.examPoints.length).fill(null)
  )

  const question = result.examPoints[index]
  const total = result.examPoints.length

  const submit = async () => {
    if (!answer.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `다음 시험 문제에 대한 학생의 답변을 평가해줘.\n\n문제: ${question}\n\n학생 답변: ${answer}\n\n짧게 (3-4줄) 피드백을 주고, 마지막 줄에 반드시 "평가: 정확 / 부분적 / 틀림" 중 하나만 써줘.` }],
          analysisContext: result,
        }),
      })
      const data = await res.json()
      const fb: string = data.answer ?? ""
      setFeedback(fb)
      const score: "correct" | "partial" | "wrong" = fb.includes("정확") ? "correct" : fb.includes("부분적") ? "partial" : "wrong"
      setScores(prev => { const next = [...prev]; next[index] = score; return next })
    } finally {
      setLoading(false)
    }
  }

  const next = () => { setIndex(i => Math.min(i + 1, total - 1)); setAnswer(""); setFeedback(null) }
  const prev = () => { setIndex(i => Math.max(i - 1, 0)); setAnswer(""); setFeedback(null) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl rounded-2xl shadow-2xl">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">퀴즈 모드</h2>
              <Badge variant="secondary" className="rounded-lg">{index + 1} / {total}</Badge>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>

          <div className="mb-5 flex gap-1.5">
            {scores.map((s, i) => (
              <div key={i} className={cn("h-2 flex-1 rounded-full transition-colors",
                i === index ? "bg-primary" : s === "correct" ? "bg-green-500" : s === "partial" ? "bg-yellow-500" : s === "wrong" ? "bg-destructive" : "bg-secondary"
              )} />
            ))}
          </div>

          <div className="mb-4 rounded-xl bg-secondary/40 p-4">
            <p className="text-sm font-medium text-foreground leading-relaxed">{question}</p>
          </div>

          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="답변을 자유롭게 작성하세요..."
            disabled={!!feedback || loading}
            className={cn("mb-3 w-full resize-none rounded-xl border border-border bg-card p-4 text-sm leading-relaxed outline-none transition-colors focus:border-primary/50", feedback ? "opacity-60" : "")}
            rows={5}
          />

          {feedback && (
            <div className={cn("mb-4 rounded-xl border p-4 text-sm leading-relaxed",
              scores[index] === "correct" ? "border-green-500/30 bg-green-500/5 text-green-700" :
              scores[index] === "partial" ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-700" :
              "border-destructive/30 bg-destructive/5 text-destructive"
            )}>
              <p className="whitespace-pre-wrap">{feedback}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={prev} disabled={index === 0}>
              <ArrowLeft className="mr-1 h-4 w-4" />이전
            </Button>
            {!feedback ? (
              <Button className="rounded-xl px-6" onClick={submit} disabled={!answer.trim() || loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />채점 중...</> : <><Send className="mr-2 h-4 w-4" />채점하기</>}
              </Button>
            ) : index < total - 1 ? (
              <Button className="rounded-xl px-6" onClick={next}>다음 문제<ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button className="rounded-xl px-6 bg-green-600 hover:bg-green-700" onClick={onClose}>퀴즈 완료! 🎉</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ──────────────────────────────────────────────
export default function ExamPage() {
  const { selectedAnalysis: result, selectedId, loading: analysisLoading } = useAnalysis()
  const [checklist, setChecklist] = useState<CheckItem[]>([])
  const [quizOpen, setQuizOpen] = useState(false)
  const router = useRouter()

  const timerRef = useRef<TimerState>({ target: 25 * 60, elapsed: 0, startedAt: null })
  const [timerTick, setTimerTick] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerFinished, setTimerFinished] = useState(false)
  const [timerTarget, setTimerTarget] = useState(25 * 60)

  useEffect(() => {
    const saved = readTimer()
    const rem = calcRemaining(saved)
    if (rem > 0 && saved.startedAt === null) {
      const next: TimerState = { ...saved, startedAt: Date.now() }
      saveTimer(next); timerRef.current = next; setTimerRunning(true)
    } else {
      timerRef.current = saved
      setTimerRunning(saved.startedAt !== null && rem > 0)
    }
    setTimerTarget(saved.target)
    setTimerFinished(rem <= 0 && saved.elapsed > 0)

    const tick = setInterval(() => {
      const s = timerRef.current
      const rem = calcRemaining(s)
      setTimerTick(t => t + 1)
      if (rem <= 0 && s.startedAt !== null) {
        const done: TimerState = { ...s, elapsed: s.target, startedAt: null }
        saveTimer(done); timerRef.current = done; setTimerRunning(false); setTimerFinished(true)
      }
    }, 200)
    return () => clearInterval(tick)
  }, [])

  const toggleTimer = () => {
    const s = timerRef.current
    if (s.startedAt !== null) {
      const elapsed = s.elapsed + (Date.now() - s.startedAt) / 1000
      const next: TimerState = { ...s, elapsed, startedAt: null }
      saveTimer(next); timerRef.current = next; setTimerRunning(false)
    } else {
      const next: TimerState = { ...s, startedAt: Date.now() }
      saveTimer(next); timerRef.current = next; setTimerRunning(true); setTimerFinished(false)
    }
  }

  const resetTimer = (target?: number) => {
    const t = target ?? timerRef.current.target
    const next: TimerState = { target: t, elapsed: 0, startedAt: null }
    saveTimer(next); timerRef.current = next; setTimerRunning(false); setTimerFinished(false); setTimerTarget(t)
  }

  // Rebuild checklist when selected analysis changes
  useEffect(() => {
    if (!result || !selectedId) return
    const savedChecklist = localStorage.getItem(`checklist-${selectedId}`)
    if (savedChecklist) {
      try { setChecklist(JSON.parse(savedChecklist)); return } catch {}
    }
    setChecklist([
      ...result.concepts.map((c, i) => ({ id: `concept-${i}`, task: `개념 이해: ${c.name}`, completed: false })),
      ...result.examPoints.slice(0, 3).map((p, i) => ({ id: `exam-${i}`, task: `시험 포인트 복습: ${p.slice(0, 50)}${p.length > 50 ? "…" : ""}`, completed: false })),
    ])
  }, [result, selectedId])

  const toggleItem = (id: string) => {
    setChecklist(prev => {
      const next = prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
      if (selectedId) localStorage.setItem(`checklist-${selectedId}`, JSON.stringify(next))
      return next
    })
  }

  const completedCount = checklist.filter(i => i.completed).length
  const progressPercentage = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0
  const remaining = calcRemaining(timerRef.current)
  const display = fmtTime(remaining)

  const timerCard = (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">집중 타이머</h3>
          </div>
          {timerFinished && <Badge className="rounded-lg bg-green-500/10 text-green-600 border-green-500/20">완료!</Badge>}
        </div>
        <div className="mb-4 text-center">
          <div className={cn("font-mono text-5xl font-bold tabular-nums",
            timerFinished ? "text-green-500" : remaining < 60 && timerRunning ? "text-destructive" : "text-foreground"
          )}>{display}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {timerFinished ? "수고했어요! 잠깐 쉬어가세요" : timerRunning ? "집중 중..." : "일시 정지됨"}
          </p>
        </div>
        <Progress value={timerTarget > 0 ? ((timerTarget - remaining) / timerTarget) * 100 : 0} className="mb-4 h-2" />
        <div className="flex items-center justify-center gap-2 mb-3">
          <Button variant={timerRunning ? "outline" : "default"} className="rounded-xl px-6" onClick={toggleTimer} disabled={timerFinished}>
            {timerRunning ? <><Pause className="mr-2 h-4 w-4" />일시정지</> : <><Play className="mr-2 h-4 w-4" />{timerFinished ? "완료" : "재개"}</>}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => resetTimer()}><RotateCcw className="h-4 w-4" /></Button>
        </div>
        <div className="flex justify-center gap-2">
          {PRESETS.map(min => (
            <button key={min} onClick={() => resetTimer(min * 60)} className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
              timerTarget === min * 60 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}>{min}분</button>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (!result && !analysisLoading) {
    return (
      <div className="flex flex-col">
        <Header title="시험 준비" subtitle="효율적인 시험 대비를 도와드립니다" />
        <div className="flex-1 space-y-6 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {timerCard}
            <Card className="rounded-2xl border-2 border-dashed border-border shadow-sm">
              <CardContent className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">강의 PDF를 업로드하면</h3>
                <p className="mt-1 text-sm text-muted-foreground">시험 포인트와 복습 체크리스트가 생성돼요</p>
                <Link href="/dashboard/upload" className="mt-4">
                  <Button size="sm" className="rounded-xl">PDF 업로드하기</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col">
        <Header title="시험 준비" subtitle="효율적인 시험 대비를 도와드립니다" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="시험 준비" subtitle="효율적인 시험 대비를 도와드립니다" />
      {quizOpen && <QuizMode result={result} onClose={() => setQuizOpen(false)} />}

      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {timerCard}
          <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary">
                  <Target className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{result.oneLiner}</h2>
                  <p className="text-sm text-muted-foreground">개념 {result.concepts.length}개 · 시험 포인트 {result.examPoints.length}개</p>
                </div>
              </div>
              <Button className="w-full rounded-xl bg-primary/90 hover:bg-primary" onClick={() => setQuizOpen(true)}>
                <Zap className="mr-2 h-4 w-4" />퀴즈 모드 시작
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />강의 흐름 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.flow.map((item, index) => (
                <div key={index} className="rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/30">
                  <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">{index + 1}</div>
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" />핵심 개념</span>
                <Badge variant="secondary" className="rounded-lg">{result.concepts.length}개</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.concepts.map((concept, index) => (
                <div key={index} className="flex items-start gap-3 rounded-xl bg-secondary/30 p-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary mt-0.5">{index + 1}</div>
                  <div>
                    <h4 className="font-medium text-foreground">{concept.name}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{concept.simple}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-primary" />복습 체크리스트</span>
                <span className="text-sm font-normal text-muted-foreground">{completedCount}/{checklist.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressPercentage} className="h-2" />
              <div className="space-y-2">
                {checklist.map((item) => (
                  <button key={item.id} onClick={() => toggleItem(item.id)} className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                    item.completed ? "bg-green-500/5" : "bg-secondary/30 hover:bg-secondary/50"
                  )}>
                    {item.completed
                      ? <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                      : <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />}
                    <span className={cn("text-sm", item.completed ? "text-green-700 line-through" : "text-foreground")}>{item.task}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />시험 출제 예상 포인트</span>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setQuizOpen(true)}>
                <Zap className="mr-1.5 h-3.5 w-3.5" />퀴즈로 풀기
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.examPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                  <AlertTriangle className={cn("h-6 w-6", index === 0 ? "text-destructive" : index === 1 ? "text-orange-500" : "text-primary")} />
                </div>
                <p className="flex-1 text-sm text-foreground">{point}</p>
                <div className="text-right">
                  <p className={cn("text-lg font-bold", index === 0 ? "text-destructive" : index === 1 ? "text-orange-500" : "text-primary")}>{90 - index * 5}%</p>
                  <p className="text-xs text-muted-foreground">출제 확률</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">더 깊이 공부하고 싶다면</h4>
                <p className="mt-2 text-sm text-muted-foreground">AI에게 각 개념을 더 자세히 물어보거나, 예상 시험 문제를 만들어달라고 해보세요.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button className="rounded-xl" onClick={() => router.push("/dashboard/chat")}>
                    <BookOpen className="mr-2 h-4 w-4" />AI에게 질문하기
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => setQuizOpen(true)}>
                    <Zap className="mr-2 h-4 w-4" />퀴즈 모드
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
