"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { supabase } from "@/lib/supabase"
import {
  Sparkles, Target, CheckCircle2, XCircle, ChevronRight,
  RotateCcw, Trophy, Brain, Loader2, AlertTriangle, History, TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { recordQuizComplete, getStreakEmoji } from "@/lib/streak"
import { logEvent, EVENTS } from "@/lib/events"
import { STORAGE_KEYS, storageGet, storageSet } from "@/lib/storage"

interface QuizQuestion {
  type: "ox" | "multiple"
  question: string
  options?: string[]
  answer: string
  explanation: string
  conceptName?: string
}

interface AnalysisResult {
  oneLiner: string
  concepts: { name: string; simple: string; why: string; example?: string; difficulty?: string }[]
  examPoints: string[]
}

function QuizContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [streakAfter, setStreakAfter] = useState<{ current: number } | null>(null)
  const [history, setHistory] = useState<any[]>([])

  // 퀴즈 히스토리 로드
  useEffect(() => {
    try {
      const all = storageGet<any[]>(STORAGE_KEYS.quizHistory, [])
      const filtered = id ? all.filter((h: any) => h.analysisId === id) : all
      setHistory(filtered.slice(0, 5))
    } catch {}
  }, [id])

  // 분석 데이터 로드
  useEffect(() => {
    if (!id) return
    const saved = storageGet<AnalysisResult | null>(STORAGE_KEYS.analysis(id), null)
    if (saved) { setAnalysis(saved); return }
    supabase.from('analyses').select('one_liner, concepts, exam_points').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          const r: AnalysisResult = {
            oneLiner: data.one_liner ?? '',
            concepts: data.concepts as AnalysisResult['concepts'],
            examPoints: data.exam_points as string[],
          }
          setAnalysis(r)
          storageSet(STORAGE_KEYS.analysis(id), r)
        }
      })
  }, [id])

  // 퀴즈 생성
  const generateQuiz = async () => {
    if (!analysis) return
    setGenerating(true)
    setGenError(null)
    setQuestions([])
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setScore(0)
    setDone(false)
    setAnswers([])

    logEvent(EVENTS.QUIZ_STARTED, { analysisId: id })

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concepts: analysis.concepts, examPoints: analysis.examPoints }),
      })
      const data = await res.json()
      if (data.error) { setGenError(data.error); return }
      setQuestions(data.questions ?? [])
    } catch {
      setGenError("퀴즈 생성 중 오류가 발생했어요. 다시 시도해주세요.")
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswer = (choice: string) => {
    if (revealed) return
    setSelected(choice)
  }

  const handleReveal = () => {
    if (!selected || revealed) return
    const q = questions[current]
    const correct = selected === q.answer
    setRevealed(true)
    if (correct) setScore(s => s + 1)
    setAnswers(prev => [...prev, correct])
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      const finalScore = score + (selected === questions[current].answer ? 1 : 0)
      const updatedStreak = recordQuizComplete()
      setStreakAfter(updatedStreak)
      logEvent(EVENTS.QUIZ_COMPLETE, { score: finalScore, total: questions.length, analysisId: id })

      // 퀴즈 결과 저장
      if (id) {
        const meta = storageGet<Record<string, string>>(STORAGE_KEYS.analysisMeta(id), {})
        const entry = {
          id: `quiz-${Date.now()}`,
          analysisId: id,
          fileName: meta.fileName ?? meta.name ?? id,
          oneLiner: analysis?.oneLiner ?? "",
          score: finalScore,
          total: questions.length,
          pct: Math.round((finalScore / questions.length) * 100),
          answers: [...answers, selected === questions[current].answer],
          timestamp: Date.now(),
        }
        const prev = storageGet<any[]>(STORAGE_KEYS.quizHistory, [])
        storageSet(STORAGE_KEYS.quizHistory, [entry, ...prev].slice(0, 50))

        // 오답노트 저장
        const wrongQuestions = questions.filter((_, i) => i < answers.length && !answers[i])
        if (wrongQuestions.length > 0) {
          const wrongNotes = storageGet<any[]>("wrong-notes", [])
          wrongQuestions.forEach(q => {
            wrongNotes.unshift({
              id: `wrong-${Date.now()}-${Math.random()}`,
              analysisId: id,
              fileName: meta.fileName ?? id,
              question: q.question,
              answer: q.answer,
              explanation: q.explanation,
              type: q.type,
              conceptName: q.conceptName,
              timestamp: Date.now(),
            })
          })
          storageSet("wrong-notes", wrongNotes.slice(0, 100))
        }
      }

      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setScore(0)
    setDone(false)
    setAnswers([])
  }

  if (!analysis) {
    return (
      <div className="flex flex-col">
        <Header title="퀴즈" subtitle="강의 내용으로 실력을 테스트하세요" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary" />
            <p className="font-medium">분석 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 퀴즈 생성 전 화면
  if (questions.length === 0) {
    return (
      <div className="flex flex-col">
        <Header title="퀴즈" subtitle="강의 내용으로 실력을 테스트하세요" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Card className="rounded-2xl border-border shadow-sm text-center">
              <CardContent className="p-8">
                <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-6">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">퀴즈 시작</h2>
                <p className="text-sm text-muted-foreground mb-1 leading-relaxed">{analysis.oneLiner}</p>
                <p className="text-xs text-muted-foreground mb-6">
                  OX 문제 4개 + 4지선다 4개 = 총 8문제
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  <div className="rounded-xl bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">핵심 개념</p>
                    <p className="text-lg font-bold text-foreground">{analysis.concepts.length}개</p>
                  </div>
                  <div className="rounded-xl bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">시험 포인트</p>
                    <p className="text-lg font-bold text-foreground">{analysis.examPoints.length}개</p>
                  </div>
                </div>

                {/* 이전 기록 */}
                {history.length > 0 && (
                  <div className="mb-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <History className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-medium">이전 기록</p>
                    </div>
                    <div className="space-y-1.5">
                      {history.map((h, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl bg-secondary/30 px-3 py-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(h.timestamp).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground font-medium">{h.score}/{h.total}</span>
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-lg",
                              h.pct >= 80 ? "bg-green-500/10 text-green-600" :
                              h.pct >= 50 ? "bg-primary/10 text-primary" :
                              "bg-destructive/10 text-destructive"
                            )}>{h.pct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {history.length > 1 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>
                          평균 {Math.round(history.reduce((s, h) => s + h.pct, 0) / history.length)}%
                          {history[0].pct > history[history.length - 1].pct ? " · 향상 중 📈" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {genError && (
                  <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    {genError}
                  </div>
                )}

                <Button onClick={generateQuiz} disabled={generating} className="w-full rounded-xl h-12 text-base gap-2">
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      AI가 문제를 만들고 있어요...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      퀴즈 생성하기
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // 완료 화면
  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    const grade =
      pct >= 90 ? { label: "완벽해요!", color: "text-green-500", emoji: "🏆" } :
      pct >= 70 ? { label: "잘했어요!", color: "text-primary", emoji: "👏" } :
      pct >= 50 ? { label: "조금 더 공부해요", color: "text-orange-500", emoji: "📚" } :
                  { label: "다시 도전해봐요", color: "text-destructive", emoji: "💪" }

    return (
      <div className="flex flex-col">
        <Header title="퀴즈 결과" subtitle="수고하셨어요!" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">{grade.emoji}</div>
                <p className={cn("text-xl font-bold mb-1", grade.color)}>{grade.label}</p>
                <p className="text-5xl font-black text-foreground mb-1">{score} <span className="text-2xl text-muted-foreground">/ {questions.length}</span></p>
                <p className="text-sm text-muted-foreground mb-4">정답률 {pct}%</p>

                {/* 스트릭 알림 */}
                {streakAfter && streakAfter.current > 0 && (
                  <div className="mb-4 rounded-xl bg-primary/10 border border-primary/20 py-2.5 px-4 flex items-center gap-2 justify-center">
                    <span className="text-xl">{getStreakEmoji(streakAfter.current)}</span>
                    <span className="text-sm font-semibold text-primary">
                      {streakAfter.current}일 연속 학습 달성!
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-8 gap-1.5 mb-6">
                  {answers.map((correct, i) => (
                    <div key={i} className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold mx-auto",
                      correct ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                    )}>
                      {correct ? "O" : "X"}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleRestart} className="flex-1 rounded-xl gap-2">
                    <RotateCcw className="h-4 w-4" />
                    다시 풀기
                  </Button>
                  <Button onClick={generateQuiz} className="flex-1 rounded-xl gap-2">
                    <Sparkles className="h-4 w-4" />
                    새 문제
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // 퀴즈 풀기 화면
  const q = questions[current]
  const isOX = q.type === "ox"
  const isCorrect = selected === q.answer

  return (
    <div className="flex flex-col">
      <Header title="퀴즈" subtitle={`${current + 1} / ${questions.length} 문제`} />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* 진행 바 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((current) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">{score}점</span>
          </div>

          {/* 문제 카드 */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(
                  "rounded-lg text-xs",
                  isOX ? "bg-accent/10 text-accent border-accent/20" : "bg-primary/10 text-primary border-primary/20"
                )}>
                  {isOX ? "OX 문제" : "4지선다"}
                </Badge>
                {q.conceptName && (
                  <span className="text-xs text-muted-foreground">관련 개념: {q.conceptName}</span>
                )}
              </div>
              <CardTitle className="text-base leading-relaxed font-medium text-foreground mt-2">
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {isOX ? (
                <div className="grid grid-cols-2 gap-3">
                  {["O", "X"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className={cn(
                        "flex h-20 items-center justify-center rounded-xl text-4xl font-black transition-all duration-200 border-2",
                        !revealed && selected === opt ? "border-primary bg-primary/10 scale-105" :
                        !revealed && selected !== opt ? "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60" :
                        revealed && opt === q.answer ? "border-green-500 bg-green-500/10 text-green-500" :
                        revealed && selected === opt ? "border-destructive bg-destructive/10 text-destructive" :
                        "border-border bg-secondary/30 opacity-50"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {q.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left text-sm transition-all duration-200",
                        !revealed && selected === opt ? "border-primary bg-primary/10 font-medium" :
                        !revealed && selected !== opt ? "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50" :
                        revealed && opt === q.answer ? "border-green-500 bg-green-500/10 text-green-700 font-medium" :
                        revealed && selected === opt ? "border-destructive bg-destructive/10 text-destructive" :
                        "border-border bg-secondary/30 opacity-60"
                      )}
                    >
                      <span className={cn(
                        "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        !revealed ? "bg-secondary" :
                        opt === q.answer ? "bg-green-500 text-white" :
                        selected === opt ? "bg-destructive text-white" : "bg-secondary"
                      )}>
                        {["①", "②", "③", "④"][i]}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* 정답 해설 */}
              {revealed && (
                <div className={cn(
                  "mt-3 rounded-xl p-4 flex items-start gap-3",
                  isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-destructive/10 border border-destructive/20"
                )}>
                  {isCorrect
                    ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    : <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className={cn("text-sm font-semibold mb-1", isCorrect ? "text-green-700" : "text-destructive")}>
                      {isCorrect ? "정답입니다!" : `오답. 정답은 "${q.answer}"`}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 버튼 */}
          <div className="flex gap-3">
            {!revealed ? (
              <Button
                onClick={handleReveal}
                disabled={!selected}
                className="flex-1 rounded-xl h-12 gap-2"
              >
                <Brain className="h-5 w-5" />
                정답 확인
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1 rounded-xl h-12 gap-2">
                {current + 1 >= questions.length ? (
                  <>
                    <Trophy className="h-5 w-5" />
                    결과 보기
                  </>
                ) : (
                  <>
                    다음 문제
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary" />
            <p>불러오는 중...</p>
          </div>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}
