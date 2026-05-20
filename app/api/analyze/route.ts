import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { text, fileName } = await req.json()

  if (!text || !fileName) {
    return NextResponse.json({ error: '텍스트 또는 파일명이 없어요' }, { status: 400 })
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 대학 강의 자료를 분석하는 AI 학습 어시스턴트입니다.
학생이 강의 흐름을 이해할 수 있도록 도와주세요.
암기 위주가 아니라 왜 이 개념이 등장했는지, 어떻게 연결되는지 중심으로 설명하세요.`,
      },
      {
        role: 'user',
        content: `다음 강의 자료를 분석해주세요:\n\n${text}\n\n아래 형식으로 JSON만 반환해주세요 (다른 텍스트 없이):
{
  "oneLiner": "이 강의의 핵심을 한 문장으로",
  "flow": ["흐름1", "흐름2", "흐름3", "흐름4", "흐름5"],
  "concepts": [
    { "name": "개념명", "simple": "쉬운 설명", "why": "왜 중요한가" }
  ],
  "examPoints": ["시험 포인트1", "시험 포인트2", "시험 포인트3"]
}`,
      },
    ],
  })

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
