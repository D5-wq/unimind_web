import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, analysisContext } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 대학 강의 자료를 기반으로 학생을 돕는 AI 학습 어시스턴트입니다.
아래는 이미 분석된 강의 요약입니다. 이를 바탕으로 학생 질문에 답해주세요.

[강의 핵심 요약]
${analysisContext?.oneLiner ?? ''}

[강의 흐름]
${analysisContext?.flow?.join('\n') ?? ''}

[핵심 개념]
${analysisContext?.concepts?.map((c: any) => `${c.name}: ${c.simple}`).join('\n') ?? ''}

규칙:
- 암기 위주가 아니라 왜 이 개념이 중요한지 설명하세요
- 어려운 내용은 쉬운 비유로 설명하세요
- 답변은 간결하게, 너무 길지 않게 해주세요`,
      },
      ...messages,
    ],
  })

  return NextResponse.json({
    answer: response.choices[0].message.content,
  })
}