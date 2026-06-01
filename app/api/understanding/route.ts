import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/understanding
 * Body: { analysisId, conceptName, courseName?, fileName?, status, userId? }
 *
 * status: 'understood' | 'confused' | 'review_needed'
 * course_name: 과목 단위 분석용 (예: "운영체제", "자료구조")
 *
 * 이 데이터가 쌓이면:
 * - 어떤 개념에서 사람들이 가장 막히는가?
 * - 어떤 과목이 가장 어려운가?
 * - 어떤 개념이 여러 과목에 반복되는가?
 */
export async function POST(req: NextRequest) {
  const { analysisId, conceptName, courseName, fileName, status, userId } = await req.json()

  if (!analysisId || !conceptName || !status) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
  }

  const validStatuses = ['understood', 'confused', 'review_needed']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: '유효하지 않은 status' }, { status: 400 })
  }

  const payload: Record<string, any> = {
    analysis_id: analysisId,
    concept_name: conceptName,
    course_name: courseName ?? null,
    file_name: fileName ?? null,
    status,
    updated_at: new Date().toISOString(),
  }
  if (userId) payload.user_id = userId

  const { error } = await supabase
    .from('concept_understanding')
    .upsert(payload, {
      onConflict: userId
        ? 'user_id,analysis_id,concept_name'
        : 'analysis_id,concept_name',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error('[understanding] upsert 실패:', error.message)
    return NextResponse.json({ ok: false, error: error.message })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { analysisId, conceptName, userId } = await req.json()

  if (!analysisId || !conceptName) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
  }

  let query = supabase
    .from('concept_understanding')
    .delete()
    .eq('analysis_id', analysisId)
    .eq('concept_name', conceptName)

  if (userId) query = query.eq('user_id', userId)

  const { error } = await query

  if (error) {
    console.error('[understanding] delete 실패:', error.message)
    return NextResponse.json({ ok: false, error: error.message })
  }

  return NextResponse.json({ ok: true })
}
