import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { concepts, examPoints } = await req.json()

  if (!concepts?.length && !examPoints?.length) {
    return NextResponse.json({ error: '분석 데이터가 없습니다.' }, { status: 400 })
  }

  const conceptList = concepts?.map((c: any) => `${c.name}: ${c.simple}`).join('\n') ?? ''
  const examList = examPoints?.join('\n') ?? ''

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 대학 강의 퀴즈 생성 전문가입니다. 주어진 개념과 시험 포인트를 바탕으로 퀴즈 문제를 만드세요.
반드시 아래 JSON 형식만 반환하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "questions": [
    {
      "type": "ox",
      "question": "문제 내용",
      "answer": "O" 또는 "X",
      "explanation": "정답 해설 (왜 O/X인지, 1-2문장)",
      "conceptName": "관련 개념명"
    },
    {
      "type": "multiple",
      "question": "문제 내용",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": "정답 선택지 (options 중 하나를 그대로)",
      "explanation": "정답 해설 (1-2문장)",
      "conceptName": "관련 개념명"
    }
  ]
}

규칙:
- OX 문제 4개 + 4지선다 문제 4개 = 총 8개
- 틀린 OX 문제는 반드시 틀린 내용으로 만들 것 (X가 정답인 문제 2개 포함)
- 4지선다는 명확한 정답이 있어야 하고 오답도 그럴듯하게
- 한국어로 작성`,
        },
        {
          role: 'user',
          content: `핵심 개념:\n${conceptList}\n\n시험 포인트:\n${examList}`,
        },
      ],
    })

    const raw = response.choices[0].message.content ?? ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('[Quiz] 생성 실패:', err?.message)
    return NextResponse.json({ error: '퀴즈 생성 중 오류가 발생했어요.' }, { status: 502 })
  }
}
