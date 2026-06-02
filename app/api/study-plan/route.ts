import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface StudyTask {
  date: string        // "YYYY-MM-DD"
  subject: string
  concept: string
  duration: number    // 분
  type: "review" | "study" | "quiz"
  priority: "high" | "medium" | "low"
}

export interface StudyPlan {
  generatedAt: string
  tasks: StudyTask[]
  summary: string
}

export async function POST(req: NextRequest) {
  const { exams, concepts } = await req.json()

  if (!exams?.length || !concepts?.length) {
    return NextResponse.json({ error: "시험 일정과 개념 데이터가 필요해요" }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)

  const prompt = `당신은 대학생 학습 코치입니다. 아래 데이터를 기반으로 오늘부터 시험 전날까지의 학습 계획을 생성하세요.

오늘 날짜: ${today}

시험 일정:
${exams.map((e: { subject: string; date: string }) => `- ${e.subject}: ${e.date}`).join("\n")}

학습할 개념 목록 (subject, concept, status: confused/understood/unknown):
${concepts.map((c: { subject: string; concept: string; status: string }) => `- [${c.subject}] ${c.concept} (${c.status})`).join("\n")}

규칙:
1. confused 개념은 최소 2번 배정 (첫 복습 + 재확인)
2. unknown 개념은 1번 배정
3. understood 개념은 시험 3일 전 빠르게 1번 리뷰
4. 하루 최대 3개 개념, 총 학습 시간 90분 이내
5. 시험 전날은 전체 리뷰 + 퀴즈만
6. 오늘 이후 날짜만 배정

아래 JSON 형식만 반환 (마크다운 없이):
{
  "tasks": [
    {
      "date": "YYYY-MM-DD",
      "subject": "과목명",
      "concept": "개념명",
      "duration": 20,
      "type": "review" | "study" | "quiz",
      "priority": "high" | "medium" | "low"
    }
  ],
  "summary": "한 줄 요약 (예: 12일간 23개 개념, TCP Handshake 집중 필요)"
}`

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    })

    const raw = res.choices[0]?.message?.content ?? ""
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const data = JSON.parse(cleaned)

    return NextResponse.json({
      generatedAt: today,
      tasks: data.tasks ?? [],
      summary: data.summary ?? "",
    } satisfies StudyPlan)
  } catch (err: any) {
    console.error("[study-plan]", err)
    return NextResponse.json({ error: "플랜 생성 실패" }, { status: 500 })
  }
}
