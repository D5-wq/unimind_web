import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/understanding
 * 개념 이해 체크 데이터를 Supabase에 upsert
 *
 * Body: { analysisId, conceptName, fileName, status, userId? }
 *
 * 이 데이터가 쌓이면:
 * SELECT concept_name, COUNT(*) FILTER (WHERE status='confused') AS confused
 * FROM concept_understanding GROUP BY concept_name ORDER BY confused DESC
 * → "어떤 개념에서 사람들이 가장 많이 막히는가?" 분석 가능
 */
export async function POST(req: NextRequest) {
  const { analysisId, conceptName, fileName, status, userId } = await req.json()

  if (!analysisId || !conceptName || !status) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
  }

  if (!['understood', 'confused'].includes(status)) {
    return NextResponse.json({ error: '유효하지 않은 status' }, { status: 400 })
  }

  // upsert: 같은 (user_id, analysis_id, concept_name) 조합이면 status 업데이트
  const payload: Record<string, any> = {
    analysis_id: analysisId,
    concept_name: conceptName,
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
    // 테이블 미생성 등 DB 오류는 조용히 처리 (localStorage는 이미 저장됨)
    console.error('[understanding] upsert 실패:', error.message)
    return NextResponse.json({ ok: false, error: error.message })
  }

  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/understanding
 * 이해 체크 취소 (토글 off)
 */
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
