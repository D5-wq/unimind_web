import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { text, fileName } = await req.json()

  if (!text || !fileName) {
    return NextResponse.json({ error: '텍스트 또는 파일명이 없어요' }, { status: 400 })
  }

  let response
  try {
    response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 대학 강의를 분석하는 AI 학습 어시스턴트입니다.
학생이 실제로 '아하!'하고 이해할 수 있도록, 추상적이고 형식적인 표현 대신 개념 간의 연결과 실제 의미 중심으로 분석하세요.
강의마다 고유한 내용과 흐름이 있으므로, 해당 강의의 특성에 맞게 구체적으로 분석하세요.`,
        },
        {
          role: 'user',
          content: `다음 강의 자료를 분석해주세요:\n\n${text}\n\n아래 JSON 형식만 반환하세요 (마크다운 코드블록 없이):
{
  "oneLiner": "이 강의의 핵심 문제나 주제를 구체적으로 (예: 'CPU 스케줄링에서 fairness와 efficiency의 트레이드오프 해결법')",
  "summary": "강의 전체 흐름과 목적을 2문장으로. 무엇을 왜 배우는지, 어떤 문제를 해결하는지 포함.",
  "flow": [
    "단계 제목 — 이 단계의 핵심 아이디어 (구체적으로)"
  ],
  "concepts": [
    {
      "name": "개념명",
      "simple": "이 개념을 처음 보는 사람에게 한 문장 설명",
      "why": "강의에서 이 개념이 왜 핵심인지, 없으면 무슨 문제가 생기는지",
      "example": "이 개념이 실제로 어떻게 작동하는지 구체적인 예시나 비유 (한 문장)",
      "difficulty": "기초 또는 핵심 또는 심화",
      "relatedTo": ["연관된 다른 개념명"]
    }
  ],
  "examPoints": [
    "실제 시험에 나올 법한 구체적인 질문 형식 (예: 'A와 B의 차이를 설명하고 C 상황에서 어떤 것을 선택해야 하는지 근거와 함께 서술하시오')"
  ]
}
개념 4~7개, 강의흐름 4~6단계, 시험포인트 3~5개.`,
        },
      ],
    })
  } catch (err: any) {
    console.error('[OpenAI] 분석 실패:', err?.message)
    return NextResponse.json({ error: 'AI 분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }, { status: 502 })
  }

  const content = response.choices[0].message.content ?? ''

  let result
  try {
    result = JSON.parse(content)
  } catch {
    return NextResponse.json({ error: '분석 실패', raw: content }, { status: 500 })
  }

  // Supabase에 저장
  const { data: saved, error: saveError } = await supabase
    .from('analyses')
    .insert({
      file_name: fileName,
      one_liner: result.oneLiner,
      flow: result.flow,
      concepts: result.concepts,
      exam_points: result.examPoints,
    })
    .select('id')
    .single()

  if (saveError) {
    console.error('[Supabase] 저장 실패:', saveError.message)
  }

  return NextResponse.json({
    ...result,
    supabaseId: saved?.id ?? null,
  })
}
