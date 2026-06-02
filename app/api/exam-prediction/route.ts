import { NextRequest, NextResponse } from "next/server"

export interface ConceptScore {
  concept: string
  subject: string
  status: "understood" | "confused" | "unknown"
  weight: number  // 심화=1.5, 핵심=1.2, 기본=1.0
  score: number   // 0~100
}

export interface ExamPrediction {
  subject: string
  examDate: string
  dday: number
  predictedScore: number   // 0~100
  grade: string            // A+, A, B+, B, C+, C, F
  confidence: "high" | "medium" | "low"
  conceptScores: ConceptScore[]
  weakPoints: string[]      // 집중 공부해야 할 개념
  strongPoints: string[]    // 잘 하고 있는 개념
  advice: string
}

function difficultyWeight(difficulty?: string): number {
  if (difficulty === "심화") return 1.5
  if (difficulty === "핵심") return 1.2
  return 1.0
}

function statusToScore(status: string): number {
  if (status === "understood") return 90
  if (status === "confused") return 30
  return 55  // unknown: 중간값
}

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+"
  if (score >= 90) return "A"
  if (score >= 85) return "B+"
  if (score >= 80) return "B"
  if (score >= 75) return "C+"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}

function ddayFactor(dday: number): number {
  // 시험이 가까울수록 현재 점수에 더 의존
  if (dday <= 3) return 1.0
  if (dday <= 7) return 0.95
  if (dday <= 14) return 0.9
  return 0.85
}

export async function POST(req: NextRequest) {
  const { exams, concepts } = await req.json()
  // concepts: { subject, concept, status, difficulty }[]

  if (!exams?.length || !concepts?.length) {
    return NextResponse.json({ error: "데이터 부족" }, { status: 400 })
  }

  const today = new Date()
  const predictions: ExamPrediction[] = []

  for (const exam of exams) {
    const examDate = new Date(exam.date)
    const dday = Math.ceil((examDate.getTime() - today.getTime()) / 86400000)
    if (dday < 0) continue

    const subjectConcepts = concepts.filter(
      (c: any) => c.subject === exam.subject || concepts.length < 10  // 과목 매핑 안 되면 전체 사용
    )

    if (!subjectConcepts.length) continue

    const conceptScores: ConceptScore[] = subjectConcepts.map((c: any) => ({
      concept: c.concept,
      subject: c.subject,
      status: c.status,
      weight: difficultyWeight(c.difficulty),
      score: statusToScore(c.status),
    }))

    // 가중 평균
    const totalWeight = conceptScores.reduce((s, c) => s + c.weight, 0)
    const weightedScore = conceptScores.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight
    const adjustedScore = Math.round(weightedScore * ddayFactor(dday))

    const confusedCount = conceptScores.filter(c => c.status === "confused").length
    const unknownCount = conceptScores.filter(c => c.status === "unknown").length
    const confidence: "high" | "medium" | "low" =
      unknownCount > conceptScores.length * 0.5 ? "low" :
      confusedCount > conceptScores.length * 0.3 ? "medium" : "high"

    const weakPoints = conceptScores
      .filter(c => c.status === "confused")
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(c => c.concept)

    const strongPoints = conceptScores
      .filter(c => c.status === "understood")
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(c => c.concept)

    const advice = adjustedScore >= 85
      ? `현재 상태 유지하면 ${scoreToGrade(adjustedScore)} 예상. 취약 개념만 집중 리뷰하세요.`
      : adjustedScore >= 70
      ? `${weakPoints.length > 0 ? weakPoints.slice(0, 2).join(", ") + " 집중 복습" : "헷갈리는 개념 다시 정리"}하면 ${scoreToGrade(adjustedScore + 10)} 가능해요.`
      : `헷갈리는 개념이 ${confusedCount}개로 많아요. 기초 개념부터 다시 잡아야 해요.`

    predictions.push({
      subject: exam.subject,
      examDate: exam.date,
      dday,
      predictedScore: adjustedScore,
      grade: scoreToGrade(adjustedScore),
      confidence,
      conceptScores,
      weakPoints,
      strongPoints,
      advice,
    })
  }

  return NextResponse.json({ predictions })
}
